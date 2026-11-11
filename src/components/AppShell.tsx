import Link from "next/link";

export function AppShell({children, household, title}:{
  children: React.ReactNode; household: string; title?: string;
}) {
  return <main className="shell">
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-icon">♡</span> KleiderPfad</Link>
      <Link href="/notifications" className="round-link" aria-label="Benachrichtigungen">♧</Link>
    </header>
    <div className="eyebrow">{household}</div>
    {title && <h1>{title}</h1>}
    <div className="content">{children}</div>
    <nav className="nav" aria-label="Hauptnavigation">
      <Link href="/"><span>⌂</span>Übersicht</Link>
      <Link href="/wardrobe"><span>♧</span>Kleidung</Link>
      <Link href="/packages"><span>▣</span>Pakete</Link>
      <Link href="/family"><span>♙</span>Familie</Link>
    </nav>
  </main>;
}

export function EmptyState({text, href, action}: {text:string;href?:string;action?:string}) {
  return <div className="empty"><p>{text}</p>{href && <a className="btn" href={href}>{action ?? "Weiter"}</a>}</div>;
}
