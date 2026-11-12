import "server-only";
import { EVENTS_BOARD_LABELS } from "@/lib/site/event-labels";
import { THOUGHTS_BROWSE_LABELS } from "@/lib/site/thoughts-labels";
import { NO_OFFERS_LABELS, OFFER_CARD_LABELS } from "@/lib/site/offer-labels";
import {
  fetchAboutExpertiseItems,
  fetchAboutMilestones,
  fetchAboutPageContent,
  fetchAboutSpaceItems,
  fetchAboutValueItems,
  fetchContactPageContent,
} from "@/lib/api";
import { HOME_ADVANTAGE, HOME_DIFFERENCE } from "@/lib/site/home-content";
import { OFFERS_PAGE } from "@/lib/site/offers-content";
import { SERVICES_HUB } from "@/lib/site/services-content";
import { SHOWREEL_VIDEO, STOCK } from "@/lib/site/stock-media";
import { f } from "../fields";
import { page, section, seoSection } from "../define";
import { closingSection, faqFields, heroFields } from "./shared";

const ABOUT_ICONS = [
  ["ZAP", "Lightning"],
  ["GLOBE", "Globe"],
  ["SPARKLES", "Sparkles"],
  ["TRENDING_UP", "Growth"],
  ["TARGET", "Target"],
  ["LIGHTBULB", "Light bulb"],
  ["HEART_HANDSHAKE", "Handshake"],
  ["SHIELD", "Shield"],
].map(([value, label]) => ({ value, label }));

const differenceSection = section({
  key: "difference",
  label: "Our difference",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    items: f.list(
      "Points",
      "Point",
      {
        icon: f.select("Icon", [
          { value: "gem", label: "Gem" },
          { value: "zap", label: "Lightning" },
          { value: "layers", label: "Layers" },
          { value: "globe", label: "Globe" },
        ]),
        label: f.text("Label", { max: 30 }),
        title: f.text("Title", { max: 60 }),
        body: f.textarea("Body", { max: 200, rows: 2 }),
      },
      { titleKey: "title", max: 6 },
    ),
  },
  defaults: HOME_DIFFERENCE,
});

/* ── Services ───────────────────────────────────────────────────────────── */

export const SERVICES_PAGE = page({
  key: "services",
  label: "Services",
  path: "/services",
  area: "services",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: {
        ...heroFields({ image: true }),
        chips: f.list(
          "Floating chips",
          "Chip",
          { label: f.text("Text", { max: 30 }), image: f.image("Thumbnail") },
          { titleKey: "label", max: 10 },
        ),
      },
      defaults: {
        ...SERVICES_HUB.hero,
        chips: [
          { label: "Brand identity", image: STOCK.colourSwatches },
          { label: "Websites", image: STOCK.laptopBrowsing },
          { label: "Invitation cards", image: STOCK.weddingRings },
          { label: "Mobile apps", image: STOCK.phoneAppUi },
          { label: "Packaging", image: STOCK.craftSupplies },
          { label: "Signage", image: STOCK.eventStage },
          { label: "E-commerce", image: STOCK.shoppingLaptopPhone },
          { label: "Merchandise", image: STOCK.whiteTshirt },
        ] as { label: string; image: string }[],
      },
    }),
    section({
      key: "intro",
      label: "Intro and showreel",
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading(),
        lead: f.textarea("Lead", { max: 400, rows: 3 }),
        body: f.textarea("Body", { max: 400, rows: 2 }),
        words: f.strings("Rotating words", { max: 6 }),
        images: f.images("Rotating images", { max: 12 }),
        video: f.video("Showreel video"),
      },
      defaults: {
        ...SERVICES_HUB.intro,
        words: HOME_ADVANTAGE.teaserWords,
        images: HOME_ADVANTAGE.teaserImages as string[],
        video: SHOWREEL_VIDEO,
      },
    }),
    section({
      key: "groups",
      label: "Design, Build and Print bands",
      description:
        "Headings for each group. The services listed come from the service pages.",
      fields: Object.fromEntries(
        (["design", "build", "print"] as const).map((k) => [
          k,
          f.object(k.charAt(0).toUpperCase() + k.slice(1), {
            title: f.heading("Heading"),
            subtitle: f.text("Subtitle", { max: 60, optional: true }),
            body: f.textarea("Body", { max: 300, rows: 2 }),
          }),
        ]),
      ),
      defaults: SERVICES_HUB.groups as Record<
        "design" | "build" | "print",
        { title: string; subtitle?: string; body: string }
      >,
    }),
    differenceSection,
    section({
      key: "faq",
      label: "Questions",
      fields: faqFields,
      defaults: {
        eyebrow: "",
        title: "Questions about *working with us*",
        items: SERVICES_HUB.faqs,
      },
    }),
    closingSection({
      title: "Have a project in mind? *Let's make it happen*",
      body: "Tell us what you're planning. We'll take it from idea to finished piece.",
      image: STOCK.teamWhiteboard,
    }),
    seoSection({
      title: "Services",
      description:
        "Design, software engineering and print services from one creative team in Port Harcourt, Nigeria.",
    }),
  ],
});

