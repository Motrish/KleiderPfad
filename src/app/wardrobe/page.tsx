import Link from "next/link";
import { and, or, eq, ne, ilike, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { items, itemPhotos } from "@/db/schema";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Plus, Search, Filter, X } from "lucide-react";

type Filters = { q?: string; size?: string; condition?: string; status?: string };

const conditionLabels: Record<string, string> = {
  new: "Neu",
  very_good: "Sehr gut",
  good: "Gut",
  used: "Gebraucht",
  damaged: "Beschädigt",
};

export default async function Wardrobe({ searchParams }: { searchParams: Promise<Filters> }) {
  const ctx = await getContext();
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 80);
  const size = (params.size || "").trim().slice(0, 25);
  const condition = (params.condition || "").trim().slice(0, 25);
  const status = (params.status || "").trim().slice(0, 24);
  const holder = ctx.household.id;

  const statusFilter = status === "at_home" ? eq(items.holderHouseholdId, holder) :
    status === "lent" ? and(eq(items.ownerHouseholdId, holder), ne(items.holderHouseholdId, holder)) :
    status === "borrowed" ? and(ne(items.ownerHouseholdId, holder), eq(items.holderHouseholdId, holder)) : undefined;

  const found = await db.select({ item: items, photoId: itemPhotos.id })
    .from(items)
    .leftJoin(itemPhotos, and(eq(itemPhotos.itemId, items.id), eq(itemPhotos.isPrimary, true)))
    .where(and(
      eq(items.archived, false),
      or(eq(items.ownerHouseholdId, holder), eq(items.holderHouseholdId, holder)),
      query ? or(ilike(items.title, `%${query}%`), ilike(items.brand, `%${query}%`), ilike(items.color, `%${query}%`)) : undefined,
      size ? ilike(items.sizeLabel, `%${size}%`) : undefined,
      condition && conditionLabels[condition] ? eq(items.condition, condition as typeof items.$inferSelect.condition) : undefined,
      statusFilter
    ))
    .orderBy(desc(items.createdAt));

  return (
    <AppShell household={ctx.household.name} title="Meine Kleidung">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Meine Kleidung</h1>
          <p className="page-subtitle">Entdecke und verwalte deine Kleidungsstücke</p>
        </div>
        <Link href="/wardrobe/new" className="btn" style={{ marginLeft: "auto" }}>
          <Plus size={20} />
          Hinzufügen
        </Link>
      </div>

      {/* Search Bar */}
      <form action="/wardrobe" method="get" className="fields" style={{ gap: "var(--space-3)" }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={20} color="#A5B0A9" />
          <input 
            name="q" 
            type="search" 
            placeholder="Kleidung durchsuchen …" 
            defaultValue={query}
            style={{ border: "none", background: "transparent", fontSize: "var(--text-lg)", color: "var(--text-primary)", outline: "none", flex: 1, minWidth: 0 }}
          />
          {query && (
            <a href="/wardrobe" className="icon-btn" aria-label="Suche zurücksetzen">
              <X size={20} color="#A5B0A9" />
            </a>
          )}
        </div>
        <Link href="/wardrobe" className="icon-btn" aria-label="Filter">
          <Filter size={20} />
        </Link>
      </form>

      {/* Filter Chips */}
      <div className="filter-chips">
        <button className={`filter-chip ${!condition ? "active" : "inactive"}`} onClick={() => window.location.href = "/wardrobe" + new URLSearchParams({ ...params, condition: "" }).toString()}>
          Alle
        </button>
        {[
          ["Body", "Bodys"],
          ["Strampler", "Strampler"],
          ["Hose", "Hosen"],
          ["Shirt", "Oberteile"],
          ["Pullover", "Pullover"],
          ["Jacke", "Jacken"],
          ["Schlafanzug", "Schlafanzüge"],
          ["Kleid", "Kleider"],
          ["Mütze", "Mützen"],
          ["Socken", "Socken"],
          ["Schuhe", "Schuhe"],
          ["Sonstiges", "Sonstiges"],
        ].map(([val, label]) => (
          <button 
            key={val} 
            className={`filter-chip ${condition === val ? "active" : "inactive"}`}
            onClick={() => window.location.href = "/wardrobe" + new URLSearchParams({ ...params, condition: val }).toString()}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-muted text-sm" style={{ marginBottom: "var(--space-3)" }}>
        {found.length} Kleidungsstück{found.length !== 1 ? "e" : ""} gefunden
      </p>

      {found.length === 0 ? (
        <EmptyState 
          text="Noch keine Kleidung vorhanden" 
          href="/wardrobe/new" 
          action="Erstes Kleidungsstück hinzufügen" 
        />
      ) : (
        <section className="grid" aria-label="Kleidungsstücke">
          {found.map(({ item, photoId }) => (
            <Link key={item.id} href={`/wardrobe/${item.id}`} className="product-card">
              <div className="image-wrapper">
                {photoId ? (
                  <img src={`/api/photos/${photoId}`} alt={item.title} loading="lazy" />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
                    👕
                  </div>
                )}
                <span className={`pill ${item.holderHouseholdId === holder ? "pill-success" : "pill-warn"}`} style={{ fontSize: "var(--text-xs)" }}>
                  {item.holderHouseholdId === holder ? "Bei uns" : "Weitergegeben"}
                </span>
              </div>
              <div className="content">
                <div className="name">{item.title}</div>
                <div className="meta">
                  <span className="size">Größe {item.sizeLabel}</span>
                  <span className="condition">{conditionLabels[item.condition] || item.condition}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppShell>
  );
}