import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { Surface } from "@/components/site/section";
import { ABOUT_TEAM_TAG } from "@/lib/about-cache";
import { imageUrl } from "./media";
import { STOCK, stock } from "./stock-media";
import { presetFor } from "./team-presets";
import { renderArticle } from "./thoughts-data";
import { getWorks } from "./works-data";

/**
 * Team members for the About page carousel and the personal portfolio pages
 * (/team/[slug]), from the AboutTeamMember table. Cached on the admin's
 * team tag; no polling. In development, sample teammates (with complete
 * portfolios, to preview every section) fill in while there are fewer than
 * four people.
 */

const SURFACES: Surface[] = ["lilac", "mint", "gold", "ice", "coral", "stone"];

export type TeamProject = {
  title: string;
  description: string;
  image: string;
  url: string | null;
};

export type TeamSkill = {
  name: string;
  /** Word shown beside the bar, e.g. "Expert". */
  level: string | null;
  /** 0–100 for the bar, or null when no level was given. */
  percent: number | null;
};

export type TeamSkillGroup = {
  title: string;
  items: TeamSkill[];
};

export type TeamLanguage = { name: string; level: string | null };

export type TeamExperience = {
  role: string;
  company: string;
  start: string;
  end: string | null;
  description: string;
};

export type TeamEducation = {
  degree: string;
  school: string;
  start: string | null;
  end: string | null;
  note: string;
};

export type TeamCertification = {
  name: string;
  issuer: string;
  year: string | null;
  url: string | null;
};

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  firstName: string;
  role: string;
  headline: string | null;
  bio: string;
  /** Sanitised HTML for the "About" section. */
  storyHtml: string;
  expertise: string[];
  /** Skills grouped by area, e.g. "Design tools", "System design". */
  skillGroups: TeamSkillGroup[];
  languages: TeamLanguage[];
  experience: TeamExperience[];
  education: TeamEducation[];
  certifications: TeamCertification[];
  brands: string[];
  funFact: string;
  location: string | null;
  quote: string | null;
  email: string | null;
  availability: string | null;
  cvUrl: string | null;
  yearsExperience: number | null;
  portfolioUrl: string | null;
  photo: string | null;
  surface: Surface;
  socials: { platform: string; url: string }[];
  projects: TeamProject[];
  /** True when projects are the studio's work, not this person's own list. */
  projectsFromStudio: boolean;
  /** Development-only sample teammate. */
  sample?: boolean;
  /** Development only: sections filled with role placeholders. */
  placeholders: string[];
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function list(raw: unknown): unknown[] {
  if (typeof raw !== "string") return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const opt = (v: unknown) => str(v) || null;
const obj = (v: unknown) =>
  (v && typeof v === "object" ? v : {}) as Record<string, unknown>;

function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url === "/projects" ? "/works" : url;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:"
      ? u.toString()
      : null;
  } catch {
    return null;
  }
}

const LEVELS: Record<string, number> = {
  expert: 95,
  advanced: 82,
  proficient: 75,
  intermediate: 60,
  beginner: 35,
};

/** One skill: a plain name or { name, level } (word or 0–100). */
function parseSkillList(items: unknown[]): TeamSkill[] {
  return items
    .map((item): TeamSkill | null => {
      if (typeof item === "string") {
        return item.trim()
          ? { name: item.trim(), level: null, percent: null }
          : null;
      }
      const o = obj(item);
      const name = str(o.name);
      if (!name) return null;
      const lv = o.level;
      if (typeof lv === "number") {
        const percent = Math.max(0, Math.min(100, Math.round(lv)));
        const level =
          percent >= 90
            ? "Expert"
            : percent >= 75
              ? "Advanced"
              : percent >= 50
                ? "Intermediate"
                : "Beginner";
        return { name, level, percent };
      }
      const word = str(lv);
      return {
        name,
        level: word || null,
        percent: word ? (LEVELS[word.toLowerCase()] ?? null) : null,
      };
    })
    .filter((s): s is TeamSkill => Boolean(s));
}

/**
 * Skills are stored as groups, [{ group, items }], or as a flat list of
 * tools, which becomes a single "Software & tools" group.
 */
function parseSkillGroups(raw: unknown): TeamSkillGroup[] {
  const items = list(raw);
  const grouped = items.filter(
    (i) => i && typeof i === "object" && Array.isArray(obj(i).items),
  );
  if (grouped.length) {
    return grouped
      .map((g) => {
        const o = obj(g);
        return {
          title: str(o.group) || str(o.title) || "Skills",
          items: parseSkillList(o.items as unknown[]),
        };
      })
      .filter((g) => g.items.length);
  }
  const flat = parseSkillList(items);
  return flat.length ? [{ title: "Software & tools", items: flat }] : [];
}

