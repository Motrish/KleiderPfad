import Link from "next/link";
import { getContext } from "@/lib/context";
import { AppShell } from "@/components/AppShell";

export default async function Profile() {
  const ctx = await getContext();
  return (
    <AppShell household={ctx.household.name} title="Mein Profil" showBackButton>
      <section className="card fields">
        <h2>{ctx.user.displayName}</h2>
        <dl className="fields">
          <div><dt>E-Mail</dt><dd>{ctx.user.email || "Nicht hinterlegt"}</dd></div>
          <div><dt>Aktiver Haushalt</dt><dd>{ctx.household.name}</dd></div>
        </dl>
        <p className="text-muted">Dein Name und deine E-Mail werden über dein Anmeldekonto verwaltet.</p>
        <Link href="/settings" className="btn btn-outline">Haushaltseinstellungen</Link>
      </section>
    </AppShell>
  );
}
