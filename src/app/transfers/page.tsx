import Link from "next/link";
import { and, desc, eq, or, inArray } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { transfers, packages, households, packageItems, items, itemPhotos } from "@/db/schema";
import { decideTransfer, returnLoan } from "@/actions";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Package, ChevronLeft, Check, X, RotateCcw, ArrowRight, Plus } from "lucide-react";

export default async function Transfers() {
  const ctx = await getContext();
  const rows = await db.select({ transfer: transfers, packageTitle: packages.title })
    .from(transfers)
    .innerJoin(packages, eq(packages.id, transfers.packageId))
    .where(or(eq(transfers.toHouseholdId, ctx.household.id), eq(transfers.fromHouseholdId, ctx.household.id)))
    .orderBy(desc(transfers.createdAt));

  const ids = [...new Set(rows.flatMap(x => [x.transfer.toHouseholdId, x.transfer.fromHouseholdId]))];
  const names = ids.length ? await db.select({ id: households.id, name: households.name }).from(households).where(inArray(households.id, ids)) : [];
  const nameMap = Object.fromEntries(names.map(x => [x.id, x.name]));

  const allItemRows = rows.length ? await db.select({ packageId: packageItems.packageId, title: items.title, size: items.sizeLabel, photoId: itemPhotos.id })
    .from(packageItems).innerJoin(items, eq(items.id, packageItems.itemId))
    .leftJoin(itemPhotos, and(eq(itemPhotos.itemId, items.id), eq(itemPhotos.isPrimary, true)))
    .where(inArray(packageItems.packageId, rows.map(x => x.transfer.packageId))) : [];

  const labels: Record<string, string> = { pending: "Wartet auf Annahme", accepted: "Angenommen", declined: "Abgelehnt", cancelled: "Abgebrochen" };
  const statusColors: Record<string, "pill-warn" | "pill-success" | "pill-neutral" | "pill-danger"> = { 
    pending: "pill-warn", 
    accepted: "pill-success", 
    declined: "pill-danger", 
    cancelled: "pill-neutral" 
  };

  return (
    <AppShell household={ctx.household.name} title="Übergaben">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Übergaben</h1>
          <p className="page-subtitle">Versendete und empfangene Pakete sowie offene Leihgaben</p>
        </div>
        <Link href="/packages" className="btn" style={{ marginLeft: "auto" }}>
          <Plus size={20} />
          Paket erstellen
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState 
          text="Noch keine Übergaben vorhanden" 
          href="/packages" 
          action="Erstes Paket erstellen"
        />
      ) : (
        <section style={{ padding: "0 var(--space-4) var(--space-8)" }}>
          {rows.map(({ transfer: t, packageTitle }) => {
            const incoming = t.toHouseholdId === ctx.household.id;
            const contents = allItemRows.filter(x => x.packageId === t.packageId);
            const otherHousehold = incoming ? t.fromHouseholdId : t.toHouseholdId;
            
            return (
              <section key={t.id} className="card-elevated" style={{ margin: "var(--space-3) var(--space-4)" }}>
                {/* Package Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                      <Package size={20} color="#27AE70" />
                      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: 0 }}>{packageTitle}</h3>
                    </div>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0 }}>
                      {incoming ? "Von " + (nameMap[t.fromHouseholdId] || "unbekannt") : "An " + (nameMap[t.toHouseholdId] || "unbekannt")}
                      · {t.type === "gift" ? "Geschenk" : "Leihgabe"}
                      · {t.createdAt.toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <span className={`pill ${statusColors[t.status]}`}>{labels[t.status]}</span>
                </div>

                {/* Items */}
                <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--divider)" }}>
                  {contents.map(c => (
                    <div key={c.title + c.size + c.photoId} className="itemrow" style={{ borderBottom: "none", padding: "var(--space-2) 0" }}>
                      {c.photoId ? (
                        <img className="thumb" src={`/api/photos/${c.photoId}`} alt={c.title} />
                      ) : (
                        <div className="thumb" style={{ display: "grid", placeItems: "center", fontSize: "24px" }}>👕</div>
                      )}
                      <div className="item-info">
                        {c.title}
                        <span className="meta">Größe {c.size}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Details */}
                {t.dueAt && (
                  <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--divider)" }}>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      <RotateCcw size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      Rückgabe geplant: {t.dueAt.toLocaleDateString("de-DE")}
                    </p>
                  </div>
                )}
                {t.returnedAt && (
                  <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--divider)" }}>
                    <span className="pill pill-success">
                      Zurückgegeben am {t.returnedAt.toLocaleDateString("de-DE")}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--divider)", flexWrap: "wrap" }}>
                  {incoming && t.status === "pending" && (
                    <>
                      <form action={decideTransfer.bind(null, t.id, "accepted")}>
                        <button className="btn" type="submit" style={{ minHeight: "40px" }}>
                          <Check size={16} />
                          Annehmen
                        </button>
                      </form>
                      <form action={decideTransfer.bind(null, t.id, "declined")}>
                        <button className="btn btn-outline" type="submit" style={{ minHeight: "40px" }}>
                          <X size={16} />
                          Ablehnen
                        </button>
                      </form>
                    </>
                  )}
                  
                  {incoming && t.status === "accepted" && t.type === "loan" && !t.returnedAt && (
                    <form action={returnLoan.bind(null, t.id)}>
                      <button className="btn btn-secondary" type="submit" style={{ minHeight: "40px" }}>
                        <RotateCcw size={16} />
                        Rückgabe bestätigen
                      </button>
                    </form>
                  )}
                  
                  {!incoming && (
                    <Link href={`/packages/${t.packageId}`} className="btn btn-outline" style={{ minHeight: "40px" }}>
                      <ArrowRight size={16} />
                      Paketdetails
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}