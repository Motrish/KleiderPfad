"use client";

import { CopyableCode } from "@/components/ui/CopyableCode";
import { Plus, Users, Link2, UserPlus, Home, ChevronLeft, Copy, Check, AlertCircle, Shield, Mail, UserCheck, UserX, Shield as ShieldIcon, UserCheck as UserCheckIcon, Users as UsersIcon } from "lucide-react";

interface FamilyInteractiveProps {
  ctx: {
    household: { id: string; name: string; role: string };
    memberships: { id: string; name: string }[];
    user: { displayName: string; id: string };
  };
  members: { id: string; displayName: string; role: string }[];
  invites: { token: string; inviteSlug: string | null; expiresAt: Date }[];
  links: { id: string; householdAId: string; householdBId: string; status: string; requestedByHouseholdId: string }[];
  linked: { id: string; name: string }[];
  origin: string;
  acceptConnection: (formData: FormData) => Promise<void>;
  selectHousehold: (formData: FormData) => Promise<void>;
  createInvite: (formData: FormData) => Promise<void>;
  joinHousehold: (formData: FormData) => Promise<void>;
  createHousehold: (formData: FormData) => Promise<void>;
  requestConnection: (formData: FormData) => Promise<void>;
  renameHousehold: (formData: FormData) => Promise<void>;
}

const roleIcons = {
  owner: ShieldIcon,
  admin: UserCheckIcon,
  member: UsersIcon,
};

const roleColors: Record<string, string> = { owner: "pill-success", admin: "pill-warn", member: "pill-neutral" };
const roleLabels: Record<string, string> = { owner: "Besitzer", admin: "Admin", member: "Mitglied" };

export function FamilyInteractive({
  ctx,
  members,
  invites,
  links,
  linked,
  origin,
  acceptConnection,
  selectHousehold,
  createInvite,
  joinHousehold,
  createHousehold,
  requestConnection,
  renameHousehold,
}: FamilyInteractiveProps) {
  const names = Object.fromEntries(linked.map(x => [x.id, x.name]));
  const inviteLink = (slug: string) => `${origin}/family/join/${slug}`;

  return (
    <>
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
              <span className={`pill ${({ owner: "pill-success", admin: "pill-warn", member: "pill-neutral" })[ctx.household.role] || "pill-neutral"}`} style={{ fontSize: "var(--text-sm)" }}>
                {(() => {
                  const Icon = ({ owner: ShieldIcon, admin: UserCheckIcon, member: UsersIcon })[ctx.household.role];
                  return Icon ? <Icon size={12} color="#27AE70" style={{ marginRight: "4px", verticalAlign: "middle" }} /> : null;
                })()}
                {({ owner: "Besitzer", admin: "Admin", member: "Mitglied" })[ctx.household.role] || ctx.household.role}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-4)", paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>Haushaltskennung</p>
              <button 
                type="button"
                style={{ wordBreak: "break-all", cursor: "pointer", background: "none", border: "none", padding: 0, font: "inherit", textAlign: "left", color: "inherit" }}
                onClick={() => navigator.clipboard.writeText(ctx.household.id)}
                aria-label="Copy Haushaltskennung"
              >
                {ctx.household.id}
              </button>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(ctx.household.id)}
              style={{ whiteSpace: "nowrap" }}
            >
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
              const RoleIcon = ({ owner: ShieldIcon, admin: UserCheckIcon, member: UsersIcon })[m.role] || UsersIcon;
              return (
                <div key={m.id} className="itemrow" style={{ padding: "var(--space-3) 0" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-full)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 700, fontSize: "var(--text-xl)" }}>
                    {m.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="item-info" style={{ flex: 1 }}>
                    <strong style={{ fontSize: "var(--text-base)" }}>{m.displayName}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                      <RoleIcon size={16} color="#27AE70" />
                      <span className={`pill ${({ owner: "pill-success", admin: "pill-warn", member: "pill-neutral" })[m.role] || "pill-neutral"}`} style={{ fontSize: "var(--text-xs)" }}>
                        {({ owner: "Besitzer", admin: "Admin", member: "Mitglied" })[m.role] || m.role}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {(["owner", "admin"].includes(ctx.household.role)) && (
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
              const link = `${origin}/family/join/${inv.inviteSlug || ""}`;
              const isExpired = new Date(inv.expiresAt) < new Date();
              return (
                <div key={inv.token} className="card" style={{ marginTop: "var(--space-3)" }}>
                  <div style={{ padding: "var(--space-4)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button 
                          type="button"
                          style={{ wordBreak: "break-all", cursor: "pointer", background: "none", border: "none", padding: 0, font: "inherit", fontSize: "var(--text-sm)", color: "inherit", textAlign: "left" }}
                          onClick={() => navigator.clipboard.writeText(link)}
                          aria-label="Copy Einladungslink"
                        >
                          {link}
                        </button>
                        <p className={`text-sm ${new Date(inv.expiresAt) < new Date() ? "text-error" : "text-muted"}`} style={{ marginTop: "var(--space-1)" }}>
                          {new Date(inv.expiresAt) < new Date() ? "Abgelaufen" : `Läuft am ${new Date(inv.expiresAt).toLocaleDateString("de-DE")} ab`}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => navigator.clipboard.writeText(link)}
                          disabled={new Date(inv.expiresAt) < new Date()}
                        >
                          Kopieren
                        </button>
                        {new Date(inv.expiresAt) < new Date() && (
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
              const other = link.householdAId === "HaushaltAId" ? link.householdBId : link.householdAId;
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
                            <div className={`pill ${({ pending: "pill-warn", accepted: "pill-success", blocked: "pill-danger" })[link.status] || "pill-neutral"}`} style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-1)" }}>
                              {({ pending: "Anfrage offen", accepted: "Verbunden", blocked: "Blockiert" })[link.status] || link.status}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isPending && link.requestedByHouseholdId !== "HaushaltAId" && ["owner", "admin"].includes("role") && (
                        <form action={acceptConnection}>
                          <input type="hidden" name="id" value={link.id} />
                          <button className="btn btn-secondary" type="submit" style={{ minHeight: "40px" }}>
                            Bestätigen
                          </button>
                        </form>
                      )}
                      {isAccepted && ["owner", "admin"].includes("role") && (
                        <form action={requestConnection} style={{ display: "inline" }}>
                          <input type="hidden" name="householdId" value={other} />
                          <button type="submit" className="btn btn-ghost text-sm" style={{ padding: "var(--space-2) var(--space-3)" }}>
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
    </>
  );
}