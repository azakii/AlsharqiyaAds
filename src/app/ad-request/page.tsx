import AdRequestForm from "./AdRequestForm";
import { getApprovedInfluencers } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "طلب إعلان | إعلانات الشرقية" };

export default async function AdRequestPage() {
  const influencers = await getApprovedInfluencers();
  return (
    <div className="bg-gold-radial">
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
