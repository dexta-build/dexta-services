/**
 * SAMPLE posts, shown in development only until real posts are published
 * through the admin (see thoughts-data.ts). Never used in production.
 */
import { STOCK } from "./stock-media";

export type SampleCategory = {
  name: string;
  slug: string;
  description: string;
  color: string;
};

export type SamplePost = {
  title: string;
  slug: string;
  excerpt: string;
  cover: string;
  category: string;
  /** Index into the team members list (falls back to "Dexta team"). */
  author: number;
  daysAgo: number;
  featured?: boolean;
  tags?: string[];
  content: string;
};

export const SAMPLE_CATEGORIES: SampleCategory[] = [
  {
    name: "Brand & design",
    slug: "brand-design",
    description: "Identity, colour, type and the craft of looking the part.",
    color: "lilac",
  },
  {
    name: "Software",
    slug: "software",
    description: "Websites, apps and the products we build for clients.",
    color: "ice",
  },
  {
    name: "Print",
    slug: "print",
    description: "Paper, finishes and printed pieces people keep.",
    color: "gold",
  },
  {
    name: "Studio notes",
    slug: "studio-notes",
    description: "News, lessons and life inside the Dexta studio.",
    color: "mint",
  },
];

const body = (intro: string, sections: [string, string][]) =>
  [
    `<p>${intro}</p>`,
    ...sections.map(
      ([h, p], i) =>
        `<h2>${h}</h2><p>${p}</p>${
          i === 1
            ? `<blockquote><p>Good design isn't decoration. It's the shortest path between what you mean and what people understand.</p></blockquote>`
            : i === 2
              ? `<ul><li>Start with the audience, not the tool.</li><li>Write the words before you design the page.</li><li>Test with real people early and often.</li></ul>`
              : ""
        }`,
    ),
    `<p>Want help putting this into practice? <a href="/contact">Talk to our team</a>.</p>`,
  ].join("");

const LOREM: [string, string][] = [
  [
    "Start with *why* it matters",
    "Every project begins with a conversation about who it's for and what should change once it's live. Those answers shape every decision that follows, from colour and layout to the copy on each button.",
  ],
  [
    "What we *learned* along the way",
    "The best results came from short loops: sketch, share, adjust. Clients saw progress every few days, and small corrections never turned into expensive rework at the end.",
  ],
  [
    "A simple *checklist* to use today",
    "You don't need a big budget to get this right. A few habits make most of the difference, and they work whether you're printing invitations or launching an app.",
  ],
  [
    "Where to go *next*",
    "Pick one thing from this article and try it on your next project. Then tell us how it went: we love hearing what works for teams across Nigeria and beyond.",
  ],
];

