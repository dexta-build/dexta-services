import "server-only";
import { STOCK } from "@/lib/site/stock-media";
import { f } from "../fields";
import { page, section } from "../define";
import { closingSection } from "./shared";
import { ARTICLE_LABELS } from "@/lib/site/thoughts-labels";
import { TEAM_PAGE_LABELS as T } from "@/lib/site/team-labels";
import {
  EVENT_PAGE_LABELS,
  REGISTRATION_FORM_LABELS,
} from "@/lib/site/event-labels";
import {
  CATALOGUE_BROWSE_LABELS as B,
  CATALOGUE_HERO_LABELS as H,
  CATALOGUE_ORDER_LABELS as O,
} from "@/lib/site/catalogue-labels";

const t = (label: string, max = 60, hint?: string) =>
  f.text(label, { max, ...(hint ? { hint } : {}) });

/**
 * Text shared by every page of one kind (each project, product, article
 * or catalogue). The pages' own content comes from their records.
 */
export const WORK_TEMPLATE = page({
  key: "template.work",
  label: "Project pages",
  path: null,
  area: "works",
  group: "Page templates",
  description: "Shared by every project page (/works/…).",
  sections: [
    section({
      key: "labels",
      label: "Buttons and headings",
      canHide: false,
      fields: {
        primary: f.link("Main button"),
        websiteLabel: f.text("Website button text", {
          max: 40,
          hint: "Shown when a project has a website address.",
        }),
        moreEyebrow: f.eyebrow(),
        moreTitle: f.heading("More projects heading"),
      },
      defaults: {
        primary: { label: "Start a similar project", href: "/contact" },
        websiteLabel: "Visit website",
        moreEyebrow: "Keep exploring",
        moreTitle: "More *of our work*",
      },
    }),
    closingSection({
      title: "Want something *like this*?",
      body: "Tell us what you're planning and we'll make it yours.",
      image: STOCK.teamWhiteboard,
    }),
  ],
});

export const EXPRESSION_TEMPLATE = page({
  key: "template.expression",
  label: "Product pages",
  path: null,
  area: "works",
  group: "Page templates",
  description: "Shared by every Our Expressions product page.",
  sections: [
    section({
      key: "labels",
      label: "Buttons and headings",
      canHide: false,
      fields: {
        visitEyebrow: f.text("Side card eyebrow", { max: 40 }),
        visitLabel: f.text("Website button text", {
          max: 40,
          hint: "{host} becomes the product's web address, e.g. bookprinta.com.",
        }),
        galleryTitle: f.text("Screenshots heading", {
          max: 60,
          hint: "Shown when a product has more screenshots.",
        }),
        featuresTitle: f.text("Features heading", { max: 60 }),
        nextEyebrow: f.text("Next product eyebrow", { max: 40 }),
        nextLabel: f.text("Next product link text", { max: 40 }),
      },
      defaults: {
        visitEyebrow: "See it live",
        visitLabel: "Visit {host}",
        galleryTitle: "Screenshots",
        featuresTitle: "Key features",
        nextEyebrow: "Next expression",
        nextLabel: "Read the story",
      },
    }),
    closingSection({
      title: "Have a product idea? *We'll build it*",
      body: "From first sketch to launch and beyond, we design, build and grow digital products with you.",
      image: STOCK.developerWoman,
    }),
  ],
});

export const ARTICLE_TEMPLATE = page({
  key: "template.article",
  label: "Article pages",
  path: null,
  area: "thoughts",
  group: "Page templates",
  description: "Shared by every article and Thoughts category page.",
  sections: [
    section({
      key: "labels",
      label: "Article words",
      canHide: false,
      fields: {
        tldr: f.text("Summary label", { max: 20, hint: "Above the excerpt." }),
        by: f.text("Before the author's name", { max: 20 }),
        writtenBy: f.text("Author box label", { max: 30 }),
        onThisPage: f.text("Contents heading", { max: 30 }),
        helpTitle: f.accent("Side card heading", { max: 80 }),
        helpBody: f.textarea("Side card text", { max: 200, rows: 2 }),
        helpButton: f.text("Side card button", {
          max: 30,
          hint: "Opens WhatsApp (the Articles message in Site settings), else the contact page.",
        }),
        relatedEyebrow: f.eyebrow(),
        relatedTitle: f.heading("More articles heading"),
        seeAll: f.text("See all link", { max: 30 }),
      },
      defaults: ARTICLE_LABELS,
    }),
    closingSection({
      title: "Got a project in mind? *Let's talk*",
      body: "Tell us what you're working on and we'll share how we can help.",
      image: STOCK.teamLaptopCasual,
    }),
  ],
});

