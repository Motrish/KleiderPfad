import Link from "next/link";
import { eq, or, and, desc } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { items, packages, notifications } from "@/db/schema";
import { AppShell } from "@/components/AppShell";

export default async function Home() {
  const session = await auth();
  if (!session?.oidcSubject) {
    return (
      <main className="login-page">
        <div className="login-brand-row">
          <img className="login-logo" src="/brand/kit/logos/primary-horizontal.svg" alt="Kleidolino – Kleine Kleidung. Große Geschichten." />
        </div>
        <section className="login-hero">
          <div className="login-copy">
            <span className="brand-kicker"><img src="/brand/kit/icons/heart.svg" alt="" /> Weitergeben mit Herz</span>
            <h1>Kleine Kleidung.<br />Große Geschichten.</h1>
            <p>Kinderkleidung gemeinsam verwalten, liebevoll weitergeben und ihren Weg verfolgen.</p>
            <form action={async () => { "use server"; await signIn("authentik"); }}>
              <button className="btn login-cta" type="submit">Zu deinem Kleiderschrank <span aria-hidden="true">→</span></button>
            </form>
            <p className="login-note">Für Familien und Freundeskreise · Gemeinsam statt einzeln</p>
          </div>
          <img className="login-illustration" src="/brand/kit/illustrations/hero-bunny-clothes.svg" alt="Illustration: liebevoll gefaltete Kinderkleidung und ein Kuschelhase" />
        </section>
        <footer className="login-footer">Ein Kleidungsstück, viele kleine Abenteuer.</footer>
      </main>
    );
  }
  const ctx = await getContext();
  const all = await db.select({ id: items.id, owner: items.ownerHouseholdId, holder: items.holderHouseholdId })
    .from(items).where(and(eq(items.archived, false), or(eq(items.ownerHouseholdId, ctx.household.id), eq(items.holderHouseholdId, ctx.household.id))));
  const packs = await db.select({ id: packages.id }).from(packages).where(eq(packages.householdId, ctx.household.id));
  const alerts = await db.select().from(notifications).where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false))).orderBy(desc(notifications.createdAt)).limit(3);

  return <AppShell household={ctx.household.name} unreadNotifications={alerts.length}>
    <section className="dashboard-hero">
      <div className="dashboard-hero-copy">
        <span className="brand-kicker"><img src="/brand/kit/icons/leaf.svg" alt="" /> Dein Familien-Kleiderschrank</span>
        <h1>Schön, dass du da bist, {ctx.user.displayName}!</h1>
        <p>Kleine Kleidung. Große Geschichten. Hier findest du alles, was deine Familie teilt und weitergibt.</p>
        <Link href="/wardrobe/new" className="btn">Kleidungsstück erfassen <span aria-hidden="true">→</span></Link>
      </div>
      <img className="dashboard-hero-image" src="/brand/kit/illustrations/hero-bunny-clothes.svg" alt="" aria-hidden="true" />
    </section>

    <section className="dashboard-stats" aria-label="Bestandsübersicht">
      <div className="stat-card"><img src="/brand/kit/icons/hanger.svg" alt="" /><span>Bei uns</span><strong>{all.filter(x => x.holder === ctx.household.id).length}</strong></div>
      <div className="stat-card"><img src="/brand/kit/icons/swap.svg" alt="" /><span>Verliehen</span><strong>{all.filter(x => x.owner === ctx.household.id && x.holder !== ctx.household.id).length}</strong></div>
      <div className="stat-card"><img src="/brand/kit/icons/package.svg" alt="" /><span>Pakete</span><strong>{packs.length}</strong></div>
    </section>

    <section className="dashboard-section">
      <div className="sectionheading"><h2>Was möchtest du tun?</h2><span>Alles Wichtige auf einen Blick</span></div>
      <div className="quick-access">
        <Link className="quick-access-item" href="/wardrobe"><img src="/brand/kit/icons/hanger.svg" alt="" /><span className="label">Kleidung ansehen</span><span className="small muted">Dein Bestand, gut sortiert</span></Link>
        <Link className="quick-access-item" href="/packages"><img src="/brand/kit/icons/package.svg" alt="" /><span className="label">Paket packen</span><span className="small muted">Teile für die nächste Familie</span></Link>
        <Link className="quick-access-item" href="/transfers"><img src="/brand/kit/icons/swap.svg" alt="" /><span className="label">Übergaben</span><span className="small muted">Eingang und Ausgang</span></Link>
      </div>
    </section>
    {alerts.length > 0 && <section className="card dashboard-alerts"><div className="split"><h2>Benachrichtigungen</h2><Link className="small" href="/notifications">Alle ansehen</Link></div>
      {alerts.map(a => <p key={a.id}><strong>{a.title}</strong><br /><span className="muted small">{a.body}</span></p>)}</section>}
    <div className="actions"><form action={async () => { "use server"; await signOut(); }}><button className="btn btn-outline" type="submit">Abmelden</button></form></div>
  </AppShell>;
}
