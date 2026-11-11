import { notFound } from "next/navigation";
import { and, eq, or, desc } from "drizzle-orm";
import Link from "next/link";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { items, itemPhotos, itemEvents } from "@/db/schema";
import { updateItem, addPhoto, archiveItem } from "@/actions";
import { AppShell } from "@/components/AppShell";
const conditions=[["new","Neu"],["very_good","Sehr gut"],["good","Gut"],["used","Gebraucht"],["damaged","Beschädigt"]] as const;

export default async function ItemDetails({params}:{params:Promise<{id:string}>}) {
  const ctx=await getContext(), {id}=await params;
  if(!/^[\da-f-]{36}$/i.test(id))notFound();
  const [item]=await db.select().from(items).where(and(eq(items.id,id),
    or(eq(items.ownerHouseholdId,ctx.household.id),eq(items.holderHouseholdId,ctx.household.id))));
  if(!item)notFound();
  const photos=await db.select().from(itemPhotos).where(eq(itemPhotos.itemId,id));
  const events=await db.select().from(itemEvents).where(eq(itemEvents.itemId,id)).orderBy(desc(itemEvents.createdAt));
  const own=item.ownerHouseholdId===ctx.household.id&&item.holderHouseholdId===ctx.household.id&&!item.archived;
  return <AppShell household={ctx.household.name} title={item.title}>
    <p className="muted">Größe {item.sizeLabel} · {conditions.find(x=>x[0]===item.condition)?.[1]??item.condition}</p>
    <span className="pill">{item.holderHouseholdId===ctx.household.id?"Aktuell bei uns":"Aktuell bei einer anderen Familie"}</span>
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
        <div className="field"><label>Art</label><input name="title" defaultValue={item.title} required/></div>
        <div className="field"><label>Größe</label><input name="size" defaultValue={item.sizeLabel} required/></div>
        <div className="field"><label>Zustand</label><select name="condition" defaultValue={item.condition}>
          {conditions.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
        <div className="field"><label>Marke</label><input name="brand" defaultValue={item.brand??""}/></div>
        <div className="field"><label>Farbe</label><input name="color" defaultValue={item.color??""}/></div>
        <div className="field"><label>Notiz</label><textarea name="notes" defaultValue={item.notes??""}/></div>
        <button className="btn wide">Änderungen speichern</button>
      </form>
    </details>}
    <section className="card"><h2>Lebenslauf</h2><div className="timeline">
      {events.map(event=><div key={event.id}><strong>{event.eventType.replaceAll("_"," ")}</strong>
        <p className="muted small">{event.createdAt.toLocaleDateString("de-DE")} · {event.createdAt.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}</p></div>)}
    </div></section>
    <div className="actions"><Link href="/wardrobe" className="btn btn-outline">← Alle Kleidungsstücke</Link>
      {own&&<form action={archiveItem.bind(null,id)}><button className="btn btn-danger">Archivieren</button></form>}
    </div>
  </AppShell>;
}