/* ── Works ──────────────────────────────────────────────────────────────── */

export const WORKS_PAGE = page({
  key: "works",
  label: "Works",
  path: "/works",
  area: "works",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero and showreel",
      canHide: false,
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading("Headline"),
        body: f.textarea("Intro", { max: 300, rows: 3 }),
        words: f.strings("Rotating words", { max: 6 }),
        images: f.images("Rotating images", {
          max: 12,
          hint: "Used until there are at least three projects with images.",
        }),
        video: f.video("Showreel video"),
      },
      defaults: {
        eyebrow: "Our work",
        title: "Work we're *proud to share*",
        body: "Brand identities, websites, apps and beautiful print, made for businesses, families and the moments they care about.",
        words: ["design", "build", "print"],
        images: [
          STOCK.weddingCouple,
          STOCK.designerTablet,
          STOCK.developerScreens,
          STOCK.goldRibbons,
          STOCK.colourSwatches,
          STOCK.eventStage,
        ] as string[],
        video: SHOWREEL_VIDEO,
      },
    }),
    section({
      key: "statement",
      label: "Statement",
      fields: { text: f.accent("Statement", { max: 300, multiline: true }) },
      defaults: {
        text: "We help ambitious brands and families *make every moment count*, from first sketch to final delivery.",
      },
    }),
    section({
      key: "projects",
      label: "Projects gallery",
      description:
        "Which projects show on the Works page (and the homepage's featured works), and the gallery's labels. The projects themselves are under Works → Projects.",
      canHide: false,
      fields: {
        source: f.select(
          "Show",
          [
            {
              value: "samples",
              label: "The sample projects (until real ones are ready)",
            },
            { value: "projects", label: "My projects (Works → Projects)" },
          ],
          {
            hint: "Switch to “My projects” once your projects have their images. Hidden projects never show.",
          },
        ),
        featuredLabel: f.text("Label over the featured projects", { max: 40 }),
        filters: f.object("Filter labels", {
          all: f.text("All", { max: 30 }),
          design: f.text("Design", { max: 30 }),
          build: f.text("Build", { max: 30 }),
          print: f.text("Print", { max: 30 }),
          allOccasions: f.text("All occasions", {
            max: 30,
            hint: "The occasion filter shows only when projects have occasions.",
          }),
        }),
        viewLabel: f.text("Link on each project", { max: 30 }),
        gridTitle: f.heading("Heading over all projects"),
        filteredTitle: f.accent("Heading when filtered", {
          max: 160,
          hint: "{filter} becomes the chosen filter, e.g. “design”. Wrap words in *asterisks* for the serif accent.",
        }),
      },
      defaults: {
        source: "samples",
        featuredLabel: "Featured work",
        filters: {
          all: "All work",
          design: "Design",
          build: "Build",
          print: "Print",
          allOccasions: "All occasions",
        },
        viewLabel: "View project",
        gridTitle: "More *of our work*",
        filteredTitle: "Our *{filter}* work",
      },
    }),
    section({
      key: "brands",
      label: "Brands wall",
      description: "Heading over the wall of product and client logos.",
      fields: { eyebrow: f.eyebrow(), title: f.heading() },
      defaults: {
        eyebrow: "Products & clients",
        title: "Brands we've *built and worked with*",
      },
    }),
    closingSection({
      title: "Love what you see? *Let's make yours next*",
      body: "Tell us about your brand, event or idea. We'll take it from first sketch to finished piece.",
      image: STOCK.teamLaptopCasual,
    }),
    seoSection({
      title: "Works",
      description:
        "Recent design, software and print projects by Dexta, for brands, businesses and life's big moments.",
    }),
  ],
});

/* ── Catalogues ─────────────────────────────────────────────────────────── */

