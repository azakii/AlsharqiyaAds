import { redirect } from "next/navigation";
import { currentInfluencerId } from "@/lib/userAuth";
import { getInfluencerById } from "@/lib/data";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "حسابي | إعلانات الشرقية" };

export default async function AccountPage() {
  const uid = currentInfluencerId();
  if (!uid) redirect("/login");

  const influencer = await getInfluencerById(uid);
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
