import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, households, householdMembers } from "@/db/schema";
import { cookies } from "next/headers";
import { eq, sql, asc } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function getContext() {
  const session = await auth();
  if (!session?.oidcSubject) redirect("/");
  const issuer = process.env.AUTH_AUTHENTIK_ISSUER;
  if (!issuer) throw new Error("AUTH_AUTHENTIK_ISSUER missing");
  const [user] = await db.insert(users).values({
    oidcIssuer: issuer,
    oidcSubject: session.oidcSubject,
    displayName: session.user?.name || session.user?.email || "Benutzer",
    email: session.user?.email ?? null,
  }).onConflictDoUpdate({
    target: [users.oidcIssuer, users.oidcSubject],
    set: { displayName: session.user?.name || session.user?.email || "Benutzer", email: session.user?.email ?? null },
  }).returning();

  await db.transaction(async (tx) => {
    // Prevent duplicate default households during concurrent first login requests.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${user.id}::text))`);
    const existing = await tx.select({ householdId: householdMembers.householdId })
      .from(householdMembers).where(eq(householdMembers.userId, user.id)).limit(1);
    if (!existing.length) {
      const [household] = await tx.insert(households)
        .values({ name: "Mein Haushalt" }).returning();
      await tx.insert(householdMembers).values({ userId: user.id, householdId: household.id, role: "owner" });
    }
  });
  const memberships = await db.select({
    id: households.id, name: households.name, role: householdMembers.role,
  }).from(householdMembers).innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, user.id)).orderBy(asc(households.createdAt));
  const preferred = (await cookies()).get("kp_household")?.value;
  const household = memberships.find((m) => m.id === preferred) ?? memberships[0];
  if (!household) throw new Error("No household assigned");
  return { user, household, memberships };
}

export type AppContext = Awaited<ReturnType<typeof getContext>>;
