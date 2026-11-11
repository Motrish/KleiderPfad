import Link from "next/link";
import { and,desc,eq,or,inArray } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { transfers, packages, households, packageItems, items } from "@/db/schema";
import { decideTransfer,returnLoan } from "@/actions";
import { AppShell,EmptyState } from "@/components/AppShell";

export default async function Transfers() {
  const ctx=await getContext();
  const rows=await db.select({transfer:transfers,packageTitle:packages.title}).from(transfers)
    .innerJoin(packages,eq(packages.id,transfers.packageId))
    .where(or(eq(transfers.toHouseholdId,ctx.household.id),eq(transfers.fromHouseholdId,ctx.household.id)))
    .orderBy(desc(transfers.createdAt));
  const ids=[...new Set(rows.flatMap(x=>[x.transfer.toHouseholdId,x.transfer.fromHouseholdId]))];
  const names=ids.length?await db.select({id:households.id,name:households.name}).from(households).where(inArray(households.id,ids)):[];
  const nameMap=Object.fromEntries(names.map(x=>[x.id,x.name]));
  const allItemRows=rows.length?await db.select({packageId:packageItems.packageId,title:items.title,size:items.sizeLabel})
    .from(packageItems).innerJoin(items,eq(items.id,packageItems.itemId))
    .where(inArray(packageItems.packageId,rows.map(x=>x.transfer.packageId))):[];
  const labels:Record<string,string>={pending:"Wartet auf Annahme",accepted:"Angenommen",declined:"Abgelehnt",cancelled:"Abgebrochen"};
  return <AppShell household={ctx.household.name} title="Übergaben">
    <p className="muted">Hier siehst du versendete und empfangene Pakete sowie offene Leihgaben.</p>
    {rows.length===0?<EmptyState text="Noch keine Übergaben vorhanden." href="/packages" action="Paket erstellen"/>:
      rows.map(({transfer:t,packageTitle})=>{
        const incoming=t.toHouseholdId===ctx.household.id;
        const contents=allItemRows.filter(x=>x.packageId===t.packageId);
        return <section className="card" key={t.id}>
          <div className="split"><h2>{packageTitle}</h2><span className={"pill "+(t.status==="pending"?"pill-warn":"")}>{labels[t.status]}</span></div>
          <p className="muted small">{incoming?"Von "+nameMap[t.fromHouseholdId]:"An "+nameMap[t.toHouseholdId]} · {t.type==="gift"?"Geschenk":"Leihgabe"} · {t.createdAt.toLocaleDateString("de-DE")}</p>
          <p>{contents.map(c=>c.title+" ("+c.size+")").join(", ")}</p>
          {t.dueAt&&<p className="small muted">Rückgabe geplant: {t.dueAt.toLocaleDateString("de-DE")}</p>}
          {t.returnedAt&&<p className="pill">Zurückgegeben am {t.returnedAt.toLocaleDateString("de-DE")}</p>}
          {incoming&&t.status==="pending"&&<div className="actions">
            <form action={decideTransfer.bind(null,t.id,"accepted")}><button className="btn">✓ Annehmen</button></form>
            <form action={decideTransfer.bind(null,t.id,"declined")}><button className="btn btn-outline">Ablehnen</button></form>
          </div>}
          {incoming&&t.status==="accepted"&&t.type==="loan"&&!t.returnedAt&&<form action={returnLoan.bind(null,t.id)}>
            <button className="btn btn-secondary">↩ Rückgabe bestätigen</button>
          </form>}
          {!incoming&&<Link className="small" href={"/packages/"+t.packageId}>Paketdetails →</Link>}
        </section>;
      })}
  </AppShell>;
}
