import type { Metadata } from "next";
import AdRequestForm from "./AdRequestForm";
import StructuredData from "@/components/StructuredData";
import { getApprovedInfluencers } from "@/lib/data";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/ad-request"), getSettings()]);
  return buildMetadata({
    path: "/ad-request",
    seo,
    settings,
    fallback: { title: `طلب إعلان | ${settings.brand_name}`, description: settings.footer_about },
  });
}

export default async function AdRequestPage() {
  const [influencers, seo] = await Promise.all([getApprovedInfluencers(), getSeoForPath("/ad-request")]);
  return (
    <div className="bg-gold-radial">
      {seo && <StructuredData blocks={seo.structured_data} />}
      <div className="container-max py-16">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold gold-text">طلب إعلان</h1>
          <p className="mt-3 text-sm text-white/50">أخبرنا عن مشروعك وسنوصلك بالمؤثر المناسب</p>
        </div>
        <AdRequestForm influencers={influencers} />
      </div>
    </div>
  );
}
