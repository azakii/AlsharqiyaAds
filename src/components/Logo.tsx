import Link from "next/link";
import { Crown } from "./Icons";

export default function Logo({
  brandName,
  brandNameEn,
  logoUrl,
  compact = false,
}: {
  brandName: string;
  brandNameEn?: string;
  logoUrl?: string;
  compact?: boolean;
}) {
  return (
    <Link href="/" className="flex items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={brandName} className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-gradient text-black shadow-gold">
          <Crown className="h-5 w-5" />
        </span>
      )}
      <div className="text-right leading-tight">
        <div className="font-display text-lg font-bold gold-text">{brandName}</div>
        {!compact && brandNameEn && (
          <div className="text-[10px] tracking-[0.2em] text-white/40">{brandNameEn}</div>
        )}
      </div>
    </Link>
  );
}
