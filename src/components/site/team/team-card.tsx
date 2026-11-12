import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/site/team-data";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Portrait for a team member. Without a photo, a large serif monogram on
 * the person's colour stands in, so the card never looks broken.
 */
export function TeamPortrait({
  member,
  sizes,
  priority,
  className,
}: {
  member: Pick<TeamMember, "name" | "photo" | "surface">;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span
      data-surface={member.surface}
      className={cn("bg-surface relative block overflow-hidden", className)}
    >
      {member.photo ? (
        <Image
          src={member.photo}
          alt={member.name}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover object-top"
        />
      ) : (
        <span
          aria-hidden
          className="text-surface-accent absolute inset-0 flex items-center justify-center"
        >
          <span className="absolute -top-1/4 -right-1/4 size-[90%] rounded-full bg-white/35" />
          <span className="absolute -bottom-1/3 -left-1/4 size-[80%] rounded-full bg-white/25" />
          <span className="relative font-[family-name:var(--font-accent)] text-[7rem] leading-none italic md:text-[8rem]">
            {initials(member.name)}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Tall team card like Superside's: portrait on top, the name in serif on a
 * coloured band below. Opens the person's portfolio page.
 */
export function TeamCard({
  member,
  priority,
}: {
  member: TeamMember;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/${member.slug}`}
      data-cursor="Meet"
      className="group flex h-full flex-col overflow-hidden rounded-[10px]"
    >
      <span className="relative block aspect-[4/5] overflow-hidden">
        <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
          <TeamPortrait
            member={member}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 32vw, 75vw"
            priority={priority}
            className="h-full w-full"
          />
        </span>
        {member.sample && (
          <span className="bg-royal/75 text-ice absolute top-3 left-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold">
            Sample
          </span>
        )}
      </span>
      <span
        data-surface={member.surface}
        className="bg-surface text-surface-fg flex flex-1 items-end justify-between gap-3 px-5 py-4"
      >
        <span className="flex flex-col gap-1">
          <span className="font-[family-name:var(--font-accent)] text-2xl leading-tight md:text-[1.75rem]">
            {member.name}
          </span>
          <span className="text-surface-muted text-sm">{member.role}</span>
        </span>
        <ArrowUpRight
          aria-hidden
          className="mb-1 size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </Link>
  );
}
