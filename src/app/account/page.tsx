import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentInfluencerId } from "@/lib/userAuth";
import { getOwnInfluencerProfile } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import StructuredData from "@/components/StructuredData";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/account"), getSettings()]);
  return buildMetadata({
    path: "/account",
    seo,
    settings,
    fallback: { title: `حسابي | ${settings.brand_name}`, description: settings.footer_about },
  });
}

export default async function AccountPage() {
  const uid = currentInfluencerId();
  if (!uid) redirect("/login");

  // getOwnInfluencerProfile (not the public-safe getInfluencerById) so the influencer
  // can see/edit their own license_number — ownership already verified via the session cookie.
  const influencer = await getOwnInfluencerProfile(uid);
  if (!influencer) redirect("/login");

  const [settings, seo] = await Promise.all([getSettings(), getSeoForPath("/account")]);

  return (
    <div className="container-max py-12">
      {seo && <StructuredData blocks={seo.structured_data} />}
      <div className="text-right">
        <h1 className="font-display text-3xl font-bold gold-text">حسابي</h1>
        <p className="text-sm text-white/45">إدارة ملفك الشخصي كمؤثر</p>
      </div>

      <AccountForm influencer={influencer} supportWhatsapp={settings.support_whatsapp} />
    </div>
  );
}