export const CATALOGUES_PAGE = page({
  key: "catalogue",
  label: "Catalogues",
  path: "/catalogue",
  area: "catalogue",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: {
        ...heroFields(),
        currencyLabel: f.text("Currency picker label", { max: 40 }),
      },
      defaults: {
        eyebrow: "Catalogues",
        title: "Ready-made designs for *every occasion*",
        body: "Choose a catalogue, pick the design you love and order on WhatsApp in the quantity you need.",
        currencyLabel: "Show prices in",
      },
    }),
    section({
      key: "steps",
      label: "How ordering works",
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading(),
        stepLabel: f.text("Step label", {
          max: 20,
          hint: "{n} becomes the step number.",
        }),
        items: f.list(
          "Steps",
          "Step",
          {
            title: f.text("Title", { max: 60 }),
            body: f.textarea("Body", { max: 300, rows: 2 }),
          },
          {
            titleKey: "title",
            max: 3,
            hint: "Three steps, each with its own icon.",
          },
        ),
      },
      defaults: {
        eyebrow: "How ordering works",
        title: "Three steps to *your order*",
        stepLabel: "Step {n}",
        items: [
          {
            title: "Pick a design",
            body: "Browse a catalogue and open any design to see it up close, with its price and minimum order.",
          },
          {
            title: "Choose your quantity",
            body: "Set how many you need. We show the total in naira, dollars, euros or pounds.",
          },
          {
            title: "Order on WhatsApp",
            body: "Tap order and your item, quantity and total are filled in for you. We'll confirm and get started.",
          },
        ],
      },
    }),
    section({
      key: "faq",
      label: "Questions",
      fields: faqFields,
      defaults: {
        eyebrow: "",
        title: "Questions about *ordering*",
        items: [
          {
            q: "What is a minimum order quantity (MOQ)?",
            a: "It's the smallest number we can produce for an item. Every design shows its MOQ, and the quantity picker starts there.",
          },
          {
            q: "Can I pay from outside Nigeria?",
            a: "Yes. Prices are shown in naira, US dollars, euros and pounds, using live exchange rates. We confirm the final amount before production.",
          },
          {
            q: "Can you change a design for me?",
            a: "Of course. Names, dates, colours and wording are included. Bigger changes can be quoted on WhatsApp.",
          },
          {
            q: "How long does delivery take?",
            a: "Most printed items are ready in 3–7 working days after you approve the proof. We deliver across Nigeria and can ship abroad.",
          },
        ],
      },
    }),
    closingSection({
      title: "Can't find what you need? *We'll design it*",
      body: "Tell us about your occasion and we'll create something just for you.",
      image: STOCK.weddingTable,
    }),
    seoSection({
      title: "Catalogues",
      description:
        "Ready-made designs for weddings, events, birthdays, burials, businesses and websites. Pick a design, choose your quantity and order on WhatsApp.",
    }),
  ],
});

/* ── Offers ─────────────────────────────────────────────────────────────── */

export const OFFERS_PAGE_CONTENT = page({
  key: "offers",
  label: "Offers",
  path: "/offers",
  area: "offers",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: {
        ...heroFields({ image: true }),
        cta: f.text("Button text", { max: 40 }),
      },
      defaults: OFFERS_PAGE.hero,
    }),
    section({
      key: "intro",
      label: "Current offers heading",
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading(),
        body: f.textarea("Body", { max: 300, rows: 2 }),
        currencyLabel: f.text("Currency picker label", { max: 40 }),
      },
      defaults: { ...OFFERS_PAGE.offers, currencyLabel: "Show prices in" },
    }),
    section({
      key: "cards",
      label: "Offer cards",
      description:
        "Words on every offer card and its countdown. The offers themselves are in Manage offers.",
      canHide: false,
      fields: {
        customQuote: f.text("Shown when an offer has no price", { max: 30 }),
        estimateNote: f.text("Note under a converted price", {
          max: 60,
          hint: "Shown after the naira price when a visitor picks another currency.",
        }),
        payButton: f.text("Payment link button", { max: 40 }),
        orderButton: f.text("WhatsApp button (with a price)", { max: 40 }),
        quoteButton: f.text("WhatsApp button (custom quote)", { max: 40 }),
        contactButton: f.text("Button with no payment link or WhatsApp", {
          max: 40,
        }),
        messageIntro: f.text("WhatsApp message first line", {
          max: 160,
          hint: "{offer} becomes the offer's name. The price follows.",
        }),
        messageQuote: f.text("WhatsApp line for a custom quote", { max: 120 }),
        endsOn: f.text("Countdown: end date", {
          max: 40,
          hint: "{date} becomes the end date, e.g. 12 Dec.",
        }),
        endingToday: f.text("Countdown: last day", { max: 40 }),
        days: f.text("Countdown: days", { max: 12 }),
        hours: f.text("Countdown: hours", { max: 12 }),
        mins: f.text("Countdown: minutes", { max: 12 }),
        secs: f.text("Countdown: seconds", { max: 12 }),
      },
      defaults: OFFER_CARD_LABELS,
    }),
    section({
      key: "empty",
      label: "No offers running",
      description: "Shown instead of the cards when no offer is running.",
      canHide: false,
      fields: {
        title: f.accent("Heading", { max: 80 }),
        body: f.textarea("Text", { max: 240, rows: 2 }),
        primary: f.link("Main button"),
        whatsappLabel: f.text("WhatsApp button", { max: 40 }),
      },
      defaults: NO_OFFERS_LABELS,
    }),
    section({
      key: "includes",
      label: "Every offer includes",
      fields: {
        title: f.text("Title", { max: 60 }),
        items: f.strings("Included", { max: 12 }),
      },
      defaults: OFFERS_PAGE.includes,
    }),
    section({
      key: "faq",
      label: "Questions",
      fields: faqFields,
      defaults: {
        eyebrow: "",
        title: "Questions about *offers*",
        items: OFFERS_PAGE.faqs,
      },
    }),
    closingSection(OFFERS_PAGE.closing),
    seoSection({
      title: "Offers",
      description:
        "Ready-made offers from Dexta across design, software and print, at a clear price. Pay online or order on WhatsApp.",
    }),
  ],
});

