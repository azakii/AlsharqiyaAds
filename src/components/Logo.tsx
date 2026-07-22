import Link from "next/link";
import { Crown } from "./Icons";
import { SITE } from "@/lib/constants";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <div className="font-display text-lg font-bold gold-text">{SITE.name}</div>
        {!compact && (
          <div className="text-[10px] tracking-[0.2em] text-white/40">{SITE.nameEn}</div>
        )}
      </div>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-gradient text-black shadow-gold">
        <Crown className="h-5 w-5" />
      </span>
    </Link>
  );
}
