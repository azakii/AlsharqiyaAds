import { redirect } from "next/navigation";
import { currentInfluencerId } from "@/lib/userAuth";
import { getOwnInfluencerProfile } from "@/lib/data";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "حسابي | إعلانات الشرقية" };

export default async function AccountPage() {
  const uid = currentInfluencerId();
  if (!uid) redirect("/login");

  // getOwnInfluencerProfile (not the public-safe getInfluencerById) so the influencer
  // can see/edit their own license_number — ownership already verified via the session cookie.
  const influencer = await getOwnInfluencerProfile(uid);
  if (!influencer) redirect("/login");

  return (
    <div className="container-max py-12">
      <div className="text-right">
        <h1 className="font-display text-3xl font-bold gold-text">حسابي</h1>
        <p className="text-sm text-white/45">إدارة ملفك الشخصي كمؤثر</p>
      </div>

      <AccountForm influencer={influencer} />
    </div>
  );
}
