/**
 * DEVELOPMENT-ONLY placeholder portfolio details, chosen by role, so a
 * profile can be previewed before it's completed in the admin. Each value
 * is stored in the same JSON shape the admin will save. Never used in
 * production: real profiles only ever show what's entered for them.
 */

const J = JSON.stringify;

export type RolePreset = {
  tools: string;
  languages: string;
  experience: string;
  education: string;
  certifications: string;
  socials: string;
  availability: string;
};

type Kind = "creative" | "engineering" | "print" | "general";

export function roleKind(role: string): Kind {
  if (
    /engineer|develop|software|technical|tech lead|architect|devops|data/i.test(
      role,
    )
  )
    return "engineering";
  if (/print|production/i.test(role)) return "print";
  if (/design|creative|brand|art|illustrat|motion|ux|ui/i.test(role))
    return "creative";
  return "general";
}

const LANGUAGES = J([
  { name: "English", level: "Fluent" },
  { name: "Nigerian Pidgin", level: "Fluent" },
]);

const PRESETS: Record<Kind, RolePreset> = {
  creative: {
    tools: J([
      {
        group: "Design tools",
        items: [
          { name: "Figma", level: "Expert" },
          { name: "Adobe Illustrator", level: "Expert" },
          { name: "Adobe Photoshop", level: "Expert" },
          { name: "Adobe InDesign", level: "Advanced" },
          { name: "Adobe After Effects", level: "Intermediate" },
        ],
      },
      {
        group: "Creative disciplines",
        items: [
          "Brand identity",
          "Art direction",
          "Typography",
          "Campaign design",
          "Packaging",
          "Motion design",
        ],
      },
      {
        group: "Strategy & leadership",
        items: [
          "Brand strategy",
          "Creative briefs",
          "Design systems",
          "Team leadership",
          "Client workshops",
        ],
      },
    ]),
    languages: LANGUAGES,
    experience: J([
      {
        role: "Creative Director",
        company: "Dexta Synergy Services",
        start: "2020",
        end: null,
        description:
          "Placeholder: leads brand and creative direction across projects.",
      },
      {
        role: "Senior Designer",
        company: "Placeholder agency",
        start: "2016",
        end: "2020",
        description:
          "Placeholder: brand, campaign and print design for clients.",
      },
    ]),
    education: J([
      {
        degree: "B.A. Graphic Design (placeholder)",
        school: "University name",
        start: "2010",
        end: "2014",
        note: "",
      },
    ]),
    certifications: J([
      {
        name: "Adobe Certified Professional (placeholder)",
        issuer: "Adobe",
        year: "2021",
        url: null,
      },
    ]),
    socials: J([
      { platform: "linkedin", url: "https://www.linkedin.com" },
      { platform: "behance", url: "https://www.behance.net" },
      { platform: "instagram", url: "https://www.instagram.com" },
      { platform: "dribbble", url: "https://dribbble.com" },
    ]),
    availability: "Open to creative projects",
  },
  engineering: {
    tools: J([
      {
        group: "System design & architecture",
        items: [
          "Distributed systems",
          "API design (REST & GraphQL)",
          "Microservices",
          "Multi-tenant SaaS",
          "Database design",
          "Caching & performance",
        ],
      },
      {
        group: "Languages & frameworks",
        items: [
          { name: "TypeScript", level: "Expert" },
          { name: "Node.js", level: "Expert" },
          { name: "React & Next.js", level: "Expert" },
          { name: "Python", level: "Advanced" },
          { name: "Go", level: "Intermediate" },
        ],
      },
      {
        group: "Cloud, data & DevOps",
        items: [
          { name: "PostgreSQL", level: "Expert" },
          { name: "AWS", level: "Advanced" },
          { name: "Docker", level: "Advanced" },
          { name: "Redis", level: "Advanced" },
          { name: "CI/CD (GitHub Actions)", level: "Advanced" },
        ],
      },
      {
        group: "Engineering practices",
        items: [
          "Technical leadership",
          "Code review",
          "Automated testing",
          "Security best practices",
          "Observability",
        ],
      },
    ]),
    languages: LANGUAGES,
    experience: J([
      {
        role: "Technical Lead",
        company: "Dexta Synergy Services",
        start: "2021",
        end: null,
        description:
          "Placeholder: leads architecture and delivery of client platforms.",
      },
      {
        role: "Software Engineer",
        company: "Placeholder company",
        start: "2017",
        end: "2021",
        description: "Placeholder: built and scaled web applications and APIs.",
      },
    ]),
    education: J([
      {
        degree: "B.Sc. Computer Science (placeholder)",
        school: "University name",
        start: "2012",
        end: "2016",
        note: "",
      },
    ]),
    certifications: J([
      {
        name: "AWS Certified Solutions Architect (placeholder)",
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
    availability: "Open to technical projects",
  },
  print: {
    tools: J([
      {
        group: "Print production",
        items: [
          "Pre-press",
          "Colour management",
          "Paper & finishes",
          "Large format",
          "Quality control",
        ],
      },
      {
        group: "Software",
        items: [
          { name: "Adobe InDesign", level: "Expert" },
          { name: "Adobe Illustrator", level: "Advanced" },
          { name: "Adobe Acrobat (pre-flight)", level: "Expert" },
        ],
      },
    ]),
    languages: LANGUAGES,
    experience: "[]",
    education: "[]",
    certifications: "[]",
    socials: J([{ platform: "linkedin", url: "https://www.linkedin.com" }]),
    availability: "Open to print projects",
  },
  general: {
    tools: J([
      {
        group: "Skills",
        items: ["Project management", "Client relations", "Communication"],
      },
    ]),
    languages: LANGUAGES,
    experience: "[]",
    education: "[]",
    certifications: "[]",
    socials: J([{ platform: "linkedin", url: "https://www.linkedin.com" }]),
    availability: "",
  },
};

export function presetFor(role: string): RolePreset {
  return PRESETS[roleKind(role)];
}
