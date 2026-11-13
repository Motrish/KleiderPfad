import { and, eq, or, gt, isNull, desc, inArray } from "drizzle-orm";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { connections, households, householdInvites, householdMembers, users } from "@/db/schema";
import { selectHousehold, createHousehold, createInvite, joinHousehold, requestConnection, acceptConnection, renameHousehold } from "@/actions";
import { AppShell } from "@/components/AppShell";
import { CopyableCode } from "@/components/ui/CopyableCode";
import { FamilyInteractive } from "./FamilyInteractive";
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

  return (
    <AppShell household={ctx.household.name} title="Familie & Kontakte">
      <FamilyInteractive
        ctx={ctx}
        members={members}
        invites={invites}
        links={links}
        linked={linked}
        origin={origin}
        acceptConnection={acceptConnection}
        selectHousehold={selectHousehold}
        createInvite={createInvite}
        joinHousehold={joinHousehold}
        createHousehold={createHousehold}
        requestConnection={requestConnection}
        renameHousehold={renameHousehold}
      />
    </AppShell>
  );
}