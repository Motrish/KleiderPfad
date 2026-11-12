import { notFound } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { getContext } from "@/lib/context";
import { getVisibleItem } from "@/lib/access";
import { db } from "@/lib/db";
import { itemPhotos, itemEvents, transfers, households } from "@/db/schema";
import { updateItem, addPhoto, archiveItem } from "@/actions";
import { AppShell } from "@/components/AppShell";
import { AddPhotoSection } from "@/components/AddPhotoSection";
import { 
  ChevronLeft, 
  Edit, 
  MoreHorizontal, 
  Package, 
  RotateCcw, 
  Trash2,
  Heart,
  Share2
} from "lucide-react";

const conditions = [["new", "Neu"], ["very_good", "Sehr gut"], ["good", "Gut"], ["used", "Gebraucht"], ["damaged", "Beschädigt"]] as const;
const labels: Record<string, string> = {
  created: "Erfasst", updated: "Bearbeitet", archived: "Archiviert",
  transfer_requested: "Übergabe angefragt", transfer_accepted: "Weitergegeben",
  transfer_declined: "Übergabe abgelehnt", loan_returned: "Zurückgegeben",
};

export default async function ItemDetails({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getContext();
  const { id } = await params;
  
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

  return (
    <AppShell 
      household={ctx.household.name} 
      title={item.title}
      showBackButton
      backHref="/wardrobe"
    >
      {/* Detail Header with Photo */}
      <section className="detail-header" style={{ margin: "calc(var(--space-4) * -1) calc(var(--space-4) * -1) var(--space-4)" }}>
        <div className="image-container">
          {primaryPhoto ? (
            <img src={`/api/photos/${primaryPhoto.id}`} alt={item.title} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "64px" }}>
              👕
            </div>
          )}
        </div>
        <div className="nav-buttons">
          <Link href="/wardrobe" className="nav-btn" aria-label="Zurück">
            <ChevronLeft size={22} />
          </Link>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button className="nav-btn" aria-label="Bearbeiten">
              <Edit size={22} />
            </button>
            <button className="nav-btn" aria-label="Mehr">
              <MoreHorizontal size={22} />
            </button>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="detail-info">
        <h1 className="name">{item.title}</h1>
        <div className="meta-row">
          <span className="size-badge">Größe {item.sizeLabel}</span>
          <span className={`pill ${["new", "very_good", "good"].includes(item.condition) ? "pill-success" : item.condition === "used" ? "pill-warn" : "pill-danger"}`}>
            {conditions.find(x => x[0] === item.condition)?.[1] ?? item.condition}
          </span>
          <span className={`pill ${item.holderHouseholdId === ctx.household.id ? "pill-success" : historical ? "pill-neutral" : "pill-warn"}`}>
            {item.holderHouseholdId === ctx.household.id ? "Aktuell bei uns" : historical ? "Nicht mehr bei uns" : "Verliehen"}
          </span>
        </div>
      </section>

      {/* Photos Gallery */}
      {photos.length > 1 && (
        <section className="card" style={{ margin: "var(--space-4)", padding: "var(--space-3)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", overflowX: "auto", padding: "var(--space-2) calc(var(--space-4) * -1) var(--space-2)", margin: "calc(var(--space-3) * -1) calc(var(--space-4) * -1)" }}>
            {photos.map(photo => (
              <img 
                key={photo.id} 
                src={`/api/photos/${photo.id}`} 
                alt={`${item.title} - Foto`}
                style={{ 
                  width: "120px", 
                  height: "120px", 
                  objectFit: "cover", 
                  borderRadius: "var(--radius-card)",
                  flexShrink: 0,
                  border: photo.isPrimary ? "2px solid var(--primary)" : "none",
                  boxShadow: "var(--shadow-sm)"
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Details */}
      <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <h3 className="detail-section-title">Details</h3>
        <div className="detail-row">
          <span className="label">Herkunft</span>
          <span className="value">{item.sourceName || item.sourceType}</span>
        </div>
        {item.brand && (
          <div className="detail-row">
            <span className="label">Marke</span>
            <span className="value">{item.brand}</span>
          </div>
        )}
        {item.color && (
          <div className="detail-row">
            <span className="label">Farbe</span>
            <span className="value">{item.color}</span>
          </div>
        )}
        {item.notes && (
          <div className="detail-row" style={{ flexDirection: "column", gap: "var(--space-1)", alignItems: "flex-start" }}>
            <span className="label">Notiz</span>
            <span className="value" style={{ color: "var(--text-secondary)" }}>{item.notes}</span>
          </div>
        )}
      </section>

      {/* Photo Upload Section */}
      {own && <AddPhotoSection itemId={id} onPhotoAdded={() => {}} />}

      {/* Edit Section */}
      {own && (
        <details className="card">
          <summary style={{ cursor: "pointer", fontWeight: 600, padding: "var(--space-2) 0", listStyle: "none", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Edit size={18} color="#27AE70" />
            <span>Bearbeiten</span>
          </summary>
          <form action={updateItem.bind(null, id)} className="fields" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider)" }}>
            <div className="field">
              <label htmlFor="title">Art</label>
              <input name="title" defaultValue={item.title} required maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="size">Größe</label>
              <input name="size" defaultValue={item.sizeLabel} required maxLength={25} />
            </div>
            <div className="field">
              <label htmlFor="condition">Zustand</label>
              <select name="condition" defaultValue={item.condition}>
                {conditions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="brand">Marke</label>
              <input name="brand" defaultValue={item.brand ?? ""} maxLength={100} />
            </div>
            <div className="field">
              <label htmlFor="color">Farbe</label>
              <input name="color" defaultValue={item.color ?? ""} maxLength={70} />
            </div>
            <div className="field">
              <label htmlFor="notes">Notiz</label>
              <textarea name="notes" defaultValue={item.notes ?? ""} maxLength={1000} />
            </div>
            <button className="btn wide">Änderungen speichern</button>
          </form>
        </details>
      )}

      {/* History */}
      <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <h3 className="detail-section-title">Lebenslauf</h3>
        <div className="timeline">
          {events.map(event => {
            const transfer = event.transferId ? transfersById.get(event.transferId) : undefined;
            const directlyInvolved = transfer && (transfer.fromHouseholdId === ctx.household.id || transfer.toHouseholdId === ctx.household.id);
            const partner = transfer ? (transfer.fromHouseholdId === ctx.household.id ? transfer.toHouseholdId : transfer.fromHouseholdId) : null;
            const counterpart = directlyInvolved && partner ? (names[partner] || "verbundene Familie") : "weitere Familie";
            const heading = event.eventType === "transfer_accepted" && transfer?.type === "loan" ? "Verliehen" : labels[event.eventType] || event.eventType;
            
            return (
              <div key={event.id}>
                <strong>{heading}</strong>
                <p className="text-muted text-sm">
                  {event.createdAt.toLocaleDateString("de-DE")} · {event.createdAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {transfer && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {directlyInvolved ? "Beteiligter Haushalt: " : "Weitere Übergabe: "}{counterpart}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="action-bar">
        <Link href="/wardrobe" className="btn btn-outline">← Kleiderschrank</Link>
        <Link href="/wardrobe/history" className="btn btn-outline">Verlauf</Link>
        {own && (
          <form action={archiveItem.bind(null, id)}>
            <button className="btn btn-danger" type="submit">Archivieren</button>
          </form>
        )}
      </div>
    </AppShell>
  );
}