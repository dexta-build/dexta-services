/**
 * Content for the Services pages: /services, /services/[pillar] and
 * /services/[pillar]/[service]. Every service page uses the same template
 * (patterned on Superside's service pages); this file only holds words and
 * image choices. The admin phase will make this editable.
 *
 * Text in *asterisks* renders as the serif italic accent.
 * Images are STOCK keys (placeholders until real work is uploaded).
 * Numbers marked PLACEHOLDER must be replaced with Dexta's real figures.
 */
import { SERVICE_GROUPS } from "./navigation";
import { STOCK } from "./stock-media";

export type PillarKey = "design" | "build" | "print";
type StockId = (typeof STOCK)[keyof typeof STOCK];

export type Offering = {
  title: string;
  description: string;
  image: StockId;
  /** Set on pillar pages so each card opens its service page. */
  href?: string;
};

export type ServicePage = {
  pillar: PillarKey;
  slug: string;
  /** Short name used in breadcrumbs, menus and FAQs ("print"). */
  shortName: string;
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    image: StockId;
    chips: { label: string; image: StockId }[];
  };
  problem: {
    eyebrow: string;
    title: string;
    lead: string;
    body: string;
    image: StockId;
  };
  trust: {
    eyebrow: string;
    title: string;
    body: string;
    stats: { value: number; suffix?: string; label: string }[];
  };
  offerings: {
    eyebrow: string;
    title: string;
    body: string;
    items: Offering[];
  };
  /** Build only: technologies we work with, shown as chips. */
  techStack?: {
    eyebrow: string;
    title: string;
    body: string;
    groups: { label: string; items: string[] }[];
  };
  useCases: {
    eyebrow: string;
    title: string;
    body: string;
    items: { icon: UseCaseIcon; title: string; description: string }[];
  };
  quality: {
    eyebrow: string;
    title: string;
    body: string;
    image: StockId;
    items: { label: string; title: string }[];
  };
  process: {
    eyebrow: string;
    title: string;
    body: string;
    steps: { title: string; description: string }[];
  };
  faqs: { q: string; a: string }[];
  closing: { title: string; body: string; image: StockId };
};

export type UseCaseIcon =
  | "rocket"
  | "store"
  | "heart"
  | "graduation"
  | "church"
  | "building"
  | "megaphone"
  | "calendar"
  | "users"
  | "globe";

/* ------------------------------------------------------------------ */
/* Pillars                                                             */
/* ------------------------------------------------------------------ */

const DESIGN: ServicePage = {
  pillar: "design",
  slug: "design",
  shortName: "design",
  hero: {
    eyebrow: "Design services",
    title: "Design that makes your brand *impossible to ignore*",
    body: "Brand identities, social creative, packaging and interfaces, crafted by a team that cares about every detail and moves at the speed of your plans.",
    image: STOCK.designerTablet,
    chips: [
      { label: "Brand identity", image: STOCK.colourSwatches },
      { label: "Social media", image: STOCK.socialLaptopPhone },
      { label: "Presentations", image: STOCK.laptopCharts },
      { label: "Packaging", image: STOCK.craftSupplies },
      { label: "Illustration", image: STOCK.paintStrokes },
      { label: "UI/UX design", image: STOCK.tabletSketch },
    ],
  },
  problem: {
    eyebrow: "Design made easy",
    title: "Look established from *day one*",
    lead: "People decide in seconds whether to trust a brand. Good design earns that trust before you say a word.",
    body: "We turn your ideas into a clear, consistent look across everything you put out: your logo, your posts, your packaging and your pitch.",
    image: STOCK.colourSwatches,
  },
  trust: {
    eyebrow: "Design you can trust",
    title: "A design partner *you can rely on*",
    body: "Founders, families and growing businesses come back to us because the work is good and the process is easy.",
    // PLACEHOLDER numbers
    stats: [
      { value: 300, suffix: "+", label: "Design projects delivered" },
      { value: 4.9, suffix: "/5", label: "Average client rating" },
    ],
  },
  offerings: {
    eyebrow: "What we offer",
    title: "Designed to impress *everywhere you show up*",
    body: "From a new logo to a full campaign, pick what you need or let us build the whole system.",
    items: [], // filled from the design services below
  },
  useCases: {
    eyebrow: "Who it's for",
    title: "*Stand out* where most brands blend in",
    body: "Whether you're launching, growing or celebrating, we design for the moments that matter to you.",
    items: [
      {
        icon: "rocket",
        title: "Startups",
        description: "A launch-ready identity, pitch deck and website visuals.",
      },
      {
        icon: "store",
        title: "Small businesses",
        description:
          "Logos, menus, flyers and social posts that bring customers in.",
      },
      {
        icon: "heart",
        title: "Weddings & celebrations",
        description:
          "Monograms, colour stories and stationery for your big day.",
      },
      {
        icon: "graduation",
        title: "Schools",
        description:
          "Crests, prospectuses and branded materials parents trust.",
      },
      {
        icon: "church",
        title: "Churches & NGOs",
        description: "Event graphics, programmes and campaign creative.",
      },
      {
        icon: "building",
        title: "Corporates",
        description: "Brand refreshes, presentations and internal campaigns.",
      },
    ],
  },
  quality: {
    eyebrow: "How we keep it sharp",
    title: "*Creative craft*, careful checks",
    body: "Every design is reviewed by a second designer before it reaches you.",
    image: STOCK.abstract3d,
    items: [
      {
        label: "Brand fit",
        title: "Checked against your brand colours, fonts and tone",
      },
      {
        label: "Every format",
        title: "Delivered in the sizes and files you actually need",
      },
      { label: "Ownership", title: "Source files are yours to keep, always" },
    ],
  },
  process: {
    eyebrow: "How we work",
    title: "A process built for *clarity and speed*",
    body: "One point of contact takes you from brief to final files without the back-and-forth.",
    steps: [
      {
        title: "Brief",
        description:
          "Tell us what you need, your timeline and any references you love.",
      },
      {
        title: "Concepts",
        description:
          "We share two or three directions so you can choose with confidence.",
      },
      {
        title: "Refine",
        description: "We polish your chosen direction with your feedback.",
      },
      {
        title: "Approve",
        description:
          "You sign off on the final design and every format you need.",
      },
      {
        title: "Deliver",
        description:
          "Print-ready and web-ready files, organised and named clearly.",
      },
    ],
  },
  faqs: [
    {
      q: "How long does a design project take?",
      a: "Most social and print designs take 2–5 working days. A full brand identity usually takes 2–4 weeks, depending on feedback.",
    },
    {
      q: "How many revisions do I get?",
      a: "We include two rounds of revisions on every project, and we're happy to discuss more for larger work.",
    },
    {
      q: "Do I own the final designs?",
      a: "Yes. Once the project is paid for, you own the final designs and receive the source files.",
    },
    {
      q: "Can you design and print at the same time?",
      a: "Absolutely. That's one of our strengths: we design with print in mind and handle production for you.",
    },
    {
      q: "Can I pay from outside Nigeria?",
      a: "Yes. We accept payment in naira, dollars, euros and pounds.",
    },
  ],
  closing: {
    title: "Now imagine this *creative power* behind your next project",
    body: "Tell us what you're working on. We'll take it from idea to finished design.",
    image: STOCK.teamLaptopCasual,
  },
};

