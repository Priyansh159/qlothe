"use client";

import { useState } from "react";

/**
 * Product photo with a graceful placeholder: seeded/dev products may point at
 * Cloudinary IDs that don't exist yet, so a broken image falls back to the
 * paper-toned engraving slot from the design.
 */
export function ProductImage({
  src,
  alt,
  label,
  className = "",
}: {
  src: string | null;
  alt: string;
  label?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-paper ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="flex flex-col items-center gap-2 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-10 w-10 object-contain" />
          {label ? (
            <span className="font-mono text-[9px] uppercase tracking-[.14em] text-forest">
              {label}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
