"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
  household: string;
  title?: string;
  role?: string;
}

const navigation = [
  { href: "/", label: "Übersicht", icon: "⌂" },
  { href: "/wardrobe", label: "Kleidung", icon: "♧" },
  { href: "/packages", label: "Pakete", icon: "▣" },
  { href: "/family", label: "Familie", icon: "♙" },
  { href: "/notifications", label: "Benachrichtigungen", icon: "🔔" },
] as const;

export function AppShell({ children, household, title, role }: AppShellProps) {
  const pathname = usePathname();

  return (
    <main className="shell">
      <a href="#main-content" className="skip-link">
        Zum Hauptinhalt springen
      </a>

      {/* Mobile Top Bar */}
      <header className="topbar hidden-desktop">
        <Link href="/" className="brand" aria-label="KleiderPfad Startseite">
          <span className="brand-icon" aria-hidden="true">♡</span>
          KleiderPfad
        </Link>
        <Link href="/notifications" className="round-link" aria-label="Benachrichtigungen">
          🔔
        </Link>
      </header>

      {/* Desktop Sidebar */}
      <aside className="sidebar" aria-label="Hauptnavigation">
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "active" : ""}
              aria-current={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main">
        {/* Desktop Top Bar */}
        <header className="topbar hidden-mobile">
          <Link href="/" className="brand" aria-label="KleiderPfad Startseite">
            <span className="brand-icon" aria-hidden="true">♡</span>
            KleiderPfad
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Link href="/notifications" className="round-link" aria-label="Benachrichtigungen">
              🔔
            </Link>
          </div>
        </header>

        <div className="eyebrow">
          {household}
          {role && <span style={{ marginLeft: "var(--space-2)", padding: "2px 8px", background: "var(--green-light)", color: "var(--green)", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: 600 }}>{role}</span>}
        </div>

        {title && <h1 id="main-content">{title}</h1>}

        <div className="content">{children}</div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="nav" aria-label="Hauptnavigation">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "active" : ""}
            aria-current={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}

export function EmptyState({ text, href, action }: { text: string; href?: string; action?: string }) {
  return (
    <div className="empty">
      <p>{text}</p>
      {href && <a className="btn" href={href}>{action ?? "Weiter"}</a>}
    </div>
  );
}