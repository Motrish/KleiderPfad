"use client";

import { useId } from "react";
import Link from "next/link";
import { UserRound, Settings, Bell, LogOut } from "lucide-react";
import { logout } from "@/actions/account";

export function AccountMenu({ household, unreadNotifications = 0 }: {
  household: string;
  unreadNotifications?: number;
}) {
  const id = useId();
  return (
    <>
      <button type="button" className="icon-btn account-trigger" popoverTarget={id} aria-label="Kontomenü öffnen">
        <UserRound size={22} aria-hidden="true" />
        {unreadNotifications > 0 && <span className="badge">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
      </button>
      <div id={id} popover="auto" className="account-menu">
        <p className="account-menu-heading">{household}</p>
        <nav aria-label="Konto">
          <Link href="/profile"><UserRound size={20} aria-hidden="true" /> Mein Profil</Link>
          <Link href="/settings"><Settings size={20} aria-hidden="true" /> Einstellungen</Link>
          <Link href="/notifications"><Bell size={20} aria-hidden="true" /> Benachrichtigungen{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}</Link>
        </nav>
        <form action={logout}>
          <button type="submit"><LogOut size={20} aria-hidden="true" /> Abmelden</button>
        </form>
      </div>
    </>
  );
}
