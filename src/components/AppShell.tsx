"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  Package,
  Users,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { AccountMenu } from "@/components/AccountMenu";

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
  { href: "/", label: "Übersicht", icon: Leaf },
  { href: "/wardrobe", label: "Kleidung", asset: "/brand/kit/icons/hanger.svg" },
  { href: "/packages", label: "Pakete", icon: Package },
  { href: "/family", label: "Familie", icon: Users },
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
          <Link href="/" className="brand" aria-label="Kleidolino – Startseite">
            <img className="brand-logo" src="/brand/kit/logos/primary-horizontal.svg" alt="Kleidolino – Kleine Kleidung. Große Geschichten." />
          </Link>
        )}
        <div className="header-actions">
          <div className="desktop-account-menu"><AccountMenu household={household} unreadNotifications={unreadNotifications} /></div>
          <Link 
            href="/notifications" 
            className="icon-btn" 
            aria-label={unreadNotifications > 0 ? `${unreadNotifications} ungelesene Benachrichtigungen` : "Benachrichtigungen"}
          >
            <img src="/brand/kit/icons/bell.svg" width="24" height="24" alt="" aria-hidden="true" />
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
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
                aria-current={isActive ? "page" : undefined}
              >
                {"asset" in item ? <img src={item.asset} width="24" height="24" alt="" aria-hidden="true" /> : <item.icon size={22} aria-hidden="true" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main" id="main-content" tabIndex={-1}>
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
          <h1 className="page-title" style={{ marginBottom: "var(--space-4)" }}>{title}</h1>
        )}

        <div className="content">{children}</div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Hauptnavigation">
        {navigation.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${isActive ? "active" : ""} ${item.href === "/" ? "nav-overview" : "nav-wardrobe"}`}
              aria-current={isActive ? "page" : undefined}
            >
              {"asset" in item ? <img src={item.asset} width="24" height="24" alt="" aria-hidden="true" /> : <item.icon size={24} aria-hidden="true" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link href="/wardrobe/new" className="capture-link" aria-label="Kleidungsstück erfassen">
          <Plus size={24} aria-hidden="true" />
          <span>Erfassen</span>
        </Link>
        {navigation.slice(2).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = "icon" in item ? item.icon : Leaf;
          return (
            <Link key={item.href} href={item.href} className={`${isActive ? "active" : ""} ${item.href === "/packages" ? "nav-packages" : "nav-family"}`} aria-current={isActive ? "page" : undefined}>
              <Icon size={24} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="bottom-account-menu nav-account"><AccountMenu household={household} unreadNotifications={unreadNotifications} /></div>
      </nav>
    </main>
  );
}

export function EmptyState({ text, href, action, illustration = "/brand/kit/illustrations/clothes-set.svg" }: { text: string; href?: string; action?: string; illustration?: string }) {
  return (
    <div className="empty">
      <img className="empty-illustration" src={illustration} alt="" aria-hidden="true" />
      <p>{text}</p>
      {href && <a className="btn wide" href={href}>{action ?? "Weiter"}</a>}
    </div>
  );
}
