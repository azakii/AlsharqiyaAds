import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportWhatsapp from "@/components/SupportWhatsapp";
import { getSettings } from "@/lib/settings";
import { currentInfluencerId } from "@/lib/userAuth";
import { getInfluencerById } from "@/lib/data";
import { isAdmin, adminCreds } from "@/lib/auth";
import { siteOrigin } from "@/lib/seo";
import type { NavUser } from "@/components/Navbar";

export const dynamic = "force-dynamic";

/**
 * الأساس الافتراضي للميتاداتا — كل صفحة عامة تستدعي buildMetadata() بمسارها الخاص وتتجاوز هذا،
 * فهذا هنا مجرد احتياطي (لصفحات ما لهاش generateMetadata خاص بها) + الفافيكون + metadataBase
 * اللازم لتحويل روابط الصور/canonical النسبية إلى روابط مطلقة صحيحة.
 */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const origin = (() => {
    try {
      return siteOrigin();
    } catch {
      return undefined;
    }
  })();
  return {
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    title: s.default_meta_title || s.brand_name,
    description: s.default_meta_description || s.footer_about,
    ...(s.default_meta_keywords
      ? { keywords: s.default_meta_keywords.split(",").map((k) => k.trim()).filter(Boolean) }
      : {}),
    ...(s.favicon_url ? { icons: { icon: s.favicon_url } } : {}),
    ...(s.google_site_verification ? { verification: { google: s.google_site_verification } } : {}),
    openGraph: {
      title: s.default_meta_title || s.brand_name,
      description: s.default_meta_description || s.footer_about,
      type: "website",
      ...(s.default_og_image ? { images: [{ url: s.default_og_image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(s.twitter_handle ? { site: s.twitter_handle } : {}),
    },
    robots: { index: s.default_robots_index !== false, follow: s.default_robots_follow !== false },
  };
}

/** "#D4A017" -> "212 160 23" (RGB channel triplet). Returns null on bad input. */
function hexToTriplet(hex: string): string | null {
  if (!hex) return null;
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();

  const uid = currentInfluencerId();
  let navUser: NavUser | null = null;
  if (uid) {
    const inf = await getInfluencerById(uid);
    if (inf) navUser = { id: inf.id, name: inf.name, avatar_url: inf.avatar_url, followers: inf.followers };
  }

  const navAdmin = isAdmin() ? { username: adminCreds().username } : null;

  const vars: string[] = [];
  const map: Record<string, string> = {
    "--c-bg": s.color_bg,
    "--c-gold": s.color_gold,
    "--c-gold-light": s.color_gold_light,
    "--c-gold-dark": s.color_gold_dark,
  };
  for (const [name, hex] of Object.entries(map)) {
    const t = hexToTriplet(hex);
    if (t) vars.push(`${name}:${t}`);
  }
  const themeVars = vars.length ? `:root{${vars.join(";")}}` : "";

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
      </head>
      <body className="min-h-screen bg-bg">
        <Navbar settings={s} user={navUser} admin={navAdmin} />
        <main className="min-h-[70vh]">{children}</main>
        <Footer settings={s} />
        <SupportWhatsapp number={s.support_whatsapp} />
      </body>
    </html>
  );
}
