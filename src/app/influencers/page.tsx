import InfluencerExplorer from "@/components/InfluencerExplorer";
import { getApprovedInfluencers } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "المشاهير | إعلانات الشرقية" };

export default async function InfluencersPage() {
  const influencers = await getApprovedInfluencers();

  return <InfluencerExplorer influencers={influencers} />;
}
