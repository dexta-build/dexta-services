import { STOCK } from "./stock-media";

/**
 * Homepage copy that has no database table yet. The admin phase will move
 * these into editable content; until then edit them here.
 *
 * Text in `*asterisks*` renders as the serif italic accent (see renderAccent).
 */

export const HOME_FALLBACK_HERO = {
  headline: "Saturating our world with *imprints* of value",
  body: "From identity systems to digital products to premium print, we shape launches and moments that feel sharp, connected and impossible to ignore.",
  ctaText: "See our work",
  ctaHref: "/works",
};

export const HOME_LOGOS = {
  title:
    "Creative support for brands across Nigeria, and the products we've built",
};

export const HOME_ABOUT = {
  eyebrow: "Who we are",
  title:
    "Not just an agency. Your *creative partner* from first idea to final piece.",
  lead: "Dexta brings design, software and print under one roof, so your brand looks and works the same everywhere: on screen, on paper and in the room.",
  body: "We work with founders, growing businesses and families planning life's big moments. One team, one point of contact, and work you're proud to show off.",
  cta: { label: "Meet the team", href: "/team" },
  image: "/images/about.png",
};

export const HOME_SERVICES = {
  eyebrow: "What we do",
  title: "Everything your brand needs, *under one roof*",
  /** Card panel colours, in order Design, Build, Print. */
  panels: [
    "bg-brand-cyan text-royal",
    "bg-ocean-deep text-white",
    "bg-ice text-royal",
  ],
  /** Accent words per service title. */
  headlines: {
    DESIGN: "*Design* that stands out",
    BUILD: "Software that *just works*",
    PRINT: "Print you can *feel*",
  } as Record<"DESIGN" | "BUILD" | "PRINT", string>,
  /** Card photos (stock until real work is uploaded). */
  images: {
    DESIGN: STOCK.designerTablet,
    BUILD: STOCK.developerScreens,
    PRINT: STOCK.weddingTable,
  } as Record<"DESIGN" | "BUILD" | "PRINT", string>,
  /** Used only if the admin's service description is empty. */
  fallbackDescriptions: {
    DESIGN:
      "Brand identities, social creative and packaging that people remember.",
    BUILD:
      "Websites, apps and platforms that are fast, beautiful and easy to run.",
    PRINT: "Invitations, brochures, signage and merch, finished to perfection.",
  } as Record<"DESIGN" | "BUILD" | "PRINT", string>,
};

export const HOME_ADVANTAGE = {
  eyebrow: "Your creative advantage",
  title: "The creative partner your brand *has been waiting for*",
  lead: "Dexta is your dedicated creative team, with the design, software and print skills to show up well everywhere that matters.",
  body: "See us as an extension of your team, freeing you to focus on running your business or enjoying your big day.",
  cta: { label: "Start a project", href: "/contact" },
  teaserWords: ["design", "build", "print"],
  teaserImages: [
    STOCK.weddingCouple,
    STOCK.designerTablet,
    STOCK.developerScreens,
    STOCK.goldRibbons,
    STOCK.colourSwatches,
    STOCK.eventStage,
  ],
};

/**
 * PLACEHOLDER NUMBERS: replace with Dexta's real figures before launch.
 * They become admin-editable in the admin phase.
 */
export const HOME_STATS = {
  eyebrow: "By the numbers",
  title: "Work that *speaks for itself*",
  items: [
    {
      value: 500,
      suffix: "+",
      label: "Projects delivered across design, build and print.",
    },
    {
      value: 150,
      suffix: "+",
      label: "Brands, businesses and families we have worked with.",
    },
    {
      value: 98,
      suffix: "%",
      label: "Of clients who come back or refer a friend.",
    },
    {
      value: 7,
      suffix: "",
      label: "Years of turning bold ideas into finished work.",
    },
  ],
};

