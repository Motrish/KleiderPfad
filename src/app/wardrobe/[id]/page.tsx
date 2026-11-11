import { notFound } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { getContext } from "@/lib/context";
import { getVisibleItem } from "@/lib/access";
import { db } from "@/lib/db";
import { itemPhotos, itemEvents, transfers, households } from "@/db/schema";
import { updateItem, addPhoto, archiveItem } from "@/actions";
import { AppShell } from "@/components/AppShell";
const conditions=[["new","Neu"],["very_good","Sehr gut"],["good","Gut"],["used","Gebraucht"],["damaged","Beschädigt"]] as const;
const labels:Record<string,string>={
  created:"Erfasst",updated:"Bearbeitet",archived:"Archiviert",
  transfer_requested:"Übergabe angefragt",transfer_accepted:"Weitergegeben",
  transfer_declined:"Übergabe abgelehnt",loan_returned:"Zurückgegeben",
};

export default async function ItemDetails({params}:{params:Promise<{id:string}>}) {
  const ctx=await getContext(),{id}=await params;
  if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id))notFound();
  const item=await getVisibleItem(id,ctx.household.id);
  if(!item)notFound();
  const photos=await db.select().from(itemPhotos).where(eq(itemPhotos.itemId,id));
  const events=await db.select().from(itemEvents).where(eq(itemEvents.itemId,id)).orderBy(desc(itemEvents.createdAt));
  const transferIds=[...new Set(events.map(e=>e.transferId).filter((x):x is string=>!!x))];
  const historyTransfers=transferIds.length?await db.select().from(transfers).where(inArray(transfers.id,transferIds)):[];
  const transfersById=new Map(historyTransfers.map(t=>[t.id,t]));
  const householdIds=[...new Set(historyTransfers.flatMap(t=>[t.fromHouseholdId,t.toHouseholdId]))];
  const knownNames=householdIds.length?await db.select({id:households.id,name:households.name})
    .from(households).where(inArray(households.id,householdIds)):[];
  const names=Object.fromEntries(knownNames.map(h=>[h.id,h.name]));
  const own=item.ownerHouseholdId===ctx.household.id&&item.holderHouseholdId===ctx.household.id&&!item.archived;
  const historical=item.ownerHouseholdId!==ctx.household.id&&item.holderHouseholdId!==ctx.household.id;
  return <AppShell household={ctx.household.name} title={item.title}>
    <p className="muted">Größe {item.sizeLabel} · {conditions.find(x=>x[0]===item.condition)?.[1]??item.condition}</p>
    <span className="pill">{item.holderHouseholdId===ctx.household.id?"Aktuell bei uns":historical?"Nicht mehr bei uns":"Verliehen"}</span>
    <div className="grid">{photos.map(photo=><img className="thumb big" key={photo.id} src={"/api/photos/"+photo.id} alt={"Foto: "+item.title}/>)}</div>
    {own&&<section className="card"><h2>Foto hinzufügen</h2>
      <form action={addPhoto.bind(null,id)} className="fields">
        <input type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" required/>
        <button className="btn btn-secondary">Foto hochladen</button>
      </form></section>}
    <section className="card"><h2>Details</h2>
      <p>Herkunft: {item.sourceName||item.sourceType}</p>
      {item.brand&&<p>Marke: {item.brand}</p>}{item.color&&<p>Farbe: {item.color}</p>}
      {item.notes&&<p className="muted">{item.notes}</p>}
    </section>
    {own&&<details className="card"><summary><strong>Bearbeiten</strong></summary>
      <form action={updateItem.bind(null,id)} className="fields">
        <div className="field"><label>Art</label><input name="title" defaultValue={item.title} required maxLength={100}/></div>
        <div className="field"><label>Größe</label><input name="size" defaultValue={item.sizeLabel} required maxLength={25}/></div>
        <div className="field"><label>Zustand</label><select name="condition" defaultValue={item.condition}>
          {conditions.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
        <div className="field"><label>Marke</label><input name="brand" defaultValue={item.brand??""} maxLength={100}/></div>
        <div className="field"><label>Farbe</label><input name="color" defaultValue={item.color??""} maxLength={70}/></div>
        <div className="field"><label>Notiz</label><textarea name="notes" defaultValue={item.notes??""} maxLength={1000}/></div>
        <button className="btn wide">Änderungen speichern</button>
      </form>
    </details>}
    <section className="card"><h2>Lebenslauf</h2><div className="timeline">
      {events.map(event=>{
        const transfer=event.transferId?transfersById.get(event.transferId):undefined;
        const directlyInvolved=transfer&&(transfer.fromHouseholdId===ctx.household.id||transfer.toHouseholdId===ctx.household.id);
        const partner=transfer?(transfer.fromHouseholdId===ctx.household.id?transfer.toHouseholdId:transfer.fromHouseholdId):null;
        const counterpart=directlyInvolved&&partner?(names[partner]||"verbundene Familie"):"weitere Familie";
        const heading=event.eventType==="transfer_accepted"&&transfer?.type==="loan"?"Verliehen":labels[event.eventType]||event.eventType;
        return <div key={event.id}><strong>{heading}</strong>
          <p className="muted small">{event.createdAt.toLocaleDateString("de-DE")} · {event.createdAt.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}</p>
          {transfer&&<p className="small muted">{directlyInvolved?"Beteiligter Haushalt: ":"Weitere Übergabe: "}{counterpart}</p>}
        </div>;
      })}
    </div></section>
    <div className="actions"><Link href="/wardrobe" className="btn btn-outline">← Kleiderschrank</Link>
      <Link href="/wardrobe/history" className="btn btn-outline">⇄ Weitergabe-Verlauf</Link>
      {own&&<form action={archiveItem.bind(null,id)}><button className="btn btn-danger">Archivieren</button></form>}
    </div>
  </AppShell>;
}
