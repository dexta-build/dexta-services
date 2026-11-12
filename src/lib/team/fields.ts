import { f, type Fields } from "@/lib/content/fields";
import { liveAddress } from "./addresses";

/**
 * The team member portfolio form, in groups (one per editor tab). Shared
 * by the editor and its actions; safe on server and client. The story is
 * edited with the article editor, outside these specs.
 */

const COLORS = [
  ["", "Automatic"],
  ["lilac", "Lilac"],
  ["mint", "Mint"],
  ["gold", "Gold"],
  ["ice", "Ice blue"],
  ["coral", "Coral"],
  ["stone", "Stone"],
  ["ocean", "Ocean"],
  ["plum", "Plum"],
  ["forest", "Forest"],
].map(([value, label]) => ({ value, label }));

export const SKILL_LEVELS = [
  ["", "No level (just the name)"],
  ["Expert", "Expert"],
  ["Advanced", "Advanced"],
  ["Proficient", "Proficient"],
  ["Intermediate", "Intermediate"],
  ["Beginner", "Beginner"],
].map(([value, label]) => ({ value, label }));

export const SOCIAL_PLATFORMS = [
  ["linkedin", "LinkedIn"],
  ["github", "GitHub"],
  ["x", "X (Twitter)"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["dribbble", "Dribbble"],
  ["behance", "Behance"],
  ["figma", "Figma"],
  ["tiktok", "TikTok"],
  ["website", "Website"],
].map(([value, label]) => ({ value, label }));

export const PROFILE_FIELDS: Fields = {
  photo: f.image("Photo", {
    optional: true,
    hint: "A portrait (4:5) works best. Used on the About page card and the profile.",
  }),
  name: f.text("Full name", { max: 80 }),
  role: f.text("Role", { max: 80, hint: "e.g. Creative Director" }),
  headline: f.text("Headline", {
    max: 160,
    optional: true,
    hint: "One line under the name on the profile.",
  }),
  bio: f.textarea("Short bio", {
    max: 300,
    rows: 3,
    hint: "On the About page team card.",
  }),
  location: f.text("Based in", {
    max: 80,
    optional: true,
    hint: "e.g. Port Harcourt, Nigeria",
  }),
  yearsExperience: f.number("Years of experience", {
    optional: true,
    min: 0,
    max: 70,
  }),
  availability: f.text("Availability", {
    max: 80,
    optional: true,
    hint: "A green badge on the profile, e.g. Open to new projects. Leave empty to hide it.",
  }),
  color: f.select("Colour", COLORS, {
    optional: true,
    hint: "The card and quote colour.",
  }),
  isVisible: f.toggle("Show on the site", {
    description:
      "Hidden people leave the About page and their profile goes offline.",
  }),
};

export const ABOUT_FIELDS: Fields = {
  quote: f.textarea("Quote", {
    max: 300,
    rows: 2,
    optional: true,
    hint: "In their own words, shown in a coloured card.",
  }),
  funFact: f.text("Fun fact", { max: 200, optional: true }),
  expertise: f.strings("Focus areas", {
    max: 12,
    addLabel: "Add a focus area",
    hint: "Also shown on the About page card.",
  }),
  brands: f.strings("Brands they've worked on", {
    max: 20,
    addLabel: "Add a brand",
  }),
};

export const SKILL_FIELDS: Fields = {
  skillGroups: f.list(
    "Skill groups",
    "Group",
    {
      title: f.text("Group name", {
        max: 60,
        hint: "e.g. Design tools, Languages & frameworks",
      }),
      items: f.list(
        "Skills",
        "Skill",
        {
          name: f.text("Skill or tool", { max: 60 }),
          level: f.select("Level", SKILL_LEVELS, {
            optional: true,
            hint: "With a level, a bar shows how strong it is.",
          }),
        },
        { titleKey: "name", max: 30 },
      ),
    },
    { titleKey: "title", max: 10 },
  ),
  languages: f.list(
    "Languages",
    "Language",
    {
      name: f.text("Language", { max: 40 }),
      level: f.text("Level", {
        max: 40,
        optional: true,
        hint: "e.g. Native, Fluent, Professional, Conversational, Basic",
      }),
    },
    { titleKey: "name", max: 12 },
  ),
};

export const HISTORY_FIELDS: Fields = {
  experience: f.list(
    "Experience",
    "Role",
    {
      role: f.text("Role", { max: 100 }),
      company: f.text("Company or organisation", { max: 100 }),
      start: f.text("From", { max: 20, hint: "e.g. 2022 or Mar 2022" }),
      end: f.text("To", {
        max: 20,
        optional: true,
        hint: "Leave empty while it's their current role.",
      }),
      description: f.textarea("What they did", {
        max: 600,
        rows: 3,
        optional: true,
      }),
    },
    { titleKey: "role", max: 20 },
  ),
  education: f.list(
    "Education",
    "Qualification",
    {
      degree: f.text("Qualification", {
        max: 140,
        hint: "e.g. B.Sc. Computer Science",
      }),
      school: f.text("School", { max: 120 }),
      start: f.text("From", { max: 20, optional: true }),
      end: f.text("To", { max: 20, optional: true }),
      note: f.text("Note", {
        max: 120,
        optional: true,
        hint: "e.g. First Class, thesis title",
      }),
    },
    { titleKey: "degree", max: 10 },
  ),
  certifications: f.list(
    "Certifications",
    "Certificate",
    {
      name: f.text("Certificate", { max: 140 }),
      issuer: f.text("Issued by", { max: 100 }),
      year: f.text("Year", { max: 10, optional: true }),
      url: f.url("Proof link", {
        optional: true,
        hint: "A link to verify it, if there is one.",
      }),
    },
    { titleKey: "name", max: 20 },
  ),
};

export const WORK_FIELDS: Fields = {
  projects: f.list(
    "Projects",
    "Project",
    {
      title: f.text("Title", { max: 100 }),
      description: f.textarea("Description", {
        max: 300,
        rows: 2,
        optional: true,
      }),
      image: f.image("Image", { optional: true }),
      url: f.url("Link", {
        optional: true,
        hint: "A page on this site (/works/…) or another website.",
      }),
    },
    { titleKey: "title", max: 12 },
  ),
};

export const CONTACT_FIELDS: Fields = {
  email: f.text("Email", {
    max: 120,
    optional: true,
    hint: "Shown on the profile with a mail link.",
  }),
  cv: f.image("CV", {
    optional: true,
    kinds: ["DOCUMENT"],
    hint: "Upload a PDF to the media library, or paste a link. Adds Download CV buttons.",
  }),
  socials: f.list(
    "Social links",
    "Link",
    {
      platform: f.select("Platform", SOCIAL_PLATFORMS),
      url: f.url("Address"),
    },
    { titleKey: "platform", max: 10 },
  ),
};

/** Edited with its own address field (with live checks), not SectionForm. */
export const ADDRESS_FIELDS: Fields = {
  slug: f.text("Profile address", { max: 60 }),
};

export const TEAM_FIELDS: Fields = {
  ...PROFILE_FIELDS,
  ...ADDRESS_FIELDS,
  ...ABOUT_FIELDS,
  ...SKILL_FIELDS,
  ...HISTORY_FIELDS,
  ...WORK_FIELDS,
  ...CONTACT_FIELDS,
};

export type TeamForm = {
  photo: string;
  name: string;
  role: string;
  slug: string;
  headline: string;
  bio: string;
  location: string;
  yearsExperience: number | null;
  availability: string;
  color: string;
  isVisible: boolean;
  quote: string;
  story: string;
  funFact: string;
  expertise: string[];
  brands: string[];
  skillGroups: { title: string; items: { name: string; level: string }[] }[];
  languages: { name: string; level: string }[];
  experience: {
    role: string;
    company: string;
    start: string;
    end: string;
    description: string;
  }[];
  education: {
    degree: string;
    school: string;
    start: string;
    end: string;
    note: string;
  }[];
  certifications: { name: string; issuer: string; year: string; url: string }[];
  projects: {
    title: string;
    description: string;
    image: string;
    url: string;
  }[];
  email: string;
  cv: string;
  socials: { platform: string; url: string }[];
};

/* ------------------------------------------------------------------ */
/* Stored row ↔ form                                                   */
/* ------------------------------------------------------------------ */

const list = (raw: unknown): unknown[] => {
  if (typeof raw !== "string") return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const s = (v: unknown) =>
  typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
const o = (v: unknown) =>
  (v && typeof v === "object" ? v : {}) as Record<string, unknown>;

/** A stored level (word or 0–100) as one of the editor's words. */
function levelWord(v: unknown): string {
  if (typeof v === "number")
    return v >= 90
      ? "Expert"
      : v >= 78
        ? "Advanced"
        : v >= 68
          ? "Proficient"
          : v >= 45
            ? "Intermediate"
            : "Beginner";
  const w = s(v).toLowerCase();
  return SKILL_LEVELS.find((l) => l.value.toLowerCase() === w)?.value ?? "";
}

function skills(items: unknown[]) {
  return items
    .map((i) =>
      typeof i === "string"
        ? { name: i.trim(), level: "" }
        : { name: s(o(i).name), level: levelWord(o(i).level) },
    )
    .filter((i) => i.name);
}

export type TeamRow = {
  name: string;
  role: string;
  bio: string;
  expertise: string;
  funFact: string;
  imagePublicId: string | null;
  isVisible: boolean;
  slug: string | null;
  headline: string | null;
  location: string | null;
  quote: string | null;
  story: string | null;
  color: string | null;
  email: string | null;
  yearsExperience: number | null;
  availability: string | null;
  cvUrl: string | null;
  tools: string;
  languages: string;
  experience: string;
  education: string;
  certifications: string;
  brands: string;
  socials: string;
  projects: string;
};

export function formFromRow(r: TeamRow): TeamForm {
  const tools = list(r.tools);
  const grouped = tools.filter((t) => Array.isArray(o(t).items));
  return {
    photo: r.imagePublicId ?? "",
    name: r.name,
    role: r.role,
    // The address the site uses now, so it can be seen and changed.
    slug: liveAddress(r.slug, r.name),
    headline: r.headline ?? "",
    bio: r.bio,
    location: r.location ?? "",
    yearsExperience: r.yearsExperience,
    availability: r.availability ?? "",
    color: r.color ?? "",
    isVisible: r.isVisible,
    quote: r.quote ?? "",
    story: r.story ?? "",
    funFact: r.funFact,
    expertise: list(r.expertise).map(s).filter(Boolean),
    brands: list(r.brands).map(s).filter(Boolean),
    skillGroups: grouped.length
      ? grouped.map((g) => ({
          title: s(o(g).group) || s(o(g).title) || "Skills",
          items: skills(o(g).items as unknown[]),
        }))
      : tools.length
        ? [{ title: "Software & tools", items: skills(tools) }]
        : [],
    languages: list(r.languages)
      .map((l) => ({ name: s(o(l).name), level: s(o(l).level) }))
      .filter((l) => l.name),
    experience: list(r.experience).map((e) => ({
      role: s(o(e).role),
      company: s(o(e).company),
      start: s(o(e).start),
      end: s(o(e).end),
      description: s(o(e).description),
    })),
    education: list(r.education).map((e) => ({
      degree: s(o(e).degree),
      school: s(o(e).school),
      start: s(o(e).start),
      end: s(o(e).end),
      note: s(o(e).note),
    })),
    certifications: list(r.certifications).map((c) => ({
      name: s(o(c).name),
      issuer: s(o(c).issuer),
      year: s(o(c).year),
      url: s(o(c).url),
    })),
    projects: list(r.projects).map((p) => ({
      title: s(o(p).title),
      description: s(o(p).description),
      image: s(o(p).image),
      url: s(o(p).url),
    })),
    email: r.email ?? "",
    cv: r.cvUrl ?? "",
    socials: list(r.socials)
      .map((x) => ({ platform: s(o(x).platform), url: s(o(x).url) }))
      .filter((x) => x.url),
  };
}

const nonEmpty = <T extends Record<string, unknown>>(
  items: T[],
  key: keyof T,
) => items.filter((i) => s(i[key]));

/** The form as database columns (JSON lists in the stored shapes). */
export function rowFromForm(d: TeamForm) {
  return {
    name: d.name.trim(),
    role: d.role.trim(),
    bio: d.bio.trim(),
    imagePublicId: d.photo || null,
    headline: d.headline.trim() || null,
    location: d.location.trim() || null,
    yearsExperience: d.yearsExperience ?? null,
    availability: d.availability.trim() || null,
    color: d.color || null,
    isVisible: d.isVisible,
    quote: d.quote.trim() || null,
    story: d.story.trim() || null,
    funFact: d.funFact.trim(),
    expertise: JSON.stringify(d.expertise.map((x) => x.trim()).filter(Boolean)),
    brands: JSON.stringify(d.brands.map((x) => x.trim()).filter(Boolean)),
    tools: JSON.stringify(
      nonEmpty(d.skillGroups, "title")
        .map((g) => ({
          group: g.title.trim(),
          items: nonEmpty(g.items, "name").map((i) =>
            i.level ? { name: i.name.trim(), level: i.level } : i.name.trim(),
          ),
        }))
        .filter((g) => g.items.length),
    ),
    languages: JSON.stringify(
      nonEmpty(d.languages, "name").map((l) => ({
        name: l.name.trim(),
        level: l.level.trim() || null,
      })),
    ),
    experience: JSON.stringify(
      nonEmpty(d.experience, "role").map((e) => ({
        role: e.role.trim(),
        company: e.company.trim(),
        start: e.start.trim(),
        end: e.end.trim() || null,
        description: e.description.trim(),
      })),
    ),
    education: JSON.stringify(
      nonEmpty(d.education, "degree").map((e) => ({
        degree: e.degree.trim(),
        school: e.school.trim(),
        start: e.start.trim() || null,
        end: e.end.trim() || null,
        note: e.note.trim(),
      })),
    ),
    certifications: JSON.stringify(
      nonEmpty(d.certifications, "name").map((c) => ({
        name: c.name.trim(),
        issuer: c.issuer.trim(),
        year: c.year.trim() || null,
        url: c.url.trim() || null,
      })),
    ),
    projects: JSON.stringify(
      nonEmpty(d.projects, "title").map((p) => ({
        title: p.title.trim(),
        description: p.description.trim(),
        image: p.image,
        url: p.url.trim() || null,
      })),
    ),
    email: d.email.trim() || null,
    cvUrl: d.cv.trim() || null,
    socials: JSON.stringify(
      d.socials
        .filter((x) => x.url.trim())
        .map((x) => ({ platform: x.platform, url: x.url.trim() })),
    ),
  };
}

/** How complete a profile is, for the list (sections with content). */
export function profileSections(d: TeamForm) {
  return [
    ["Photo", !!d.photo],
    ["Story", !!d.story.trim()],
    ["Skills", d.skillGroups.some((g) => g.items.length)],
    ["Languages", d.languages.length > 0],
    ["Experience", d.experience.length > 0],
    ["Education", d.education.length > 0 || d.certifications.length > 0],
    ["Projects", d.projects.length > 0],
    ["Contact", !!(d.email || d.cv || d.socials.length)],
  ] as const;
}
