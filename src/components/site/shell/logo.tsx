import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Blue wordmark on light surfaces, white on dark ones. */
export function Logo({
  tone,
  className,
  priority = false,
  onClick,
}: {
  tone: "light" | "dark";
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/"
      aria-label="Dexta, home"
      onClick={onClick}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src={tone === "dark" ? "/images/dexta1.png" : "/images/dexta.png"}
        alt="Dexta"
        width={425}
        height={134}
        priority={priority}
        sizes="140px"
        className="h-7 w-auto xl:h-8"
      />
    </Link>
  );
}
