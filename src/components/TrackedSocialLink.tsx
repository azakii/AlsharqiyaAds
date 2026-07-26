"use client";

import type { ReactNode } from "react";
import { incrementInfluencerStat } from "@/lib/actions";

/**
 * Thin client wrapper so a plain contact/social link on a server-rendered page
 * (profile page) can bump the influencer's "clicks" counter on click, without
 * turning the whole page into a client component.
 */
export default function TrackedSocialLink({
  href,
  influencerId,
  className,
  children,
}: {
  href: string;
  influencerId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => {
        incrementInfluencerStat(influencerId, "clicks").catch(() => {});
      }}
    >
      {children}
    </a>
  );
}
