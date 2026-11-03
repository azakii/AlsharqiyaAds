import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, ShieldCheck, MapPin, Users, Tag, Gem, ArrowLeft, ArrowRight } from "lucide-react";
import { SOCIAL_META, Whatsapp, Crown } from "@/components/Icons";
import TrackedSocialLink from "@/components/TrackedSocialLink";
import StructuredData from "@/components/StructuredData";
import { getInfluencerByIdOrSlug } from "@/lib/data";
import { incrementInfluencerStat } from "@/lib/actions";
import { formatFollowers, isSafeUrl } from "@/lib/constants";
import { getSeoForPath, buildMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const inf = await getInfluencerByIdOrSlug(params.id);
  if (!inf || inf.status !== "approved") return {};
  const [seo, settings] = await Promise.all([getSeoForPath(`/influencer/${inf.id}`), getSettings()]);
  return buildMetadata({
    path: `/influencer/${inf.slug || inf.id}`,
    seo,
    settings,
    fallback: { title: `${inf.name} | ${settings.brand_name}`, description: inf.bio, image: inf.avatar_url },
  });
}

export default async function InfluencerPage({ params }: { params: { id: string } }) {
  const inf = await getInfluencerByIdOrSlug(params.id);
  if (!inf || inf.status !== "approved") notFound();

  // لو فُتحت الصفحة بالـ UUID وللمؤثر رابط صديق (slug) محفوظ، نوجّه بشكل دائم للرابط الصديق
  // (يوحّد الرابط الأساسي لمحركات البحث ويمنع ظهور نفس المحتوى تحت رابطين مختلفين).
  // params.id قد يصل مُرمّزاً (خصوصاً السلاق العربي) فنفكّه قبل المقارنة، وإلا نعمل تحويل
  // لا نهائي لأن القيمة المُرمّزة لن تساوي أبداً inf.slug المُخزّن بدون ترميز.
  let decodedId = params.id;
  try {
    decodedId = decodeURIComponent(params.id);
  } catch {
    // قيمة غير قابلة لفك الترميز — نكمل بالقيمة الخام.
  }
  if (inf.slug && decodedId !== inf.slug) {
    // encodeURIComponent إجباري: سلاق عربي خام في هيدر Location يكسر الاستجابة (ERR_INVALID_CHAR).
    redirect(`/influencer/${encodeURIComponent(inf.slug)}`);
  }

  const seo = await getSeoForPath(`/influencer/${inf.id}`);

  // عداد مشاهدات — لا نوقف عرض الصفحة في انتظاره.
  incrementInfluencerStat(inf.id, "views").catch(() => {});

  // يظهر فقط ما أضافه المؤثر فعلاً من روابط (القيم الفارغة أو المسافات تُتجاهل)
  const socials = Object.entries(inf.socials)
    .map(([k, v]) => [k, typeof v === "string" ? v.trim() : ""] as const)
    .filter(([k, v]) => SOCIAL_META[k] && isSafeUrl(v));
  const wa = isSafeUrl(inf.socials.whatsapp) ? inf.socials.whatsapp.trim() : "";
  const vip = inf.plan === "vip";
  const pro = inf.plan === "pro";

  return (
    <div className="bg-gold-radial">
      {seo && <StructuredData blocks={seo.structured_data} />}
      <div className="container-max py-10 sm:py-14">
        <Link href="/influencers" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-gold">
          <ArrowRight className="h-4 w-4" /> العودة لقائمة المؤثرين
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {/* الهوية */}
            <div className={`${vip ? "vip-card" : pro ? "silver-card" : "glass-card"} relative overflow-hidden rounded-3xl p-6 sm:p-8`}>
              {vip && <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gold-radial" />}
              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-start">
                <div className="relative flex-shrink-0">
                  {vip && (
                    <Crown className="absolute -top-7 left-1/2 z-10 h-9 w-9 -translate-x-1/2 text-gold-light drop-shadow-[0_0_10px_rgb(var(--c-gold)/0.8)]" />
                  )}
                  <div className="absolute inset-0 rounded-full bg-gold/30 blur-2xl" />
                  <Avatar
                    src={inf.avatar_url}
                    name={inf.name}
                    textClass="text-5xl"
                    className={`relative h-36 w-36 rounded-full border-4 object-cover sm:h-40 sm:w-40 ${vip ? "border-gold" : pro ? "border-silver" : "border-gold/20"}`}
                  />
                  {vip && (
                    <span className="absolute inset-x-0 -bottom-3 z-10 mx-auto flex w-fit items-center gap-1 rounded-full bg-gold-gradient px-3 py-1 text-xs font-bold text-black shadow-gold">
                      <Crown className="h-3.5 w-3.5" /> عضو ذهبي
                    </span>
                  )}
                  {pro && (
                    <span className="absolute inset-x-0 -bottom-3 z-10 mx-auto flex w-fit items-center gap-1 rounded-full bg-silver-gradient px-3 py-1 text-xs font-bold text-black">
                      <Gem className="h-3.5 w-3.5" /> عضو مميز
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className={`font-display text-3xl font-bold leading-[1.3] sm:text-4xl ${vip ? "gold-text" : pro ? "silver-text" : "text-white"}`}>{inf.name}</h1>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {inf.verified && (
                      <span className="badge-gold"><BadgeCheck className="h-3 w-3" /> ملتزم</span>
                    )}
                    {inf.has_license && (
                      <span className="badge-gold"><ShieldCheck className="h-3 w-3" /> موثوق</span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <Fact icon={<Users />} value={formatFollowers(inf.followers)} label="متابع" />
                    <Fact icon={<MapPin />} value={inf.city} label="المدينة" />
                    <Fact icon={<Tag />} value={inf.category} label="التخصص" />
                  </div>
                </div>
              </div>
            </div>

            {/* نبذة */}
            {inf.bio && (
              <div className="card p-6 sm:p-8">
                <h2 className="mb-3 border-s-2 border-gold ps-3 font-display text-lg text-gold">نبذة</h2>
                <p className="max-w-prose whitespace-pre-line text-sm leading-8 text-white/75">{inf.bio}</p>
              </div>
            )}
          </div>

          {/* الإجراءات والحسابات: تثبت أثناء التمرير على الشاشات الكبيرة */}
          <aside className="space-y-4 self-start lg:sticky lg:top-24">
            <div className="card space-y-3 p-6">
              <h2 className="font-display text-lg text-white">تعاون مع {inf.name}</h2>
              <Link href="/ad-request" className="btn-gold w-full">
                اطلب إعلان <ArrowLeft className="h-4 w-4" />
              </Link>
              {wa && (
                <TrackedSocialLink
                  href={wa}
                  influencerId={inf.id}
                  className="glass flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-gold/40 hover:text-gold"
                >
                  <Whatsapp className="h-4 w-4" /> تواصل عبر واتساب
                </TrackedSocialLink>
              )}
            </div>

            {socials.length > 0 && (
              <div className="card p-6">
                <h2 className="mb-4 border-s-2 border-gold ps-3 font-display text-lg text-gold">المنصات الاجتماعية</h2>
                <div className="grid grid-cols-2 gap-2">
                  {socials.map(([key, url]) => {
                    const { label, Icon } = SOCIAL_META[key];
                    return (
                      <TrackedSocialLink
                        key={key}
                        href={url}
                        influencerId={inf.id}
                        className="flex items-center gap-2 rounded-xl border border-line bg-black/30 px-3 py-3 text-sm text-white/80 transition hover:border-gold/40 hover:text-gold"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-gold" /> {label}
                      </TrackedSocialLink>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="glass min-w-0 rounded-xl p-3 text-center">
      <span className="mx-auto mb-1 flex justify-center text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <div className="truncate text-sm font-bold text-white sm:text-base">{value}</div>
      <div className="text-[11px] text-white/60">{label}</div>
    </div>
  );
}
