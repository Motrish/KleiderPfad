import Link from "next/link";
import { and,eq,or, inArray, notInArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { packages, packageItems, items, connections, households, itemPhotos } from "@/db/schema";
import { addPackageItem, removePackageItem, sendPackage } from "@/actions";
import { AppShell } from "@/components/AppShell";

export default async function PackageDetails({params}:{params:Promise<{id:string}>}) {
  const ctx=await getContext(),{id}=await params;
  if(!/^[\da-f-]{36}$/i.test(id))notFound();
  const [p]=await db.select().from(packages).where(and(eq(packages.id,id),eq(packages.householdId,ctx.household.id)));
  if(!p)notFound();
  const chosen=await db.select({item:items,photoId:itemPhotos.id}).from(packageItems)
    .innerJoin(items,eq(items.id,packageItems.itemId))
    .leftJoin(itemPhotos,and(eq(itemPhotos.itemId,items.id),eq(itemPhotos.isPrimary,true)))
    .where(eq(packageItems.packageId,id));
  const selectedIds=chosen.map(x=>x.item.id);
  const available=p.status==="draft"?await db.select({id:items.id,title:items.title,size:items.sizeLabel}).from(items)
    .where(and(eq(items.ownerHouseholdId,ctx.household.id),eq(items.holderHouseholdId,ctx.household.id),
      eq(items.archived,false),selectedIds.length?notInArray(items.id,selectedIds):undefined)):[];
  const links=await db.select().from(connections).where(and(eq(connections.status,"accepted"),
    or(eq(connections.householdAId,ctx.household.id),eq(connections.householdBId,ctx.household.id))));
  const targetIds=links.map(x=>x.householdAId===ctx.household.id?x.householdBId:x.householdAId);
  const recipients=targetIds.length?await db.select().from(households).where(inArray(households.id,targetIds)):[];
  return <AppShell household={ctx.household.name} title={p.title}>
    <p className="muted">{p.notes||"Paketinhalt auswählen und anschließend gemeinsam übertragen."}</p>
    <span className="pill">{p.status==="draft"?"Entwurf":p.status==="submitted"?"Versendet":"Abgeschlossen"} · {chosen.length} Teile</span>
    <h2 style={{marginTop:24}}>Kleidungsstücke</h2>
    <section className="card">
      {!chosen.length?<p className="muted">Dieses Paket ist noch leer.</p>:chosen.map(({item,photoId})=><div className="itemrow" key={item.id}>
        {photoId?<img className="thumb" src={"/api/photos/"+photoId} alt={item.title}/>:<div className="thumb" style={{display:"grid",placeItems:"center"}}>♧</div>}
        <div className="item-info"><Link href={"/wardrobe/"+item.id}><strong>{item.title}</strong></Link><span className="muted small">Größe {item.sizeLabel}</span></div>
        {p.status==="draft"&&<form action={removePackageItem.bind(null,id)}>
          <input type="hidden" name="itemId" value={item.id}/><button className="btn btn-outline" aria-label={item.title+" entfernen"}>−</button>
        </form>}
      </div>)}
    </section>
    {p.status==="draft"&&<>
      <section className="card"><h2>Teil hinzufügen</h2>
        {available.length?<form action={addPackageItem.bind(null,id)} className="fields">
          <div className="field"><label>Aus dem Kleiderschrank wählen</label><select name="itemId" required>
            {available.map(item=><option key={item.id} value={item.id}>{item.title} – Größe {item.size}</option>)}
          </select></div><button className="btn btn-secondary">＋ Hinzufügen</button></form>
          :<p className="muted">Keine weiteren Teile verfügbar. <Link href="/wardrobe/new">Neues Teil erfassen</Link></p>}
      </section>
      <section className="card card-soft"><h2>Paket übergeben</h2>
        {recipients.length===0?<p>Verbinde dich unter <Link href="/family"><strong>Familie &amp; Kontakte</strong></Link> mit einem anderen Haushalt, bevor du Pakete übergibst.</p>:
          <form action={sendPackage.bind(null,id)} className="fields">
            <div className="field"><label>Empfänger</label><select name="recipient" required>{recipients.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
            <div className="field"><label>Art der Übergabe</label><select name="type" defaultValue="gift">
              <option value="gift">Verschenken</option><option value="loan">Verleihen</option></select></div>
            <div className="field"><label>Optionales Rückgabedatum (bei Leihgabe)</label><input type="date" name="dueAt"/></div>
            <p className="help">Der neue Besitzer wird erst nach der Bestätigung eingetragen.</p>
            <button className="btn wide" disabled={!chosen.length}>Paket zur Bestätigung senden →</button>
          </form>}
      </section>
    </>}
    <Link href="/packages" className="btn btn-outline">← Zur Paketübersicht</Link>
  </AppShell>;
}
