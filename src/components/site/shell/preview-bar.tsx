"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye } from "lucide-react";

/** Shown to admins previewing unpublished changes. */
export function PreviewBar() {
  const pathname = usePathname();
  return (
    <div
      role="status"
      className="bg-gold text-royal sticky top-0 z-[70] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-center text-sm font-bold"
    >
      <span className="inline-flex items-center gap-2">
        <Eye aria-hidden className="size-4" />
        Preview: you&apos;re seeing unpublished changes
      </span>
      <a
        href={`/api/preview/exit?path=${encodeURIComponent(pathname)}`}
        className="underline underline-offset-2"
      >
        Exit preview
      </a>
      <Link href="/admin/pages" className="underline underline-offset-2">
        Back to admin
      </Link>
    </div>
  );
}