/* ── Events, Thoughts, Our Expressions ──────────────────────────────────── */

export const EVENTS_PAGE = page({
  key: "events",
  label: "Events",
  path: "/events",
  area: "events",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: heroFields(),
      defaults: {
        eyebrow: "Learn with us",
        title: "Events & *meet-ups*",
        body: "Workshops, open days and community meet-ups for founders, creatives and builders. See what's coming up and save your seat.",
      },
    }),
    section({
      key: "board",
      label: "Event listings",
      description:
        "The next two events as large tiles, then all events with filters. The events come from Manage events.",
      canHide: false,
      fields: {
        noUpcomingTitle: f.text("No upcoming events: heading", { max: 80 }),
        noUpcomingBody: f.textarea("No upcoming events: text", {
          max: 240,
          rows: 2,
        }),
        startsIn: f.text("Countdown label on the big tiles", { max: 20 }),
        allTitle: f.text("All events heading", { max: 40 }),
        filterAll: f.text("Filter: all", { max: 20 }),
        filterUpcoming: f.text("Filter: upcoming", { max: 20 }),
        filterPast: f.text("Filter: past", { max: 20 }),
        filterInPerson: f.text("Filter: in person", { max: 20 }),
        filterOnline: f.text("Filter: online", { max: 20 }),
        ended: f.text("Past event label on cards", { max: 20 }),
        empty: f.text("No events for a filter", { max: 80 }),
        loadMore: f.text("Load more button", { max: 30 }),
      },
      defaults: EVENTS_BOARD_LABELS,
    }),
    closingSection({
      title: "Want to host an event *with us*?",
      body: "We design, brand and print for events of every size, and we love partnering on community meet-ups.",
      image: STOCK.confettiConcert,
    }),
    seoSection({
      title: "Events",
      description:
        "Workshops, meet-ups and open days from Dexta Synergy Services. See what's coming up and register.",
    }),
  ],
});

