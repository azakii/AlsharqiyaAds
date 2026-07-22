import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { isAdmin } from "@/lib/auth";
import { getAllInfluencers, getAllAdRequests, getStats } from "@/lib/data";
import { supabaseEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة الإدارة | إعلانات الشرقية" };

export default async function AdminPage() {
  if (!isAdmin()) return <AdminLogin />;

  const [influencers, adRequests, stats] = await Promise.all([
    getAllInfluencers(),
    getAllAdRequests(),
    getStats(),
  ]);

  return (
    <AdminDashboard
      influencers={influencers}
      adRequests={adRequests}
      stats={stats}
      demo={!supabaseEnabled}
    />
  );
}
