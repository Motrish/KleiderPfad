import Link from "next/link";
import { and, or, eq, ne, ilike, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { items, itemPhotos } from "@/db/schema";
import { AppShell, EmptyState } from "@/components/AppShell";

type Filters={q?:string;size?:string;condition?:string;status?:string};
const conditionLabels:Record<string,string>={
  new:"Neu",very_good:"Sehr gut",good:"Gut",used:"Gebraucht",damaged:"Beschädigt",
};
export default async function Wardrobe({searchParams}:{searchParams:Promise<Filters>}) {
  const ctx=await getContext(), params=await searchParams;
  const query=(params.q||"").trim().slice(0,80);
  const size=(params.size||"").trim().slice(0,25);
  const condition=(params.condition||"").trim().slice(0,25);
  const status=(params.status||"").trim().slice(0,24);
  const holder=ctx.household.id;
  const statusFilter=status==="at_home"?eq(items.holderHouseholdId,holder):
    status==="lent"?and(eq(items.ownerHouseholdId,holder),ne(items.holderHouseholdId,holder)):
    status==="borrowed"?and(ne(items.ownerHouseholdId,holder),eq(items.holderHouseholdId,holder)):undefined;
  const found=await db.select({item:items,photoId:itemPhotos.id}).from(items)
    .leftJoin(itemPhotos,and(eq(itemPhotos.itemId,items.id),eq(itemPhotos.isPrimary,true)))
    .where(and(eq(items.archived,false),
      or(eq(items.ownerHouseholdId,holder),eq(items.holderHouseholdId,holder)),
      query?or(ilike(items.title,"%"+query+"%"),ilike(items.brand,"%"+query+"%"),ilike(items.color,"%"+query+"%")):undefined,
      size?ilike(items.sizeLabel,"%"+size+"%"):undefined,
      condition&&conditionLabels[condition]?eq(items.condition,condition as typeof items.$inferSelect.condition):undefined,
      statusFilter))
    .orderBy(desc(items.createdAt));
  return <AppShell household={ctx.household.name} title="Kleiderschrank">
    <div className="actions">
      <Link href="/wardrobe/new" className="btn">＋ Teil erfassen</Link>
      <Link href="/wardrobe/history" className="btn btn-outline">⇄ Weitergabe-Verlauf</Link>
    </div>
    <form action="/wardrobe" method="get" className="fields card card-soft">
      <div className="field"><label htmlFor="q">Suchen</label>
        <input id="q" name="q" type="search" placeholder="Art, Marke oder Farbe" defaultValue={query}/></div>
      <div className="grid">
        <div className="field"><label htmlFor="size">Größe</label>
          <input id="size" name="size" placeholder="z. B. 62" defaultValue={size}/></div>
        <div className="field"><label htmlFor="condition">Zustand</label><select id="condition" name="condition" defaultValue={condition}>
          <option value="">Alle</option>{Object.entries(conditionLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select></div>
      </div>
      <div className="field"><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={status}>
        <option value="">Alle</option><option value="at_home">Bei uns</option>
        <option value="lent">Verliehen</option><option value="borrowed">Ausgeliehen</option>
      </select></div>
      <div className="actions"><button className="btn">Filter anwenden</button>
        <Link className="btn btn-outline" href="/wardrobe">Zurücksetzen</Link></div>
    </form>
    <p className="muted small">{found.length} Kleidungsstücke gefunden</p>
    {found.length===0?<EmptyState text="Keine Kleidungsstücke gefunden." href="/wardrobe/new" action="Teil hinzufügen"/>:
      <section className="card">{found.map(({item,photoId})=><Link className="itemrow" key={item.id} href={"/wardrobe/"+item.id}>
        {photoId?<img className="thumb" src={"/api/photos/"+photoId} loading="lazy" alt={item.title}/>:
          <div className="thumb" style={{display:"grid",placeItems:"center",fontSize:26}}>♧</div>}
        <div className="item-info"><strong>{item.title}</strong>
          <span className="muted small">Größe {item.sizeLabel} · {conditionLabels[item.condition]||item.condition}</span><br/>
          <span className={"pill "+(item.holderHouseholdId===holder?"":"pill-warn")}>
            {item.holderHouseholdId===holder?"Bei uns":"Weitergegeben"}
          </span>
        </div><span>›</span>
      </Link>)}</section>}
  </AppShell>;
}
