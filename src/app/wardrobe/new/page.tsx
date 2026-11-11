import Link from "next/link";
import { createItem } from "@/actions";
import { getContext } from "@/lib/context";
import { AppShell } from "@/components/AppShell";

export default async function NewItem() {
  const ctx=await getContext();
  return <AppShell household={ctx.household.name} title="Kleidungsstück erfassen">
    <p className="muted">Foto aufnehmen, wenige Angaben ergänzen und speichern.</p>
    <form action={createItem} className="fields">
      <div className="field"><label htmlFor="photo">Foto (optional)</label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment"/>
        <span className="help">Max. 10 MB. Fotos werden verkleinert und ohne Metadaten gespeichert.</span></div>
      <div className="field"><label htmlFor="title">Art des Kleidungsstücks *</label>
        <select id="title" name="title" required defaultValue="Body">
          {["Body","Strampler","Hose","Shirt","Pullover","Jacke","Schlafanzug","Kleid","Mütze","Socken","Schuhe","Sonstiges"].map(x=><option key={x}>{x}</option>)}
        </select></div>
      <div className="field"><label htmlFor="size">Größe *</label>
        <input name="size" id="size" required placeholder="z. B. 62, 62/68, 18–21" maxLength={25}/></div>
      <div className="field"><label htmlFor="condition">Zustand</label><select id="condition" name="condition" defaultValue="good">
        <option value="new">Neu</option><option value="very_good">Sehr gut</option>
        <option value="good">Gut</option><option value="used">Gebraucht</option>
        <option value="damaged">Beschädigt</option></select></div>
      <div className="field"><label htmlFor="sourceType">Herkunft</label><select id="sourceType" name="sourceType" defaultValue="unknown">
        <option value="unknown">Unbekannt</option><option value="gift">Geschenk</option>
        <option value="bought">Gekauft</option><option value="received">Weitergegeben bekommen</option></select></div>
      <div className="field"><label htmlFor="sourceName">Von wem / woher? (optional)</label><input id="sourceName" name="sourceName" maxLength={150} placeholder="z. B. Oma oder Flohmarkt"/></div>
      <details><summary>Weitere Angaben (optional)</summary><div className="fields">
        <div className="field"><label htmlFor="brand">Marke</label><input id="brand" name="brand" maxLength={100}/></div>
        <div className="field"><label htmlFor="color">Farbe</label><input id="color" name="color" maxLength={70}/></div>
        <div className="field"><label htmlFor="notes">Notiz</label><textarea id="notes" name="notes" maxLength={1000}/></div>
      </div></details>
      <button type="submit" className="btn wide">✓ Speichern</button>
      <Link href="/wardrobe" className="btn btn-outline wide">Abbrechen</Link>
    </form>
  </AppShell>;
}
