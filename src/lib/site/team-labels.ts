/**
 * Words on every team member's portfolio page (/daniel-azu), edited in
 * Pages → Team profile pages. {name} becomes the person's first name.
 * These defaults are also the page's fallbacks; safe on server and client.
 */

export const TEAM_PAGE_LABELS = {
  defaultLocation: "Port Harcourt, Nigeria",
  downloadCv: "Download CV",
  yearsBadge: "years of experience",
  // Stats under the introduction
  statYears: "Years of experience",
  statProjects: "Featured projects",
  statCertOne: "Certification",
  statCertMany: "Certifications",
  statLangOne: "Language",
  statLangMany: "Languages",
  statSkills: "Skills & tools",
  // Section menu
  navAbout: "About",
  navExpertise: "Expertise",
  navExperience: "Experience",
  navEducation: "Education",
  navWork: "Work",
  navWriting: "Writing",
  navContact: "Contact",
  // About
  aboutEyebrow: "About me",
  aboutTitle: "Hi, I'm *{name}*",
  funFact: "Fun fact",
  brands: "Brands I've worked on",
  // Expertise
  expertiseEyebrow: "Expertise",
  expertiseTitle: "What I *do best*",
  focusAreas: "Focus areas",
  skills: "Skills, tools & technologies",
  languages: "Languages",
  // Experience
  experienceEyebrow: "Experience",
  experienceTitle: "Where I've *worked*",
  present: "Present",
  // Education
  educationEyebrow: "Qualifications",
  educationTitle: "Education & *certifications*",
  academic: "Academic",
  professional: "Professional",
  // Work
  workEyebrow: "Portfolio",
  workTitle: "Selected *work*",
  studioEyebrow: "From the studio",
  studioTitle: "Work *from the team*",
  seeAllWorks: "See all works",
  // Writing
  writingEyebrow: "Writing",
  writingTitle: "My *thoughts*",
  // Contact
  contactEyebrow: "Contact",
  contactTitle: "Let's work *together*",
  contactBody: "Want to reach {name}? Get in touch using the details here.",
};

export type TeamPageLabels = typeof TEAM_PAGE_LABELS;