export const HOME_NETWORK = {
  eyebrow: "Our services",
  title:
    "Move fast with *20+ creative services*, for every brand and *every moment*",
  /** `image` adds a small thumbnail inside the chip, as on Superside. */
  chips: [
    {
      label: "Brand identity",
      href: "/services/design/brand-identity",
      image: STOCK.colourSwatches,
    },
    { label: "Logo design", href: "/services/design/brand-identity" },
    { label: "Social media", href: "/services/design/social-media-creative" },
    {
      label: "Websites",
      href: "/services/build/websites",
      image: STOCK.laptopBrowsing,
    },
    { label: "Mobile apps", href: "/services/build/mobile-apps" },
    {
      label: "Invitation cards",
      href: "/services/print/invitation-cards",
      image: STOCK.weddingRings,
    },
    { label: "Packaging", href: "/services/design/packaging-design" },
    {
      label: "UI/UX design",
      href: "/services/design/ui-ux-design",
      image: STOCK.phoneUi,
    },
    { label: "Web apps", href: "/services/build/web-applications" },
    {
      label: "E-commerce",
      href: "/services/build/e-commerce",
      image: STOCK.shoppingLaptopPhone,
    },
    { label: "Brochures", href: "/services/print/brochures-flyers" },
    {
      label: "Event branding",
      href: "/catalogue/events",
      image: STOCK.eventStage,
    },
    { label: "Business cards", href: "/services/print/business-stationery" },
    { label: "Signage", href: "/services/print/banners-signage" },
    {
      label: "Presentations",
      href: "/services/design/presentation-design",
      image: STOCK.laptopCharts,
    },
    {
      label: "Merchandise",
      href: "/services/print/branded-merchandise",
      image: STOCK.giftRibbon,
    },
    { label: "Illustration", href: "/services/design/illustration-motion" },
    {
      label: "Motion graphics",
      href: "/services/design/illustration-motion",
      image: STOCK.paintStrokes,
    },
    { label: "Wedding stationery", href: "/catalogue/wedding" },
    { label: "Large format", href: "/services/print/large-format" },
    {
      label: "School portals",
      href: "/webrandschools",
      image: STOCK.teamLibrary,
    },
    { label: "Hosting & care", href: "/services/build/support-maintenance" },
    {
      label: "Souvenirs",
      href: "/catalogue/wedding",
      image: STOCK.goldRibbons,
    },
    { label: "…and more", href: "/services" },
  ],

  /**
   * The people we serve. x/y place each avatar on tablet/desktop (percent of
   * the right-hand panel); mx/my place it on phones (panel below the logo).
   */
  audiences: [
    {
      label: "Startups",
      image: STOCK.manPortraitA,
      x: 22,
      y: 20,
      mx: 18,
      my: 30,
      size: "sm",
    },
    {
      label: "Brides & grooms",
      image: STOCK.womanPortraitA,
      x: 55,
      y: 14,
      mx: 50,
      my: 22,
      size: "lg",
    },
    {
      label: "Schools",
      image: STOCK.womanPortraitD,
      x: 88,
      y: 24,
      mx: 82,
      my: 32,
      size: "sm",
    },
    {
      label: "SMEs",
      image: STOCK.manPortraitB,
      x: 30,
      y: 52,
      mx: 24,
      my: 62,
      size: "lg",
    },
    {
      label: "Event planners",
      image: STOCK.womanPortraitC,
      x: 66,
      y: 48,
      mx: 70,
      my: 60,
      size: "lg",
    },
    {
      label: "Churches",
      image: STOCK.manPortraitC,
      x: 20,
      y: 84,
      mx: 16,
      my: 90,
      size: "sm",
    },
    {
      label: "Families",
      image: STOCK.womanPortraitB,
      x: 52,
      y: 86,
      mx: 48,
      my: 92,
      size: "sm",
    },
    {
      label: "Corporates",
      image: STOCK.womanPortraitE,
      x: 86,
      y: 78,
      mx: 84,
      my: 88,
      size: "sm",
    },
  ],
};

export const HOME_WORKS = {
  eyebrow: "Our work",
  title: "See what we've *made lately*",
  cta: { label: "Explore all our work", href: "/works" },
};

export const HOME_CATALOGUE = {
  eyebrow: "Catalogues",
  title: "Shop ready-made designs for *every occasion*",
  body: "Browse our catalogues, pick a design you love, and order on WhatsApp in your quantity.",
};

export const HOME_COMPARISON = {
  eyebrow: "Why Dexta",
  title: "Freelancer, agency or print shop? *Why not all three.*",
  columns: ["Design", "Build", "Print", "One contact", "Speed", "Quality"],
  rows: [
    {
      name: "Dexta",
      note: "Design, software and print from one team that knows your brand.",
      values: [true, true, true, true, true, true],
      highlight: true,
    },
    {
      name: "Freelancers",
      note: "Great for one-off tasks, harder to scale or keep consistent.",
      values: [true, false, false, false, true, false],
    },
    {
      name: "Traditional agencies",
      note: "Strong on strategy, often slow and costly for everyday needs.",
      values: [true, true, false, true, false, true],
    },
    {
      name: "Print shops",
      note: "They print what you send. Design is usually an afterthought.",
      values: [false, false, true, false, true, false],
    },
    {
      name: "DIY tools",
      note: "Quick and cheap, but your brand ends up looking like everyone else.",
      values: [true, false, false, false, true, false],
    },
  ],
};