export const CATALOGUE_TEMPLATE = page({
  key: "template.catalogue",
  label: "Catalogue pages",
  path: null,
  area: "catalogue",
  group: "Page templates",
  description: "Shared by every catalogue and catalogue item page.",
  sections: [
    section({
      key: "hero",
      label: "Catalogue hero",
      description:
        "Used when a catalogue has no hero heading or text of its own (set those in Catalogues).",
      canHide: false,
      fields: {
        eyebrow: f.eyebrow(),
        title: f.accent("Heading", {
          max: 80,
          hint: "{catalogue} becomes the catalogue's name. Wrap words in *asterisks* for the accent.",
        }),
        line: f.textarea("Line after the description", { max: 200, rows: 2 }),
      },
      defaults: H,
    }),
    section({
      key: "browse",
      label: "Filters and results",
      canHide: false,
      fields: {
        allLabel: t("All categories chip", 30),
        searchPlaceholder: t("Search box placeholder", 40),
        sortLabel: t("Sort menu name", 30),
        sortFeatured: t("Sort: featured", 30),
        sortPriceAsc: t("Sort: price low to high", 40),
        sortPriceDesc: t("Sort: price high to low", 40),
        sortNewest: t("Sort: newest", 30),
        priceLabel: t("Price menu name", 30),
        anyPrice: t("Price: any", 30),
        countOne: t("Result count (one)", 40, "{count} becomes the number."),
        countMany: t("Result count (many)", 40, "{count} becomes the number."),
        inCategory: t(
          "After the count when filtered",
          40,
          "{category} becomes the category.",
        ),
        clearLabel: t("Clear filters link", 30),
        emptyTitle: t("No results heading", 80),
        emptyBody: f.textarea("No results text", { max: 200, rows: 2 }),
        customTitle: f.accent('"We\'ll design it" tile heading', { max: 80 }),
        customBody: f.textarea("Tile text", { max: 200, rows: 2 }),
        customMessage: t(
          "Tile WhatsApp message",
          200,
          "{catalogue} becomes the catalogue's name (in lower case).",
        ),
        customButton: t("Tile button (WhatsApp)", 40),
        customButtonNoWhatsApp: t("Tile button (no WhatsApp number)", 40),
      },
      defaults: B,
    }),
    section({
      key: "order",
      label: "Order panel",
      description: "Shown beside a design when it's opened.",
      canHide: false,
      fields: {
        minimumLabel: t("Minimum order label", 30),
        detailsLabel: t("Tags label", 30),
        quantityLabel: t("Quantity label", 30),
        minimumNote: t("Minimum note", 60, "{moq} becomes the minimum order."),
        roundUpNote: t("Below-minimum note", 80),
        totalLabel: t("Total label", 30),
        orderButton: t("Order button", 40),
        requestButton: t("Button without a WhatsApp number", 40),
        priceNote: f.textarea("Note under the button", { max: 200, rows: 2 }),
        messageIntro: t(
          "WhatsApp message first line",
          120,
          "The item, quantity, price, total and link are added after it.",
        ),
      },
      defaults: O,
    }),
    section({
      key: "more",
      label: "More catalogues",
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading(),
        count: f.number("How many to show", { min: 1, max: 6 }),
      },
      defaults: {
        eyebrow: "More catalogues",
        title: "Shop by *occasion*",
        count: 3,
      },
    }),
    closingSection({
      title: "Can't find *exactly what you want*?",
      body: "Tell us your idea and we'll design something just for you.",
      image: STOCK.craftSupplies,
    }),
  ],
});

