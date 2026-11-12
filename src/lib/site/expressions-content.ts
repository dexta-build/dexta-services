/**
 * "Our Expressions": products built by Dexta. Shown whenever the Expression
 * table has no rows; once products are added in the admin, those are used
 * instead. Copy is based on each product's live site — please review.
 * Screenshots live in /public/expressions.
 */

export type ExpressionContent = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  websiteUrl: string;
  /** Site surface used for the product's panel. */
  color: string;
  cover: string;
  mobile: string | null;
  /** Square app icon for logo strips (null shows the name only). */
  icon: string | null;
  features: string[];
  facts: { value: string; label: string }[];
  /** Rich-text HTML for /expressions/[slug]. */
  story: string;
};

export const EXPRESSION_DEFAULTS: ExpressionContent[] = [
  {
    slug: "dx-school-portal",
    name: "DX-SchoolPortal",
    tagline: "Shaping the future of education, *together*",
    category: "EdTech · School management",
    description:
      "A multi-school management platform: manage students, publish results, create AI-powered quizzes and keep parents in the loop, all from one place.",
    websiteUrl: "https://www.dexta.website",
    color: "brand",
    cover: "/expressions/school-portal-desktop.webp",
    mobile: null,
    icon: "/expressions/icons/school-portal.svg",
    features: [
      "AI quiz generation from documents",
      "Real-time results and analytics",
      "Parent–teacher collaboration",
      "One platform for many schools",
    ],
    facts: [
      { value: "6+", label: "Schools running on the platform" },
      { value: "AI", label: "Quizzes generated from documents in seconds" },
      { value: "1", label: "Login for admins, teachers, students and parents" },
    ],
    story: `<h2>The *product*</h2><p>DX-SchoolPortal is a multi-tenant school management platform. Each school gets its own portal to manage students, deliver results, create quizzes and connect with parents.</p><h2>The *problem*</h2><p>Many schools juggle spreadsheets, paper result sheets and group chats. Results come out late, parents are left guessing, and teachers spend hours on admin instead of teaching.</p><h2>What we *built*</h2><p>We designed and built one platform that every school can run on, with its own branded portal.</p><ul><li>AI-powered quiz generation from lesson documents</li><li>Real-time results and performance analytics</li><li>Parent and teacher collaboration in one place</li><li>Secure, role-based access for admins, teachers, students and parents</li></ul><h2>Where it is *now*</h2><p>Schools across Nigeria use DX-SchoolPortal to publish results and keep families informed. It is also the engine behind our <a href="/webrandschools">We Brand Schools</a> websites.</p>`,
  },
  {
    slug: "bookprinta",
    name: "BookPrinta",
    tagline: "Your book. *Beautifully printed.*",
    category: "Publishing · Print on demand",
    description:
      "Publish fearlessly from as few as 25 copies. Authors pick an offer, upload a manuscript and BookPrinta formats, prints and delivers the finished books.",
    websiteUrl: "https://www.bookprinta.com",
    color: "royal",
    cover: "/expressions/bookprinta-desktop.webp",
    mobile: "/expressions/bookprinta-mobile.webp",
    icon: "/expressions/icons/bookprinta.png",
    features: [
      "Print runs from 25 copies",
      "AI manuscript clean-up and formatting",
      "Secure author dashboard",
      "Simple, transparent pricing",
    ],
    facts: [
      { value: "25", label: "Copies minimum: publish without a big print run" },
      { value: "3", label: "Steps from manuscript to printed book" },
      { value: "DOCX/PDF", label: "Upload the files authors already have" },
    ],
    story: `<h2>The *product*</h2><p>BookPrinta helps authors turn a manuscript into a beautifully printed book, from as few as 25 copies.</p><h2>The *problem*</h2><p>Traditional printing asks first-time authors for large print runs, confusing quotes and a lot of back-and-forth. Many good books never get printed.</p><h2>What we *built*</h2><p>A simple three-step journey: pick an offer and pay, upload your manuscript, approve the preview and we print.</p><ul><li>Clear packages with formatting and printing included</li><li>An AI engine that cleans and prepares the text</li><li>A secure dashboard to upload files and approve previews</li><li>Custom quotes for bigger or special projects</li></ul><h2>Where it is *now*</h2><p>BookPrinta is live and printing books for authors, with a showcase of published titles on its site.</p>`,
  },
  {
    slug: "awamenu",
    name: "AwaMenu",
    tagline: "Your restaurant menu, *online in minutes*",
    category: "Hospitality · Restaurant software",
    description:
      "Digital menus for restaurants: QR codes, WhatsApp ordering, reservations, staff access and analytics, managed from one dashboard.",
    websiteUrl: "https://www.awamenu.com",
    color: "forest",
    cover: "/expressions/awamenu-desktop.webp",
    mobile: "/expressions/awamenu-mobile.webp",
    icon: "/expressions/icons/awamenu.png",
    features: [
      "Mobile-friendly QR menus",
      "WhatsApp click-to-chat ordering",
      "Payments and table reservations",
      "Staff access and menu analytics",
    ],
    facts: [
      { value: "QR", label: "Menus customers scan and view instantly" },
      { value: "1-tap", label: "WhatsApp chat, no extra apps needed" },
      { value: "Free", label: "Plan to get started today" },
    ],
    story: `<h2>The *product*</h2><p>AwaMenu puts a restaurant's menu online in minutes, with ordering, reservations and insights built in.</p><h2>The *problem*</h2><p>Printed menus go out of date, reprints cost money, and customers want to order the way they already chat: on WhatsApp.</p><h2>What we *built*</h2><p>A menu platform restaurants can set up themselves and update any time.</p><ul><li>Beautiful mobile menus shared by QR code, link or social media</li><li>WhatsApp click-to-chat for orders and questions</li><li>Online ordering, dine-in flows and table reservations</li><li>Staff accounts and activity insights in the dashboard</li></ul><h2>Where it is *now*</h2><p>AwaMenu is live with free and paid plans, billed monthly, quarterly or yearly.</p>`,
  },
  {
    slug: "dextalearning",
    name: "DextaLearning",
    tagline: "Learning that *actually sticks*",
    category: "EdTech · Learning platform",
    description:
      "A learning platform built on learning science: active recall, spaced repetition, cohorts and an earn-back programme that rewards finishing.",
    websiteUrl: "https://dextalearning-frontend.vercel.app",
    color: "gold",
    cover: "/expressions/dextalearning-desktop.webp",
    mobile: "/expressions/dextalearning-mobile.webp",
    icon: null,
    features: [
      "Quizzes before and after every lesson",
      "Spaced-repetition reminders",
      "Learn in cohorts with peers",
      "Earn back what you paid when you finish",
    ],
    facts: [
      { value: "4", label: "Languages: English, French, Spanish and Naijá" },
      { value: "Many", label: "Academies on one platform" },
      { value: "Free", label: "To start learning" },
    ],
    story: `<h2>The *product*</h2><p>DextaLearning is a behaviour-driven learning platform that makes deep, lasting learning the default.</p><h2>The *problem*</h2><p>Most online courses are video libraries: easy to start, easy to forget and rarely finished.</p><h2>What we *built*</h2><p>Every feature is a learning mechanism designed to help people remember more and get further.</p><ul><li>Active recall with quizzes before and after lessons</li><li>Spaced repetition that brings lessons back at the right time</li><li>Cohorts so learners study with peers</li><li>An earn-back programme that rewards finishing what you start</li></ul><h2>Where it is *now*</h2><p>DextaLearning hosts several academies and is available in English, French, Spanish and Naijá.</p>`,
  },
];
