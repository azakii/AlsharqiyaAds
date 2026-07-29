import type { Metadata } from "next";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { isAdmin } from "@/lib/auth";
import { getAllInfluencers, getAllAdRequests, getStats } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { getAllSeoPages, getSeoForPath, buildMetadata } from "@/lib/seo";
import { supabaseEnabled, serviceRoleEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/admin"), getSettings()]);
  return buildMetadata({
    path: "/admin",
    seo,
    // لوحة الإدارة غير مخصصة للفهرسة افتراضياً — الأدمن يقدر يغيّر ده صراحة من لوحة السيو لو حابب.
    settings: { ...settings, default_robots_index: seo ? settings.default_robots_index : false },
    fallback: { title: `لوحة الإدارة | ${settings.brand_name}`, description: settings.footer_about },
  });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  if (!isAdmin()) return <AdminLogin />;

  const [influencers, adRequests, stats, settings, seoPages] = await Promise.all([
    getAllInfluencers(),
    getAllAdRequests(),
    getStats(),
    getSettings(),
    getAllSeoPages(),
  ]);

  const tabParam = searchParams?.tab;
  const initialTab: "influencers" | "ads" | "seo" | "settings" =
    tabParam === "ads" || tabParam === "settings" || tabParam === "seo" ? tabParam : "influencers";

  return (
    <AdminDashboard
      influencers={influencers}
      adRequests={adRequests}
      stats={stats}
      settings={settings}
      seoPages={seoPages}
      demo={!supabaseEnabled}
      missingServiceRole={supabaseEnabled && !serviceRoleEnabled}
      initialTab={initialTab}
    />
  );
}
