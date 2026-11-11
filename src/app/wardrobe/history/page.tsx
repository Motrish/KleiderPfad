import Link from "next/link";
import { and,eq,or,desc } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { items, packageItems, transfers, itemPhotos } from "@/db/schema";
import { AppShell, EmptyState } from "@/components/AppShell";

export default async function History() {
  const ctx=await getContext();
  const records=await db.selectDistinct({
    id:items.id,title:items.title,size:items.sizeLabel,photoId:itemPhotos.id,createdAt:items.createdAt,
  }).from(items)
    .innerJoin(packageItems,eq(packageItems.itemId,items.id))
    .innerJoin(transfers,eq(transfers.packageId,packageItems.packageId))
    .leftJoin(itemPhotos,and(eq(itemPhotos.itemId,items.id),eq(itemPhotos.isPrimary,true)))
    .where(and(eq(transfers.status,"accepted"),or(
      eq(transfers.toHouseholdId,ctx.household.id),eq(transfers.fromHouseholdId,ctx.household.id))))
    .orderBy(desc(items.createdAt));
  return <AppShell household={ctx.household.name} title="Weitergabe-Verlauf">
    <p className="muted">Diese Kleidungsstücke waren an einer bestätigten Übergabe deines Haushalts beteiligt. Sie bleiben auch nach dem Verschenken auffindbar.</p>
    {!records.length?<EmptyState text="Noch keine früheren Übergaben."/>:
      <section className="card">{records.map(item=><Link className="itemrow" key={item.id} href={"/wardrobe/"+item.id}>
        {item.photoId?<img src={"/api/photos/"+item.photoId} className="thumb" alt={item.title}/>:<div className="thumb" style={{display:"grid",placeItems:"center"}}>♧</div>}
        <div className="item-info"><strong>{item.title}</strong><span className="muted small">Größe {item.size}</span></div><span>›</span>
      </Link>)}</section>}
    <Link href="/wardrobe" className="btn btn-outline">← Zum Kleiderschrank</Link>
  </AppShell>;
}