type Row = {
  id: string;
  name: string;
  role: string;
  bio: string;
  expertise: string;
  funFact: string;
  portfolioUrl: string;
  showPortfolioButton: boolean;
  imagePublicId: string | null;
  slug?: string | null;
  headline?: string | null;
  location?: string | null;
  quote?: string | null;
  story?: string | null;
  color?: string | null;
  email?: string | null;
  yearsExperience?: number | null;
  availability?: string | null;
  cvUrl?: string | null;
  tools?: string;
  languages?: string;
  experience?: string;
  education?: string;
  certifications?: string;
  brands?: string;
  socials?: string;
  projects?: string;
};

const BASE_SELECT = {
  id: true,
  name: true,
  role: true,
  bio: true,
  expertise: true,
  funFact: true,
  portfolioUrl: true,
  showPortfolioButton: true,
  imagePublicId: true,
} as const;

/** Full rows; falls back to the original columns if new ones are missing. */
async function readRows(): Promise<Row[]> {
  const where = { isVisible: true };
  const orderBy = { position: "asc" as const };
  try {
    return await prisma.aboutTeamMember.findMany({ where, orderBy });
  } catch {
    try {
      return await prisma.aboutTeamMember.findMany({
        where,
        orderBy,
        select: BASE_SELECT,
      });
    } catch {
      return [];
    }
  }
}

function isTechnical(role: string) {
  return /tech|engineer|develop|software|product|architect|data/i.test(role);
}

const J = JSON.stringify;

