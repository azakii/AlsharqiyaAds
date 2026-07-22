import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: s.brand_name,
    description: s.footer_about,
    openGraph: { title: s.brand_name, description: s.footer_about, type: "website" },
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
        <Navbar settings={s} />
        <main className="min-h-[70vh]">{children}</main>
        <Footer settings={s} />
      </body>
    </html>
  );
}
