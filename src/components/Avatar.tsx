"use client";

import { useState } from "react";

/** Photo, or the first two letters of the name when there is none (or it fails to load). */
export function Avatar({ src, name, className = "", textClass = "text-base" }: {
  src?: string | null;
  name: string;
  className?: string;
  textClass?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} onError={() => setBroken(true)} className={className} />;
  }
  return (
    <div
      role="img"
      aria-label={name}
      className={`${className} flex items-center justify-center bg-white/5 font-bold text-gold ${textClass}`}
    >
      {Array.from(name.trim()).slice(0, 2).join("")}
    </div>
  );
}