const BUILD: ServicePage = {
  pillar: "build",
  slug: "build",
  shortName: "software",
  hero: {
    eyebrow: "Build · Software engineering",
    title: "Websites and software that *work as hard as you do*",
    body: "We design, build and look after websites, web apps and mobile apps that are fast, secure and easy to run, so you can focus on your business.",
    image: STOCK.developerScreens,
    chips: [
      { label: "Websites", image: STOCK.laptopBrowsing },
      { label: "Web apps", image: STOCK.analyticsDark },
      { label: "Mobile apps", image: STOCK.phoneAppUi },
      { label: "E-commerce", image: STOCK.shoppingLaptopPhone },
      { label: "School portals", image: STOCK.teamLibrary },
      { label: "Support", image: STOCK.serverRack },
    ],
  },
  problem: {
    eyebrow: "Engineering made easy",
    title: "Your website isn't a brochure, *it's your best salesperson*",
    lead: "A slow, outdated site costs you customers every day. A good one works around the clock.",
    body: "We build modern, mobile-first products that load fast, rank well and are simple for your team to update, then we stay on to keep them secure.",
    image: STOCK.laptopCode,
  },
  trust: {
    eyebrow: "Built to last",
    title: "An engineering team *you can trust*",
    body: "From five-page business sites to platforms with thousands of users, we ship software that keeps working.",
    // PLACEHOLDER numbers
    stats: [
      { value: 120, suffix: "+", label: "Websites and apps launched" },
      { value: 4.9, suffix: "/5", label: "Average client rating" },
    ],
  },
  offerings: {
    eyebrow: "What we build",
    title: "Engineering that *scales with you*",
    body: "Start with what you need today. We build so it can grow with you tomorrow.",
    items: [],
  },
  techStack: {
    eyebrow: "Our tech stack",
    title: "Modern tools, *proven in production*",
    body: "We pick the right tools for your project, not the trendiest ones, so your product stays fast and easy to maintain.",
    groups: [
      {
        label: "Frontend",
        items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vue"],
      },
      {
        label: "Mobile",
        items: ["React Native", "Expo", "Flutter", "iOS", "Android"],
      },
      {
        label: "Backend",
        items: ["Node.js", "PostgreSQL", "Prisma", "REST & GraphQL", "Python"],
      },
      {
        label: "Cloud & DevOps",
        items: ["Vercel", "AWS", "Docker", "Cloudflare", "CI/CD"],
      },
      {
        label: "Commerce & CMS",
        items: ["Paystack", "Flutterwave", "Stripe", "Shopify", "Sanity"],
      },
    ],
  },
  useCases: {
    eyebrow: "Who it's for",
    title: "Digital products for *every kind of team*",
    body: "We work with people who need software that just works, without hiring a whole tech department.",
    items: [
      {
        icon: "rocket",
        title: "Startups",
        description:
          "MVPs and launch-ready products, built lean and built to grow.",
      },
      {
        icon: "store",
        title: "Retail & SMEs",
        description: "Online stores with local and international payments.",
      },
      {
        icon: "graduation",
        title: "Schools",
        description:
          "Websites and portals for results, fees and announcements.",
      },
      {
        icon: "calendar",
        title: "Events",
        description: "Registration sites, ticketing and attendee check-in.",
      },
      {
        icon: "building",
        title: "Corporates",
        description: "Internal tools, dashboards and customer portals.",
      },
      {
        icon: "globe",
        title: "NGOs & churches",
        description: "Donation pages, member portals and content sites.",
      },
    ],
  },
  quality: {
    eyebrow: "How we keep it solid",
    title: "*Fast, secure* and easy to run",
    body: "Quality checks are built into every release, not bolted on at the end.",
    image: STOCK.blueWaves,
    items: [
      {
        label: "Performance",
        title: "Speed-tested on real phones and slow networks",
      },
      {
        label: "Security",
        title: "Secure hosting, backups and updates included",
      },
      {
        label: "Handover",
        title: "Training so your team can update content themselves",
      },
    ],
  },
  process: {
    eyebrow: "How we work",
    title: "Software workflows, *minus the friction*",
    body: "Clear milestones, regular demos and no surprises on launch day.",
    steps: [
      {
        title: "Discovery",
        description:
          "We learn your goals, users and must-haves, then agree scope and timeline.",
      },
      {
        title: "Design",
        description:
          "Wireframes and visual designs you can click through before we write code.",
      },
      {
        title: "Build",
        description:
          "We develop in short sprints and show you progress every week.",
      },
      {
        title: "Test & launch",
        description: "Thorough testing on real devices, then a smooth launch.",
      },
      {
        title: "Support",
        description:
          "Hosting, updates and improvements so your product keeps getting better.",
      },
    ],
  },
  faqs: [
    {
      q: "How much does a website cost?",
      a: "It depends on what you need. A business website starts small; online stores and custom apps are quoted after a short discovery call.",
    },
    {
      q: "How long does it take to build?",
      a: "Business websites usually take 2–4 weeks. Web and mobile apps typically take 6–16 weeks, depending on features.",
    },
    {
      q: "Will I be able to update my website myself?",
      a: "Yes. We set up an easy content editor and show your team how to use it.",
    },
    {
      q: "Do you offer hosting and maintenance?",
      a: "Yes. We offer monthly care plans covering hosting, security, backups and small changes.",
    },
    {
      q: "Can my online store accept international payments?",
      a: "Yes. We integrate Paystack, Flutterwave and Stripe so you can accept naira, dollars, euros and pounds.",
    },
  ],
  closing: {
    title: "Ready to build something *people love to use*?",
    body: "Tell us about your idea. We'll help you plan it, build it and grow it.",
    image: STOCK.developerWoman,
  },
};

