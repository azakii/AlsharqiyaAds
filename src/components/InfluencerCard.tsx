"use client";

import Link from "next/link";
import { BadgeCheck, ShieldCheck, Eye, MapPin, Gem } from "lucide-react";
import { SOCIAL_META, Crown } from "./Icons";
import { formatFollowers, isSafeUrl } from "@/lib/constants";
import { incrementInfluencerStat } from "@/lib/actions";
import type { Influencer } from "@/lib/types";
import { Avatar } from "./Avatar";

export default function InfluencerCard({ inf }: { inf: Influencer }) {
  const socials = Object.entries(inf.socials).filter(([k, v]) => SOCIAL_META[k] && isSafeUrl(v));
  const vip = inf.plan === "vip";
  const pro = inf.plan === "pro";

  return (
    <Link
      href={`/influencer/${inf.slug || inf.id}`}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl ${vip ? "vip-card hover:-translate-y-1" : pro ? "silver-card hover:-translate-y-1" : "glass-card"}`}
    >
      {/* views badge */}
      {/* <div className="glass absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2 py-1 sm:top-4 sm:left-4 sm:px-3 sm:py-1.5">
        <Eye className="h-3 w-3 text-gold" />
        <span className="text-[10px] text-muted sm:text-[11px]">{inf.views.toLocaleString("en")}</span>
      </div> */}

      {/* verified badge: glow pulse + shimmer sweep — circular icon-only "ملتزم" mark */}
      {inf.verified && (
        <div className="absolute top-1 right-1 z-10 sm:top-4 sm:right-4" title="ملتزم">
          <div className="relative">
            <div className="animate-glow-pulse absolute inset-0 rounded-full bg-gold/40 blur-md" />
            <div className="shimmer-badge relative flex h-6 w-6 items-center justify-center rounded-full sm:h-9 sm:w-9">
              <BadgeCheck className="h-3 w-3 flex-shrink-0 text-bg sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      )}

      {vip && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gold-radial" />
          <div className="absolute inset-x-0 top-1 z-10 flex justify-center text-gold-light sm:top-3" title="ذهبي">
            <Crown className="h-5 w-5 drop-shadow-[0_0_8px_rgb(var(--c-gold)/0.8)] sm:h-8 sm:w-8" />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col items-center p-2 pt-8 text-center sm:p-6 sm:pt-14">
        {/* avatar with glow + hover ring */}
        <div className={`relative h-16 w-16 sm:h-28 sm:w-28 ${vip || pro ? "mb-6 sm:mb-8" : "mb-3 sm:mb-5"}`}>
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl transition-all duration-500 group-hover:bg-gold/30" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold-light/40 to-gold-dark/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <Avatar
            src={inf.avatar_url}
            name={inf.name}
            textClass="text-xl sm:text-3xl"
            className={`relative h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105 ${vip ? "border-[3px] border-gold" : pro ? "border-2 border-silver" : "border-2 border-gold/20"}`}
          />
          {vip && (
            <span className="absolute inset-x-0 -bottom-3 z-10 mx-auto flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-gold-gradient px-1.5 py-0.5 text-[9px] sm:px-2.5 font-bold text-black shadow-gold sm:text-[11px]">
              <Crown className="h-3 w-3" /> عضو ذهبي
            </span>
          )}
          {pro && (
            <span className="absolute inset-x-0 -bottom-3 z-10 mx-auto flex w-fit items-center gap-1 whitespace-nowrap rounded-full bg-silver-gradient px-1.5 py-0.5 text-[9px] sm:px-2.5 font-bold text-black sm:text-[11px]">
              <Gem className="h-3 w-3" /> عضو مميز
            </span>
          )}
        </div>

        <h3 className={`mb-1 text-xs font-bold sm:text-lg ${vip ? "gold-text" : pro ? "silver-text" : "text-white"}`}>{inf.name}</h3>

        <p className="mb-2 mt-1 line-clamp-2 max-sm:hidden text-[11px] leading-relaxed text-muted sm:mt-2 sm:text-xs">{inf.bio}</p>

        {inf.has_license && (
          <span className="mb-2 flex items-center gap-0.5 rounded-full border border-gold/20 bg-gold/10 px-1.5 py-0.5 text-[9px] text-gold sm:mb-3 sm:text-[10px]">
            <ShieldCheck className="h-3 w-3" /> موثوق
          </span>
        )}

        <div className="mb-3 mt-1 flex flex-wrap items-center justify-center gap-1 text-[10px] sm:mb-5 sm:gap-3 sm:text-xs">
          <span className="flex items-center gap-1 text-muted">
            <MapPin className="h-3 w-3 text-gold" /> {inf.city}
          </span>
          <span className="h-1 w-1 rounded-full bg-line" />
          <span className="flex items-center gap-1 font-semibold text-gold">
            {formatFollowers(inf.followers)} متابع
          </span>
        </div>

        {socials.length > 0 && (
          <div className="mb-3 flex items-center justify-center gap-1.5 sm:mb-5 sm:gap-2">
            {socials.map(([key, url]) => {
              const meta = SOCIAL_META[key];
              if (!meta) return null;
              const Icon = meta.Icon;
              return (
                <span
                  key={key}
                  onClick={(e) => {
                    e.preventDefault();
                    incrementInfluencerStat(inf.id, "clicks").catch(() => {});
                    window.open((url as string).trim(), "_blank", "noopener,noreferrer");
                  }}
                  className={`glass flex h-6 w-6 items-center justify-center rounded-full text-muted transition-all hover:scale-110 hover:text-gold sm:h-8 sm:w-8`}
                  aria-label={meta.label}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              );
            })}
          </div>
        )}

        <span className={`mt-auto hidden w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-300 sm:block ${vip ? "bg-gold-gradient font-bold text-black" : pro ? "border border-silver/40 text-silver-light group-hover:bg-silver group-hover:text-bg" : "border border-gold/20 text-gold group-hover:bg-gold group-hover:text-bg"}`}>
          عرض الملف الشخصي
        </span>
      </div>
    </Link>
  );
}
