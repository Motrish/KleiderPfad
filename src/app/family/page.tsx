import { and, eq, or, gt, isNull, desc, inArray } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { connections, households, householdInvites, householdMembers, users } from "@/db/schema";
import { selectHousehold, createHousehold, createInvite, joinHousehold, requestConnection, acceptConnection, renameHousehold } from "@/actions";
import { AppShell } from "@/components/AppShell";
import { Plus, Users, Link2, UserPlus, Home, ChevronLeft, Copy, Check, AlertCircle, Shield, Mail, UserCheck, UserX, Shield as ShieldIcon, UserCheck as UserCheckIcon, Users as UsersIcon } from "lucide-react";

const roleIcons = {
  owner: ShieldIcon,
  admin: UserCheckIcon,
  member: UsersIcon,
};

const roleColors: Record<string, string> = { owner: "pill-success", admin: "pill-warn", member: "pill-neutral" };
const roleLabels: Record<string, string> = { owner: "Besitzer", admin: "Admin", member: "Mitglied" };

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

  const copyToClipboard = (text: string, label: string) => async () => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <AppShell household={ctx.household.name} title="Familie & Kontakte">
      {/* Active Household */}
      <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <div style={{ padding: "var(--space-5)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                <Home size={24} color="#27AE70" />
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: 0 }}>Aktiver Haushalt</h2>
              </div>
              <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                <strong>{ctx.household.name}</strong>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span className={`pill ${roleColors[ctx.household.role] || "pill-neutral"}`} style={{ fontSize: "var(--text-sm)" }}>
                {(() => {
                  const Icon = roleIcons[ctx.household.role];
                  return Icon ? <Icon size={12} color="#27AE70" style={{ marginRight: "4px", verticalAlign: "middle" }} /> : null;
                })()}
                {roleLabels[ctx.household.role] || ctx.household.role}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-4)", paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>Haushaltskennung</p>
              <button 
                className="code" 
                style={{ wordBreak: "break-all", cursor: "pointer", background: "none", border: "none", padding: 0, font: "inherit", textAlign: "left", color: "inherit" }}
                onClick={copyToClipboard(ctx.household.id, "Haushaltskennung")}
              >
                {ctx.household.id}
              </button>
            </div>
            <button 
              className="btn btn-outline"
              onClick={copyToClipboard(ctx.household.id, "Haushaltskennung")}
              style={{ whiteSpace: "nowrap" }}
            >
              <Copy size={16} />
              Kopieren
            </button>
          </div>

          {["owner", "admin"].includes(ctx.household.role) && (
            <details style={{ marginTop: "var(--space-2)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, padding: "var(--space-3) 0", listStyle: "none", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Link2 size={20} color="#27AE70" />
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
        </div>
      </section>

      {/* Members */}
      <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <div style={{ padding: "var(--space-5) var(--space-5) 0" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: 0 }}>Mitglieder ({members.length})</h3>
        </div>
        <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {members.map(m => {
              const RoleIcon = roleIcons[m.role] || UsersIcon;
              return (
                <div key={m.id} className="itemrow" style={{ padding: "var(--space-3) 0" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-full)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 700, fontSize: "var(--text-xl)" }}>
                    {m.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="item-info" style={{ flex: 1 }}>
                    <strong style={{ fontSize: "var(--text-base)" }}>{m.displayName}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                      <RoleIcon size={16} color="#27AE70" />
                      <span className={`pill ${roleColors[m.role] || "pill-neutral"}`} style={{ fontSize: "var(--text-xs)" }}>
                        {roleLabels[m.role] || m.role}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {["owner", "admin"].includes(ctx.household.role) && (
            <form action={createInvite} style={{ marginTop: "var(--space-4)" }}>
              <button className="btn wide" type="submit" style={{ minHeight: "48px" }}>
                <Plus size={18} />
                Einladungslink erstellen
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Active Invites */}
      {invites.length > 0 && (
        <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
          <div style={{ padding: "var(--space-5) var(--space-5) 0" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Mail size={22} color="#27AE70" />
              Aktive Einladungen ({invites.length})
            </h3>
            <p className="help" style={{ margin: "var(--space-3) 0 0" }}>
              Einladungslinks sind einmal nutzbar und sieben Tage gültig.
            </p>
          </div>
          <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>
            {invites.map(inv => {
              const link = inviteLink(inv.inviteSlug || "");
              const isExpired = new Date(inv.expiresAt) < new Date();
              return (
                <div key={inv.token} className="card" style={{ marginTop: "var(--space-3)" }}>
                  <div style={{ padding: "var(--space-4)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button 
                          className="code" 
                          style={{ wordBreak: "break-all", cursor: "pointer", background: "none", border: "none", padding: 0, font: "inherit", fontSize: "var(--text-sm)", color: "inherit", textAlign: "left" }}
                          onClick={copyToClipboard(link, "Einladungslink")}
                        >
                          {link}
                        </button>
                        <p className={`text-sm ${isExpired ? "text-error" : "text-muted"}`} style={{ marginTop: "var(--space-1)" }}>
                          {isExpired ? "Abgelaufen" : `Läuft am ${new Date(inv.expiresAt).toLocaleDateString("de-DE")} ab`}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={copyToClipboard(link, "Einladungslink")}
                          disabled={isExpired}
                        >
                          <Copy size={16} />
                          Kopieren
                        </button>
                        {isExpired && (
                          <span className="pill pill-danger" style={{ alignSelf: "center", fontSize: "var(--text-xs)" }}>Abgelaufen</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Join Household */}
      <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <div style={{ padding: "var(--space-5) var(--space-5) 0" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <UserPlus size={22} color="#27AE70" />
            Haushalt beitreten
          </h3>
        </div>
        <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>
          <form action={joinHousehold} className="fields">
            <div className="field">
              <label>Einladungscode oder Link</label>
              <input name="inviteCode" required placeholder="Code oder ganzer Link einfügen" />
            </div>
            <button className="btn btn-secondary wide" type="submit" style={{ minHeight: "48px" }}>
              Beitreten
            </button>
          </form>
        </div>
      </section>

      {/* Create New Household */}
      <details className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, padding: "var(--space-3) 0", listStyle: "none", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Home size={20} color="#27AE70" />
          <strong>Eigenen neuen Haushalt anlegen</strong>
        </summary>
        <form action={createHousehold} className="fields" style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider)" }}>
          <div className="field">
            <label>Name</label>
            <input name="name" maxLength={100} required placeholder="Unser Haushalt" />
          </div>
          <button className="btn btn-secondary wide" type="submit" style={{ minHeight: "48px" }}>
            Haushalt erstellen
          </button>
        </form>
      </details>

      {/* Connected Families */}
      <section className="card-elevated" style={{ margin: "var(--space-4)" }}>
        <div style={{ padding: "var(--space-5) var(--space-5) 0" }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Link2 size={22} color="#27AE70" />
            Verbundene Familien ({links.length})
          </h3>
        </div>
        <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>
          {links.length > 0 ? (
            links.map(link => {
              const other = link.householdAId === ctx.household.id ? link.householdBId : link.householdAId;
              const isPending = link.status === "pending";
              const isAccepted = link.status === "accepted";
              const statusColors = { pending: "pill-warn", accepted: "pill-success", blocked: "pill-danger" };
              const statusLabels = { pending: "Anfrage offen", accepted: "Verbunden", blocked: "Blockiert" };
              return (
                <div key={link.id} className="card" style={{ marginTop: "var(--space-3)" }}>
                  <div style={{ padding: "var(--space-4)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-full)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 700, fontSize: "var(--text-xl)" }}>
                            {(names[other] || other).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: "var(--text-base)" }}>{names[other] || other}</strong>
                            <div className={`pill ${statusColors[link.status] || "pill-neutral"}`} style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-1)" }}>
                              {statusLabels[link.status] || link.status}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isPending && link.requestedByHouseholdId !== ctx.household.id && ["owner", "admin"].includes(ctx.household.role) && (
                        <form action={acceptConnection}>
                          <input type="hidden" name="id" value={link.id} />
                          <button className="btn btn-secondary" type="submit" style={{ minHeight: "40px" }}>
                            <UserCheck size={16} />
                            Bestätigen
                          </button>
                        </form>
                      )}
                      {isAccepted && ["owner", "admin"].includes(ctx.household.role) && (
                        <form action={requestConnection} style={{ display: "inline" }}>
                          <input type="hidden" name="householdId" value={other} />
                          <button type="submit" className="btn btn-ghost text-sm" style={{ padding: "var(--space-2) var(--space-3)" }}>
                            <UserX size={14} />
                            Entfernen
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>
              Noch keine Kontakte verbunden.
            </p>
          )}

          <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, margin: "var(--space-6) 0 var(--space-3)", paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--divider)" }}>Kontakt hinzufügen</h4>
          <form action={requestConnection} className="fields">
            <div className="field">
              <label>Kennung eines anderen Haushalts</label>
              <input name="householdId" required placeholder="UUID des Haushalts" />
            </div>
            <button className="btn btn-secondary wide" type="submit" style={{ minHeight: "48px" }}>
              <Plus size={18} />
              Kontakt anfragen
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}