export const EVENT_TEMPLATE = page({
  key: "template.event",
  label: "Event pages",
  path: null,
  area: "events",
  group: "Page templates",
  description: "Shared by every event page and its registration form.",
  sections: [
    section({
      key: "labels",
      label: "Event details",
      canHide: false,
      fields: {
        about: f.eyebrow(),
        dateLabel: f.text("Date label", { max: 30 }),
        locationLabel: f.text("Location label", { max: 30 }),
        formatLabel: f.text("Format label", { max: 30 }),
        spacesLabel: f.text("Spaces label", { max: 30 }),
        openToAll: f.text("Spaces: no limit", { max: 40 }),
        spotsLeftOne: f.text("Spaces: one left", { max: 40 }),
        spotsLeftMany: f.text("Spaces: some left", {
          max: 40,
          hint: "{count} becomes the number.",
        }),
        full: f.text("Spaces: full", { max: 40 }),
        closed: f.text("Spaces: registration closed", { max: 40 }),
        calendar: f.text("Calendar link", { max: 40 }),
        ended: f.text("Past event badge", { max: 20 }),
        endedTitle: f.text("Past event: heading", { max: 80 }),
        endedBody: f.textarea("Past event: text", { max: 200, rows: 2 }),
        endedButton: f.text("Past event: button", { max: 40 }),
      },
      defaults: EVENT_PAGE_LABELS,
    }),
    section({
      key: "form",
      label: "Registration form",
      description:
        "Words around every registration form. Each event's own questions are set in Manage events.",
      canHide: false,
      fields: {
        title: f.text("Heading", { max: 40 }),
        subtitle: f.text("Text under the heading", { max: 120 }),
        nameLabel: f.text("Name label", { max: 30 }),
        namePlaceholder: f.text("Name placeholder", { max: 40 }),
        emailLabel: f.text("Email label", { max: 30 }),
        emailPlaceholder: f.text("Email placeholder", { max: 40 }),
        choose: f.text("Dropdown placeholder", { max: 30 }),
        submit: f.text("Button", { max: 30 }),
        submitting: f.text("Button while sending", { max: 30 }),
        privacy: f.text("Note under the button", { max: 160 }),
        successTitle: f.text("After sending: heading", { max: 60 }),
        successBody: f.textarea("After sending: text", { max: 300, rows: 3 }),
        closedTitle: f.text("Closed: heading", { max: 60 }),
        closedBody: f.text("Closed: text", { max: 160 }),
      },
      defaults: REGISTRATION_FORM_LABELS,
    }),
  ],
});

const tl = (label: string, max = 60, hint?: string) =>
  f.text(label, { max, ...(hint ? { hint } : {}) });
const NAME_HINT = "{name} becomes the person's first name.";

