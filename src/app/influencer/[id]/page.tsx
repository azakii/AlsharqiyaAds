import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Eye, MousePointerClick, Megaphone, Users, ArrowLeft } from "lucide-react";
import { SOCIAL_META, Whatsapp } from "@/components/Icons";
import { getInfluencerById, getApprovedInfluencers } from "@/lib/data";
import { formatFollowers } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function InfluencerPage({ params }: { params: { id: string } }) {
  const inf = await getInfluencerById(params.id);
  if (!inf || inf.status !== "approved") notFound();

  const socials = Object.entries(inf.socials).filter(([, v]) => v);
  const wa = inf.socials.whatsapp;

  return (
    <div className="bg-gold-radial">
      <div className="container-max py-14">
        {/* Hero card */}
        <div className="card grid gap-8 p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="mx-auto md:order-3">
            <div className="relative rounded-full bg-gold-gradient p-[3px] shadow-gold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inf.avatar_url || "/avatar-placeholder.svg"}
                alt={inf.name}
                className="h-40 w-40 rounded-full object-cover"
              />
              {inf.verified && (
                <span className="absolute bottom-2 left-2 grid h-8 w-8 place-items-center rounded-full bg-gold-gradient text-black ring-4 ring-bg">
                  <BadgeCheck className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>

          <div className="text-center md:order-2 md:text-right">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <h1 className="font-display text-4xl font-bold gold-text">{inf.name}</h1>
              {inf.verified && (
                <span className="badge-gold">
                  <BadgeCheck className="h-3 w-3" /> موثّق
                </span>
              )}
            </div>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/60 md:mx-0">{inf.bio}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span className="chip"><MapPin className="h-3.5 w-3.5 text-gold" /> {inf.city}</span>
              <span className="chip">{inf.category}</span>
            </div>

            <div className="mt-6 grid max-w-lg grid-cols-4 gap-3 md:mx-0">
              <Metric icon={<Megaphone />} value={String(inf.ad_requests)} label="طلب إعلان" />
              <Metric icon={<MousePointerClick />} value={String(inf.clicks)} label="نقرة" />
              <Metric icon={<Eye />} value={inf.views.toLocaleString("en")} label="مشاهدة" />
              <Metric icon={<Users />} value={formatFollowers(inf.followers)} label="متابع" />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:order-1">
            <Link href="/ad-request" className="btn-gold">
              اطلب إعلان <ArrowLeft className="h-4 w-4" />
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="btn-outline">
                <Whatsapp className="h-4 w-4" /> تواصل عبر واتساب
              </a>
            )}
          </div>
        </div>

        {/* Socials + gallery */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
          <div className="card p-6">
            <h3 className="mb-4 border-r-2 border-gold pr-3 font-display text-lg text-gold">
              المنصات الاجتماعية
            </h3>
            <div className="space-y-2">
              {socials.map(([key, url]) => {
                const meta = SOCIAL_META[key];
                if (!meta) return null;
                const Icon = meta.Icon;
                return (
                  <a
                    key={key}
                    href={url as string}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-line bg-black/30 px-4 py-3 text-sm text-white/80 transition hover:border-gold/40 hover:text-gold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="flex items-center gap-2">
                      {meta.label} <Icon className="h-4 w-4" />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 border-r-2 border-gold pr-3 font-display text-lg text-gold">
              معرض الأعمال
            </h3>
            {inf.gallery.length === 0 ? (
              <div className="card grid h-52 place-items-center text-sm text-white/40">
                لا يوجد أعمال منشورة بعد
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {inf.gallery.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`عمل ${i + 1}`}
                    className="h-48 w-full rounded-2xl border border-line object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/#celebrities" className="text-sm text-white/50 hover:text-gold">
            → العودة لقائمة المؤثرين
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-black/30 p-3 text-center">
      <span className="mx-auto mb-1 flex justify-center text-gold">{icon}</span>
      <div className="font-display text-lg font-bold text-white">{value}</div>
      <div className="text-[11px] text-white/45">{label}</div>
    </div>
  );
}
