"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Shirt,
  Package,
  Users,
  Bell,
  ChevronLeft,
  Plus,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  household: string;
  title?: string;
  role?: string;
  unreadNotifications?: number;
  showBackButton?: boolean;
  backHref?: string;
}

const navigation = [
  { href: "/", label: "Übersicht", icon: Home },
  { href: "/wardrobe", label: "Kleidung", icon: Shirt },
  { href: "/packages", label: "Pakete", icon: Package },
  { href: "/family", label: "Familie", icon: Users },
  { href: "/notifications", label: "Benachrichtigungen", icon: Bell },
] as const;

export function AppShell({ 
  children, 
  household, 
  title, 
  role, 
  unreadNotifications = 0,
  showBackButton = false,
  backHref = "/"
}: AppShellProps) {
  const pathname = usePathname();
  const isSubPage = pathname !== "/" && pathname !== "/wardrobe" && pathname !== "/packages" && pathname !== "/family" && pathname !== "/notifications";

  return (
    <main className="shell">
      <a href="#main-content" className="skip-link">
        Zum Hauptinhalt springen
      </a>

      {/* Header */}
      <header className="header" role="banner">
        {showBackButton && (
          <Link 
            href={backHref} 
            className="icon-btn" 
            aria-label="Zurück"
          >
            <ChevronLeft size={22} />
          </Link>
        )}
        {!showBackButton && (
          <Link href="/" className="brand" aria-label="KleiderPfad Startseite">
            <span className="brand-icon" aria-hidden="true">
              <Shirt size={24} color="white" />
            </span>
            KleiderPfad
          </Link>
        )}
        <div className="header-actions">
          <Link 
            href="/notifications" 
            className="icon-btn" 
            aria-label={unreadNotifications > 0 ? `${unreadNotifications} ungelesene Benachrichtigungen` : "Benachrichtigungen"}
          >
            <Bell size={22} />
            {unreadNotifications > 0 && (
              <span className="badge">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
            )}
          </Link>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="sidebar" aria-label="Hauptnavigation">
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={22} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main">
        {isSubPage && showBackButton && title && (
          <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
            <Link href={backHref} className="icon-btn" aria-label="Zurück">
              <ChevronLeft size={22} />
            </Link>
            <div style={{ flex: 1 }}>
              <h1 className="page-title">{title}</h1>
              {household && <p className="page-subtitle">{household}</p>}
            </div>
          </div>
        )}

        {!isSubPage && (
          <div className="eyebrow">
            {household}
            {role && (
              <span className="pill pill-success" style={{ marginLeft: "var(--space-2)" }}>
                {role}
              </span>
            )}
          </div>
        )}

        {isSubPage && !showBackButton && title && (
          <h1 id="main-content" className="page-title" style={{ marginBottom: "var(--space-4)" }}>{title}</h1>
        )}

        <div className="content">{children}</div>
      </div>

      {/* Mobile Bottom Navigation - 5 items with centered Plus */}
      <nav className="bottom-nav" aria-label="Hauptnavigation">
        <Link
          href="/"
          className={pathname === "/" ? "active" : ""}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <Home size={24} aria-hidden="true" />
          <span>Übersicht</span>
        </Link>
        <Link
          href="/wardrobe"
          className={pathname === "/wardrobe" || pathname.startsWith("/wardrobe/") ? "active" : ""}
          aria-current={pathname === "/wardrobe" || pathname.startsWith("/wardrobe/") ? "page" : undefined}
        >
          <Shirt size={24} aria-hidden="true" />
          <span>Kleidung</span>
        </Link>
        {/* Centered Plus Button */}
        <Link
          href="/wardrobe/new"
          className="center-action"
          aria-label="Kleidungsstück erfassen"
        >
          <Plus size={28} aria-hidden="true" />
        </Link>
        <Link
          href="/packages"
          className={pathname === "/packages" || pathname.startsWith("/packages/") ? "active" : ""}
          aria-current={pathname === "/packages" || pathname.startsWith("/packages/") ? "page" : undefined}
        >
          <Package size={24} aria-hidden="true" />
          <span>Pakete</span>
        </Link>
        <Link
          href="/family"
          className={pathname === "/family" || pathname.startsWith("/family/") ? "active" : ""}
          aria-current={pathname === "/family" || pathname.startsWith("/family/") ? "page" : undefined}
        >
          <Users size={24} aria-hidden="true" />
          <span>Familie</span>
        </Link>
      </nav>
    </main>
  );
}

export function EmptyState({ text, href, action }: { text: string; href?: string; action?: string }) {
  return (
    <div className="empty">
      <p>{text}</p>
      {href && <a className="btn wide" href={href}>{action ?? "Weiter"}</a>}
    </div>
  );
}