const PRINT: ServicePage = {
  pillar: "print",
  slug: "print",
  shortName: "print",
  hero: {
    eyebrow: "Print services",
    title: "Big moments deserve *beautiful print*",
    body: "From wedding invitations to billboards, we design and print work you can feel, finished with care and delivered on time.",
    image: STOCK.weddingTable,
    chips: [
      { label: "Invitation cards", image: STOCK.weddingRings },
      { label: "Brochures", image: STOCK.typeOnTablet },
      { label: "Stationery", image: STOCK.notebook },
      { label: "Banners & signage", image: STOCK.eventStage },
      { label: "Merchandise", image: STOCK.whiteTshirt },
      { label: "Large format", image: STOCK.confettiConcert },
    ],
  },
  problem: {
    eyebrow: "Print made easy",
    title: "Focus on the big picture, *not the production details*",
    lead: "Invitations, programmes, flyers and banners: printed pieces come in every shape and size.",
    body: "We handle the design, paper, finishing and delivery, so you get a perfect result without chasing printers or worrying about colours.",
    image: STOCK.ideasLightbox,
  },
  trust: {
    eyebrow: "High-impact print",
    title: "Print services *you can trust*",
    body: "We check every file before it goes to press, so what you approve is exactly what you get.",
    // PLACEHOLDER numbers
    stats: [
      { value: 1000, suffix: "+", label: "Print jobs delivered" },
      { value: 4.9, suffix: "/5", label: "Average client rating" },
    ],
  },
  offerings: {
    eyebrow: "What we print",
    title: "Designed to impress *in every format*",
    body: "One-off event pieces or everyday business essentials, we bring care and polish to every print project.",
    items: [],
  },
  useCases: {
    eyebrow: "Where it shines",
    title: "*Stand out* where most people blend in",
    body: "Weddings, launches, conferences and everyday business: if it's printed, we'll design it and produce it.",
    items: [
      {
        icon: "heart",
        title: "Weddings",
        description:
          "Invitations, programmes, menus, welcome boards and souvenirs.",
      },
      {
        icon: "users",
        title: "Burials & memorials",
        description:
          "Funeral programmes, banners and keepsakes, handled with care.",
      },
      {
        icon: "calendar",
        title: "Events & conferences",
        description: "Badges, backdrops, roll-ups and branded giveaways.",
      },
      {
        icon: "store",
        title: "Retail & restaurants",
        description: "Menus, packaging, flyers and in-store signage.",
      },
      {
        icon: "megaphone",
        title: "Marketing & ads",
        description: "Posters, billboards and direct mail that get noticed.",
      },
      {
        icon: "building",
        title: "Offices & schools",
        description: "Business cards, letterheads, ID cards and notebooks.",
      },
    ],
  },
  quality: {
    eyebrow: "How we keep it perfect",
    title: "*Print-ready* every time",
    body: "Careful checks at every step mean no nasty surprises when the box arrives.",
    image: STOCK.goldRibbons,
    items: [
      {
        label: "Proofing",
        title: "Digital proof for your approval before anything is printed",
      },
      {
        label: "Colour",
        title: "Colour-matched to your brand and checked on paper",
      },
      {
        label: "Delivery",
        title: "Packed carefully and delivered to your door or venue",
      },
    ],
  },
  process: {
    eyebrow: "How we work",
    title: "A process built for *clarity, speed and care*",
    body: "We make it easy to go from idea to beautifully finished print.",
    steps: [
      {
        title: "Brief",
        description:
          "Share your idea, quantity, deadline and any wording or photos.",
      },
      {
        title: "Design & quote",
        description:
          "We design your piece and confirm paper, finish and price.",
      },
      {
        title: "Proof",
        description:
          "You approve a digital proof, so you know exactly what you'll get.",
      },
      {
        title: "Print & finish",
        description: "Printed on quality stock with the finishing you chose.",
      },
      {
        title: "Delivery",
        description:
          "Packed with care and delivered on time, wherever you need it.",
      },
    ],
  },
  faqs: [
    {
      q: "What is the minimum order quantity?",
      a: "It depends on the item. Each catalogue item shows its MOQ; for custom jobs we'll confirm it in your quote.",
    },
    {
      q: "How long does printing take?",
      a: "Most jobs are ready in 3–7 working days after you approve the proof. Rush printing is available for many items.",
    },
    {
      q: "Can I see a sample before printing?",
      a: "Yes. You'll always approve a digital proof, and physical samples are available for larger orders.",
    },
    {
      q: "Do you deliver outside Port Harcourt?",
      a: "Yes. We deliver across Nigeria and can arrange international shipping.",
    },
    {
      q: "Can I order on WhatsApp?",
      a: "Yes. Pick a design from our catalogues and order on WhatsApp with your quantity filled in for you.",
    },
  ],
  closing: {
    title: "Now imagine this *creative power* behind your next celebration",
    body: "Tell us about your event or project. We'll design it, print it and deliver it.",
    image: STOCK.weddingCouple,
  },
};

