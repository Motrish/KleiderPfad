import { createPackage } from "@/actions";
import { getContext } from "@/lib/context";
import { AppShell } from "@/components/AppShell";
import { Package, ChevronLeft } from "lucide-react";

export default async function NewPackage() {
  const ctx = await getContext();

  return (
    <AppShell household={ctx.household.name} title="Neues Paket packen" showBackButton backHref="/packages">
      <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <header style={{ marginBottom: "var(--space-6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
            <Package size={24} color="#27AE70" />
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Neues Paket packen</h2>
          </div>
          <p className="text-muted" style={{ margin: 0, fontSize: "var(--text-base)" }}>
            Gib deinem Paket einen Namen und eine optionale Notiz, dann füge Kleidungsstücke hinzu.
          </p>
        </header>
        
        <form action={createPackage} className="fields">
          <div className="field">
            <label htmlFor="title">Paketname *</label>
            <input 
              id="title" 
              name="title" 
              maxLength={120} 
              required 
              placeholder="z. B. Frühjahr Größe 62/68"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="notes">Notiz (optional)</label>
            <textarea id="notes" name="notes" maxLength={1000} placeholder="z. B. für Anna" rows={3} />
          </div>
          
          <div className="actions" style={{ marginTop: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <button type="submit" className="btn wide" style={{ minHeight: "56px", fontSize: "var(--text-lg)", fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" }}>
                <Package size={20} />
                <span>Paket erstellen</span>
              </span>
            </button>
            <button type="button" className="btn btn-outline wide" onClick={() => window.history.back()} style={{ minHeight: "48px" }}>
              Abbrechen
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}