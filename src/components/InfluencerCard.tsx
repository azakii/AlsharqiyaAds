import Link from "next/link";
import { BadgeCheck, Eye, MapPin } from "lucide-react";
import { SOCIAL_META } from "./Icons";
import { formatFollowers } from "@/lib/constants";
import type { Influencer } from "@/lib/types";

export default function InfluencerCard({ inf }: { inf: Influencer }) {
  const socials = Object.entries(inf.socials).filter(([, v]) => v);

  return (
    <Link
      href={`/influencer/${inf.id}`}
      className="glass-card group relative block cursor-pointer overflow-hidden rounded-2xl"
    >
      {/* views badge */}
      <div className="glass absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5">
        <Eye className="h-3 w-3 text-gold" />
        <span className="text-[11px] text-muted">{inf.views.toLocaleString("en")}</span>
      </div>

      {/* verified badge: glow pulse + shimmer sweep */}
      {inf.verified && (
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <div className="animate-glow-pulse absolute inset-0 rounded-full bg-gold/40 blur-md" />
            <div className="shimmer-badge relative flex h-7 w-7 items-center justify-center rounded-full">
              <BadgeCheck className="h-3.5 w-3.5 text-bg" />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center p-6 pt-12 text-center">
        {/* avatar with glow + hover ring */}
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl transition-all duration-500 group-hover:bg-gold/30" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold-light/40 to-gold-dark/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inf.avatar_url || "/avatar-placeholder.svg"}
            alt={inf.name}
            className="relative h-28 w-28 rounded-full border-2 border-gold/20 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="mb-1 flex items-center justify-center gap-1.5">
          <h3 className="text-lg font-bold text-white">{inf.name}</h3>
        </div>
        {inf.verified && (
          <span className="flex items-center gap-0.5 rounded-full border border-gold/20 bg-gold/10 px-1.5 py-0.5 text-[10px] text-gold">
            <BadgeCheck className="h-3 w-3" /> موثّق
          </span>
        )}

        <p className="mb-3 mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{inf.bio}</p>

        <div className="mb-5 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-muted">
            <MapPin className="h-3 w-3 text-gold" /> {inf.city}
          </span>
          <span className="h-1 w-1 rounded-full bg-line" />
          <span className="flex items-center gap-1 font-semibold text-gold">
            {formatFollowers(inf.followers)} متابع
          </span>
        </div>

        {socials.length > 0 && (
          <div className="mb-5 flex items-center justify-center gap-2">
            {socials.map(([key, url]) => {
              const meta = SOCIAL_META[key];
              if (!meta) return null;
              const Icon = meta.Icon;
              return (
                <span
                  key={key}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(url as string, "_blank", "noopener,noreferrer");
                  }}
                  className={`glass flex h-8 w-8 items-center justify-center rounded-full text-muted transition-all hover:scale-110 hover:text-gold`}
                  aria-label={meta.label}
                >
                  <Icon className="h-4 w-4" />
                </span>
              );
            })}
          </div>
        )}

        <span className="w-full rounded-lg border border-gold/20 py-2.5 text-sm font-medium text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-bg">
          عرض الملف الشخصي
        </span>
      </div>
    </Link>
  );
}
