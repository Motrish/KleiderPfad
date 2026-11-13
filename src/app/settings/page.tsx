import Link from "next/link";
import { getContext } from "@/lib/context";
import { renameHousehold, selectHousehold } from "@/actions";
import { AppShell } from "@/components/AppShell";

export default async function Settings() {
  const ctx = await getContext();
  const canManage = ctx.household.role === "owner" || ctx.household.role === "admin";
  return (
    <AppShell household={ctx.household.name} title="Einstellungen" showBackButton>
      <section className="card fields">
        <h2>Haushalt</h2>
        {canManage ? (
          <form action={renameHousehold} className="fields">
            <div className="field">
              <label htmlFor="household-name">Name des Haushalts</label>
              <input id="household-name" name="name" defaultValue={ctx.household.name} required maxLength={100} />
            </div>
            <button className="btn" type="submit">Name speichern</button>
          </form>
        ) : <p>Den Haushaltsnamen können Besitzer und Administratoren ändern.</p>}
        {ctx.memberships.length > 1 && (
          <form action={selectHousehold} className="fields">
            <div className="field">
              <label htmlFor="active-household">Aktiver Haushalt</label>
              <select id="active-household" name="householdId" defaultValue={ctx.household.id}>
                {ctx.memberships.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <button className="btn btn-outline" type="submit">Haushalt wechseln</button>
          </form>
        )}
        <Link href="/family" className="btn btn-outline">Mitglieder und Einladungen verwalten</Link>
      </section>
    </AppShell>
  );
}
