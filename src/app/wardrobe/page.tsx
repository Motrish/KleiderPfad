import Link from "next/link";
import { and, or, eq, ilike, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { items, itemPhotos } from "@/db/schema";
import { AppShell, EmptyState } from "@/components/AppShell";

export default async function Wardrobe({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const ctx=await getContext(), params=await searchParams, query=(params.q||"").trim().slice(0,80);
  const found=await db.select({item:items,photoId:itemPhotos.id}).from(items)
    .leftJoin(itemPhotos,and(eq(itemPhotos.itemId,items.id),eq(itemPhotos.isPrimary,true)))
    .where(and(eq(items.archived,false),
      or(eq(items.ownerHouseholdId,ctx.household.id),eq(items.holderHouseholdId,ctx.household.id)),
      query?ilike(items.title,"%"+query+"%"):undefined))
    .orderBy(desc(items.createdAt));
  return <AppShell household={ctx.household.name} title="Kleiderschrank">
    <div className="actions"><Link href="/wardrobe/new" className="btn">＋ Teil erfassen</Link></div>
    <form action="/wardrobe" method="get" className="field">
      <input name="q" className="input" type="search" placeholder="Art des Kleidungsstücks suchen …" defaultValue={query}/>
    </form>
    {found.length===0?<EmptyState text="Keine Kleidungsstücke gefunden." href="/wardrobe/new" action="Erstes Teil hinzufügen"/>:
      <div className="card">
      {found.map(({item,photoId})=><Link className="itemrow" key={item.id} href={"/wardrobe/"+item.id}>
        {photoId?<img className="thumb" src={"/api/photos/"+photoId} alt={item.title}/>:
          <div className="thumb" style={{display:"grid",placeItems:"center",fontSize:26}}>♧</div>}
        <div className="item-info"><strong>{item.title}</strong><span className="muted small">Größe {item.sizeLabel} · {item.condition}</span><br/>
          <span className={"pill "+(item.holderHouseholdId===ctx.household.id?"":"pill-warn")}>{item.holderHouseholdId===ctx.household.id?"Bei uns":"Weitergegeben"}</span>
        </div><span>›</span>
      </Link>)}</div>}
  </AppShell>;
}