/* ------------------------------------------------------------------ */
/* Individual services                                                 */
/* Each inherits its pillar's trust, use cases, quality, process, FAQs */
/* and closing, and adds its own hero, problem and offerings.          */
/* ------------------------------------------------------------------ */

type ServiceSeed = {
  pillar: PillarKey;
  slug: string;
  shortName: string;
  hero: { title: string; body: string; image: StockId };
  problem: { title: string; lead: string; body: string; image: StockId };
  offeringsTitle: string;
  items: Omit<Offering, "href">[];
};

const SEEDS: ServiceSeed[] = [
  // ---- Design ----
  {
    pillar: "design",
    slug: "brand-identity",
    shortName: "branding",
    hero: {
      title: "A brand identity people *remember*",
      body: "Logos, colours, typography and guidelines that make your business look established and consistent everywhere.",
      image: STOCK.colourSwatches,
    },
    problem: {
      title: "Consistency *builds trust*",
      lead: "When your brand looks the same everywhere, people recognise you faster and trust you sooner.",
      body: "We create a complete identity system and the guidelines to use it, so every flyer, post and sign looks like it came from the same place.",
      image: STOCK.designerTablet,
    },
    offeringsTitle: "From logo to *full brand system*",
    items: [
      {
        title: "Logo design",
        description: "A distinctive mark with versions for every use.",
        image: STOCK.sketchWireframes,
      },
      {
        title: "Colour & type",
        description: "A palette and font pairing that feels like you.",
        image: STOCK.colourSwatches,
      },
      {
        title: "Brand guidelines",
        description: "A simple guide your whole team can follow.",
        image: STOCK.typeOnTablet,
      },
      {
        title: "Stationery",
        description: "Business cards, letterheads and email signatures.",
        image: STOCK.notebook,
      },
      {
        title: "Social templates",
        description: "Ready-to-use templates for consistent posts.",
        image: STOCK.socialLaptopPhone,
      },
      {
        title: "Rebranding",
        description: "A fresh look that keeps what people love.",
        image: STOCK.abstract3d,
      },
    ],
  },
  {
    pillar: "design",
    slug: "social-media-creative",
    shortName: "social media",
    hero: {
      title: "Social creative that *stops the scroll*",
      body: "Posts, carousels, stories and ads designed to get noticed and get results.",
      image: STOCK.socialLaptopPhone,
    },
    problem: {
      title: "Tired of posts that *nobody sees*?",
      lead: "Generic templates blend into the feed. Thoughtful design gets people to stop and engage.",
      body: "We design on-brand content for every platform, sized correctly and ready to post, so you can stay consistent without the stress.",
      image: STOCK.colourfulPortrait,
    },
    offeringsTitle: "Content for *every platform*",
    items: [
      {
        title: "Feed posts",
        description: "Eye-catching posts for Instagram, Facebook and LinkedIn.",
        image: STOCK.socialLaptopPhone,
      },
      {
        title: "Carousels",
        description: "Swipeable stories that teach, sell and inspire.",
        image: STOCK.typeOnTablet,
      },
      {
        title: "Stories & reels covers",
        description: "Vertical designs that fit the way people watch.",
        image: STOCK.phoneAppUi,
      },
      {
        title: "Paid ads",
        description: "Ad creative built to test and convert.",
        image: STOCK.laptopAnalytics,
      },
      {
        title: "Event promos",
        description: "Countdown and announcement graphics.",
        image: STOCK.eventStage,
      },
      {
        title: "Monthly content packs",
        description: "A month of designs delivered in one go.",
        image: STOCK.colourfulPortrait,
      },
    ],
  },
  {
    pillar: "design",
    slug: "presentation-design",
    shortName: "presentation",
    hero: {
      title: "Presentations that *win the room*",
      body: "Pitch decks, company profiles and keynote slides that make your story clear and compelling.",
      image: STOCK.laptopCharts,
    },
    problem: {
      title: "Great ideas deserve *better slides*",
      lead: "Cluttered slides lose attention. Clear design helps people understand and remember.",
      body: "We turn your content into a confident, easy-to-follow story, with editable templates your team can reuse.",
      image: STOCK.teamMeeting,
    },
    offeringsTitle: "Decks for *every occasion*",
    items: [
      {
        title: "Pitch decks",
        description: "Investor-ready decks that tell your story.",
        image: STOCK.laptopCharts,
      },
      {
        title: "Company profiles",
        description: "A polished introduction to your business.",
        image: STOCK.teamWhiteboard,
      },
      {
        title: "Sales presentations",
        description: "Slides that help your team close.",
        image: STOCK.meetingHands,
      },
      {
        title: "Keynote & event slides",
        description: "Big-screen visuals for conferences.",
        image: STOCK.eventStage,
      },
      {
        title: "Report design",
        description: "Annual reports and data that's easy to read.",
        image: STOCK.laptopAnalytics,
      },
      {
        title: "Slide templates",
        description: "On-brand templates your team can reuse.",
        image: STOCK.typeOnTablet,
      },
    ],
  },
  {
    pillar: "design",
    slug: "packaging-design",
    shortName: "packaging",
    hero: {
      title: "Packaging that *sells from the shelf*",
      body: "Boxes, labels, bags and wrappers that make your product look premium and stand out.",
      image: STOCK.craftSupplies,
    },
    problem: {
      title: "Your packaging is *your silent salesperson*",
      lead: "Shoppers judge a product by its box. Great packaging earns a second look.",
      body: "We design packaging that fits your product, your brand and your budget, and we can handle the printing too.",
      image: STOCK.shopOwner,
    },
    offeringsTitle: "Packaging for *every product*",
    items: [
      {
        title: "Product boxes",
        description: "Custom boxes that protect and impress.",
        image: STOCK.craftSupplies,
      },
      {
        title: "Labels & stickers",
        description: "Labels for bottles, jars and pouches.",
        image: STOCK.giftRibbon,
      },
      {
        title: "Shopping bags",
        description: "Branded bags customers love to carry.",
        image: STOCK.toteBag,
      },
      {
        title: "Gift packaging",
        description: "Wrapping and boxes for special occasions.",
        image: STOCK.goldRibbons,
      },
      {
        title: "Food packaging",
        description: "Takeaway boxes, cups and sleeves.",
        image: STOCK.dinnerParty,
      },
      {
        title: "Mock-ups",
        description: "Realistic previews before you print.",
        image: STOCK.designerTablet,
      },
    ],
  },
  {
    pillar: "design",
    slug: "illustration-motion",
    shortName: "illustration",
    hero: {
      title: "Illustration and motion that *tell your story*",
      body: "Custom illustrations, icons and animations that make your brand feel alive.",
      image: STOCK.paintStrokes,
    },
    problem: {
      title: "Stock images *all look the same*",
      lead: "Custom illustration gives your brand a personality nobody can copy.",
      body: "From hand-drawn artwork to animated social clips, we create visuals made just for you.",
      image: STOCK.brushes,
    },
    offeringsTitle: "Visual stories, *made for you*",
    items: [
      {
        title: "Custom illustrations",
        description: "Artwork for websites, books and campaigns.",
        image: STOCK.paintStrokes,
      },
      {
        title: "Icon sets",
        description: "Consistent icons for apps and websites.",
        image: STOCK.sketchWireframes,
      },
      {
        title: "Animated posts",
        description: "Short motion clips for social media.",
        image: STOCK.phoneAppUi,
      },
      {
        title: "Explainer animations",
        description: "Simple animations that explain your product.",
        image: STOCK.laptopPhone,
      },
      {
        title: "Character design",
        description: "Mascots and characters for your brand.",
        image: STOCK.brushes,
      },
      {
        title: "Infographics",
        description: "Data and processes made easy to understand.",
        image: STOCK.laptopAnalytics,
      },
    ],
  },
  {
    pillar: "design",
    slug: "ui-ux-design",
    shortName: "UI/UX",
    hero: {
      title: "Interfaces people *enjoy using*",
      body: "Research-led UI/UX design for websites and apps that are clear, beautiful and easy to use.",
      image: STOCK.tabletSketch,
    },
    problem: {
      title: "Confusing apps *lose customers*",
      lead: "If people can't find what they need in seconds, they leave.",
      body: "We map your users' journeys, design clickable prototypes and test them before a single line of code is written.",
      image: STOCK.wireframeBoard,
    },
    offeringsTitle: "Design that *feels effortless*",
    items: [
      {
        title: "User research",
        description: "Understand what your users really need.",
        image: STOCK.teamWhiteboard,
      },
      {
        title: "Wireframes",
        description: "Map out every screen before designing.",
        image: STOCK.sketchWireframes,
      },
      {
        title: "UI design",
        description: "Beautiful, on-brand screens for web and mobile.",
        image: STOCK.appScreensImac,
      },
      {
        title: "Prototypes",
        description: "Clickable prototypes you can test with users.",
        image: STOCK.tabletSketch,
      },
      {
        title: "Design systems",
        description: "Reusable components that keep things consistent.",
        image: STOCK.wireframeBoard,
      },
      {
        title: "UX audits",
        description: "Find and fix what's slowing users down.",
        image: STOCK.laptopAnalytics,
      },
    ],
  },
  // ---- Build ----
  {
    pillar: "build",
    slug: "websites",
    shortName: "website",
    hero: {
      title: "Websites that *grow your business*",
      body: "Fast, beautiful, mobile-first websites that are easy to update and built to bring in customers.",
      image: STOCK.laptopBrowsing,
    },
    problem: {
      title: "First impressions *happen online*",
      lead: "Most people will visit your website before they ever call you.",
      body: "We build sites that load fast, look great on every phone, show up on Google and make it easy for visitors to get in touch.",
      image: STOCK.laptopPhone,
    },
    offeringsTitle: "Websites for *every stage*",
    items: [
      {
        title: "Business websites",
        description: "A professional home for your business.",
        image: STOCK.laptopBrowsing,
      },
      {
        title: "Landing pages",
        description: "Focused pages for campaigns and launches.",
        image: STOCK.appScreensImac,
      },
      {
        title: "Portfolio sites",
        description: "Show off your work beautifully.",
        image: STOCK.designerTablet,
      },
      {
        title: "Event websites",
        description: "Registration, schedules and updates in one place.",
        image: STOCK.eventStage,
      },
      {
        title: "Website redesigns",
        description: "A modern refresh for an outdated site.",
        image: STOCK.laptopCode,
      },
      {
        title: "SEO setup",
        description: "Built so people can find you on Google.",
        image: STOCK.laptopAnalytics,
      },
    ],
  },
  {
    pillar: "build",
    slug: "web-applications",
    shortName: "web app",
    hero: {
      title: "Web apps built *around how you work*",
      body: "Custom platforms, dashboards and portals that save your team time and delight your customers.",
      image: STOCK.analyticsDark,
    },
    problem: {
      title: "Spreadsheets *can only take you so far*",
      lead: "When your business outgrows manual work, custom software pays for itself.",
      body: "We design and build secure web applications that automate your processes and give you the data you need to decide.",
      image: STOCK.darkDashboard,
    },
    offeringsTitle: "Software that *saves you time*",
    items: [
      {
        title: "Dashboards",
        description: "See your business at a glance.",
        image: STOCK.analyticsDark,
      },
      {
        title: "Customer portals",
        description: "Let customers manage orders and accounts.",
        image: STOCK.laptopAnalytics,
      },
      {
        title: "Booking systems",
        description: "Appointments and reservations made easy.",
        image: STOCK.laptopPhone,
      },
      {
        title: "Internal tools",
        description: "Custom tools that fit your workflow.",
        image: STOCK.darkDashboard,
      },
      {
        title: "APIs & integrations",
        description: "Connect the systems you already use.",
        image: STOCK.codeScreen,
      },
      {
        title: "SaaS products",
        description: "Turn your idea into a subscription product.",
        image: STOCK.developerWoman,
      },
    ],
  },
  {
    pillar: "build",
    slug: "mobile-apps",
    shortName: "mobile app",
    hero: {
      title: "Mobile apps people *keep coming back to*",
      body: "iOS and Android apps designed for real people and built to perform, from idea to app store.",
      image: STOCK.phoneAppUi,
    },
    problem: {
      title: "Your customers *live on their phones*",
      lead: "A great app keeps you one tap away from the people who matter most.",
      body: "We build cross-platform apps that feel native, work offline where needed and are easy to update.",
      image: STOCK.laptopPhoneApp,
    },
    offeringsTitle: "Apps for *every idea*",
    items: [
      {
        title: "iOS & Android apps",
        description: "One codebase, both app stores.",
        image: STOCK.phoneAppUi,
      },
      {
        title: "MVPs",
        description: "Launch quickly and learn from real users.",
        image: STOCK.laptopPhoneApp,
      },
      {
        title: "Commerce apps",
        description: "Shopping and ordering in your customers' pockets.",
        image: STOCK.shoppingLaptopPhone,
      },
      {
        title: "Booking apps",
        description: "Appointments, tickets and reservations.",
        image: STOCK.laptopPhone,
      },
      {
        title: "Push notifications",
        description: "Keep users informed and engaged.",
        image: STOCK.socialLaptopPhone,
      },
      {
        title: "App store launch",
        description: "We handle submission and approval.",
        image: STOCK.codeScreen,
      },
    ],
  },
  {
    pillar: "build",
    slug: "e-commerce",
    shortName: "e-commerce",
    hero: {
      title: "Online stores that *sell while you sleep*",
      body: "Beautiful, secure e-commerce with local and international payments, delivery options and easy product management.",
      image: STOCK.shoppingLaptopPhone,
    },
    problem: {
      title: "Take your shop *beyond your street*",
      lead: "An online store opens your business to customers across Nigeria and around the world.",
      body: "We build stores that are simple to run, accept naira, dollars, euros and pounds, and make checkout quick on any phone.",
      image: STOCK.shopOwner,
    },
    offeringsTitle: "Everything your store needs",
    items: [
      {
        title: "Store design",
        description: "A storefront that reflects your brand.",
        image: STOCK.shoppingLaptopPhone,
      },
      {
        title: "Payments",
        description: "Paystack, Flutterwave and Stripe built in.",
        image: STOCK.cardPayment,
      },
      {
        title: "Inventory",
        description: "Manage products, stock and variants easily.",
        image: STOCK.shopOwner,
      },
      {
        title: "Delivery options",
        description: "Shipping rates and pickup points.",
        image: STOCK.toteBag,
      },
      {
        title: "In-store payments",
        description: "Connect your online and physical shop.",
        image: STOCK.cardReader,
      },
      {
        title: "Sales reports",
        description: "Know what sells and when.",
        image: STOCK.laptopAnalytics,
      },
    ],
  },
  {
    pillar: "build",
    slug: "support-maintenance",
    shortName: "support",
    hero: {
      title: "Hosting and care, *so you never worry*",
      body: "Secure hosting, backups, updates and quick fixes for your website or app, all in one plan.",
      image: STOCK.serverRack,
    },
    problem: {
      title: "A website *needs looking after*",
      lead: "Outdated software and missed backups put your business at risk.",
      body: "Our care plans keep your site fast, secure and up to date, with a team on hand whenever you need a change.",
      image: STOCK.stickyNotes,
    },
    offeringsTitle: "Peace of mind, *every month*",
    items: [
      {
        title: "Managed hosting",
        description: "Fast, reliable hosting, set up for you.",
        image: STOCK.serverRack,
      },
      {
        title: "Security updates",
        description: "Software and plugins kept up to date.",
        image: STOCK.codeScreen,
      },
      {
        title: "Daily backups",
        description: "Your data safe and quickly restorable.",
        image: STOCK.darkDashboard,
      },
      {
        title: "Content changes",
        description: "Small updates handled for you.",
        image: STOCK.laptopBrowsing,
      },
      {
        title: "Performance checks",
        description: "Regular speed and health reports.",
        image: STOCK.laptopAnalytics,
      },
      {
        title: "Priority support",
        description: "A real person when you need help.",
        image: STOCK.stickyNotes,
      },
    ],
  },
  // ---- Print ----
  {
    pillar: "print",
    slug: "invitation-cards",
    shortName: "invitation",
    hero: {
      title: "Invitations that *set the tone*",
      body: "Wedding, birthday and event invitations designed beautifully and printed on paper you'll love to hold.",
      image: STOCK.weddingRings,
    },
    problem: {
      title: "The first glimpse *of your big day*",
      lead: "Your invitation is the first thing guests see. It should feel as special as the event.",
      body: "Choose from our catalogue or let us design something unique, with finishes like gold foil, embossing and custom envelopes.",
      image: STOCK.weddingTable,
    },
    offeringsTitle: "Invitations for *every celebration*",
    items: [
      {
        title: "Wedding invitations",
        description: "Elegant suites with matching inserts.",
        image: STOCK.weddingRings,
      },
      {
        title: "Birthday invitations",
        description: "Fun or formal, for every age.",
        image: STOCK.balloons,
      },
      {
        title: "Event invitations",
        description: "Launches, galas and parties.",
        image: STOCK.celebrationToast,
      },
      {
        title: "Save the dates",
        description: "Get your date in diaries early.",
        image: STOCK.weddingCouple,
      },
      {
        title: "Foil & embossing",
        description: "Premium finishes that feel luxurious.",
        image: STOCK.goldRibbons,
      },
      {
        title: "Envelopes & seals",
        description: "The perfect finishing touch.",
        image: STOCK.giftRibbon,
      },
    ],
  },
  {
    pillar: "print",
    slug: "brochures-flyers",
    shortName: "brochure",
    hero: {
      title: "Brochures and flyers that *get read*",
      body: "Clear, well-designed print that informs, persuades and sells, from single flyers to multi-page brochures.",
      image: STOCK.typeOnTablet,
    },
    problem: {
      title: "Make your message *easy to take away*",
      lead: "A great brochure keeps working long after the conversation ends.",
      body: "We polish your words, then design and print materials people want to keep, on quality paper with the right finish.",
      image: STOCK.ideasLightbox,
    },
    offeringsTitle: "Print that *informs and sells*",
    items: [
      {
        title: "Flyers",
        description: "Single-page promos that get attention.",
        image: STOCK.ideasLightbox,
      },
      {
        title: "Tri-fold brochures",
        description: "Compact and informative.",
        image: STOCK.typeOnTablet,
      },
      {
        title: "Catalogues",
        description: "Show your full range beautifully.",
        image: STOCK.notebook,
      },
      {
        title: "Programmes",
        description: "For weddings, funerals and events.",
        image: STOCK.weddingTable,
      },
      {
        title: "Menus",
        description: "Restaurant and event menus.",
        image: STOCK.dinnerParty,
      },
      {
        title: "Company profiles",
        description: "Printed profiles that impress.",
        image: STOCK.teamWhiteboard,
      },
    ],
  },
  {
    pillar: "print",
    slug: "business-stationery",
    shortName: "stationery",
    hero: {
      title: "Business stationery that *looks the part*",
      body: "Business cards, letterheads, envelopes and notebooks that make every touchpoint feel professional.",
      image: STOCK.notebook,
    },
    problem: {
      title: "Small details, *big impression*",
      lead: "A quality business card says a lot before you say anything.",
      body: "We design and print stationery that matches your brand perfectly, on stock that feels as good as it looks.",
      image: STOCK.architectDrawings,
    },
    offeringsTitle: "Essentials, *beautifully done*",
    items: [
      {
        title: "Business cards",
        description: "Premium cards with special finishes.",
        image: STOCK.notebook,
      },
      {
        title: "Letterheads",
        description: "Branded paper for official letters.",
        image: STOCK.architectDrawings,
      },
      {
        title: "Envelopes",
        description: "Matching envelopes in every size.",
        image: STOCK.giftRibbon,
      },
      {
        title: "Notebooks",
        description: "Branded notebooks for teams and gifts.",
        image: STOCK.typeOnTablet,
      },
      {
        title: "ID cards",
        description: "Staff and student identity cards.",
        image: STOCK.teamLibrary,
      },
      {
        title: "Certificates",
        description: "Awards and certificates that last.",
        image: STOCK.goldRibbons,
      },
    ],
  },
  {
    pillar: "print",
    slug: "banners-signage",
    shortName: "signage",
    hero: {
      title: "Banners and signage that *can't be missed*",
      body: "Roll-ups, flex banners, backdrops and shop signage designed to be seen from across the room or the road.",
      image: STOCK.eventStage,
    },
    problem: {
      title: "Be seen *from a distance*",
      lead: "Signage has seconds to grab attention. Bold, clear design makes those seconds count.",
      body: "We design and produce banners and signs for events, shops and offices, with installation available.",
      image: STOCK.confettiConcert,
    },
    offeringsTitle: "Signage for *every space*",
    items: [
      {
        title: "Roll-up banners",
        description: "Portable banners for events and receptions.",
        image: STOCK.eventStage,
      },
      {
        title: "Flex banners",
        description: "Large banners for outdoor use.",
        image: STOCK.confettiConcert,
      },
      {
        title: "Event backdrops",
        description: "Photo walls and stage backdrops.",
        image: STOCK.celebrationToast,
      },
      {
        title: "Shop signage",
        description: "Storefront and in-store signs.",
        image: STOCK.shopOwner,
      },
      {
        title: "Welcome boards",
        description: "Elegant boards for weddings and events.",
        image: STOCK.weddingAisle,
      },
      {
        title: "Directional signs",
        description: "Help guests find their way.",
        image: STOCK.eventTableSetup,
      },
    ],
  },
  {
    pillar: "print",
    slug: "branded-merchandise",
    shortName: "merchandise",
    hero: {
      title: "Branded merch people *actually use*",
      body: "T-shirts, mugs, tote bags and gifts printed with your brand or event, for teams, customers and guests.",
      image: STOCK.whiteTshirt,
    },
    problem: {
      title: "Turn people into *walking billboards*",
      lead: "Good merch gets worn, carried and remembered long after the event.",
      body: "We help you choose quality items, design them well and print them to last.",
      image: STOCK.toteBag,
    },
    offeringsTitle: "Merch for *every occasion*",
    items: [
      {
        title: "T-shirts",
        description: "Comfortable shirts with lasting prints.",
        image: STOCK.whiteTshirt,
      },
      {
        title: "Mugs",
        description: "Custom mugs for offices and gifts.",
        image: STOCK.whiteMug,
      },
      {
        title: "Tote bags",
        description: "Reusable bags with your design.",
        image: STOCK.toteBag,
      },
      {
        title: "Souvenirs",
        description: "Keepsakes for weddings and events.",
        image: STOCK.goldRibbons,
      },
      {
        title: "Gift boxes",
        description: "Curated gifts for clients and staff.",
        image: STOCK.giftRibbon,
      },
      {
        title: "Notebooks & pens",
        description: "Everyday items with your brand.",
        image: STOCK.notebook,
      },
    ],
  },
  {
    pillar: "print",
    slug: "large-format",
    shortName: "large format",
    hero: {
      title: "Large-format print, *perfectly finished*",
      body: "Billboards, posters, wall graphics and vehicle wraps printed sharp and vivid at any size.",
      image: STOCK.confettiConcert,
    },
    problem: {
      title: "Go big *without losing quality*",
      lead: "Large prints magnify every detail, good and bad.",
      body: "We prepare your files properly and print on the right materials so your design looks crisp up close and from far away.",
      image: STOCK.eventStage,
    },
    offeringsTitle: "Print at *any size*",
    items: [
      {
        title: "Billboards",
        description: "High-impact outdoor advertising.",
        image: STOCK.confettiConcert,
      },
      {
        title: "Posters",
        description: "Eye-catching posters in any size.",
        image: STOCK.ideasLightbox,
      },
      {
        title: "Wall graphics",
        description: "Murals and branded walls for offices.",
        image: STOCK.teamLibrary,
      },
      {
        title: "Window graphics",
        description: "Storefront displays and frosting.",
        image: STOCK.shopOwner,
      },
      {
        title: "Vehicle branding",
        description: "Wraps and stickers for your fleet.",
        image: STOCK.blueWaves,
      },
      {
        title: "Exhibition stands",
        description: "Booths that draw a crowd.",
        image: STOCK.eventStage,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export const PILLARS: Record<PillarKey, ServicePage> = {
  design: DESIGN,
  build: BUILD,
  print: PRINT,
};

/** Link for a service, from the navigation config (keeps one source of truth). */
function navItem(pillar: PillarKey, slug: string) {
  const group = SERVICE_GROUPS.find((g) => g.key === pillar);
  return group?.items.find((i) => i.href === `/services/${pillar}/${slug}`);
}

function buildService(seed: ServiceSeed): ServicePage {
  const pillar = PILLARS[seed.pillar];
  const nav = navItem(seed.pillar, seed.slug);
  return {
    ...pillar,
    slug: seed.slug,
    shortName: seed.shortName,
    hero: {
      eyebrow: nav?.title ?? seed.shortName,
      title: seed.hero.title,
      body: seed.hero.body,
      image: seed.hero.image,
      chips: seed.items.map((i) => ({ label: i.title, image: i.image })),
    },
    problem: {
      eyebrow: `${nav?.title ?? seed.shortName} made easy`,
      ...seed.problem,
    },
    offerings: {
      eyebrow: "What we offer",
      title: seed.offeringsTitle,
      body: pillar.offerings.body,
      items: seed.items,
    },
    // Tech stack shows only on the Build pillar page and its services.
    techStack: pillar.techStack,
  };
}

export const SERVICES: ServicePage[] = SEEDS.map(buildService);

// Pillar pages list their services as the offering cards.
for (const key of Object.keys(PILLARS) as PillarKey[]) {
  PILLARS[key].offerings.items = SERVICES.filter((s) => s.pillar === key).map(
    (s) => ({
      title: navItem(key, s.slug)?.title ?? s.shortName,
      description: navItem(key, s.slug)?.description ?? "",
      image: s.hero.image,
      href: `/services/${key}/${s.slug}`,
    }),
  );
}

// School portals live on the We Brand Schools page, not a service page.
PILLARS.build.offerings.items.splice(4, 0, {
  title: "School portals",
  description: "Websites and portals for schools",
  image: STOCK.teamLibrary,
  href: "/webrandschools",
});

export function getPillar(key: string): ServicePage | undefined {
  return (PILLARS as Record<string, ServicePage>)[key];
}

export function getService(
  pillar: string,
  slug: string,
): ServicePage | undefined {
  return SERVICES.find((s) => s.pillar === pillar && s.slug === slug);
}

export function servicesInPillar(pillar: PillarKey): ServicePage[] {
  return SERVICES.filter((s) => s.pillar === pillar);
}

/* ------------------------------------------------------------------ */
/* /services overview                                                  */
/* ------------------------------------------------------------------ */

export const SERVICES_HUB = {
  hero: {
    eyebrow: "Our services",
    title: "Design, build and print for brands *and the moments that matter*",
    body: "One team for your brand, your software and everything you print. Pick a service below or tell us what you're planning.",
    image: STOCK.teamCafe,
  },
  intro: {
    eyebrow: "Everything in one place",
    title: "Get design, software and print *without juggling vendors*",
    lead: "Most projects need all three. A launch needs a logo, a website and printed materials; a wedding needs a monogram, invitations and a website for RSVPs.",
    body: "With Dexta, one team handles it all, so everything matches and nothing falls through the cracks.",
  },
  groups: {
    design: {
      title: "*Design* services",
      body: "Identity, content and interfaces that make your brand look its best.",
    },
    build: {
      title: "*Build* services",
      subtitle: "Software engineering",
      body: "Websites, apps and platforms that are fast, secure and easy to run.",
    },
    print: {
      title: "*Print* services",
      body: "Invitations, stationery, signage and merch, finished with care.",
    },
  } as Record<PillarKey, { title: string; subtitle?: string; body: string }>,
  faqs: [
    {
      q: "Can I hire you for just one thing?",
      a: "Of course. Many clients start with a single design or print job and come back for more.",
    },
    {
      q: "Do you work with clients outside Port Harcourt?",
      a: "Yes. We work with clients across Nigeria and abroad, and deliver print nationwide.",
    },
    {
      q: "How do I get a quote?",
      a: "Send us a message or chat on WhatsApp with what you need. We usually reply the same day.",
    },
    {
      q: "Which currencies do you accept?",
      a: "Naira, US dollars, euros and British pounds.",
    },
  ],
};
