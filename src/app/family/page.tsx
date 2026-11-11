import { and,eq,or,gt,isNull,desc,inArray } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { connections, households, householdInvites, householdMembers, users } from "@/db/schema";
import { AppShell } from "@/components/AppShell";
import { selectHousehold, createHousehold, createInvite, joinHousehold,requestConnection,acceptConnection,renameHousehold } from "@/actions";

export default async function Family() {
  const ctx=await getContext();
  const members=await db.select({id:users.id,displayName:users.displayName,role:householdMembers.role})
    .from(householdMembers).innerJoin(users,eq(users.id,householdMembers.userId))
    .where(eq(householdMembers.householdId,ctx.household.id));
  const invites=await db.select().from(householdInvites)
    .where(and(eq(householdInvites.householdId,ctx.household.id),isNull(householdInvites.usedAt),gt(householdInvites.expiresAt,new Date())))
    .orderBy(desc(householdInvites.createdAt));
  const links=await db.select().from(connections).where(or(
    eq(connections.householdAId,ctx.household.id),eq(connections.householdBId,ctx.household.id)));
  const targetIds=links.map(x=>x.householdAId===ctx.household.id?x.householdBId:x.householdAId);
  const linked=targetIds.length?await db.select({id:households.id,name:households.name}).from(households).where(inArray(households.id,targetIds)):[];
  const names=Object.fromEntries(linked.map(x=>[x.id,x.name]));
  return <AppShell household={ctx.household.name} title="Familie & Kontakte">
    <section className="card card-soft">
      <h2>Aktiver Haushalt</h2>
      <p><strong>{ctx.household.name}</strong> · {ctx.household.role}</p>
      <p className="help">Haushaltskennung für eine Kontaktanfrage:</p>
      <div className="code">{ctx.household.id}</div>
      {["owner","admin"].includes(ctx.household.role)&&<details style={{marginTop:12}}>
        <summary>Haushalt umbenennen</summary>
        <form action={renameHousehold} className="fields">
          <div className="field"><label>Neuer Name</label><input name="name" required maxLength={100} defaultValue={ctx.household.name}/></div>
          <button className="btn btn-secondary">Namen speichern</button>
        </form>
      </details>}
      {ctx.memberships.length>1&&<form action={selectHousehold} className="fields" style={{marginTop:12}}>
        <div className="field"><label>Haushalt wechseln</label><select name="householdId" defaultValue={ctx.household.id}>
          {ctx.memberships.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <button className="btn btn-secondary">Wechseln</button>
      </form>}
    </section>
    <section className="card"><h2>Mitglieder</h2>
      {members.map(m=><div className="itemrow" key={m.id}><div className="item-info"><strong>{m.displayName}</strong><span className="muted small">{m.role}</span></div></div>)}
      {["owner","admin"].includes(ctx.household.role)&&<div className="actions">
        <form action={createInvite}><button className="btn btn-secondary">＋ Einladungscode erstellen</button></form>
      </div>}
      {invites.length>0&&<><p className="help">Einmal nutzbare Codes, jeweils sieben Tage gültig:</p>
        {invites.map(i=><div className="code" key={i.token}>{i.token}</div>)}</>}
    </section>
    <section className="card"><h2>Haushalt beitreten</h2>
      <form action={joinHousehold} className="fields">
        <div className="field"><label>Einladungscode</label><input name="inviteCode" required placeholder="Code von Familie oder Freunden"/></div>
        <button className="btn btn-secondary">Beitreten</button>
      </form>
    </section>
    <details className="card"><summary><strong>Eigenen neuen Haushalt anlegen</strong></summary>
      <form action={createHousehold} className="fields">
        <div className="field"><label>Name</label><input name="name" maxLength={100} required placeholder="Unser Haushalt"/></div>
        <button className="btn btn-secondary">Haushalt erstellen</button>
      </form>
    </details>
    <section className="card"><h2>Verbundene Familien</h2>
      {links.map(link=>{
        const other=link.householdAId===ctx.household.id?link.householdBId:link.householdAId;
        return <div className="itemrow" key={link.id}><div className="item-info"><strong>{names[other]||other}</strong>
          <span className="muted small">{link.status==="accepted"?"Verbunden":"Anfrage offen"}</span></div>
          {link.status==="pending" && link.requestedByHouseholdId!==ctx.household.id && ["owner","admin"].includes(ctx.household.role) && <form action={acceptConnection}>
            <input type="hidden" name="id" value={link.id}/><button className="btn btn-secondary">Bestätigen</button>
          </form>}
        </div>;
      })}
      {links.length===0&&<p className="muted">Noch keine Kontakte verbunden.</p>}
      <h3 style={{marginTop:16}}>Kontakt hinzufügen</h3>
      <form action={requestConnection} className="fields">
        <div className="field"><label>Kennung eines anderen Haushalts</label><input name="householdId" required placeholder="UUID des Haushalts"/></div>
        <button className="btn btn-secondary">Kontakt anfragen</button>
      </form>
    </section>
  </AppShell>;
}
