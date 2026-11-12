import Link from "next/link";
import { and, or, eq, ne, ilike, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { items, itemPhotos, categories } from "@/db/schema";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Plus, Search, Filter, X } from "lucide-react";
import { WardrobeFilters } from "@/components/wardrobe/WardrobeFilters";
import { ProductCard } from "@/components/wardrobe/ProductCard";
import { PackageBasketProvider, BasketActionBar } from "@/components/packages";

type Filters = { q?: string; category?: string; size?: string; condition?: string; status?: string };

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
  const categorySlug = (params.category || "").trim().slice(0, 50);
  const size = (params.size || "").trim().slice(0, 25);
  const condition = (params.condition || "").trim().slice(0, 25);
  const status = (params.status || "").trim().slice(0, 24);
  const holder = ctx.household.id;

  const statusFilter = status === "at_home" ? eq(items.holderHouseholdId, holder) :
    status === "lent" ? and(eq(items.ownerHouseholdId, holder), ne(items.holderHouseholdId, holder)) :
    status === "borrowed" ? and(ne(items.ownerHouseholdId, holder), eq(items.holderHouseholdId, holder)) : undefined;

  // Resolve category slug to categoryId if provided
  let categoryId: string | undefined;
  if (categorySlug) {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    categoryId = cat?.id;
  }

  // Build where conditions
  const whereConditions = [
    eq(items.archived, false),
    or(eq(items.ownerHouseholdId, holder), eq(items.holderHouseholdId, holder)),
    query ? or(ilike(items.title, `%${query}%`), ilike(items.brand, `%${query}%`), ilike(items.color, `%${query}%`)) : undefined,
    size ? ilike(items.sizeLabel, `%${size}%`) : undefined,
    condition && conditionLabels[condition] ? eq(items.condition, condition as typeof items.$inferSelect.condition) : undefined,
    categoryId ? eq(items.categoryId, categoryId) : undefined,
    statusFilter,
  ].filter(Boolean);

  const found = await db.select({ item: items, photoId: itemPhotos.id })
    .from(items)
    .leftJoin(itemPhotos, and(eq(itemPhotos.itemId, items.id), eq(itemPhotos.isPrimary, true)))
    .where(and(...whereConditions))
    .orderBy(desc(items.createdAt));

  return (
    <PackageBasketProvider householdId={holder}>
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

        {/* Filters */}
        <WardrobeFilters searchParams={Promise.resolve(params as any)} />

        {/* Results */}
        <p className="text-muted text-sm" style={{ marginBottom: "var(--space-3)", padding: "0 var(--space-4)" }}>
          {found.length} Kleidungsstück{found.length !== 1 ? "e" : ""} gefunden
        </p>

        {found.length === 0 ? (
          <EmptyState 
            text="Noch keine Kleidung vorhanden" 
            href="/wardrobe/new" 
            action="Erstes Kleidungsstück hinzufügen" 
          />
        ) : (
          <section className="grid" aria-label="Kleidungsstücke" style={{ padding: "0 var(--space-4) var(--space-8)" }}>
            {found.map(({ item, photoId }) => (
              <ProductCard
                key={item.id}
                item={{
                  id: item.id,
                  title: item.title,
                  sizeLabel: item.sizeLabel,
                  condition: item.condition,
                  holderHouseholdId: item.holderHouseholdId,
                  ownerHouseholdId: item.ownerHouseholdId,
                  archived: item.archived,
                }}
                photoId={photoId}
                currentHouseholdId={holder}
              />
            ))}
          </section>
        )}

        {/* Basket Action Bar */}
        <BasketActionBar />
      </AppShell>
    </PackageBasketProvider>
  );
}