import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { packages } from "@/db/schema";
import { createPackage } from "@/actions";
import { AppShell, EmptyState } from "@/components/AppShell";

const statuses:Record<string,string>={draft:"Entwurf",submitted:"Wartet auf Annahme",closed:"Abgeschlossen"};

export default async function Packages() {
  const ctx=await getContext();
  const all=await db.select().from(packages).where(eq(packages.householdId,ctx.household.id)).orderBy(desc(packages.createdAt));
  return <AppShell household={ctx.household.name} title="Pakete">
    <section className="card card-soft"><h2>Neues Paket packen</h2>
      <form action={createPackage} className="fields">
        <div className="field"><label htmlFor="name">Paketname *</label><input id="name" name="title" maxLength={120} required placeholder="z. B. Frühjahr Größe 62/68"/></div>
        <div className="field"><label htmlFor="notes">Notiz (optional)</label><textarea id="notes" name="notes" maxLength={1000} placeholder="z. B. für Anna"/></div>
        <button className="btn wide">＋ Paket erstellen</button>
      </form>
    </section>
    <div className="sectionheading"><h2>Meine Pakete</h2><Link href="/transfers" className="small">Alle Übergaben →</Link></div>
    {!all.length?<EmptyState text="Noch keine Pakete erstellt."/>:<section className="card">
      {all.map(p=><Link className="itemrow" key={p.id} href={"/packages/"+p.id}>
        <div className="thumb" style={{display:"grid",placeItems:"center",fontSize:28}}>▣</div>
        <div className="item-info"><strong>{p.title}</strong><span className="muted small">{p.createdAt.toLocaleDateString("de-DE")}</span><br/><span className="pill">{statuses[p.status]}</span></div><span>›</span>
      </Link>)}
    </section>}
  </AppShell>;
}