export const THOUGHTS_PAGE = page({
  key: "thoughts",
  label: "Thoughts",
  path: "/thoughts",
  area: "thoughts",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: heroFields(),
      defaults: {
        eyebrow: "Our thoughts",
        title: "Ideas worth *sharing*",
        body: "Practical tips, behind-the-scenes stories and lessons from our work in brand, design, software and print.",
      },
    }),
    section({
      key: "empty",
      label: "No articles yet",
      description: "Shown while there are no published articles.",
      canHide: false,
      fields: {
        title: f.heading(),
        body: f.textarea("Body", { max: 300, rows: 2 }),
        primary: f.link("Main button"),
        secondary: f.link("Second button"),
      },
      defaults: {
        title: "Our first articles are *on the way*",
        body: "The team is writing. In the meantime, see the products we build and the work we're proud of.",
        primary: { label: "See our work", href: "/works" },
        secondary: { label: "Our Expressions", href: "/expressions" },
      },
    }),
    section({
      key: "browse",
      label: "Filters, cards and category pages",
      description:
        "Words around the articles on this page and on every category page.",
      canHide: false,
      fields: {
        allTitle: f.text("All articles heading", { max: 60 }),
        trending: f.text("Trending band eyebrow", {
          max: 30,
          hint: "The band shows the category with the most articles (2 or more).",
        }),
        allCategories: f.text("All categories option", { max: 30 }),
        searchPlaceholder: f.text("Search box placeholder", { max: 30 }),
        sortLabel: f.text("Sort label", { max: 20 }),
        latest: f.text("Sort: latest", { max: 20 }),
        oldest: f.text("Sort: oldest", { max: 20 }),
        readTime: f.text("Reading time", {
          max: 30,
          hint: "{n} becomes the minutes.",
        }),
        loadMore: f.text("Load more button", { max: 30 }),
        showing: f.text("Count under the grid", {
          max: 40,
          hint: "{shown} and {total} become numbers.",
        }),
        noneTitle: f.text("No articles in a category: heading", { max: 80 }),
        noneBody: f.text("No articles in a category: text", { max: 160 }),
        noMatchTitle: f.text("No search results: heading", { max: 80 }),
        noMatchBody: f.text("No search results: text", { max: 160 }),
        clearSearch: f.text("Clear search link", { max: 30 }),
        articleOne: f.text("Category page count (one)", {
          max: 30,
          hint: "{count} becomes the number.",
        }),
        articleMany: f.text("Category page count (many)", { max: 30 }),
      },
      defaults: { allTitle: "All thoughts", ...THOUGHTS_BROWSE_LABELS },
    }),
    closingSection({
      title: "Got a project in mind? *Let's talk*",
      body: "Tell us what you're working on and we'll share how we can help.",
      image: STOCK.teamLaptopCasual,
    }),
    seoSection({
      title: "Thoughts",
      description:
        "Ideas, guides and stories from the Dexta team on brand, design, software and print.",
    }),
  ],
});

export const EXPRESSIONS_PAGE = page({
  key: "expressions",
  label: "Our Expressions",
  path: "/expressions",
  area: "works",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: heroFields(),
      defaults: {
        eyebrow: "Our Expressions",
        title: "Products we *build* and run",
        body: "Our Expressions are products designed, built and run by Dexta. They're proof of what we can make for you, and they serve thousands of people every day.",
      },
    }),
    closingSection({
      title: "Have a product idea? *We'll build it*",
      body: "From first sketch to launch and beyond, we design, build and grow digital products with you.",
      image: STOCK.developerWoman,
    }),
    seoSection({
      title: "Our Expressions",
      description:
        "Products designed, built and run by Dexta: DX-SchoolPortal, BookPrinta, AwaMenu, DextaLearning and more.",
    }),
  ],
});

/* ── About ──────────────────────────────────────────────────────────────── */

const aboutContent = () => fetchAboutPageContent();
const visible = { isVisible: f.toggle("Show on the page") };

