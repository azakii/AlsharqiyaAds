import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, TrendingUp, MapPin, Users } from "lucide-react";
import { Crown } from "@/components/Icons";
import InfluencerCard from "@/components/InfluencerCard";
import StructuredData from "@/components/StructuredData";
import { getApprovedInfluencers } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { formatFollowers } from "@/lib/constants";

const HOME_PREVIEW_COUNT = 8;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoForPath("/"), getSettings()]);
  return buildMetadata({
    path: "/",
    seo,
    settings,
    fallback: { title: settings.brand_name, description: settings.footer_about, image: settings.hero_image },
  });
}

export default async function HomePage() {
  const [influencers, s, seo] = await Promise.all([getApprovedInfluencers(), getSettings(), getSeoForPath("/")]);
  const totalFollowers = influencers.reduce((sum, i) => sum + i.followers, 0);
  const cities = new Set(influencers.map((i) => i.city)).size;

  return (
    <>
      {seo && <StructuredData blocks={seo.structured_data} />}
      {/* Hero */}
      <section className="relative overflow-hidden">
        {s.hero_image && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.hero_image} alt="" className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/85 to-bg" />
          </div>
        )}

        <div className="container-max relative flex flex-col items-center py-24 text-center">
          <span className="badge-gold">
            <Crown className="h-3.5 w-3.5" /> {s.hero_badge}
          </span>

          <div className="my-6 flex items-center gap-4 text-gold">
            <span className="h-px w-12 bg-gold/40" />
            <Crown className="h-6 w-6" />
            <span className="h-px w-12 bg-gold/40" />
          </div>

          <h1 className="font-display text-6xl font-bold gold-text sm:text-7xl">{s.hero_title}</h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">{s.hero_subtitle}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/#celebrities" className="btn-gold">
              استعرض المشاهير <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/register" className="btn-outline">
              سجّل كمؤثر
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6">
            <Stat icon={<TrendingUp />} value={formatFollowers(totalFollowers)} label="إجمالي المتابعين" />
            <Stat icon={<MapPin />} value={String(cities)} label="مدينة مغطّاة" />
            <Stat icon={<Users />} value={String(influencers.length)} label="مؤثر موثّق" />
          </div>
        </div>
      </section>

      {/* معاينة المؤثرين — أول ٨ فقط (الأحدث تسجيلاً، بترتيب getApprovedInfluencers)، والباقي في صفحة المشاهير الكاملة */}
      <section id="celebrities" className="container-max scroll-mt-24 py-20">
        <div className="text-center">
          <span className="badge-gold mx-auto">نخبة المؤثرين الموثّقين</span>
          <h2 className="mt-4 font-display text-4xl font-bold gold-text">استكشف المؤثرين</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            تصفح نخبة من أفضل المؤثرين في المنطقة الشرقية
          </p>
        </div>

        {influencers.length === 0 ? (
          <p className="mt-10 text-center text-muted">لا يوجد مؤثرون حالياً.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {influencers.slice(0, HOME_PREVIEW_COUNT).map((inf) => (
              <InfluencerCard key={inf.id} inf={inf} />
            ))}
          </div>
        )}

        {influencers.length > HOME_PREVIEW_COUNT && (
          <div className="mt-10 flex justify-center">
            <Link href="/influencers" className="btn-gold">
              شاهد المزيد <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-max py-16">
        <div className="card flex flex-col items-center bg-gold-radial px-6 py-16 text-center">
          <Crown className="h-8 w-8 text-gold" />
          <h2 className="mt-5 font-display text-3xl font-bold gold-text">{s.cta_title}</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/55">{s.cta_text}</p>
          <Link href="/register" className="btn-gold mt-8">
            ابدأ التسجيل الآن <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-gold">{icon}</span>
      <span className="font-display text-3xl font-bold text-white">{value}</span>
      <span className="text-xs text-white/45">{label}</span>
    </div>
  );
}
