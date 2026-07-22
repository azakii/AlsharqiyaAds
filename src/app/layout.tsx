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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const themeVars = `:root{--c-bg:${s.color_bg};--c-gold:${s.color_gold};--c-gold-light:${s.color_gold_light};--c-gold-dark:${s.color_gold_dark};}`;

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
