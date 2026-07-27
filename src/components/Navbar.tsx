"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck, LogOut, Loader2, Home } from "lucide-react";
import Logo from "./Logo";
import { formatFollowers } from "@/lib/constants";
import { logout } from "@/lib/actions";
import type { SiteSettings } from "@/lib/settings";

type NavLink = { href: string; label: string; tab?: string };

const LINKS: NavLink[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/influencers", label: "المشاهير" },
];

// لما يكون الأدمن مسجل دخول، القائمة الرئيسية تتحول لروابط لوحة التحكم مباشرة —
// كل رابط بيحمل اسم التاب بتاعه عشان نحدد العنصر الفعّال (active) صح، لأن usePathname
// وحده مش كافي هنا (كل التلات روابط بتوصل لنفس المسار /admin، والفرق بس في ?tab=).
const ADMIN_LINKS: NavLink[] = [
  { href: "/admin?tab=influencers", label: "المؤثرون", tab: "influencers" },
  { href: "/admin?tab=ads", label: "طلبات الإعلان", tab: "ads" },
  { href: "/admin?tab=settings", label: "إعدادات الموقع", tab: "settings" },
];

export interface NavUser {
  id: string;
  name: string;
  avatar_url: string;
  followers: number;
}

export default function Navbar({
  settings,
  user,
  admin,
}: {
  settings: SiteSettings;
  user: NavUser | null;
  admin: { username: string } | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // المنيو بتاعة الأدمن تظهر بس وهو داخل /admin فعلاً — لو راح لأي صفحة تانية (الرئيسية مثلاً)
  // يشوف نفس منيو أي زائر عادي، حتى لو لسه مسجل دخول كأدمن (شارة اسمه وزر الخروج بيفضلوا ظاهرين برضه).
  const onAdminRoute = pathname === "/admin";
  const links = admin && onAdminRoute ? ADMIN_LINKS : LINKS;
  const currentAdminTab = searchParams.get("tab") || "influencers";

  function isActive(l: NavLink): boolean {
    if (l.tab) return pathname === "/admin" && currentAdminTab === l.tab;
    return pathname === l.href;
  }

  async function handleAdminLogout() {
    setLoggingOut(true);
    await logout();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-lg">
      {/* 3-column grid so the menu sits truly centered between the logo and the button group,
          regardless of dir="rtl": grid column 1 renders on the right, column 3 on the left. */}
      <nav className="container-max grid h-[70px] grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo — column 1, right side in RTL */}
        <Logo brandName={settings.brand_name} brandNameEn={settings.brand_name_en} logoUrl={settings.logo_url} />

        {/* Menu — column 2, centered */}
        <ul className="hidden items-center justify-center gap-8 md:flex">
          {links.map((l) => {
            const active = isActive(l);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`border-b-2 pb-1 text-sm transition hover:text-gold ${
                    active ? "border-gold font-semibold text-gold" : "border-transparent text-white/70"
                  }`}
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
            {admin ? (
              <>
                <Link
                  href="/"
                  className="glass flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:text-gold"
                  aria-label="الصفحة الرئيسية"
                  title="الصفحة الرئيسية"
                >
                  <Home className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin"
                  className="glass flex items-center gap-2 rounded-full py-1.5 pl-4 pr-3 text-xs font-semibold text-white/80 transition hover:text-gold"
                >
                  <ShieldCheck className="h-4 w-4 text-gold" /> {admin.username}
                </Link>
                <button
                  onClick={handleAdminLogout}
                  disabled={loggingOut}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-semibold text-gold transition-all hover:bg-gold/10 disabled:opacity-60"
                >
                  {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  تسجيل خروج
                </button>
              </>
            ) : user ? (
              <>
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
                <Link
                  href="/ad-request"
                  className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-black shadow-gold transition-all hover:brightness-105"
                >
                  طلب إعلان
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-xs font-semibold text-gold transition-all hover:bg-gold/10"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/ad-request"
                  className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-black shadow-gold transition-all hover:brightness-105"
                >
                  طلب إعلان
                </Link>
              </>
            )}
          </div>

          <button className="text-white/80 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="القائمة">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="container-max flex flex-col gap-1 pb-4 md:hidden">
          {links.map((l) => {
            const active = isActive(l);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg border-r-2 px-3 py-2 text-sm transition hover:bg-white/5 hover:text-gold ${
                    active ? "border-gold font-semibold text-gold" : "border-transparent text-white/80"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
          {admin ? (
            <>
              <li>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-gold"
                >
                  <Home className="h-4 w-4 text-gold" /> الصفحة الرئيسية
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-gold"
                >
                  <ShieldCheck className="h-4 w-4 text-gold" /> {admin.username}
                </Link>
              </li>
              <li>
                <button
                  onClick={handleAdminLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-right text-sm text-gold hover:bg-white/5 disabled:opacity-60"
                >
                  {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  تسجيل خروج
                </button>
              </li>
            </>
          ) : (
            <>
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
            </>
          )}
        </ul>
      )}
    </header>
  );
}