export const HOME_TESTIMONIALS = {
  eyebrow: "Don't just take it from us",
  title: "Kind words from *the people we work with*",
};

export const HOME_CLOSING = {
  title: "Your next big moment *starts here*",
  body: "Tell us what you're planning. We'll take it from idea to finished piece.",
  image: "/images/services.png",
};

/**
 * Offers currently running. Empty means the homepage offers band is hidden.
 * Phase 6 replaces this with offers from the database that have start and
 * end dates, so expired offers disappear on their own.
 */
export const HOME_PROCESS = {
  eyebrow: "Easy & hassle-free",
  title: "One team, one process, *made around you*",
  body: "Whatever you need, getting started is simple: message us, approve the design, and we handle the rest.",
  chat: {
    title: "Order on WhatsApp *in minutes*",
    caption: "Pick from a catalogue or describe your idea. We reply fast.",
    messages: [
      {
        from: "client",
        text: "Hi Dexta! I need 200 wedding invitation cards 💌",
      },
      {
        from: "dexta",
        text: "Congratulations! Here are 3 designs from our Wedding catalogue.",
      },
      {
        from: "client",
        text: "The gold one is perfect. Can you add our names?",
      },
      { from: "dexta", text: "Of course. Proof coming your way today ✨" },
    ] as { from: "client" | "dexta"; text: string }[],
  },
  progress: {
    title: "From brief to delivery, *always in the loop*",
    body: "One point of contact keeps you updated at every step, so you always know what's happening and when.",
    steps: [
      "Brief received",
      "Concepts shared",
      "Revisions done",
      "Printed & delivered",
    ],
  },
  brandKit: {
    title: "Always *on brand*",
    body: "We keep your colours, fonts and logos on file, so every piece looks like you.",
  },
  currency: {
    title: "Pay *your way*",
    body: "See prices in naira, dollars, euros or pounds, wherever you are in the world.",
  },
};

export const HOME_DIFFERENCE = {
  eyebrow: "Our difference",
  title: "Dexta is built for people who *refuse to blend in*",
  items: [
    {
      icon: "gem",
      label: "Crafted",
      title: "Quality you can feel",
      body: "Thoughtful design and careful finishing on every piece, big or small.",
    },
    {
      icon: "zap",
      label: "Fast",
      title: "Quick turnarounds",
      body: "Clear timelines and a team that moves at the speed of your plans.",
    },
    {
      icon: "layers",
      label: "All in one",
      title: "Design, build and print",
      body: "One team for your brand, your website and everything you print.",
    },
    {
      icon: "globe",
      label: "Global",
      title: "Clients everywhere",
      body: "Based in Port Harcourt, working with people across Nigeria and abroad.",
    },
  ] as {
    icon: "gem" | "zap" | "layers" | "globe";
    label: string;
    title: string;
    body: string;
  }[],
};

export const HOME_SPLITS = [
  {
    surface: "plum",
    eyebrow: "Work with the best",
    title: "*Creative talent* that raises the bar",
    lead: "Designers, developers, illustrators and print specialists who care about the details.",
    body: "A dedicated project lead keeps everything aligned, from the first sketch to the final delivery.",
    cta: { label: "Meet the team", href: "/team" },
    image: STOCK.teamLaptopCasual,
  },
  {
    surface: "forest",
    eyebrow: "Life's big moments",
    title: "Your celebration deserves *better than templates*",
    lead: "Weddings, birthdays, launches and memorials: moments like these deserve design made just for you.",
    body: "Browse our catalogues for ready-made favourites, or let us create something completely new.",
    cta: { label: "Browse catalogues", href: "/catalogue" },
    image: STOCK.weddingCouple,
  },
];

/**
 * Sample projects: the Works page shows these while its "Projects gallery"
 * section is set to the samples, and they seed the hero showcase.
 */

export type SampleProject = {
  id: string;
  /** Used in the URL: /works/[slug] */
  slug: string;
  title: string;
  category: string;
  pillar: "DESIGN" | "BUILD" | "PRINT";
  featured?: boolean;
  tags: string[];
  description: string;
  images: string[];
};