export const ABOUT_PAGE = page({
  key: "about",
  label: "About",
  path: "/about",
  area: "about",
  group: "Pages",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: {
        heroEyebrow: f.eyebrow(),
        heroHeadline: f.accent("Headline", { max: 200 }),
        heroBody: f.textarea("Intro", { max: 500, rows: 3 }),
        heroButton: f.link("Button"),
        heroBackgroundImagePublicId: f.image("Wide photo under the hero", {
          optional: true,
          hint: "The full-width photo below the headline. A wide team or studio shot works best; empty shows a stock photo.",
        }),
        ...Object.fromEntries(
          [1, 2, 3, 4].flatMap((n) => [
            [
              `heroStat${n}Value`,
              f.text(`Stat ${n} number`, { max: 12, optional: true }),
            ],
            [
              `heroStat${n}Label`,
              f.text(`Stat ${n} label`, { max: 60, optional: true }),
            ],
          ]),
        ),
      },
      defaults: async () => {
        const c = await aboutContent();
        return {
          heroEyebrow: c.heroEyebrow,
          heroHeadline: c.heroHeadline,
          heroBody: c.heroBody,
          heroButton: { label: "Talk to us", href: "/contact" },
          heroBackgroundImagePublicId: c.heroBackgroundImagePublicId ?? "",
          heroStat1Value: c.heroStat1Value,
          heroStat1Label: c.heroStat1Label,
          heroStat2Value: c.heroStat2Value,
          heroStat2Label: c.heroStat2Label,
          heroStat3Value: c.heroStat3Value,
          heroStat3Label: c.heroStat3Label,
          heroStat4Value: c.heroStat4Value,
          heroStat4Label: c.heroStat4Label,
        };
      },
    }),
    section({
      key: "story",
      label: "Our story",
      fields: {
        storyLabel: f.eyebrow(),
        storyTitle: f.accent("Heading", { max: 200 }),
        storyBody1: f.textarea("First paragraph", { max: 1500, rows: 4 }),
        storyBody2: f.textarea("Second paragraph", {
          max: 1500,
          rows: 4,
          optional: true,
        }),
        storyHighlightLabel: f.text("Highlight label", {
          max: 60,
          optional: true,
        }),
        storyHighlightTitle: f.text("Highlight title", {
          max: 120,
          optional: true,
        }),
        storyHighlightBody: f.textarea("Highlight text", {
          max: 500,
          rows: 3,
          optional: true,
        }),
        storyTrustedLabel: f.text("Trusted-by label", {
          max: 60,
          optional: true,
        }),
        storyTrustedItems: f.strings("Trusted by", { max: 12 }),
        storyImage: f.image("Photo beside the story", {
          optional: true,
          hint: "In the dark story band, above the stats. Empty uses the first Our space photo.",
        }),
      },
      defaults: async () => {
        const c = await aboutContent();
        return {
          storyLabel: c.storyLabel,
          storyTitle: c.storyTitle,
          storyBody1: c.storyBody1,
          storyBody2: c.storyBody2,
          storyHighlightLabel: c.storyHighlightLabel,
          storyHighlightTitle: c.storyHighlightTitle,
          storyHighlightBody: c.storyHighlightBody,
          storyTrustedLabel: c.storyTrustedLabel,
          storyTrustedItems: c.storyTrustedItems,
          storyImage: "",
        };
      },
    }),
    section({
      key: "expertise",
      label: "What we bring",
      fields: {
        expertiseLabel: f.eyebrow(),
        expertiseTitle: f.accent("Heading", { max: 200 }),
        expertiseBody: f.textarea("Intro", {
          max: 600,
          rows: 3,
          optional: true,
        }),
        items: f.list(
          "Strengths",
          "Strength",
          {
            icon: f.select("Icon", ABOUT_ICONS),
            title: f.text("Title", { max: 80 }),
            description: f.textarea("Description", { max: 400, rows: 2 }),
            metricValue: f.text("Figure", { max: 20, optional: true }),
            metricLabel: f.text("Figure label", { max: 60, optional: true }),
            ...visible,
          },
          { titleKey: "title", max: 12 },
        ),
      },
      defaults: async () => {
        const [c, items] = await Promise.all([
          aboutContent(),
          fetchAboutExpertiseItems(),
        ]);
        return {
          expertiseLabel: c.expertiseLabel,
          expertiseTitle: c.expertiseTitle,
          expertiseBody: c.expertiseBody,
          items: items.map((i) => ({ ...i, icon: i.icon as string })),
        };
      },
    }),
    section({
      key: "team",
      label: "Team heading",
      description:
        "Heading over the team carousel. People and portfolios are edited under About & team.",
      fields: {
        teamLabel: f.eyebrow(),
        teamTitle: f.accent("Heading", { max: 200 }),
        teamBody: f.textarea("Intro", { max: 600, rows: 3, optional: true }),
      },
      defaults: async () => {
        const c = await aboutContent();
        return {
          teamLabel: c.teamLabel,
          teamTitle: c.teamTitle,
          teamBody: c.teamBody,
        };
      },
    }),
    section({
      key: "journey",
      label: "Our journey",
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading(),
        items: f.list(
          "Milestones",
          "Milestone",
          {
            year: f.text("Year", { max: 12 }),
            title: f.text("Title", { max: 100 }),
            description: f.textarea("Description", { max: 400, rows: 2 }),
            ...visible,
          },
          { titleKey: "year", max: 30 },
        ),
      },
      defaults: async () => ({
        eyebrow: "Our journey",
        title: "How we *got here*",
        items: await fetchAboutMilestones(),
      }),
    }),
    section({
      key: "values",
      label: "Our values",
      fields: {
        valuesLabel: f.eyebrow(),
        valuesTitle: f.accent("Heading", { max: 200 }),
        valuesBody: f.textarea("Intro", { max: 600, rows: 3, optional: true }),
        items: f.list(
          "Values",
          "Value",
          {
            icon: f.select("Icon", ABOUT_ICONS),
            title: f.text("Title", { max: 80 }),
            description: f.textarea("Description", { max: 400, rows: 2 }),
            ...visible,
          },
          { titleKey: "title", max: 12 },
        ),
      },
      defaults: async () => {
        const [c, items] = await Promise.all([
          aboutContent(),
          fetchAboutValueItems(),
        ]);
        return {
          valuesLabel: c.valuesLabel,
          valuesTitle: c.valuesTitle,
          valuesBody: c.valuesBody,
          items: items.map((i) => ({ ...i, icon: i.icon as string })),
        };
      },
    }),
    section({
      key: "space",
      label: "Our space",
      fields: {
        spaceLabel: f.eyebrow(),
        spaceTitle: f.accent("Heading", { max: 200 }),
        spaceBody: f.textarea("Intro", { max: 600, rows: 3, optional: true }),
        items: f.list(
          "Photos and videos",
          "Item",
          {
            title: f.text("Title", { max: 80, optional: true }),
            description: f.textarea("Caption", {
              max: 300,
              rows: 2,
              optional: true,
            }),
            mediaType: f.select("Type", [
              { value: "IMAGE", label: "Photo" },
              { value: "VIDEO", label: "Video" },
            ]),
            mediaPublicId: f.image("Photo, or video cover", { optional: true }),
            thumbnailPublicId: f.image("Video thumbnail", {
              optional: true,
              hint: "Only for videos.",
            }),
            ...visible,
          },
          { titleKey: "title", max: 12 },
        ),
      },
      defaults: async () => {
        const [c, items] = await Promise.all([
          aboutContent(),
          fetchAboutSpaceItems(),
        ]);
        return {
          spaceLabel: c.spaceLabel,
          spaceTitle: c.spaceTitle,
          spaceBody: c.spaceBody,
          items: items.map((i) => ({
            ...i,
            mediaType: i.mediaType as string,
            mediaPublicId: i.mediaPublicId ?? "",
            thumbnailPublicId: i.thumbnailPublicId ?? "",
          })),
        };
      },
    }),
    section({
      key: "closing",
      label: "Closing call to action",
      fields: {
        ctaTitle: f.accent("Heading", { max: 200 }),
        ctaBody: f.textarea("Body", { max: 300, rows: 2, optional: true }),
        image: f.image("Image"),
        primary: f.link("Main button"),
        whatsappLabel: f.text("WhatsApp button text", { max: 40 }),
      },
      defaults: async () => {
        const c = await aboutContent();
        return {
          ctaTitle: c.ctaTitle,
          ctaBody: c.ctaBody,
          image: STOCK.teamCafe as string,
          primary: { label: "Talk to us", href: "/contact" },
          whatsappLabel: "Chat on WhatsApp",
        };
      },
    }),
    seoSection(async () => ({
      title: "About us",
      description: (await aboutContent()).heroBody.slice(0, 200),
    })),
  ],
});

