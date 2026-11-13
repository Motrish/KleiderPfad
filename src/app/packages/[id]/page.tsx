import Link from "next/link";
import { and, eq, or, inArray, notInArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { packages, packageItems, items, connections, households, itemPhotos, transfers } from "@/db/schema";
import { addPackageItem, removePackageItem, sendPackage } from "@/actions";
import { AppShell } from "@/components/AppShell";
import { Plus, Trash2, Send, ChevronLeft, Package, UserPlus, RotateCcw, Shield, Truck } from "lucide-react";

export default async function PackageDetails({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getContext();
  const { id } = await params;
  
  if (!/^[\da-f-]{36}$/i.test(id)) notFound();
  
  const [p] = await db.select().from(packages).where(and(eq(packages.id, id), eq(packages.householdId, ctx.household.id)));
  if (!p) notFound();

  // For closed packages, fetch the associated transfer to get type and dueAt
  let transferData = null;
  if (p.status === "closed") {
    [transferData] = await db.select().from(transfers).where(eq(transfers.packageId, id));
  }

  const chosen = await db.select({ item: items, photoId: itemPhotos.id })
    .from(packageItems)
    .innerJoin(items, eq(items.id, packageItems.itemId))
    .leftJoin(itemPhotos, and(eq(itemPhotos.itemId, items.id), eq(itemPhotos.isPrimary, true)))
    .where(eq(packageItems.packageId, id));
  
  const selectedIds = chosen.map(x => x.item.id);
  
  const available = p.status === "draft" ? await db.select({ id: items.id, title: items.title, size: items.sizeLabel })
    .from(items)
    .where(and(
      eq(items.ownerHouseholdId, ctx.household.id),
      eq(items.holderHouseholdId, ctx.household.id),
      eq(items.archived, false),
      selectedIds.length ? notInArray(items.id, selectedIds) : undefined
    )) : [];
  
  const links = await db.select().from(connections).where(and(
    eq(connections.status, "accepted"),
    or(eq(connections.householdAId, ctx.household.id), eq(connections.householdBId, ctx.household.id))
  ));
  
  const targetIds = links.map(x => x.householdAId === ctx.household.id ? x.householdBId : x.householdAId);
  const recipients = targetIds.length ? await db.select().from(households).where(inArray(households.id, targetIds)) : [];

  const statusColors: Record<string, "pill-success" | "pill-warn" | "pill-neutral"> = { draft: "pill-neutral", submitted: "pill-warn", closed: "pill-success" };
  const statuses: Record<string, string> = { draft: "Entwurf", submitted: "Wartet auf Annahme", closed: "Abgeschlossen" };

  const renderChosenItems = () => {
    if (chosen.length === 0) {
      return (
        <div className="empty" style={{ margin: "var(--space-4)" }}>
          <div style={{ fontSize: "48px", marginBottom: "var(--space-3)" }}>📦</div>
          <p>Dieses Paket ist noch leer.</p>
          {p.status === "draft" && (
            <Link href={`/packages/${id}`} className="btn" style={{ marginTop: "var(--space-3)" }}>
              <Plus size={18} />
              Teil hinzufügen
            </Link>
          )}
        </div>
      );
    }
    
    return (
      <div style={{ padding: "0 var(--space-4)" }}>
        {chosen.map(({ item, photoId }) => (
          <Link key={item.id} href={`/wardrobe/${item.id}`} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)", padding: "var(--space-3)" }}>
            {photoId ? (
              <img src={`/api/photos/${photoId}`} alt={item.title} className="thumb" />
            ) : (
              <div className="thumb" style={{ display: "grid", placeItems: "center", fontSize: "24px", background: "var(--primary-light)" }}>👕</div>
            )}
            <div className="item-info" style={{ flex: 1 }}>
              <strong>{item.title}</strong>
              <div className="meta">Größe {item.sizeLabel}</div>
            </div>
            {p.status === "draft" && (
              <form action={removePackageItem.bind(null, id)} style={{ display: "inline" }}>
                <input type="hidden" name="itemId" value={item.id} />
                <button type="submit" className="icon-btn" aria-label={`${item.title} entfernen`}>
                  <Trash2 size={18} color="#E76F6F" />
                </button>
              </form>
            )}
          </Link>
        ))}
      </div>
    );
  };

  const renderAddItemsSection = () => {
    if (!available.length) {
      return (
        <div className="empty" style={{ margin: "var(--space-4) 0" }}>
          <p>Keine weiteren Teile verfügbar.</p>
          <Link href="/wardrobe/new" className="btn" style={{ marginTop: "var(--space-3)" }}>
            <Plus size={18} />
            Neues Teil erfassen
          </Link>
        </div>
      );
    }
    
    return (
      <form action={addPackageItem.bind(null, id)} className="fields">
        <div className="field">
          <label>Aus dem Kleiderschrank wählen</label>
          <select name="itemId" required style={{ minHeight: "var(--touch-comfortable)" }}>
            {available.map(item => (
              <option key={item.id} value={item.id}>
                {item.title} – Größe {item.size}
              </option>
            ))}
          </select>
        </div>
        <button className="btn wide" style={{ marginTop: "var(--space-2)" }}>
          <Plus size={18} />
          Hinzufügen
        </button>
      </form>
    );
  };

  return (
    <AppShell household={ctx.household.name} title={p.title}>
      {/* Package Header */}
      <section className="card" style={{ margin: "var(--space-4)", padding: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, margin: "0 0 var(--space-1)" }}>{p.title}</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0 }}>
              Erstellt am {p.createdAt.toLocaleDateString("de-DE")}
            </p>
          </div>
          <span className={`pill ${p.status === "draft" ? "pill-neutral" : p.status === "submitted" ? "pill-warn" : "pill-success"}`}>
            {statuses[p.status]}
          </span>
        </div>
        
        {p.notes && (
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>{p.notes}</p>
        )}
        
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
            {chosen.length} Teil{chosen.length !== 1 ? "e" : ""} im Paket
          </span>
        </div>
      </section>

      {/* Items in Package */}
      <section style={{ padding: "0 var(--space-4) var(--space-4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: 0 }}>Kleidungsstücke ({chosen.length})</h3>
        </div>
        
        {renderChosenItems()}
      </section>

      {/* Add Items Section */}
      {p.status === "draft" && (
        <section className="card" style={{ margin: "var(--space-4)" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>Teil hinzufügen</h3>
          {renderAddItemsSection()}
        </section>
      )}

      {/* Send Package Section */}
      {p.status === "draft" && (
        <section className="card-soft" style={{ margin: "var(--space-4)", padding: "var(--space-5)" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
            <Package size={20} color="#27AE70" style={{ marginRight: "var(--space-2)", verticalAlign: "middle" }} />
            Verschenken oder verleihen
          </h3>
          
          {recipients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-6)" }}>
              <div style={{ fontSize: "48px", marginBottom: "var(--space-3)" }}>🔗</div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
                Verbinde dich zuerst mit einem anderen Haushalt unter 
                <Link href="/family" style={{ color: "var(--primary)", fontWeight: 600 }}>Familie & Kontakte</Link>, 
                bevor du Pakete übergibst.
              </p>
              <Link href="/family" className="btn btn-outline">
                <UserPlus size={18} />
                Zu Familie & Kontakte
              </Link>
            </div>
          ) : (
            <form action={sendPackage.bind(null, id)} className="fields">
              <div className="field">
                <label>Empfänger</label>
                <select name="recipient" required>
                  {recipients.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Art der Übergabe</label>
                <select name="type" defaultValue="gift">
                  <option value="gift">Verschenken – Eigentum geht nach Annahme über</option>
                  <option value="loan">Verleihen – Eigentum bleibt bei uns</option>
                </select>
              </div>
              <div className="field">
                <label>Optionales Rückgabedatum (bei Leihgabe)</label>
                <input type="date" name="dueAt" />
              </div>
              <p className="help">Verschenken ist vorausgewählt. Beim Verleihen bleibt das Eigentum bei euch; ein Rückgabedatum ist optional. Die Übergabe wird erst nach der Bestätigung wirksam.</p>
              <button className="btn wide" disabled={!chosen.length} style={{ marginTop: "var(--space-2)" }}>
                <Truck size={18} />
                Paket zur Bestätigung senden
              </button>
            </form>
          )}
        </section>
      )}

      {/* Status Info for Submitted/Closed Packages */}
      {p.status !== "draft" && (
        <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
            <Shield size={20} color="#27AE70" style={{ marginRight: "var(--space-2)", verticalAlign: "middle" }} />
            Übergabe-Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div className="card" style={{ padding: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-full)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 600 }}>
                {p.status === "submitted" ? "⏳" : p.status === "closed" ? "✓" : "✕"}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "var(--text-base)" }}>
                  {p.status === "submitted" ? "Wartet auf Annahme" : p.status === "closed" ? "Übergabe abgeschlossen" : "Abgebrochen"}
                </strong>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                  Erstellt am {p.createdAt.toLocaleDateString("de-DE")}
                </span>
              </div>
            </div>
            {p.status === "closed" && transferData?.type === "loan" && (
              <div className="card" style={{ padding: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <RotateCcw size={24} color="#27AE70" />
                <div>
                  <strong style={{ display: "block" }}>Leihgabe aktiv</strong>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                    {transferData?.dueAt ? `Rückgabe geplant: ${new Date(transferData.dueAt).toLocaleDateString("de-DE")}` : "Kein Rückgabedatum festgelegt"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <Link href="/packages" className="btn btn-outline wide" style={{ margin: "0 var(--space-4) var(--space-8)" }}>
        <ChevronLeft size={18} />
        Zur Paketübersicht
      </Link>
    </AppShell>
  );
}
