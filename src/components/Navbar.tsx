"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { formatFollowers } from "@/lib/constants";
import type { SiteSettings } from "@/lib/settings";

// "لوحة الإدارة" لا تظهر في القائمة الظاهرة للعامة — الوصول لها عبر /admin مباشرة
const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/#celebrities", label: "المشاهير" },
];

export interface NavUser {
  id: string;
  name: string;
  avatar_url: string;
  followers: number;
}

export default function Navbar({ settings, user }: { settings: SiteSettings; user: NavUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-lg">
      {/* 3-column grid so the menu sits truly centered between the logo and the button group,
          regardless of dir="rtl": grid column 1 renders on the right, column 3 on the left. */}
      <nav className="container-max grid h-[70px] grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo — column 1, right side in RTL */}
        <Logo brandName={settings.brand_name} brandNameEn={settings.brand_name_en} logoUrl={settings.logo_url} />

        {/* Menu — column 2, centered */}
        <ul className="hidden items-center justify-center gap-8 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`text-sm transition hover:text-gold ${active ? "text-gold" : "text-white/70"}`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Buttons — column 3, left side in RTL.
            DOM order: login/user-chip first (renders closer to the menu), ad-request last (far left edge). */}
        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <Link
                href="/account"
                className="glass flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 transition hover:text-gold"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url || "/avatar-placeholder.svg"}
                  alt={user.name}
                  className="h-8 w-8 rounded-full border border-gold/30 object-cover"
                />
                <span className="text-right leading-tight">
                  <span className="block text-xs font-semibold text-white">{user.name}</span>
                  <span className="block text-[10px] text-gold">{formatFollowers(user.followers)} متابع</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-xs font-semibold text-gold transition-all hover:bg-gold/10"
              >
                تسجيل الدخول
              </Link>
            )}
            <Link
              href="/ad-request"
              className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-black shadow-gold transition-all hover:brightness-105"
            >
              طلب إعلان
            </Link>
          </div>

          <button className="text-white/80 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="القائمة">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="container-max flex flex-col gap-1 pb-4 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-gold"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            {user ? (
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-gold"
              >
                حسابي ({user.name})
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-gold"
              >
                تسجيل الدخول
              </Link>
            )}
          </li>
          <li>
            <Link
              href="/ad-request"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-gold"
            >
              طلب إعلان
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