/* ── Contact ────────────────────────────────────────────────────────────── */

export const CONTACT_PAGE = page({
  key: "contact",
  label: "Contact",
  path: "/contact",
  area: "contact",
  group: "Pages",
  description:
    "Phone numbers, emails, address and socials are in Site settings → Business details.",
  sections: [
    section({
      key: "hero",
      label: "Hero",
      canHide: false,
      fields: heroFields(),
      defaults: async () => {
        const c = await fetchContactPageContent();
        return { eyebrow: "Talk to us", title: c.heroTitle, body: c.heroBody };
      },
    }),
    section({
      key: "whatsapp",
      label: "WhatsApp card",
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading(),
        body: f.textarea("Body", { max: 200, rows: 2 }),
      },
      defaults: {
        eyebrow: "Fastest reply",
        title: "Chat with us on *WhatsApp*",
        body: "Send us a message and a real person will reply, usually within minutes during working hours.",
      },
    }),
    section({
      key: "details",
      label: "Contact details labels",
      canHide: false,
      fields: {
        emailLabel: f.text("Email label", { max: 30 }),
        phoneLabel: f.text("Phone label", { max: 30 }),
        addressLabel: f.text("Address label", { max: 30 }),
        socialsLabel: f.text("Socials label", { max: 30 }),
      },
      defaults: async () => {
        const c = await fetchContactPageContent();
        return {
          emailLabel: c.emailLabel,
          phoneLabel: c.phoneLabel,
          addressLabel: c.addressLabel,
          socialsLabel: c.socialsLabel,
        };
      },
    }),
    section({
      key: "form",
      label: "Contact form",
      canHide: false,
      fields: {
        eyebrow: f.eyebrow(),
        title: f.heading(),
        body: f.textarea("Body", { max: 300, rows: 2 }),
        nameLabel: f.text("Name label", { max: 30 }),
        emailLabel: f.text("Email label", { max: 30 }),
        messageLabel: f.text("Message label", { max: 30 }),
        submit: f.text("Button", { max: 30 }),
        sending: f.text("Button while sending", { max: 30 }),
      },
      defaults: async () => {
        const c = await fetchContactPageContent();
        return {
          eyebrow: c.formEyebrow,
          title: c.formTitle,
          body: c.formBody,
          nameLabel: "Name",
          emailLabel: "Email",
          messageLabel: "Message",
          submit: "Send message",
          sending: "Sending…",
        };
      },
    }),
    section({
      key: "map",
      label: "Map",
      description: "A map of the address from Business details.",
      fields: { show: f.toggle("Show the map") },
      defaults: { show: true },
    }),
    section({
      key: "faq",
      label: "Questions",
      fields: faqFields,
      defaults: {
        eyebrow: "",
        title: "Before you *get in touch*",
        items: [
          {
            q: "How quickly will you reply?",
            a: "We reply to messages within one working day, and usually much sooner on WhatsApp.",
          },
          {
            q: "Do you work with clients outside Nigeria?",
            a: "Yes. We work with clients across Africa, Europe and North America, and can quote in naira, dollars, euros or pounds.",
          },
          {
            q: "Can I visit the studio?",
            a: "Of course. Send us a message to book a time and we'll have the coffee ready.",
          },
        ],
      },
    }),
    section({
      key: "browse",
      label: "Browse band",
      fields: {
        title: f.heading(),
        primary: f.link("Main button"),
        secondary: f.link("Second button"),
      },
      defaults: {
        title: "Prefer to browse first? *See our work*",
        primary: { label: "See our work", href: "/works" },
        secondary: { label: "View offers", href: "/offers" },
      },
    }),
    seoSection(async () => {
      const c = await fetchContactPageContent();
      return {
        title: "Talk to us",
        description: `${c.heroBody} ${c.address}`.trim().slice(0, 200),
      };
    }),
  ],
});

