import Link from "next/link";
import { eq, or, and, desc } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { items, packages, notifications } from "@/db/schema";
import { AppShell } from "@/components/AppShell";

export default async function Home() {
  const session=await auth();
  if(!session?.oidcSubject) {
    return <main className="shell">
      <header className="brand"><span className="brand-icon">♡</span>KleiderPfad</header>
      <h1>Kleine Kleidung. Große Geschichten.</h1>
      <p className="muted">Der gemeinsame Kleiderschrank für Familien: Fotografieren, organisieren, weitergeben und die Geschichte jedes Kleidungsstücks nachverfolgen.</p>
      <section className="card card-soft"><h2>Einfach weitergeben</h2>
        <p>Erfasse Baby- und Kinderkleidung, packe Pakete und übergib sie an verbundene Familien.</p></section>
      <form action={async()=>{"use server";await signIn("authentik");}}>
        <button className="btn wide" type="submit">Mit Authentik anmelden</button>
      </form>
    </main>;
  }
  const ctx=await getContext();
  const all=await db.select({id:items.id,owner:items.ownerHouseholdId,holder:items.holderHouseholdId})
    .from(items).where(and(eq(items.archived,false),or(eq(items.ownerHouseholdId,ctx.household.id),eq(items.holderHouseholdId,ctx.household.id))));
  const packs=await db.select({id:packages.id}).from(packages).where(eq(packages.householdId,ctx.household.id));
  const alerts=await db.select().from(notifications).where(and(eq(notifications.userId,ctx.user.id),eq(notifications.isRead,false))).orderBy(desc(notifications.createdAt)).limit(3);
  return <AppShell household={ctx.household.name}>
    <h1>Hallo, {ctx.user.displayName}! 👋</h1>
    <p className="muted">Hier ist deine Babykleidung im Überblick.</p>
    <section className="kpi">
      <div className="tile">Bei uns<strong>{all.filter(x=>x.holder===ctx.household.id).length}</strong></div>
      <div className="tile">Verliehen<strong>{all.filter(x=>x.owner===ctx.household.id&&x.holder!==ctx.household.id).length}</strong></div>
      <div className="tile">Pakete<strong>{packs.length}</strong></div>
    </section>
    <div className="sectionheading"><h2>Schnellzugriff</h2></div>
    <div className="grid">
      <Link className="card card-soft" href="/wardrobe/new"><strong>＋ Kleidungsstück</strong><p className="small muted">Foto &amp; wenige Angaben</p></Link>
      <Link className="card card-soft" href="/packages"><strong>▣ Paket packen</strong><p className="small muted">Mehrere Teile übergeben</p></Link>
      <Link className="card card-soft" href="/transfers"><strong>⇄ Übergaben</strong><p className="small muted">Eingang &amp; Ausgang</p></Link>
    </div>
    {alerts.length>0&&<section className="card"><div className="split"><h2>Benachrichtigungen</h2><Link className="small" href="/notifications">Alle ansehen</Link></div>
      {alerts.map(a=><p key={a.id}><strong>{a.title}</strong><br/><span className="muted small">{a.body}</span></p>)}</section>}
    <div className="actions"><form action={async()=>{"use server";await signOut();}}><button className="btn btn-outline">Abmelden</button></form></div>
  </AppShell>;
}
