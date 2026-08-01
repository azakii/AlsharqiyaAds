"use client";

import Link from "next/link";
import { BadgeCheck, ShieldCheck, Eye, MapPin } from "lucide-react";
import { SOCIAL_META } from "./Icons";
import { formatFollowers } from "@/lib/constants";
import { incrementInfluencerStat } from "@/lib/actions";
import type { Influencer } from "@/lib/types";

export default function InfluencerCard({ inf }: { inf: Influencer }) {
  const socials = Object.entries(inf.socials).filter(([, v]) => v);

  return (
    <Link
      href={`/influencer/${inf.slug || inf.id}`}
      className="glass-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl"
    >
      {/* views badge */}
      <div className="glass absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2 py-1 sm:top-4 sm:left-4 sm:px-3 sm:py-1.5">
        <Eye className="h-3 w-3 text-gold" />
        <span className="text-[10px] text-muted sm:text-[11px]">{inf.views.toLocaleString("en")}</span>
      </div>

      {/* verified badge: glow pulse + shimmer sweep — combined icon + "موثّق" label */}
      {inf.verified && (
        <div className="absolute top-2 right-2 z-10 max-w-[62%] sm:top-4 sm:right-4">
          <div className="relative">
            <div className="animate-glow-pulse absolute inset-0 rounded-full bg-gold/40 blur-md" />
            <div className="shimmer-badge relative flex items-center gap-1 rounded-full px-2 py-1 sm:px-2.5 sm:py-1.5">
              <BadgeCheck className="h-3 w-3 flex-shrink-0 text-bg" />
              <span className="truncate text-[9px] font-semibold text-bg sm:text-[10px]">موثّق</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center p-3 pt-12 text-center sm:p-6 sm:pt-14">
        {/* avatar with glow + hover ring */}
        <div className="relative mb-3 h-32 w-32 sm:mb-5 sm:h-28 sm:w-28">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl transition-all duration-500 group-hover:bg-gold/30" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold-light/40 to-gold-dark/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inf.avatar_url || "/avatar-placeholder.svg"}
            alt={inf.name}
            className="relative h-full w-full rounded-full border-2 border-gold/20 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <h3 className="mb-1 text-sm font-bold text-white sm:text-lg">{inf.name}</h3>

        <p className="mb-2 mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted sm:mt-2 sm:text-xs">{inf.bio}</p>

        {inf.has_license && (
          <span className="mb-2 flex items-center gap-0.5 rounded-full border border-gold/20 bg-gold/10 px-1.5 py-0.5 text-[9px] text-gold sm:mb-3 sm:text-[10px]">
            <ShieldCheck className="h-3 w-3" /> موثوق
          </span>
        )}

        <div className="mb-3 mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:mb-5 sm:gap-3 sm:text-xs">
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
                    window.open(url as string, "_blank", "noopener,noreferrer");
                  }}
                  className={`glass flex h-7 w-7 items-center justify-center rounded-full text-muted transition-all hover:scale-110 hover:text-gold sm:h-8 sm:w-8`}
                  aria-label={meta.label}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
              );
            })}
          </div>
        )}

        <span className="mt-auto hidden w-full rounded-lg border border-gold/20 py-2.5 text-sm font-medium text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-bg sm:block">
          عرض الملف الشخصي
        </span>
      </div>
    </Link>
  );
}
