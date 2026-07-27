import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { isAdmin } from "@/lib/auth";
import { getAllInfluencers, getAllAdRequests, getStats } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { supabaseEnabled, serviceRoleEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة الإدارة | إعلانات الشرقية" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  if (!isAdmin()) return <AdminLogin />;

  const [influencers, adRequests, stats, settings] = await Promise.all([
    getAllInfluencers(),
    getAllAdRequests(),
    getStats(),
    getSettings(),
  ]);

  const tabParam = searchParams?.tab;
  const initialTab: "influencers" | "ads" | "settings" =
    tabParam === "ads" || tabParam === "settings" ? tabParam : "influencers";

  return (
    <AdminDashboard
      influencers={influencers}
      adRequests={adRequests}
      stats={stats}
      settings={settings}
      demo={!supabaseEnabled}
      missingServiceRole={supabaseEnabled && !serviceRoleEnabled}
      initialTab={initialTab}
    />
  );
}