/** Development-only sample teammates with complete portfolios. */
const SAMPLES: (Omit<Row, "id"> & { photo: string })[] = [
  {
    name: "Ada Okafor",
    role: "Senior Brand Designer",
    headline:
      "Brand designer crafting identities that feel unmistakably local and confidently global.",
    bio: "Ada crafts identities and campaigns that feel unmistakably local and confidently global.",
    story:
      "<p>Ada has spent eight years helping Nigerian businesses, schools and non-profits find a visual voice people remember. She leads identity projects at Dexta from first workshop to final brand guide.</p><p>Before Dexta, she designed campaigns for consumer brands in Lagos and taught typography at a design school. She believes the best brands are built on one clear idea, told consistently everywhere.</p>",
    expertise: J([
      "Brand identity",
      "Campaign design",
      "Packaging",
      "Art direction",
    ]),
    funFact: "Collects vintage Nigerian matchbox labels for type inspiration.",
    portfolioUrl: "",
    showPortfolioButton: false,
    imagePublicId: null,
    quote:
      "Good design should feel obvious in hindsight. That's the moment I chase on every project.",
    location: "Lagos, Nigeria",
    email: "ada.sample@dexta.services",
    availability: "Open to new brand projects",
    cvUrl: "#",
    yearsExperience: 8,
    tools: J([
      {
        group: "Design tools",
        items: [
          { name: "Adobe Illustrator", level: "Expert" },
          { name: "Figma", level: "Expert" },
          { name: "Adobe Photoshop", level: "Advanced" },
          { name: "Adobe InDesign", level: "Advanced" },
          { name: "After Effects", level: "Intermediate" },
        ],
      },
      {
        group: "Creative disciplines",
        items: [
          "Brand identity",
          "Typography",
          "Packaging",
          "Art direction",
          "Illustration",
        ],
      },
    ]),
    languages: J([
      { name: "English", level: "Native" },
      { name: "Igbo", level: "Native" },
      { name: "Yoruba", level: "Conversational" },
      { name: "French", level: "Basic" },
    ]),
    experience: J([
      {
        role: "Senior Brand Designer",
        company: "Dexta Synergy Services",
        start: "2022",
        end: null,
        description:
          "Leads identity and campaign projects for schools, businesses and events.",
      },
      {
        role: "Brand Designer",
        company: "Lagos creative agency",
        start: "2019",
        end: "2022",
        description:
          "Designed campaigns and packaging for FMCG and fintech brands.",
      },
      {
        role: "Junior Designer",
        company: "Independent studio",
        start: "2017",
        end: "2019",
        description: "Logos, print collateral and social media design.",
      },
    ]),
    education: J([
      {
        degree: "B.A. Fine and Applied Arts (Graphic Design)",
        school: "University of Nigeria, Nsukka",
        start: "2012",
        end: "2016",
        note: "Second Class Upper",
      },
    ]),
    certifications: J([
      {
        name: "Google UX Design Certificate",
        issuer: "Google",
        year: "2021",
        url: null,
      },
      {
        name: "Adobe Certified Professional: Illustrator",
        issuer: "Adobe",
        year: "2020",
        url: null,
      },
    ]),
    brands: J(["BookPrinta", "City International School", "PNEUMA Academy"]),
    socials: J([
      { platform: "linkedin", url: "https://www.linkedin.com" },
      { platform: "behance", url: "https://www.behance.net" },
      { platform: "instagram", url: "https://www.instagram.com" },
      { platform: "dribbble", url: "https://dribbble.com" },
    ]),
    photo: stock(STOCK.womanPortraitB, 900, 1200),
  },
  {
    name: "Tobi Adeyemi",
    role: "Full-stack Developer",
    headline:
      "Full-stack developer turning messy processes into fast, simple tools.",
    bio: "Tobi builds fast, reliable web apps and loves turning messy processes into simple tools.",
    expertise: J(["Web apps", "APIs", "Performance", "Databases"]),
    funFact: "Has shipped code from a danfo bus more than once.",
    portfolioUrl: "",
    showPortfolioButton: false,
    imagePublicId: null,
    location: "Port Harcourt, Nigeria",
    availability: "Available for web and app projects",
    yearsExperience: 6,
    tools: J([
      {
        group: "Languages & frameworks",
        items: [
          { name: "TypeScript", level: 95 },
          { name: "React & Next.js", level: 92 },
          { name: "Node.js", level: 85 },
          { name: "Flutter", level: 60 },
        ],
      },
      {
        group: "System design & architecture",
        items: ["REST APIs", "Multi-tenant SaaS", "Database design", "Caching"],
      },
      {
        group: "Cloud, data & DevOps",
        items: [
          { name: "PostgreSQL", level: 85 },
          { name: "Docker", level: 75 },
          { name: "Vercel & AWS", level: 70 },
        ],
      },
    ]),
    languages: J([
      { name: "English", level: "Fluent" },
      { name: "Yoruba", level: "Native" },
    ]),
    experience: J([
      {
        role: "Full-stack Developer",
        company: "Dexta Synergy Services",
        start: "2021",
        end: null,
        description:
          "Builds DX-SchoolPortal features, client websites and internal tools.",
      },
      {
        role: "Frontend Developer",
        company: "Fintech startup",
        start: "2019",
        end: "2021",
        description:
          "Built dashboards and onboarding flows used by 50k+ customers.",
      },
    ]),
    education: J([
      {
        degree: "B.Eng. Computer Engineering",
        school: "University of Port Harcourt",
        start: "2013",
        end: "2018",
        note: "",
      },
    ]),
    certifications: J([
      {
        name: "AWS Certified Cloud Practitioner",
        issuer: "Amazon Web Services",
        year: "2023",
        url: null,
      },
    ]),
    socials: J([
      { platform: "github", url: "https://github.com" },
      { platform: "linkedin", url: "https://www.linkedin.com" },
      { platform: "x", url: "https://x.com" },
    ]),
    photo: stock(STOCK.manPortraitB, 900, 1200),
  },
  {
    name: "Ngozi Eze",
    role: "Print Production Lead",
    bio: "Ngozi makes sure every invitation, banner and brochure looks as good in hand as on screen.",
    expertise: J(["Print production", "Finishes", "Colour management"]),
    funFact: "Can name a paper stock just by touching it.",
    portfolioUrl: "",
    showPortfolioButton: false,
    imagePublicId: null,
    location: "Port Harcourt, Nigeria",
    photo: stock(STOCK.womanPortraitD, 900, 1200),
  },
];

