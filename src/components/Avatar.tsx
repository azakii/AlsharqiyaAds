"use client";

import { useEffect, useRef, useState } from "react";
import { isDeadImage } from "@/lib/constants";

const LOAD_TIMEOUT_MS = 2000;

/** Photo, or the first two letters of the name when there is none (or it fails to load). */
export function Avatar({ src: rawSrc, name, className = "", textClass = "text-base" }: {
  src?: string | null;
  name: string;
  className?: string;
  textClass?: string;
}) {
  const src = isDeadImage(rawSrc) ? null : rawSrc;
  const [broken, setBroken] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Fall back to initials if the photo hasn't loaded within 2s (also covers a cached image that finished before hydration).
  useEffect(() => {
    if (!src || ref.current?.complete) return;
    const t = setTimeout(() => {
      if (!ref.current?.complete) setBroken(true);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [src]);

  if (src && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img ref={ref} src={src} alt={name} decoding="async" onError={() => setBroken(true)} className={className} />;
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
