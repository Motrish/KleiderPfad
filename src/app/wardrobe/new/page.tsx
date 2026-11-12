import Link from "next/link";
import { createItem } from "@/actions";
import { getContext } from "@/lib/context";
import { AppShell } from "@/components/AppShell";
import { PhotoCapture } from "@/components/ui/PhotoCapture";

const categories = [
  "Body", "Strampler", "Hose", "Shirt", "Pullover", "Jacke",
  "Schlafanzug", "Kleid", "Mütze", "Socken", "Schuhe", "Sonstiges"
] as const;

const conditions = [
  { value: "new", label: "Neu" },
  { value: "very_good", label: "Sehr gut" },
  { value: "good", label: "Gut" },
  { value: "used", label: "Gebraucht" },
  { value: "damaged", label: "Beschädigt" },
] as const;

const sourceTypes = [
  { value: "unknown", label: "Unbekannt" },
  { value: "gift", label: "Geschenk" },
  { value: "bought", label: "Gekauft" },
  { value: "received", label: "Weitergegeben bekommen" },
] as const;

export default async function NewItem() {
  const ctx = await getContext();

  return <AppShell household={ctx.household.name} title="Kleidungsstück erfassen">
    <p className="muted">Foto aufnehmen, wenige Angaben ergänzen und speichern.</p>
    <NewItemForm />
  </AppShell>;
}

function NewItemForm() {
  return (
    <form action={createItem} className="fields">
      <div className="field">
        <label>Foto (optional)</label>
        <PhotoCapture name="photo" />
      </div>

      <div className="field">
        <label htmlFor="title">Art des Kleidungsstücks *</label>
        <select id="title" name="title" required defaultValue="Body">
          {categories.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="size">Größe *</label>
        <input name="size" id="size" required placeholder="z. B. 62, 62/68, 18–21" maxLength={25} />
      </div>

      <div className="field">
        <label htmlFor="condition">Zustand</label>
        <select id="condition" name="condition" defaultValue="good">
          {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="sourceType">Herkunft</label>
        <select id="sourceType" name="sourceType" defaultValue="unknown">
          {sourceTypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="sourceName">Von wem / woher? (optional)</label>
        <input id="sourceName" name="sourceName" maxLength={150} placeholder="z. B. Oma oder Flohmarkt" />
      </div>

      <details>
        <summary>Weitere Angaben (optional)</summary>
        <div className="fields">
          <div className="field"><label htmlFor="brand">Marke</label><input id="brand" name="brand" maxLength={100} /></div>
          <div className="field"><label htmlFor="color">Farbe</label><input id="color" name="color" maxLength={70} /></div>
          <div className="field"><label htmlFor="notes">Notiz</label><textarea id="notes" name="notes" maxLength={1000} /></div>
        </div>
      </details>

      <div className="actions">
        <button type="submit" className="btn wide">✓ Speichern</button>
        <Link href="/wardrobe" className="btn btn-outline wide">Abbrechen</Link>
      </div>
    </form>
  );
}