async function loadTeam(): Promise<TeamMember[]> {
  const [rows, works] = await Promise.all([
    readRows(),
    getWorks().catch(() => []),
  ]);

  const dev = process.env.NODE_ENV !== "production";
  const all: (Row & { photo?: string; sample?: boolean })[] = [
    ...rows,
    ...(dev && rows.length < 4
      ? SAMPLES.slice(0, 4 - rows.length).map((s, i) => ({
          ...s,
          id: `sample-${i}`,
          sample: true,
        }))
      : []),
  ];

  const used = new Set<string>();
  return all.map((original, i) => {
    // Development preview: fill empty portfolio fields from role presets.
    const placeholders: string[] = [];
    const r = { ...original };
    if (dev && !original.sample) {
      const preset = presetFor(r.role);
      const empty = (v: unknown) => list(v).length === 0;
      if (empty(r.tools) && preset.tools !== "[]") {
        r.tools = preset.tools;
        placeholders.push("Skills");
      }
      if (empty(r.languages)) {
        r.languages = preset.languages;
        placeholders.push("Languages");
      }
      if (empty(r.experience) && preset.experience !== "[]") {
        r.experience = preset.experience;
        placeholders.push("Experience");
      }
      if (empty(r.education) && preset.education !== "[]") {
        r.education = preset.education;
        placeholders.push("Education");
      }
      if (empty(r.certifications) && preset.certifications !== "[]") {
        r.certifications = preset.certifications;
        placeholders.push("Certifications");
      }
      if (empty(r.socials)) {
        r.socials = preset.socials;
        placeholders.push("Social links");
      }
      if (!r.availability && preset.availability) {
        r.availability = preset.availability;
      }
    }

    let slug = r.slug || toSlug(r.name) || `member-${i}`;
    while (used.has(slug)) slug = `${slug}-${i}`;
    used.add(slug);

    const ownProjects = list(r.projects)
      .map(obj)
      .filter((p) => str(p.title) && str(p.image))
      .map((p) => ({
        title: str(p.title),
        description: str(p.description),
        image: imageUrl(str(p.image), 1200),
        url: safeUrl(opt(p.url)),
      }));
    const pillar = isTechnical(r.role) ? "BUILD" : "DESIGN";
    const studioProjects = works
      .filter((w) => w.pillar === pillar)
      .concat(works.filter((w) => w.pillar !== pillar))
      .slice(0, 4)
      .map((w) => ({
        title: w.title,
        description: w.description,
        image:
          w.media[0]?.kind === "video"
            ? (w.media[0].poster ?? stock(STOCK.teamCafe, 1200))
            : (w.media[0]?.src ?? stock(STOCK.teamCafe, 1200)),
        url: `/works/${w.slug}`,
      }));

    const story = r.story?.trim() || `<p>${r.bio}</p>`;
    return {
      id: r.id,
      slug,
      name: r.name,
      firstName: r.name.split(/\s+/)[0] ?? r.name,
      role: r.role,
      headline: opt(r.headline),
      bio: r.bio,
      storyHtml: renderArticle(story).html,
      expertise: list(r.expertise).map(str).filter(Boolean),
      skillGroups: parseSkillGroups(r.tools),
      languages: list(r.languages)
        .map((l) =>
          typeof l === "string"
            ? { name: l.trim(), level: null }
            : { name: str(obj(l).name), level: opt(obj(l).level) },
        )
        .filter((l) => l.name),
      experience: list(r.experience)
        .map(obj)
        .filter((e) => str(e.role))
        .map((e) => ({
          role: str(e.role),
          company: str(e.company),
          start: str(e.start),
          end: opt(e.end),
          description: str(e.description),
        })),
      education: list(r.education)
        .map(obj)
        .filter((e) => str(e.degree))
        .map((e) => ({
          degree: str(e.degree),
          school: str(e.school),
          start: opt(e.start),
          end: opt(e.end),
          note: str(e.note),
        })),
      certifications: list(r.certifications)
        .map(obj)
        .filter((c) => str(c.name))
        .map((c) => ({
          name: str(c.name),
          issuer: str(c.issuer),
          year: opt(c.year),
          url: safeUrl(opt(c.url)),
        })),
      brands: list(r.brands).map(str).filter(Boolean),
      funFact: r.funFact,
      location: opt(r.location),
      quote: opt(r.quote),
      email: opt(r.email),
      availability: opt(r.availability),
      cvUrl: r.cvUrl === "#" ? "#" : safeUrl(r.cvUrl),
      yearsExperience: r.yearsExperience ?? null,
      portfolioUrl: r.showPortfolioButton ? safeUrl(r.portfolioUrl) : null,
      photo:
        r.photo ??
        (r.imagePublicId ? imageUrl(r.imagePublicId, 900, 1200) : null),
      surface: SURFACES.includes(r.color as Surface)
        ? (r.color as Surface)
        : SURFACES[i % SURFACES.length],
      socials: list(r.socials)
        .map(obj)
        .map((s) => ({
          platform: str(s.platform).toLowerCase(),
          url: safeUrl(opt(s.url)) ?? "",
        }))
        .filter((s) => s.platform && s.url),
      projects: ownProjects.length ? ownProjects : studioProjects,
      projectsFromStudio: ownProjects.length === 0,
      sample: r.sample,
      placeholders,
    };
  });
}

const loadTeamCached = unstable_cache(loadTeam, ["site-team-v2"], {
  revalidate: false,
  tags: [ABOUT_TEAM_TAG, "portfolio-content"],
});

export async function getTeam(): Promise<TeamMember[]> {
  return process.env.NODE_ENV === "development" ? loadTeam() : loadTeamCached();
}

export async function getTeamMember(slug: string) {
  const team = await getTeam();
  const index = team.findIndex((m) => m.slug === slug);
  if (index < 0) return null;
  return {
    member: team[index],
    others: [...team.slice(index + 1), ...team.slice(0, index)],
  };
}