export const TEAM_TEMPLATE = page({
  key: "template.team",
  label: "Team profile pages",
  path: null,
  area: "about",
  group: "Page templates",
  description:
    "Shared by every team member's portfolio. Each person's own details are in Team.",
  sections: [
    section({
      key: "intro",
      label: "Introduction and stats",
      canHide: false,
      fields: {
        defaultLocation: tl("Location when none is set", 80),
        downloadCv: tl("CV button", 30),
        yearsBadge: tl("Badge on the photo", 40, "After the number of years."),
        statYears: tl("Stat: years", 40),
        statProjects: tl("Stat: projects", 40),
        statCertOne: tl("Stat: one certification", 40),
        statCertMany: tl("Stat: certifications", 40),
        statLangOne: tl("Stat: one language", 40),
        statLangMany: tl("Stat: languages", 40),
        statSkills: tl("Stat: skills", 40),
      },
      defaults: {
        defaultLocation: T.defaultLocation,
        downloadCv: T.downloadCv,
        yearsBadge: T.yearsBadge,
        statYears: T.statYears,
        statProjects: T.statProjects,
        statCertOne: T.statCertOne,
        statCertMany: T.statCertMany,
        statLangOne: T.statLangOne,
        statLangMany: T.statLangMany,
        statSkills: T.statSkills,
      },
    }),
    section({
      key: "nav",
      label: "Section menu",
      canHide: false,
      fields: {
        navAbout: tl("About", 20),
        navExpertise: tl("Expertise", 20),
        navExperience: tl("Experience", 20),
        navEducation: tl("Education", 20),
        navWork: tl("Work", 20),
        navWriting: tl("Writing", 20),
        navContact: tl("Contact", 20),
      },
      defaults: {
        navAbout: T.navAbout,
        navExpertise: T.navExpertise,
        navExperience: T.navExperience,
        navEducation: T.navEducation,
        navWork: T.navWork,
        navWriting: T.navWriting,
        navContact: T.navContact,
      },
    }),
    section({
      key: "sections",
      label: "Section headings",
      canHide: false,
      fields: {
        aboutEyebrow: tl("About: eyebrow", 30),
        aboutTitle: f.accent("About: heading", { max: 80, hint: NAME_HINT }),
        funFact: tl("Fun fact label", 30),
        brands: tl("Brands label", 40),
        expertiseEyebrow: tl("Expertise: eyebrow", 30),
        expertiseTitle: f.accent("Expertise: heading", { max: 80 }),
        focusAreas: tl("Focus areas label", 40),
        skills: tl("Skills label", 60),
        languages: tl("Languages card heading", 30),
        experienceEyebrow: tl("Experience: eyebrow", 30),
        experienceTitle: f.accent("Experience: heading", { max: 80 }),
        present: tl("Current role end date", 20, "e.g. Present"),
        educationEyebrow: tl("Education: eyebrow", 30),
        educationTitle: f.accent("Education: heading", { max: 80 }),
        academic: tl("Education list label", 30),
        professional: tl("Certifications list label", 30),
        workEyebrow: tl("Own projects: eyebrow", 30),
        workTitle: f.accent("Own projects: heading", { max: 80 }),
        studioEyebrow: tl(
          "Studio work: eyebrow",
          30,
          "Shown when someone has no projects of their own.",
        ),
        studioTitle: f.accent("Studio work: heading", { max: 80 }),
        seeAllWorks: tl("See all works link", 30),
        writingEyebrow: tl("Articles: eyebrow", 30),
        writingTitle: f.accent("Articles: heading", { max: 80 }),
        contactEyebrow: tl("Contact: eyebrow", 30),
        contactTitle: f.accent("Contact: heading", { max: 80 }),
        contactBody: f.textarea("Contact: text", {
          max: 200,
          rows: 2,
          hint: NAME_HINT,
        }),
      },
      defaults: {
        aboutEyebrow: T.aboutEyebrow,
        aboutTitle: T.aboutTitle,
        funFact: T.funFact,
        brands: T.brands,
        expertiseEyebrow: T.expertiseEyebrow,
        expertiseTitle: T.expertiseTitle,
        focusAreas: T.focusAreas,
        skills: T.skills,
        languages: T.languages,
        experienceEyebrow: T.experienceEyebrow,
        experienceTitle: T.experienceTitle,
        present: T.present,
        educationEyebrow: T.educationEyebrow,
        educationTitle: T.educationTitle,
        academic: T.academic,
        professional: T.professional,
        workEyebrow: T.workEyebrow,
        workTitle: T.workTitle,
        studioEyebrow: T.studioEyebrow,
        studioTitle: T.studioTitle,
        seeAllWorks: T.seeAllWorks,
        writingEyebrow: T.writingEyebrow,
        writingTitle: T.writingTitle,
        contactEyebrow: T.contactEyebrow,
        contactTitle: T.contactTitle,
        contactBody: T.contactBody,
      },
    }),
  ],
});

export const TEMPLATE_PAGES = [
  WORK_TEMPLATE,
  EXPRESSION_TEMPLATE,
  ARTICLE_TEMPLATE,
  CATALOGUE_TEMPLATE,
  EVENT_TEMPLATE,
  TEAM_TEMPLATE,
];
