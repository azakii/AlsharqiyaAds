import Link from "next/link";
import { ArrowLeft, TrendingUp, MapPin, Users } from "lucide-react";
import { Crown } from "@/components/Icons";
import InfluencerExplorer from "@/components/InfluencerExplorer";
import { getApprovedInfluencers } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { formatFollowers } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [influencers, s] = await Promise.all([getApprovedInfluencers(), getSettings()]);
  const totalFollowers = influencers.reduce((sum, i) => sum + i.followers, 0);
  const cities = new Set(influencers.map((i) => i.city)).size;

  return (
    <>
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

      {/* Explorer */}
      <InfluencerExplorer influencers={influencers} />

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
