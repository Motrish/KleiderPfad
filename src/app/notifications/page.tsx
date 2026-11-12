import { and, desc, eq } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { markNotificationRead } from "@/actions";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Bell, Check, ChevronLeft } from "lucide-react";

export default async function Notifications() {
  const ctx = await getContext();
  const notes = await db.select().from(notifications).where(eq(notifications.userId, ctx.user.id))
    .orderBy(desc(notifications.createdAt)).limit(100);

  const unreadCount = notes.filter(n => !n.isRead).length;

  return (
    <AppShell household={ctx.household.name} title="Benachrichtigungen" unreadNotifications={unreadCount}>
      {notes.length === 0 ? (
        <EmptyState 
          text="Noch keine Benachrichtigungen" 
        />
      ) : (
        <>
          {unreadCount > 0 && (
            <div style={{ padding: "0 var(--space-4) var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) var(--space-4)", background: "var(--primary-light)", borderRadius: "var(--radius-card)", color: "var(--primary-dark)", fontWeight: 500 }}>
                <span>{unreadCount} ungelesene Benachrichtigung{unreadCount !== 1 ? "en" : ""}</span>
              </div>
            </div>
          )}
          <section style={{ padding: "0 var(--space-4) var(--space-8)" }}>
            {notes.map(n => (
              <section key={n.id} className="card" style={{ margin: "var(--space-3) var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "var(--radius-full)", 
                    background: n.isRead ? "var(--border)" : "var(--primary-light)",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: n.isRead ? "var(--text-muted)" : "var(--primary)",
                    flexShrink: 0,
                    marginTop: "2px"
                  }}>
                    <Bell size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                      <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, margin: 0, color: n.isRead ? "var(--text-secondary)" : "var(--text-primary)" }}>
                        {n.title}
                      </h4>
                      {!n.isRead && <span className="pill pill-success" style={{ fontSize: "var(--text-xs)" }}>Neu</span>}
                      <time style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {n.createdAt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </time>
                    </div>
                    <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: "var(--leading-normal)" }}>
                      {n.body}
                    </p>
                    {!n.isRead && (
                      <form action={markNotificationRead} style={{ marginTop: "var(--space-3)" }}>
                        <input type="hidden" name="id" value={n.id} />
                        <button className="btn btn-secondary" type="submit" style={{ minHeight: "36px", fontSize: "var(--text-sm)" }}>
                          <Check size={14} />
                          Als gelesen markieren
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </section>
        </>
      )}
    </AppShell>
  );
}