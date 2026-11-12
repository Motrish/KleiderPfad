import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { packages } from "@/db/schema";
import { createPackage } from "@/actions";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Plus, Package, ArrowRight } from "lucide-react";

const statuses: Record<string, string> = { draft: "Entwurf", submitted: "Wartet auf Annahme", closed: "Abgeschlossen" };
const statusColors: Record<string, "pill-success" | "pill-warn" | "pill-neutral"> = { draft: "pill-neutral", submitted: "pill-warn", closed: "pill-success" };

export default async function Packages() {
  const ctx = await getContext();
  const all = await db.select().from(packages).where(eq(packages.householdId, ctx.household.id)).orderBy(desc(packages.createdAt));

  return (
    <AppShell household={ctx.household.name} title="Pakete">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pakete</h1>
          <p className="page-subtitle">Kleidung zusammenpacken und übergeben</p>
        </div>
        <Link href="/packages/new" className="btn" style={{ marginLeft: "auto" }}>
          <Plus size={20} />
          Neues Paket
        </Link>
      </div>

      {/* Quick Stats */}
      <section className="stats-grid" style={{ margin: "var(--space-4)" }}>
        <div className="stat-card">
          <div className="icon"><Package size={20} color="#27AE70" /></div>
          <div className="value">{all.length}</div>
          <div className="label">Pakete insgesamt</div>
        </div>
        <div className="stat-card">
          <div className="icon"><Package size={20} color="#27AE70" /></div>
          <div className="value">{all.filter(p => p.status === "draft").length}</div>
          <div className="label">Entwürfe</div>
        </div>
        <div className="stat-card">
          <div className="icon"><Package size={20} color="#27AE70" /></div>
          <div className="value">{all.filter(p => p.status === "submitted").length}</div>
          <div className="label">Offen</div>
        </div>
        <div className="stat-card">
          <div className="icon"><Package size={20} color="#27AE70" /></div>
          <div className="value">{all.filter(p => p.status === "closed").length}</div>
          <div className="label">Abgeschlossen</div>
        </div>
      </section>

      {/* Package List */}
      {!all.length ? (
        <EmptyState 
          text="Noch keine Pakete erstellt" 
          href="/packages/new" 
          action="Erstes Paket packen" 
        />
      ) : (
        <section style={{ padding: "0 var(--space-4) var(--space-8)" }}>
          {all.map(p => (
            <Link key={p.id} href={`/packages/${p.id}`} className="card-elevated" style={{ display: "block", margin: "var(--space-3) var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: "0 0 var(--space-1)" }}>{p.title}</h3>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0 }}>
                    Erstellt am {p.createdAt.toLocaleDateString("de-DE")}
                  </p>
                </div>
                <span className={`pill ${statusColors[p.status]}`}>{statuses[p.status]}</span>
              </div>
              <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                  {p.notes || "Keine Notizen"}
                </span>
                <ArrowRight size={18} color="#A5B0A9" />
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppShell>
  );
}