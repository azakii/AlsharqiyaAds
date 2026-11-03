import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, TrendingUp, MapPin, Users, Megaphone } from "lucide-react";
import { Crown } from "@/components/Icons";
import InfluencerCard from "@/components/InfluencerCard";
import StructuredData from "@/components/StructuredData";
import { getApprovedInfluencers } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { formatFollowers } from "@/lib/constants";

const HOME_PREVIEW_COUNT = 12;

const STEPS = ["تصفّح المؤثرين وحدّد من يناسب جمهورك", "أرسل طلب إعلانك بالتفاصيل والميزانية", "نراجع طلبك ونتواصل معك"];

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
            <img src={s.hero_image} alt="" fetchPriority="high" decoding="async" className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/85 to-bg" />
          </div>
        )}

        <div className="container-max relative flex flex-col items-center py-24 text-center">
          {/* شعار التاج داخل حلقات ذهبية متداخلة (CSS فقط، بدون صور) */}
          <div aria-hidden className="animate-glow-pulse relative grid h-28 w-28 place-items-center rounded-full border border-gold/30">
            <span className="absolute -inset-4 rounded-full border border-gold/15" />
            <span className="absolute -inset-9 rounded-full border border-gold/[0.07]" />
            <Crown className="h-10 w-10 text-gold-light" />
          </div>

          <span className="badge-gold mt-12">{s.hero_badge}</span>

          <h1 className="mt-6 font-display text-6xl font-bold leading-[1.3] gold-text sm:text-7xl sm:leading-[1.3]">{s.hero_title}</h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">{s.hero_subtitle}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/influencers" className="btn-gold">
              استعرض المشاهير <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/register" className="btn-outline">
              سجّل كمؤثر
            </Link>
          </div>
        </div>

        <div className="container-max relative pb-10">
          <div className="glass grid grid-cols-3 rounded-2xl py-6 [&>*+*]:border-s [&>*+*]:border-white/10">
            <Stat icon={<TrendingUp />} value={formatFollowers(totalFollowers)} label="إجمالي المتابعين" />
            <Stat icon={<MapPin />} value={String(cities)} label="مدينة مغطّاة" />
            <Stat icon={<Users />} value={String(influencers.length)} label="مؤثر" />
          </div>
        </div>
      </section>

      {/* كل المؤثرين في قائمة واحدة، مرتّبة: ذهبي ثم مميّز ثم ملتزم ثم الأحدث (ترتيب getApprovedInfluencers) */}
      <section id="celebrities" className="container-max scroll-mt-24 pt-20">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold gold-text">اكتشف المؤثرين</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">تصفح نخبة من أفضل المؤثرين في المملكة</p>
        </div>

        {influencers.length === 0 ? (
          <p className="mt-10 text-center text-muted">لا يوجد مؤثرون حالياً.</p>
        ) : (
          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* كيف تبدأ حملتك: تسلسل حقيقي فالترقيم مقصود */}
      <section className="container-max pt-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-white">كيف تبدأ حملتك؟</h2>
        </div>
        <ol className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {STEPS.map((t, n) => (
            <li key={t} className="glass flex items-center gap-4 rounded-xl p-4">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-gold/40 font-display text-gold">{n + 1}</span>
              <span className="text-sm leading-6 text-white/75">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* مسارين: معلن / مؤثر */}
      <section className="container-max grid gap-6 py-16 md:grid-cols-2">
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Megaphone className="h-8 w-8 text-gold" />
          <h2 className="mt-5 font-display text-2xl font-bold text-white">عندك نشاط تجاري؟</h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/60">اختر المؤثر المناسب لجمهورك وأرسل طلب إعلانك.</p>
          <Link href="/ad-request" className="btn-gold mt-7">
            اطلب إعلان <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="card flex flex-col items-center bg-gold-radial px-6 py-14 text-center">
          <Crown className="h-8 w-8 text-gold" />
          <h2 className="mt-5 font-display text-2xl font-bold gold-text">{s.cta_title}</h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/60">{s.cta_text}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-gold">ابدأ التسجيل الآن</Link>
            <Link href="/pricing" className="btn-outline">باقات المؤثرين</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-gold">{icon}</span>
      <span className="font-display text-2xl font-bold text-white sm:text-3xl">{value}</span>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  );
}
