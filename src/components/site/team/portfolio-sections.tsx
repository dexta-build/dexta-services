import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Cloud,
  Code2,
  Compass,
  GraduationCap,
  Languages as LanguagesIcon,
  Network,
  Palette,
  PenTool,
  Printer,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, RevealGroup, RevealItem } from "../reveal";
import type {
  TeamCertification,
  TeamEducation,
  TeamExperience,
  TeamLanguage,
  TeamSkill,
  TeamSkillGroup,
} from "@/lib/site/team-data";

/* ---------------- skills ---------------- */

/** Software and tools, each with a proficiency bar when a level is set. */
export function SkillBars({ skills }: { skills: TeamSkill[] }) {
  const withBars = skills.some((s) => s.percent !== null);
  if (!withBars) {
    return (
      <ul className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <li
            key={s.name}
            className="border-surface-fg/20 rounded-full border bg-white px-4 py-2 text-sm font-bold"
          >
            {s.name}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <RevealGroup className="flex flex-col gap-5">
      {skills.map((s) => (
        <RevealItem key={s.name}>
          <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
            <span className="font-bold">{s.name}</span>
            {s.level && <span className="text-surface-muted">{s.level}</span>}
          </div>
          <div className="bg-surface-fg/10 h-2 overflow-hidden rounded-full">
            <div
              className="from-brand to-brand-cyan h-full rounded-full bg-gradient-to-r"
              style={{ width: `${s.percent ?? 50}%` }}
            />
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/* ---------------- languages ---------------- */

const LANGUAGE_DOTS: Record<string, number> = {
  native: 5,
  bilingual: 5,
  fluent: 4,
  professional: 4,
  advanced: 4,
  conversational: 3,
  intermediate: 3,
  basic: 2,
  elementary: 2,
  beginner: 1,
};

/** Spoken languages with a five-dot proficiency scale. */
export function LanguageList({ languages }: { languages: TeamLanguage[] }) {
  return (
    <ul className="flex flex-col">
      {languages.map((l) => {
        const dots = l.level
          ? (LANGUAGE_DOTS[l.level.toLowerCase()] ?? 3)
          : null;
        return (
          <li
            key={l.name}
            className="border-surface-rule flex items-center justify-between gap-4 border-b py-4 first:pt-0"
          >
            <span>
              <span className="block font-bold">{l.name}</span>
              {l.level && (
                <span className="text-surface-muted text-sm">{l.level}</span>
              )}
            </span>
            {dots !== null && (
              <span
                className="flex gap-1.5"
                role="img"
                aria-label={`${dots} out of 5`}
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <span
                    key={d}
                    className={cn(
                      "size-2.5 rounded-full",
                      d <= dots ? "bg-brand" : "bg-surface-fg/15",
                    )}
                  />
                ))}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- experience ---------------- */

/** Work history as a vertical timeline, newest first. */
export function ExperienceTimeline({ items }: { items: TeamExperience[] }) {
  return (
    <ol className="border-surface-rule relative ml-2 border-l">
      {items.map((e, i) => (
        <li
          key={`${e.role}-${e.company}-${i}`}
          className="relative pb-10 pl-8 last:pb-0"
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-1.5 -left-[7px] size-3.5 rounded-full border-2 border-white",
              e.end
                ? "bg-surface-fg/30"
                : "bg-brand-cyan ring-brand-cyan/30 ring-4",
            )}
          />
          <Reveal>
            <p className="text-eyebrow text-surface-muted">
              {e.start}
              {" – "}
              {e.end ?? "Present"}
            </p>
            <h3 className="text-h3 mt-2">{e.role}</h3>
            {e.company && (
              <p className="text-brand mt-1 font-bold">{e.company}</p>
            )}
            {e.description && (
              <p className="text-surface-muted mt-3 max-w-2xl leading-relaxed">
                {e.description}
              </p>
            )}
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/* ---------------- education & certifications ---------------- */

export function EducationList({ items }: { items: TeamEducation[] }) {
  return (
    <RevealGroup className="flex flex-col gap-4">
      {items.map((e) => (
        <RevealItem
          key={`${e.degree}-${e.school}`}
          className="flex gap-4 rounded-[10px] bg-white p-5 ring-1 ring-black/5 md:p-6"
        >
          <span className="bg-ice text-brand inline-flex size-11 shrink-0 items-center justify-center rounded-full">
            <GraduationCap aria-hidden className="size-5" />
          </span>
          <div>
            <h3 className="font-bold leading-snug">{e.degree}</h3>
            {e.school && <p className="mt-1 text-sm">{e.school}</p>}
            <p className="text-surface-muted mt-1 text-sm">
              {[
                e.start && e.end ? `${e.start} – ${e.end}` : (e.end ?? e.start),
                e.note,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export function CertificationList({ items }: { items: TeamCertification[] }) {
  return (
    <RevealGroup className="flex flex-col gap-4">
      {items.map((c) => {
        const body = (
          <>
            <span className="bg-mint-soft text-mint-deep inline-flex size-11 shrink-0 items-center justify-center rounded-full">
              <BadgeCheck aria-hidden className="size-5" />
            </span>
            <div className="flex-1">
              <h3 className="font-bold leading-snug">{c.name}</h3>
              <p className="text-surface-muted mt-1 text-sm">
                {[c.issuer, c.year].filter(Boolean).join(" · ")}
              </p>
            </div>
            {c.url && (
              <ArrowUpRight aria-hidden className="mt-1 size-4 shrink-0" />
            )}
          </>
        );
        return (
          <RevealItem key={`${c.name}-${c.issuer}`}>
            {c.url ? (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 rounded-[10px] bg-white p-5 ring-1 ring-black/5 transition-shadow hover:shadow-md md:p-6"
              >
                {body}
              </a>
            ) : (
              <div className="flex gap-4 rounded-[10px] bg-white p-5 ring-1 ring-black/5 md:p-6">
                {body}
              </div>
            )}
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}

/** Small label used above each portfolio sub-list. */
export function SubHeading({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="text-eyebrow text-surface-muted mb-6 flex items-center gap-2">
      {icon ?? <Award aria-hidden className="size-4" />}
      {children}
    </h3>
  );
}

/* ---------------- skill groups ---------------- */

const GROUP_ICONS: [RegExp, LucideIcon][] = [
  [/architect|system design/i, Network],
  [/language|framework|stack|code/i, Code2],
  [/cloud|devops|data|infra/i, Cloud],
  [/practice|quality|security/i, ShieldCheck],
  [/discipline|creative|craft/i, Palette],
  [/strategy|leadership|management/i, Compass],
  [/print|production/i, Printer],
  [/tool|software|design/i, PenTool],
];

const GROUP_SURFACES = ["ice", "lilac", "mint", "gold", "coral", "stone"];

function groupIcon(title: string): LucideIcon {
  return GROUP_ICONS.find(([re]) => re.test(title))?.[1] ?? Sparkles;
}

/**
 * One area of skills ("Design tools", "System design & architecture"…):
 * skills with a level get a proficiency bar, the rest show as tags.
 */
export function SkillGroupCard({
  group,
  index,
}: {
  group: TeamSkillGroup;
  index: number;
}) {
  const Icon = groupIcon(group.title);
  const bars = group.items.filter((s) => s.percent !== null);
  const tags = group.items.filter((s) => s.percent === null);
  return (
    <RevealItem className="flex h-full flex-col gap-6 rounded-[10px] bg-white p-6 ring-1 ring-black/5 md:p-7">
      <div className="flex items-center gap-3">
        <span
          data-surface={GROUP_SURFACES[index % GROUP_SURFACES.length]}
          className="bg-surface text-surface-accent inline-flex size-11 shrink-0 items-center justify-center rounded-[10px]"
        >
          <Icon aria-hidden className="size-5" />
        </span>
        <h3 className="text-lg leading-snug font-bold">{group.title}</h3>
      </div>
      {bars.length > 0 && (
        <div className="flex flex-col gap-4">
          {bars.map((s) => (
            <div key={s.name}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                <span className="font-bold">{s.name}</span>
                {s.level && (
                  <span className="text-surface-muted text-xs">{s.level}</span>
                )}
              </div>
              <div className="bg-surface-fg/10 h-1.5 overflow-hidden rounded-full">
                <div
                  className="from-brand to-brand-cyan h-full rounded-full bg-gradient-to-r"
                  style={{ width: `${s.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((s) => (
            <li
              key={s.name}
              className="bg-canvas border-surface-fg/10 rounded-full border px-3.5 py-1.5 text-sm"
            >
              {s.name}
              {s.level && (
                <span className="text-surface-muted"> · {s.level}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </RevealItem>
  );
}

/** Spoken languages as a card that sits alongside the skill groups. */
export function LanguagesCard({ languages }: { languages: TeamLanguage[] }) {
  return (
    <RevealItem className="flex h-full flex-col gap-6 rounded-[10px] bg-white p-6 ring-1 ring-black/5 md:p-7">
      <div className="flex items-center gap-3">
        <span
          data-surface="forest"
          className="bg-surface text-surface-fg inline-flex size-11 shrink-0 items-center justify-center rounded-[10px]"
        >
          <LanguagesIcon aria-hidden className="size-5" />
        </span>
        <h3 className="text-lg leading-snug font-bold">Languages</h3>
      </div>
      <LanguageList languages={languages} />
    </RevealItem>
  );
}
