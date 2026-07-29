import type { Metadata } from "next";
import InfluencerExplorer from "@/components/InfluencerExplorer";
import StructuredData from "@/components/StructuredData";
import { getApprovedInfluencers } from "@/lib/data";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/influencers"), getSettings()]);
  return buildMetadata({
    path: "/influencers",
    seo,
    settings,
    fallback: { title: `المشاهير | ${settings.brand_name}`, description: settings.footer_about },
  });
}

export default async function InfluencersPage() {
  const [influencers, seo] = await Promise.all([getApprovedInfluencers(), getSeoForPath("/influencers")]);

  return (
    <>
      {seo && <StructuredData blocks={seo.structured_data} />}
      <InfluencerExplorer influencers={influencers} />
    </>
  );
}
