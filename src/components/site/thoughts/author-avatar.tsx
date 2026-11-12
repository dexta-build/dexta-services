"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Round author photo; falls back to initials if there's no photo. */
export function AuthorAvatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "bg-royal text-ice relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials || "D"
      )}
    </span>
  );
}