export const HOME_SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "sample-wedding",
    slug: "wedding-stationery-suite",
    title: "Wedding stationery suite",
    category: "Wedding · Print",
    pillar: "PRINT",
    featured: true,
    tags: ["Invitation cards", "Programmes", "Welcome signage"],
    description:
      "A matching set of invitations, programmes and venue signage in soft gold, designed and printed for a 300-guest celebration.",
    images: [
      STOCK.weddingRings,
      STOCK.weddingTable,
      STOCK.weddingCouple,
      STOCK.goldRibbons,
      STOCK.weddingAisle,
    ],
  },
  {
    id: "sample-launch",
    slug: "product-launch-night",
    title: "Product launch night",
    category: "Events · Design",
    pillar: "DESIGN",
    featured: true,
    tags: ["Event branding", "Stage visuals", "Merchandise"],
    description:
      "Stage visuals, wristbands, banners and social graphics for a product launch, delivered in two weeks.",
    images: [
      STOCK.eventStage,
      STOCK.confettiConcert,
      STOCK.celebrationToast,
      STOCK.balloons,
      STOCK.dinnerParty,
    ],
  },
  {
    id: "sample-identity",
    slug: "brand-identity-refresh",
    title: "Brand identity refresh",
    category: "Design",
    pillar: "DESIGN",
    tags: ["Brand identity", "Packaging", "Guidelines"],
    description:
      "A new logo, colour system and packaging range for a growing lifestyle brand, with guidelines the team can use every day.",
    images: [
      STOCK.colourSwatches,
      STOCK.designerTablet,
      STOCK.typeOnTablet,
      STOCK.giftRibbon,
      STOCK.craftSupplies,
    ],
  },
  {
    id: "sample-store",
    slug: "online-store-build",
    title: "Online store build",
    category: "Build",
    pillar: "BUILD",
    tags: ["Web design", "E-commerce", "Payments"],
    description:
      "A fast online store with local and international payments, built so the owner can add products in minutes.",
    images: [
      STOCK.shoppingLaptopPhone,
      STOCK.developerScreens,
      STOCK.cardPayment,
      STOCK.shopOwner,
      STOCK.laptopAnalytics,
    ],
  },
  {
    id: "sample-birthday",
    slug: "50th-birthday-celebration",
    title: "50th birthday celebration",
    category: "Birthdays · Print",
    pillar: "PRINT",
    tags: ["Invitations", "Backdrop", "Party favours"],
    description:
      "Invitations, a photo backdrop and personalised favours for a milestone birthday party.",
    images: [
      STOCK.balloons,
      STOCK.giftRibbon,
      STOCK.celebrationToast,
      STOCK.friendsSunset,
    ],
  },
  {
    id: "sample-portal",
    slug: "school-portal",
    title: "School website & portal",
    category: "Education · Build",
    pillar: "BUILD",
    tags: ["Website", "Parent portal", "Results"],
    description:
      "A website and parent portal where families check results, pay fees and get announcements, set up in under a month.",
    images: [
      STOCK.teamLibrary,
      STOCK.laptopBrowsing,
      STOCK.phoneAppUi,
      STOCK.laptopPhone,
    ],
  },
  {
    id: "sample-corporate",
    slug: "company-offsite-kit",
    title: "Company offsite kit",
    category: "Corporate · Print",
    pillar: "PRINT",
    tags: ["Branded merch", "Name badges", "Presentations"],
    description:
      "Branded notebooks, badges, roll-up banners and presentation slides for a three-day company retreat.",
    images: [
      STOCK.teamCafe,
      STOCK.notebook,
      STOCK.whiteTshirt,
      STOCK.teamWhiteboard,
    ],
  },
  {
    id: "sample-booking",
    slug: "booking-app",
    title: "Salon booking app",
    category: "Mobile app · Build",
    pillar: "BUILD",
    tags: ["Mobile app", "Payments", "Notifications"],
    description:
      "An iOS and Android app for booking appointments, paying deposits and getting reminders.",
    images: [
      STOCK.phoneAppUi,
      STOCK.laptopPhoneApp,
      STOCK.tabletSketch,
      STOCK.analyticsDark,
    ],
  },
  {
    id: "sample-gala",
    slug: "gala-dinner-branding",
    title: "Gala dinner branding",
    category: "Events · Print",
    pillar: "PRINT",
    tags: ["Table cards", "Menus", "Signage"],
    description:
      "Menus, table cards and entrance signage for an elegant fundraising dinner.",
    images: [
      STOCK.dinnerParty,
      STOCK.eventTableSetup,
      STOCK.weddingTable,
      STOCK.goldRibbons,
    ],
  },
  {
    id: "sample-social",
    slug: "social-media-campaign",
    title: "Social media campaign",
    category: "Design",
    pillar: "DESIGN",
    tags: ["Social creative", "Photography", "Ads"],
    description:
      "A colourful month-long social campaign with photography, carousel posts and short ads.",
    images: [
      STOCK.colourfulPortrait,
      STOCK.socialLaptopPhone,
      STOCK.typeOnTablet,
      STOCK.colourSwatches,
    ],
  },
];
