import Link from "next/link";
import { eq, or, and, desc, inArray } from "drizzle-orm";
import { auth, signIn, signOut } from "@/auth";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { items, packages, notifications, transfers, households, packageItems, itemPhotos } from "@/db/schema";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Plus, Search, Filter, X, Tag, Shirt, Package, Users, RotateCcw, ArrowRight, Shirt as ShirtIcon } from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (!session?.oidcSubject) {
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
  const ctx = await getContext();
  const all = await db.select({id:items.id, owner:items.ownerHouseholdId, holder:items.holderHouseholdId})
    .from(items).where(and(eq(items.archived,false),or(eq(items.ownerHouseholdId,ctx.household.id),eq(items.holderHouseholdId,ctx.household.id))));
  const packs = await db.select({id:packages.id}).from(packages).where(eq(packages.householdId,ctx.household.id));
  const alerts = await db.select().from(notifications).where(and(eq(notifications.userId,ctx.user.id),eq(notifications.isRead,false))).orderBy(desc(notifications.createdAt)).limit(3);
  
  // Recent items (last 6)
  const recentItems = await db.select({ item: items, photoId: itemPhotos.id })
    .from(items)
    .leftJoin(itemPhotos, and(eq(itemPhotos.itemId, items.id), eq(itemPhotos.isPrimary, true)))
    .where(and(
      eq(items.archived, false),
      or(eq(items.ownerHouseholdId, ctx.household.id), eq(items.holderHouseholdId, ctx.household.id))
    ))
    .orderBy(desc(items.createdAt))
    .limit(6);

  // Open incoming transfers
  const incomingTransfers = await db.select({ transfer: transfers, packageTitle: packages.title })
    .from(transfers)
    .innerJoin(packages, eq(packages.id, transfers.packageId))
    .where(and(eq(transfers.toHouseholdId, ctx.household.id), eq(transfers.status, "pending")))
    .orderBy(desc(transfers.createdAt))
    .limit(3);

  // Size shortcuts (sizes that exist in this household)
  const sizeRows = await db.selectDistinct({ size: items.sizeLabel })
    .from(items)
    .where(and(eq(items.archived, false), or(eq(items.ownerHouseholdId, ctx.household.id), eq(items.holderHouseholdId, ctx.household.id))))
    .orderBy(items.sizeLabel);

  const sizes = sizeRows.map(r => r.size).filter(Boolean);

  return <AppShell household={ctx.household.name} unreadNotifications={alerts.length}>
    {/* Hero Section */}
    <section className="hero-card">
      <div className="hero-content">
        <h2>Hallo, {ctx.user.displayName}! 👋</h2>
        <p>Hier ist dein KleiderPfad im Überblick.</p>
        <Link href="/wardrobe/new" className="btn" style={{ marginTop: "var(--space-4)" }}>
          <Plus size={18} aria-hidden="true" />
          Kleidungsstück erfassen
        </Link>
      </div>
    </section>

    {/* Stats Grid */}
    <section className="stats-grid" style={{ margin: "var(--space-4)" }}>
      <div className="stat-card">
        <div className="icon"><Shirt size={20} color="#27AE70" /></div>
        <div className="value">{all.filter(x => x.holder === ctx.household.id).length}</div>
        <div className="label">Bei uns</div>
      </div>
      <div className="stat-card">
        <div className="icon"><Shirt size={20} color="#27AE70" /></div>
        <div className="value">{all.filter(x => x.owner === ctx.household.id && x.holder !== ctx.household.id).length}</div>
        <div className="label">Verliehen</div>
      </div>
      <div className="stat-card">
        <div className="icon"><Package size={20} color="#27AE70" /></div>
        <div className="value">{packs.length}</div>
        <div className="label">Pakete</div>
      </div>
    </section>

    {/* Search & Size Chips */}
    <section style={{ padding: "0 var(--space-4) var(--space-4)" }}>
      <form action="/wardrobe" method="get" className="fields" style={{ gap: "var(--space-3)" }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={20} color="#A5B0A9" />
          <input 
            name="q" 
            type="search" 
            placeholder="Kleidung durchsuchen …" 
            style={{ border: "none", background: "transparent", fontSize: "var(--text-lg)", color: "var(--text-primary)", outline: "none", flex: 1, minWidth: 0 }}
          />
        </div>
      </form>

      {/* Size Chips */}
      {sizes.length > 0 && (
        <div className="filter-chips" style={{ marginTop: "var(--space-3)" }}>
          <Link href="/wardrobe" className="filter-chip active">Alle</Link>
          {sizes.slice(0, 8).map(size => (
            <Link key={size} href={`/wardrobe?size=${encodeURIComponent(size)}`} className="filter-chip inactive">
              {size}
            </Link>
          ))}
        </div>
      )}
    </section>

    {/* Recent Items */}
    {recentItems.length > 0 && (
      <section style={{ padding: "0 var(--space-4) var(--space-4)" }}>
        <div className="sectionheading">
          <h2>Zuletzt erfasst</h2>
          <Link href="/wardrobe" className="small">Alle ansehen</Link>
        </div>
        <section className="grid">
          {recentItems.map(({ item, photoId }) => (
            <Link key={item.id} href={`/wardrobe/${item.id}`} className="product-card">
              <div className="image-wrapper">
                {photoId ? (
                  <img src={`/api/photos/${photoId}`} alt={item.title} loading="lazy" />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
                    👕
                  </div>
                )}
              </div>
              <div className="content">
                <div className="name">{item.title}</div>
                <div className="meta">
                  <span className="size">Größe {item.sizeLabel}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </section>
    )}

    {/* Incoming Transfers */}
    {incomingTransfers.length > 0 && (
      <section style={{ padding: "0 var(--space-4) var(--space-8)" }}>
        <div className="sectionheading">
          <h2>Offene Übergaben</h2>
          <Link href="/transfers" className="small">Alle ansehen</Link>
        </div>
        <section style={{ padding: "0 var(--space-4)" }}>
          {incomingTransfers.map(({ transfer, packageTitle }) => (
            <Link key={transfer.id} href={`/transfers`} className="card" style={{ display: "block", margin: "var(--space-3) 0", padding: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                    <RotateCcw size={18} color="#27AE70" />
                    <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, margin: 0 }}>{packageTitle}</h3>
                  </div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0 }}>
                    Von {transfer.fromHouseholdId} · {transfer.type === "gift" ? "Geschenk" : "Leihgabe"} · {transfer.createdAt.toLocaleDateString("de-DE")}
                  </p>
                </div>
                <span className="pill pill-warn">Wartet auf Annahme</span>
              </div>
            </Link>
          ))}
        </section>
      </section>
    )}

    {/* Quick Actions */}
    <section className="quick-access" style={{ margin: "var(--space-4)" }}>
      <Link href="/wardrobe/new" className="quick-access-item">
        <div className="icon"><Plus size={28} color="#27AE70" /></div>
        <span className="label">Kleidung erfassen</span>
      </Link>
      <Link href="/packages" className="quick-access-item">
        <div className="icon"><Package size={28} color="#27AE70" /></div>
        <span className="label">Pakete packen</span>
      </Link>
      <Link href="/transfers" className="quick-access-item">
        <div className="icon"><RotateCcw size={28} color="#27AE70" /></div>
        <span className="label">Übergaben</span>
      </Link>
      <Link href="/family" className="quick-access-item">
        <div className="icon"><Users size={28} color="#27AE70" /></div>
        <span className="label">Familie</span>
      </Link>
    </section>

    {alerts.length > 0 && (
      <section className="card" style={{ margin: "var(--space-4)" }}>
        <div className="split">
          <h2>Benachrichtigungen</h2>
          <Link href="/notifications" className="small">Alle ansehen</Link>
        </div>
        {alerts.map(a => (
          <p key={a.id} style={{ margin: "var(--space-2) 0" }}>
            <strong>{a.title}</strong><br/>
            <span className="muted small">{a.body}</span>
          </p>
        ))}
      </section>
    )}

    <div className="actions">
      <form action={async()=>{"use server";await signOut();}}>
        <button className="btn btn-outline">Abmelden</button>
      </form>
    </div>
  </AppShell>;
}