import Link from "next/link";
import { and, eq, or, desc } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { items, packageItems, transfers, itemPhotos } from "@/db/schema";
import { AppShell, EmptyState } from "@/components/AppShell";
import { ChevronLeft } from "lucide-react";

export default async function History() {
  const ctx = await getContext();
  const records = await db.selectDistinct({
    id: items.id,
    title: items.title,
    size: items.sizeLabel,
    photoId: itemPhotos.id,
    createdAt: items.createdAt,
  }).from(items)
    .innerJoin(packageItems, eq(packageItems.itemId, items.id))
    .innerJoin(transfers, eq(transfers.packageId, packageItems.packageId))
    .leftJoin(itemPhotos, and(eq(itemPhotos.itemId, items.id), eq(itemPhotos.isPrimary, true)))
    .where(and(eq(transfers.status, "accepted"), or(
      eq(transfers.toHouseholdId, ctx.household.id),
      eq(transfers.fromHouseholdId, ctx.household.id)
    )))
    .orderBy(desc(items.createdAt));

  return (
    <AppShell household={ctx.household.name} title="Weitergabe-Verlauf" showBackButton backHref="/wardrobe">
      <p className="text-muted" style={{ margin: "var(--space-4)" }}>
        Diese Kleidungsstücke waren an einer bestätigten Übergabe deines Haushalts beteiligt. 
        Sie bleiben auch nach dem Verschenken auffindbar.
      </p>
      {!records.length ? (
        <EmptyState 
          text="Noch keine früheren Übergaben" 
          href="/wardrobe/new" 
          action="Kleidung hinzufügen" 
        />
      ) : (
        <section className="grid" style={{ padding: "0 var(--space-4) var(--space-8)" }}>
          {records.map(item => (
            <Link key={item.id} href={`/wardrobe/${item.id}`} className="product-card">
              <div className="image-wrapper">
                {item.photoId ? (
                  <img src={`/api/photos/${item.photoId}`} alt={item.title} loading="lazy" />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
                    👕
                  </div>
                )}
              </div>
              <div className="content">
                <div className="name">{item.title}</div>
                <div className="meta">
                  <span className="size">Größe {item.size}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppShell>
  );
}