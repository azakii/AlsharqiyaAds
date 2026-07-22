"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import type { SiteSettings } from "@/lib/settings";

// "لوحة الإدارة" لا تظهر في القائمة الظاهرة للعامة — الوصول لها عبر /admin مباشرة
const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/#celebrities", label: "المشاهير" },
  { href: "/register", label: "تسجيل كمؤثر" },
  { href: "/ad-request", label: "طلب إعلان" },
];

export default function Navbar({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-lg">
      <nav className="container-max flex h-[70px] items-center justify-between">
        {/* Logo — first child so it sits on the right in RTL */}
        <Logo brandName={settings.brand_name} brandNameEn={settings.brand_name_en} logoUrl={settings.logo_url} />

        <ul className="hidden items-center gap-7 md:flex">
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

        <button className="text-white/80 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="القائمة">
          {open ? <X /> : <Menu />}
        </button>
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
        </ul>
      )}
    </header>
  );
}
