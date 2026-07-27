import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldCheck, MapPin, Eye, MousePointerClick, Megaphone, Users, ArrowLeft } from "lucide-react";
import { SOCIAL_META, Whatsapp } from "@/components/Icons";
import TrackedSocialLink from "@/components/TrackedSocialLink";
import { getInfluencerById } from "@/lib/data";
import { incrementInfluencerStat } from "@/lib/actions";
import { formatFollowers } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function InfluencerPage({ params }: { params: { id: string } }) {
  const inf = await getInfluencerById(params.id);
  if (!inf || inf.status !== "approved") notFound();

  // عداد مشاهدات — لا نوقف عرض الصفحة في انتظاره.
  incrementInfluencerStat(inf.id, "views").catch(() => {});

  const socials = Object.entries(inf.socials).filter(([, v]) => v);
  const wa = inf.socials.whatsapp;

  return (
    <div className="bg-gold-radial">
      <div className="container-max py-14">
        {/* Hero card — DOM order avatar → info → buttons; RTL flex-row renders
            avatar on the right, buttons on the left, exactly like the reference. */}
        <div className="glass-card mb-8 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            {/* avatar */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-gold/30 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inf.avatar_url || "/avatar-placeholder.svg"}
                alt={inf.name}
                className="relative h-36 w-36 rounded-full border-4 border-gold/20 object-cover sm:h-44 sm:w-44"
              />
              {inf.verified && (
                <div className="shimmer-badge absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full">
                  <BadgeCheck className="h-5 w-5 text-bg" />
                </div>
              )}
            </div>

            {/* info */}
            <div className="flex-1 text-center lg:text-right">
              {/* شارة "موثّق" (تحكم الإدارة) بقت أيقونة فقط على الصورة الشخصية فوق — هنا جنب
                  الاسم شارة مختلفة: "موثوق" المشتقة من رقم رخصة منصة موثوق (إن وُجد). */}
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{inf.name}</h1>
                {inf.has_license && (
                  <span className="badge-gold">
                    <ShieldCheck className="h-3 w-3" /> موثوق
                  </span>
                )}
              </div>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted lg:mx-0">{inf.bio}</p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="glass flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5 text-gold" /> {inf.city}
                </span>
                <span className="glass rounded-full border border-gold/20 px-3 py-1.5 text-sm text-gold">
                  {inf.category}
                </span>
              </div>

              <div className="mx-auto mt-6 grid max-w-lg grid-cols-4 gap-3 lg:mx-0">
                <Stat icon={<Users />} value={formatFollowers(inf.followers)} label="متابع" />
                <Stat icon={<Eye />} value={inf.views.toLocaleString("en")} label="مشاهدة" />
                <Stat icon={<MousePointerClick />} value={String(inf.clicks)} label="نقرة" />
                <Stat icon={<Megaphone />} value={String(inf.ad_requests)} label="طلب إعلان" />
              </div>
            </div>

            {/* actions */}
            <div className="flex w-full flex-col gap-3 lg:w-auto">
              <Link
                href="/ad-request"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold-dark px-6 py-3.5 text-sm font-semibold text-bg transition-all hover:brightness-105"
              >
                اطلب إعلان <ArrowLeft className="h-4 w-4" />
              </Link>
              {wa && (
                <TrackedSocialLink
                  href={wa}
                  influencerId={inf.id}
                  className="glass flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white/80 transition-all hover:border-gold/40 hover:text-gold"
                >
                  <Whatsapp className="h-4 w-4" /> تواصل عبر واتساب
                </TrackedSocialLink>
              )}
            </div>
          </div>
        </div>

        {/* Socials */}
        {socials.length > 0 && (
          <div className="card mx-auto max-w-lg p-6">
            <h3 className="mb-4 border-r-2 border-gold pr-3 font-display text-lg text-gold">
              المنصات الاجتماعية
            </h3>
            <div className="space-y-2">
              {socials.map(([key, url]) => {
                const meta = SOCIAL_META[key];
                if (!meta) return null;
                const Icon = meta.Icon;
                return (
                  <TrackedSocialLink
                    key={key}
                    href={url as string}
                    influencerId={inf.id}
                    className="flex items-center justify-between rounded-xl border border-line bg-black/30 px-4 py-3 text-sm text-white/80 transition hover:border-gold/40 hover:text-gold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="flex items-center gap-2">
                      {meta.label} <Icon className="h-4 w-4" />
                    </span>
                  </TrackedSocialLink>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/influencers" className="text-sm text-muted hover:text-gold">
            → العودة لقائمة المؤثرين
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="glass rounded-xl p-2 text-center">
      <span className="mx-auto mb-1 flex justify-center text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}
