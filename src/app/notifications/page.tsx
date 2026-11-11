import { and,desc,eq } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { markNotificationRead } from "@/actions";
import { AppShell,EmptyState } from "@/components/AppShell";

export default async function Notifications() {
  const ctx=await getContext();
  const notes=await db.select().from(notifications).where(eq(notifications.userId,ctx.user.id))
    .orderBy(desc(notifications.createdAt)).limit(100);
  return <AppShell household={ctx.household.name} title="Benachrichtigungen">
    {!notes.length?<EmptyState text="Noch keine Benachrichtigungen."/>:notes.map(n=><section className="card" key={n.id}>
      <div className="split"><strong>{n.title}</strong>{!n.isRead&&<span className="pill">Neu</span>}</div>
      <p>{n.body}</p><p className="muted small">{n.createdAt.toLocaleDateString("de-DE")}</p>
      {!n.isRead&&<form action={markNotificationRead}>
        <input type="hidden" name="id" value={n.id}/><button className="btn btn-secondary">Als gelesen markieren</button>
      </form>}
    </section>)}
  </AppShell>;
}
