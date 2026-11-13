import { notFound } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { getContext } from "@/lib/context";
import { getVisibleItem } from "@/lib/access";
import { db } from "@/lib/db";
import { itemPhotos, itemEvents, transfers, households, categories } from "@/db/schema";
import { updateItem, addPhoto, archiveItem } from "@/actions";
import { AppShell } from "@/components/AppShell";
import { AddPhotoSection } from "@/components/AddPhotoSection";
import { ItemPhoto } from "@/components/ItemPhoto";
import { 
  ChevronLeft, 
  Edit, 
  Package, 
  RotateCcw, 
  Trash2,
  Heart,
  Share2,
  Camera,
  Image,
  ChevronRight,
  Eye,
  Tag,
  Droplet,
  Sparkles,
} from "lucide-react";

const conditions = [["new", "Neu"], ["very_good", "Sehr gut"], ["good", "Gut"], ["used", "Gebraucht"], ["damaged", "Beschädigt"]] as const;
const labels: Record<string, string> = {
  created: "Erfasst", updated: "Bearbeitet", archived: "Archiviert",
  transfer_requested: "Übergabe angefragt", transfer_accepted: "Weitergegeben",
  transfer_declined: "Übergabe abgelehnt", loan_returned: "Zurückgegeben",
};

export default async function ItemDetails({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const ctx = await getContext();
  const { id } = await params;
  const editing = (await searchParams).edit === "1";
  
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) notFound();
  
  const item = await getVisibleItem(id, ctx.household.id);
  if (!item) notFound();
  
  const photos = await db.select().from(itemPhotos).where(eq(itemPhotos.itemId, id));
  const events = await db.select().from(itemEvents).where(eq(itemEvents.itemId, id)).orderBy(desc(itemEvents.createdAt));
  
  const transferIds = [...new Set(events.map(e => e.transferId).filter((x): x is string => !!x))];
  const historyTransfers = transferIds.length ? await db.select().from(transfers).where(inArray(transfers.id, transferIds)) : [];
  const transfersById = new Map(historyTransfers.map(t => [t.id, t]));
  
  const householdIds = [...new Set(historyTransfers.flatMap(t => [t.fromHouseholdId, t.toHouseholdId]))];
  const knownNames = householdIds.length ? await db.select({ id: households.id, name: households.name })
    .from(households).where(inArray(households.id, householdIds)) : [];
  const names = Object.fromEntries(knownNames.map(h => [h.id, h.name]));
  
  const own = item.ownerHouseholdId === ctx.household.id && item.holderHouseholdId === ctx.household.id && !item.archived;
  const historical = item.ownerHouseholdId !== ctx.household.id && item.holderHouseholdId !== ctx.household.id;
  
  const primaryPhoto = photos.find(p => p.isPrimary) || photos[0];
  const categoryName = item.categoryId ? 
    (await db.select({ name: categories.name }).from(categories).where(eq(categories.id, item.categoryId)).limit(1))[0]?.name 
    : null;

  const conditionColor = ["new", "very_good", "good"].includes(item.condition) ? "pill-success" : item.condition === "used" ? "pill-warn" : "pill-danger";
  const locationColor = item.holderHouseholdId === ctx.household.id ? "pill-success" : historical ? "pill-neutral" : "pill-warn";
  const locationText = item.holderHouseholdId === ctx.household.id ? "Aktuell bei uns" : historical ? "Nicht mehr bei uns" : "Verliehen";
  const conditionText = conditions.find(x => x[0] === item.condition)?.[1] ?? item.condition;

  return (
    <AppShell 
      household={ctx.household.name} 
      title={item.title}
      showBackButton
      backHref="/wardrobe"
    >
      {/* Foto-Hero mit Galerie */}
      <section className="detail-hero" style={{ margin: "calc(var(--space-4) * -1) calc(var(--space-4) * -1) var(--space-6)" }}>
        <div className="hero-image">
          <ItemPhoto photoId={primaryPhoto?.id} title={item.title} />
        </div>
        <div className="hero-overlay" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "var(--space-4) var(--space-4) var(--space-6)", background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.6))" }}>
          <h1 style={{ color: "white", fontSize: "var(--text-2xl)", fontWeight: 700, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {item.title}
          </h1>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
            <span className="size-badge" style={{ background: "rgba(255,255,255,0.9)", color: "var(--text-primary)" }}>
              Größe {item.sizeLabel}
            </span>
            {categoryName && (
              <span className="pill pill-info" style={{ background: "rgba(255,255,255,0.9)" }}>
                {categoryName}
              </span>
            )}
            <span className={`pill ${conditionColor}`} style={{ background: "rgba(255,255,255,0.9)" }}>
              {conditionText}
            </span>
            <span className={`pill ${locationColor}`} style={{ background: "rgba(255,255,255,0.9)" }}>
              {locationText}
            </span>
          </div>
        </div>
        
        {/* Galerie-Indikator */}
        {photos.length > 1 && (
          <div style={{ position: "absolute", bottom: "var(--space-4)", right: "var(--space-4)", display: "flex", gap: "var(--space-1)" }}>
            {photos.map((photo, i) => (
              <span 
                key={photo.id} 
                style={{ 
                  width: "8px", height: "8px", borderRadius: "50%", 
                  background: photo.isPrimary ? "var(--primary)" : "rgba(255,255,255,0.5)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
              />
            ))}
          </div>
        )}
        
        {/* Nav-Buttons */}
        <div className="hero-nav">
          <Link href="/wardrobe" className="nav-btn" aria-label="Zurück">
            <ChevronLeft size={22} />
          </Link>
        </div>
      </section>

      {/* Galerie - horizontale Scroll */}
      {photos.length > 1 && (
        <section className="photo-gallery" style={{ margin: "0 var(--space-4) var(--space-6)", paddingBottom: "var(--space-2)" }}>
          <div style={{ display: "flex", gap: "var(--space-3)", overflowX: "auto", padding: "var(--space-2) 0", margin: "0 calc(var(--space-4) * -1)", scrollSnapType: "x mandatory" }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ flex: "0 0 85%", maxWidth: "280px", scrollSnapAlign: "start" }}>
                <img 
                  src={`/api/photos/${photo.id}`} 
                  alt={`${item.title} - Foto ${photos.indexOf(photo) + 1}`}
                  style={{ 
                    width: "100%", 
                    aspectRatio: "4/3", 
                    objectFit: "cover", 
                    borderRadius: "var(--radius-card)",
                    border: photo.isPrimary ? "2px solid var(--primary)" : "none",
                    boxShadow: "var(--shadow-md)",
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Details Section - kompakt */}
      <section className="card-elevated" style={{ margin: "0 var(--space-4) var(--space-6)" }}>
        <div style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <div className="detail-row">
              <span className="label"><Tag size={16} /> Herkünfte</span>
              <span className="value">{item.sourceName || item.sourceType}</span>
            </div>
            {item.brand && (
              <div className="detail-row">
                <span className="label"><Sparkles size={16} /> Marke</span>
                <span className="value">{item.brand}</span>
              </div>
            )}
            {item.color && (
              <div className="detail-row">
                <span className="label"><Droplet size={16} /> Farbe</span>
                <span className="value">{item.color}</span>
              </div>
            )}
            {item.notes && (
              <div className="detail-row" style={{ flexDirection: "column", gap: "var(--space-1)", alignItems: "flex-start" }}>
                <span className="label">Notiz</span>
                <span className="value" style={{ color: "var(--text-secondary)" }}>{item.notes}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Foto Upload */}
      {own && <AddPhotoSection itemId={id} />}

      {/* Bearbeiten */}
      {own && (
        <details id="edit" open={editing} className="card-elevated" style={{ margin: "0 var(--space-4) var(--space-6)", scrollMarginTop: "var(--space-8)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "var(--space-3) 0", listStyle: "none", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Edit size={20} color="#27AE70" />
            <span style={{ fontSize: "var(--text-lg)" }}>Bearbeiten</span>
            <ChevronRight size={20} style={{ marginLeft: "auto", color: "var(--text-secondary)" }} />
          </summary>
          <form action={updateItem.bind(null, id)} className="fields" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider)" }}>
            <div className="field">
              <label htmlFor="title">Art</label>
              <input id="title" name="title" defaultValue={item.title} required maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="size">Größe</label>
              <input id="size" name="size" defaultValue={item.sizeLabel} required maxLength={25} />
            </div>
            <div className="field">
              <label htmlFor="condition">Zustand</label>
              <select id="condition" name="condition" defaultValue={item.condition}>
                {conditions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="brand">Marke</label>
              <input id="brand" name="brand" defaultValue={item.brand ?? ""} maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="color">Farbe</label>
              <input id="color" name="color" defaultValue={item.color ?? ""} maxLength={70} />
            </div>
            <div className="field">
              <label htmlFor="notes">Notiz</label>
              <textarea id="notes" name="notes" defaultValue={item.notes ?? ""} maxLength={1000} />
            </div>
            <button className="btn wide">Änderungen speichern</button>
          </form>
        </details>
      )}

      {/* Lebenslauf / Timeline */}
      <section className="card-elevated" style={{ margin: "0 var(--space-4) var(--space-6)" }}>
        <h3 className="detail-section-title" style={{ padding: "var(--space-4) var(--space-4) 0" }}>
          <RotateCcw size={20} color="#27AE70" style={{ marginRight: "var(--space-2)" }} />
          Lebenslauf
        </h3>
        <div className="timeline" style={{ padding: "var(--space-4)" }}>
          {events.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "var(--space-4)" }}>
              Noch keine Ereignisse erfasst.
            </p>
          ) : (
            events.map(event => {
              const transfer = event.transferId ? transfersById.get(event.transferId) : undefined;
              const directlyInvolved = transfer && (transfer.fromHouseholdId === ctx.household.id || transfer.toHouseholdId === ctx.household.id);
              const partner = transfer ? (transfer.fromHouseholdId === ctx.household.id ? transfer.toHouseholdId : transfer.fromHouseholdId) : null;
              const counterpart = directlyInvolved && partner ? (names[partner] || "verbundene Familie") : "weitere Familie";
              const heading = event.eventType === "transfer_accepted" && transfer?.type === "loan" ? "Verliehen" : labels[event.eventType] || event.eventType;
              
              return (
                <div key={event.id} className="timeline-item" style={{ 
                  paddingLeft: "var(--space-4)", 
                  borderLeft: "2px solid var(--divider)",
                  marginBottom: "var(--space-4)",
                  position: "relative",
                  paddingBottom: "var(--space-4)",
                }}>
                  <div style={{ 
                    position: "absolute", left: "-8px", top: "2px",
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: "var(--primary)", border: "2px solid white", boxShadow: "0 0 0 2px var(--divider)"
                  }} />
                  <strong style={{ fontSize: "var(--text-base)" }}>{heading}</strong>
                  <p className="text-muted text-sm" style={{ marginTop: "var(--space-1)" }}>
                    {event.createdAt.toLocaleDateString("de-DE")} · {event.createdAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {transfer && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>
                      {directlyInvolved ? "Beteiligter Haushalt: " : "Weitere Übergabe: "}{counterpart}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Aktionen */}
      <div className="action-bar" style={{ padding: "0 var(--space-4) var(--space-8)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Link href="/wardrobe" className="btn btn-outline">← Kleiderschrank</Link>
        <Link href="/wardrobe/history" className="btn btn-outline">Verlauf</Link>
        {own && (
          <Link href={`/wardrobe/${id}?edit=1#edit`} className="btn btn-outline">
            <Edit size={18} aria-hidden="true" /> Bearbeiten
          </Link>
        )}
        {own && (
          <form action={archiveItem.bind(null, id)}>
            <button className="btn btn-danger" type="submit">Archivieren</button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
