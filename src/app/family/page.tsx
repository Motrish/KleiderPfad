import { and, eq, or, gt, isNull, desc, inArray } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { connections, households, householdInvites, householdMembers, users } from "@/db/schema";
import { selectHousehold, createHousehold, createInvite, joinHousehold, requestConnection, acceptConnection, renameHousehold } from "@/actions";
import { AppShell } from "@/components/AppShell";
import { Plus, Users, Link2, UserPlus, Home, ChevronLeft, Copy, Check, AlertCircle } from "lucide-react";

export default async function Family() {
  const ctx = await getContext();
  const origin = process.env.AUTH_URL || "https://kleiderpfad.nehmer.org";

  const members = await db.select({ id: users.id, displayName: users.displayName, role: householdMembers.role })
    .from(householdMembers).innerJoin(users, eq(users.id, householdMembers.userId))
    .where(eq(householdMembers.householdId, ctx.household.id));

  const invites = await db.select().from(householdInvites)
    .where(and(eq(householdInvites.householdId, ctx.household.id), isNull(householdInvites.usedAt), gt(householdInvites.expiresAt, new Date())))
    .orderBy(desc(householdInvites.createdAt));

  const links = await db.select().from(connections).where(or(
    eq(connections.householdAId, ctx.household.id), eq(connections.householdBId, ctx.household.id)
  ));
  
  const targetIds = links.map(x => x.householdAId === ctx.household.id ? x.householdBId : x.householdAId);
  const linked = targetIds.length ? await db.select({ id: households.id, name: households.name }).from(households).where(inArray(households.id, targetIds)) : [];
  const names = Object.fromEntries(linked.map(x => [x.id, x.name]));

  const inviteLink = (slug: string) => `${origin}/family/join/${slug}`;

  return (
    <AppShell household={ctx.household.name} title="Familie & Kontakte">
      {/* Active Household */}
      <section className="card-soft" style={{ margin: "var(--space-4)", padding: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: "0 0 var(--space-1)" }}>Aktiver Haushalt</h2>
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
              <strong>{ctx.household.name}</strong> · {ctx.household.role}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="pill pill-success">{ctx.household.role}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>Haushaltskennung</p>
            <div className="code" style={{ wordBreak: "break-all", cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(ctx.household.id)}>
              {ctx.household.id}
            </div>
          </div>
          <button 
            className="btn btn-outline"
            onClick={() => navigator.clipboard.writeText(ctx.household.id)}
            style={{ whiteSpace: "nowrap" }}
          >
            <Copy size={16} />
            Kopieren
          </button>
        </div>

        {["owner", "admin"].includes(ctx.household.role) && (
          <details style={{ marginTop: "var(--space-4)" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, padding: "var(--space-2) 0", listStyle: "none" }}>
              <Link2 size={18} color="#27AE70" style={{ marginRight: "var(--space-2)" }} />
              Einladungslink erstellen
            </summary>
            <form action={createInvite} className="fields" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider)" }}>
              <button className="btn wide" type="submit">
                <Plus size={18} />
                Einladungslink generieren
              </button>
            </form>
          </details>
        )}

        {ctx.memberships.length > 1 && (
          <form action={selectHousehold} className="fields" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider)" }}>
            <div className="field">
              <label>Haushalt wechseln</label>
              <select name="householdId" defaultValue={ctx.household.id}>
                {ctx.memberships.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <button className="btn btn-secondary wide">Wechseln</button>
          </form>
        )}
      </section>

      {/* Members */}
      <section className="card" style={{ margin: "var(--space-4)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>Mitglieder ({members.length})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {members.map(m => (
            <div key={m.id} className="itemrow">
              <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-full)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 600, fontSize: "var(--text-lg)" }}>
                {m.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="item-info" style={{ flex: 1 }}>
                <strong>{m.displayName}</strong>
                <span className={`pill ${m.role === "owner" ? "pill-success" : m.role === "admin" ? "pill-warn" : "pill-neutral"}`} style={{ fontSize: "var(--text-xs)" }}>
                  {m.role}
                </span>
              </div>
            </div>
          ))}
        </div>
        {["owner", "admin"].includes(ctx.household.role) && (
          <form action={createInvite} style={{ marginTop: "var(--space-4)" }}>
            <button className="btn wide" type="submit">
              <Plus size={18} />
              Einladungslink erstellen
            </button>
          </form>
        )}
      </section>

      {/* Active Invites */}
      {invites.length > 0 && (
        <section className="card" style={{ margin: "var(--space-4)" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
            Aktive Einladungen ({invites.length})
          </h3>
          <p className="help" style={{ marginBottom: "var(--space-4)" }}>
            Einladungslinks sind einmal nutzbar und sieben Tage gültig:
          </p>
          {invites.map(inv => {
            const link = inviteLink(inv.inviteSlug || "");
            const isExpired = new Date(inv.expiresAt) < new Date();
            return (
              <div key={inv.token} className="card" style={{ marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  <div className="flex-1 min-w-0">
                    <div className="code" style={{ wordBreak: "break-all", cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(link)}>
                      {link}
                    </div>
                    <p className={`text-sm ${isExpired ? "text-error" : "text-muted"}`} style={{ marginTop: "var(--space-1)" }}>
                      {isExpired ? "Abgelaufen" : `Läuft am ${new Date(inv.expiresAt).toLocaleDateString("de-DE")} ab`}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => navigator.clipboard.writeText(link)}
                      disabled={isExpired}
                    >
                      <Copy size={16} />
                      Kopieren
                    </button>
                    {isExpired && (
                      <span className="pill pill-danger" style={{ alignSelf: "center" }}>Abgelaufen</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Join Household */}
      <section className="card" style={{ margin: "var(--space-4)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          <UserPlus size={20} color="#27AE70" style={{ marginRight: "var(--space-2)", verticalAlign: "middle" }} />
          Haushalt beitreten
        </h3>
        <form action={joinHousehold} className="fields">
          <div className="field">
            <label>Einladungscode oder Link</label>
            <input name="inviteCode" required placeholder="Code oder ganzer Link einfügen" />
          </div>
          <button className="btn btn-secondary wide" type="submit">
            Beitreten
          </button>
        </form>
      </section>

      {/* Create New Household */}
      <details className="card" style={{ margin: "var(--space-4)" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, padding: "var(--space-2) 0", listStyle: "none", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Home size={20} color="#27AE70" />
          <strong>Eigenen neuen Haushalt anlegen</strong>
        </summary>
        <form action={createHousehold} className="fields" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider)" }}>
          <div className="field">
            <label>Name</label>
            <input name="name" maxLength={100} required placeholder="Unser Haushalt" />
          </div>
          <button className="btn btn-secondary wide" type="submit">
            Haushalt erstellen
          </button>
        </form>
      </details>

      {/* Connected Families */}
      <section className="card" style={{ margin: "var(--space-4)" }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Verbundene Familien ({links.length})
        </h3>
        {links.map(link => {
          const other = link.householdAId === ctx.household.id ? link.householdBId : link.householdAId;
          return (
            <div key={link.id} className="card" style={{ marginTop: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                <div className="flex-1 min-w-0">
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-full)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 600, fontSize: "var(--text-lg)" }}>
                      {(names[other] || other).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{names[other] || other}</strong>
                      <div className={`pill ${link.status === "accepted" ? "pill-success" : "pill-warn"}`} style={{ fontSize: "var(--text-xs)", marginTop: "2px" }}>
                        {link.status === "accepted" ? "Verbunden" : "Anfrage offen"}
                      </div>
                    </div>
                  </div>
                </div>
                {link.status === "pending" && link.requestedByHouseholdId !== ctx.household.id && ["owner", "admin"].includes(ctx.household.role) && (
                  <form action={acceptConnection}>
                    <input type="hidden" name="id" value={link.id} />
                    <button className="btn btn-secondary" type="submit">
                      <Check size={16} />
                      Bestätigen
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {links.length === 0 && (
          <p className="text-muted" style={{ textAlign: "center", padding: "var(--space-6)" }}>
            Noch keine Kontakte verbunden.
          </p>
        )}

        <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, margin: "var(--space-6) 0 var(--space-3)" }}>Kontakt hinzufügen</h4>
        <form action={requestConnection} className="fields">
          <div className="field">
            <label>Kennung eines anderen Haushalts</label>
            <input name="householdId" required placeholder="UUID des Haushalts" />
          </div>
          <button className="btn btn-secondary wide" type="submit">
            <Plus size={18} />
            Kontakt anfragen
          </button>
        </form>
      </section>
    </AppShell>
  );
}