/** Headings and buttons on /webrandschools that aren't in the We Brand Schools content. */
export const WE_BRAND_SCHOOLS_PAGE = page({
  key: "webrandschools",
  label: "We Brand Schools",
  path: "/webrandschools",
  area: "schools",
  group: "Pages",
  description:
    "Headings and buttons around the page. The hero, steps, templates, portal and testimonials are edited under We Brand Schools.",
  sections: [
    section({
      key: "labels",
      label: "Headings and buttons",
      description:
        "Words that frame the sections managed under We Brand Schools.",
      canHide: false,
      fields: {
        testimonialsEyebrow: f.eyebrow(),
        testimonialsTitle: f.heading("Testimonials heading"),
        processButton: f.text("How it works button", { max: 40 }),
        templatesHelpButton: f.text("Templates help button", {
          max: 40,
          hint: "Opens WhatsApp (from Site settings).",
        }),
        previewButton: f.text("Template preview button", { max: 30 }),
        chooseButton: f.text("Template choose button", { max: 30 }),
        showMoreButton: f.text("Show more templates button", { max: 40 }),
        emptyTitle: f.text("When there are no templates: heading", {
          max: 80,
        }),
        emptyBody: f.textarea("When there are no templates: text", {
          max: 200,
          rows: 2,
        }),
        emptyButton: f.text("When there are no templates: button", {
          max: 40,
        }),
        helpEyebrow: f.text("Help block: small label", { max: 60 }),
        helpTitle: f.heading("Help block: heading"),
        helpBody: f.textarea("Help block: text", { max: 240, rows: 3 }),
        helpChatButton: f.text("Help block: chat button", { max: 40 }),
        helpBackButton: f.text("Help block: back button", { max: 40 }),
      },
      defaults: {
        testimonialsEyebrow: "Testimonials",
        testimonialsTitle: "Trusted by schools *across Nigeria*",
        processButton: "Start here",
        templatesHelpButton: "Need help choosing?",
        previewButton: "Preview",
        chooseButton: "Choose this",
        showMoreButton: "Show more templates",
        emptyTitle: "Templates are on their way",
        emptyBody:
          "We're adding website templates here. Talk to us and we'll show you what's ready.",
        emptyButton: "Talk to us",
        helpEyebrow: "Need help?",
        helpTitle: "Questions before you *apply*?",
        helpBody:
          "Talk to the team. We'll help you pick a template and walk you through what happens next.",
        helpChatButton: "Chat with us",
        helpBackButton: "Back to templates",
      },
    }),
    seoSection({
      title: "We Brand Schools",
      description:
        "Free, professionally designed websites for private schools, with a complete school portal. You only pay for your domain and hosting.",
    }),
  ],
});

export const MAIN_PAGES = [
  SERVICES_PAGE,
  WORKS_PAGE,
  CATALOGUES_PAGE,
  OFFERS_PAGE_CONTENT,
  EVENTS_PAGE,
  THOUGHTS_PAGE,
  EXPRESSIONS_PAGE,
  ABOUT_PAGE,
  CONTACT_PAGE,
  WE_BRAND_SCHOOLS_PAGE,
];
