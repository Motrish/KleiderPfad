import { auth, signIn, signOut } from "@/auth";
export default async function Home() {
  const session = await auth();
  return <main className="shell">
    <header className="brand">♡ KleiderPfad</header>
    <p className="muted">Kleine Kleidung. Große Geschichten.</p>
    <h1>{session?.user ? "Hallo, " + (session.user.name ?? "willkommen") + "!" : "Willkommen bei KleiderPfad"}</h1>
    <p className="muted">Babykleidung gemeinsam verwalten, weitergeben und ihren Weg nachverfolgen.</p>
    {session?.user ? <>
      <section className="card"><h2>Du bist angemeldet</h2><p>Die Kleiderverwaltung wird im nächsten Entwicklungsschritt ergänzt.</p></section>
      <form action={async () => { "use server"; await signOut(); }}><button className="btn">Abmelden</button></form>
      <nav className="nav"><span>Übersicht</span><span>Kleidung</span><span>Pakete</span><span>Familie</span></nav>
    </> : <>
      <section className="card">Deine gemeinsame Familiengarderobe.</section>
      <form action={async () => { "use server"; await signIn("authentik"); }}><button className="btn">Mit Authentik anmelden</button></form>
    </>}
  </main>;
}