export const SAMPLE_POSTS: SamplePost[] = [
  {
    title: "Why every small business needs a *brand system*, not just a logo",
    slug: "brand-system-not-just-a-logo",
    excerpt:
      "A logo is a starting point. A brand system — colours, type, tone and templates — is what makes you recognisable everywhere, from your flyers to your website.",
    cover: STOCK.colourSwatches,
    category: "brand-design",
    author: 0,
    daysAgo: 3,
    featured: true,
    tags: ["Branding", "Small business"],
    content: body(
      "Most businesses come to us asking for a logo. Most leave with something more useful: a small set of rules that makes everything they publish look like it came from the same place.",
      LOREM,
    ),
  },
  {
    title: "How we built a school portal parents *actually use*",
    slug: "school-portal-parents-use",
    excerpt:
      "Results, fees and announcements in one place. Here's how we designed a school portal around busy parents on mobile data.",
    cover: STOCK.laptopPhoneApp,
    category: "software",
    author: 1,
    daysAgo: 8,
    featured: true,
    tags: ["Web apps", "Schools"],
    content: body(
      "Parents don't want another app to install. They want to check results and pay fees in under a minute, on whatever phone they have.",
      LOREM,
    ),
  },
  {
    title: "Paper, foil and finish: choosing the right *wedding invitation*",
    slug: "choosing-wedding-invitation",
    excerpt:
      "Matte or gloss? Foil or emboss? A quick guide to the finishes that make invitations feel special, and what they cost.",
    cover: STOCK.weddingRings,
    category: "print",
    author: 0,
    daysAgo: 12,
    tags: ["Weddings", "Print finishes"],
    content: body(
      "An invitation is the first thing guests hold from your big day. The paper and finish say as much as the words.",
      LOREM,
    ),
  },
  {
    title: "Five signs your website is *costing you customers*",
    slug: "website-costing-customers",
    excerpt:
      "Slow pages, unclear prices and no WhatsApp button. Small fixes that turn visitors into enquiries.",
    cover: STOCK.laptopAnalytics,
    category: "software",
    author: 1,
    daysAgo: 18,
    tags: ["Websites", "Conversion"],
    content: body(
      "Your website might look fine and still be losing you business every day. These are the problems we see most often.",
      LOREM,
    ),
  },
  {
    title: "Inside Devs Day: what our community *built* together",
    slug: "inside-devs-day",
    excerpt:
      "A day of demos, honest feedback and jollof. Highlights from our first Devs Day at Dexta Studios.",
    cover: STOCK.developerScreens,
    category: "studio-notes",
    author: 1,
    daysAgo: 25,
    tags: ["Community", "Events"],
    content: body(
      "We opened our doors to developers and builders across Port Harcourt. Here's what happened.",
      LOREM,
    ),
  },
  {
    title: "Colour on screen vs. colour on paper: *why they differ*",
    slug: "screen-vs-paper-colour",
    excerpt:
      "Your brand blue looks perfect on your phone and dull on your banner. Here's why, and how we fix it.",
    cover: STOCK.paintStrokes,
    category: "print",
    author: 0,
    daysAgo: 31,
    tags: ["Colour", "Print"],
    content: body(
      "Screens mix light; printers mix ink. Getting the two to agree takes a little planning up front.",
      LOREM,
    ),
  },
  {
    title: "Social media design that *stops the scroll*",
    slug: "social-design-stops-scroll",
    excerpt:
      "Bold type, one idea per post and a consistent grid. Practical tips for designs that get noticed.",
    cover: STOCK.socialLaptopPhone,
    category: "brand-design",
    author: 0,
    daysAgo: 40,
    tags: ["Social media"],
    content: body(
      "People decide in under a second whether to keep scrolling. Good social design earns that second.",
      LOREM,
    ),
  },
  {
    title: "From idea to app store: our *mobile app* process",
    slug: "idea-to-app-store",
    excerpt:
      "Discovery, design, build, test, launch. A look at how we take apps from a sketch to your customers' phones.",
    cover: STOCK.phoneAppUi,
    category: "software",
    author: 1,
    daysAgo: 52,
    tags: ["Mobile apps", "Process"],
    content: body(
      "Building an app is less about code than about decisions. Here's how we make them with you.",
      LOREM,
    ),
  },
  {
    title: "A week in the *Dexta studio*",
    slug: "week-in-the-studio",
    excerpt:
      "Brand workshops, print runs and a website launch. What a typical week looks like for our team.",
    cover: STOCK.teamWhiteboard,
    category: "studio-notes",
    author: 0,
    daysAgo: 60,
    tags: ["Team", "Culture"],
    content: body(
      "No two weeks are the same at Dexta, but some things never change: good coffee and honest feedback.",
      LOREM,
    ),
  },
  {
    title: "Banners that work outdoors: *size, material and placement*",
    slug: "outdoor-banners-guide",
    excerpt:
      "Flex, mesh or vinyl? How big should the text be? A practical guide to banners people can read from the road.",
    cover: STOCK.eventStage,
    category: "print",
    author: 1,
    daysAgo: 70,
    tags: ["Banners", "Signage"],
    content: body(
      "A banner has about three seconds to be read by someone driving past. Every choice should serve that moment.",
      LOREM,
    ),
  },
];
