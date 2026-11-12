import { createPackage } from "@/actions";
import { getContext } from "@/lib/context";
import { AppShell } from "@/components/AppShell";
import { Package, ChevronLeft } from "lucide-react";

export default async function NewPackage() {
  const ctx = await getContext();

  return (
    <AppShell household={ctx.household.name} title="Neues Paket packen" showBackButton backHref="/packages">
      <section className="card" style={{ margin: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          <Package size={20} color="#27AE70" style={{ marginRight: "var(--space-2)", verticalAlign: "middle" }} />
          Neues Paket packen
        </h2>
        <p className="text-muted" style={{ marginBottom: "var(--space-6)" }}>
          Gib deinem Paket einen Namen und eine optionale Notiz, dann füge Kleidungsstücke hinzu.
        </p>
        
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
          
          <div className="actions" style={{ marginTop: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <button type="submit" className="btn wide" style={{ minHeight: "var(--touch-xl)", fontSize: "var(--text-lg)" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" }}>
                <span>Paket erstellen</span>
              </span>
            </button>
            <button type="button" className="btn btn-outline wide" onClick={() => window.history.back()} style={{ minHeight: "var(--touch-comfortable)" }}>
              Abbrechen
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}