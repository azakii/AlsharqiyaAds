import Link from "next/link";
import { BadgeCheck, MapPin, Eye } from "lucide-react";
import { SOCIAL_META } from "./Icons";
import { formatFollowers } from "@/lib/constants";
import type { Influencer } from "@/lib/types";

export default function InfluencerCard({ inf }: { inf: Influencer }) {
  const socials = Object.entries(inf.socials).filter(([, v]) => v);

  return (
    <div className="card group relative flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs text-white/50">
          <Eye className="h-3.5 w-3.5" /> {inf.views.toLocaleString("en")}
        </span>
        {inf.verified && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-gradient text-black">
            <BadgeCheck className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-gold-gradient p-[2px] shadow-gold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inf.avatar_url || "/avatar-placeholder.svg"}
            alt={inf.name}
            className="h-24 w-24 rounded-full object-cover"
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <h3 className="font-display text-lg font-bold text-white">{inf.name}</h3>
        </div>
        {inf.verified && (
          <span className="badge-gold mt-1">
            <BadgeCheck className="h-3 w-3" /> موثّق
          </span>
        )}

        <p className="mt-3 line-clamp-2 text-xs leading-6 text-white/50">{inf.bio}</p>

        <div className="mt-4 flex items-center gap-3 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-gold" /> {inf.city}
          </span>
          <span className="text-gold">•</span>
          <span className="font-semibold text-white">{formatFollowers(inf.followers)} متابع</span>
        </div>
      </div>

      {socials.length > 0 && (
        <div className="mt-4 flex justify-center gap-2 border-t border-line/50 pt-4">
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
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-gold/15 hover:text-gold"
                aria-label={meta.label}
              >
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      )}

      <Link
        href={`/influencer/${inf.id}`}
        className="mt-4 block rounded-full border border-line py-2.5 text-center text-sm text-white/80 transition hover:border-gold/50 hover:text-gold"
      >
        عرض الملف الشخصي
      </Link>
    </div>
  );
}
