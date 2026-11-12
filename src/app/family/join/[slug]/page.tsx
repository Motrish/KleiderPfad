import { notFound, redirect } from "next/navigation";
import { eq, and, isNull, gt } from "drizzle-orm";
import Link from "next/link";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { households, householdInvites, householdMembers } from "@/db/schema";
import { joinHousehold } from "@/actions";
import { AppShell } from "@/components/AppShell";

export default async function JoinByLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getContext();

  const [invite] = await db
    .select({
      id: householdInvites.token,
      householdId: householdInvites.householdId,
      expiresAt: householdInvites.expiresAt,
      usedAt: householdInvites.usedAt,
      householdName: households.name,
    })
    .from(householdInvites)
    .innerJoin(households, eq(households.id, householdInvites.householdId))
    .where(eq(householdInvites.inviteSlug, slug))
    .limit(1);

  if (!invite) {
    return <AppShell household={ctx.household.name} title="Einladung ungültig">
      <div className="card card-soft text-center" style={{ maxWidth: 400, margin: "auto" }}>
        <h2>Einladung nicht gefunden</h2>
        <p className="muted mt-2">Dieser Einladungslink ist ungültig oder wurde bereits verwendet.</p>
        <Link href="/family" className="btn mt-4">Zurück zu Familie</Link>
      </div>
    </AppShell>;
  }

  const isExpired = new Date(invite.expiresAt) < new Date();
  const isUsed = !!invite.usedAt;
  const alreadyMember = ctx.memberships.some((m) => m.id === invite.householdId);

  if (alreadyMember) {
    await setActiveHousehold(invite.householdId);
    redirect("/family");
  }

  if (isExpired || isUsed) {
    return <AppShell household={ctx.household.name} title="Einladung abgelaufen">
      <div className="card card-soft text-center" style={{ maxWidth: 400, margin: "auto" }}>
        <h2>{isExpired ? "Einladung abgelaufen" : "Einladung bereits verwendet"}</h2>
        <p className="muted mt-2">
          {isExpired
            ? "Dieser Einladungslink ist abgelaufen. Bitte fordere einen neuen an."
            : "Diese Einladung wurde bereits angenommen."}
        </p>
        <Link href="/family" className="btn mt-4">Zurück zu Familie</Link>
      </div>
    </AppShell>;
  }

  return <AppShell household={ctx.household.name} title={`Einladung: ${invite.householdName}`}>
    <div className="card card-soft" style={{ maxWidth: 400, margin: "auto" }}>
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-green-light flex items-center justify-center mx-auto mb-3">
          <span style={{ fontSize: 32 }}>🏠</span>
        </div>
        <h2>Einladung zu „{invite.householdName}“</h2>
        <p className="muted mt-2">Du wurdest eingeladen, diesem Haushalt beizutreten.</p>
      </div>

      <form action={joinHousehold} className="fields">
        <input type="hidden" name="inviteCode" value={invite.id} />
        <button className="btn wide" type="submit">Haushalt beitreten</button>
      </form>
      <p className="help text-center mt-3">Durch Beitritt stimmst du der Datennutzung im Haushalt zu.</p>
    </div>
  </AppShell>;
}

async function setActiveHousehold(householdId: string) {
  const { cookies } = await import("next/headers");
  (await cookies()).set("kp_household", householdId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
}