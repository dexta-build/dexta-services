import Link from "next/link";
import { requirePageAccess } from "@/lib/admin/session";
import { AdminCard, PageHeader } from "@/components/admin/kit/layout";

export const metadata = { title: "How to edit your site" };

type Topic = {
  id: string;
  title: string;
  where?: { label: string; href: string };
  points: React.ReactNode[];
};

const TOPICS: Topic[] = [
  {
    id: "basics",
    title: "The basics",
    points: [
      "The menu on the left shows only the parts of the site you've been given. Ask an Admin if something you need is missing.",
      <>
        Press <strong>Ctrl K</strong> (or <strong>⌘ K</strong> on a Mac) to jump
        to any screen by typing its name.
      </>,
      "When a form has unsaved changes, a blue bar appears at the bottom with Save and Discard. The browser also warns you before you leave the page.",
      "In headings, wrap words in *asterisks* to show them in the serif italic accent, e.g. Your *creative* partner.",
      "Every change is recorded under Activity (Admins only), with who made it and when.",
    ],
  },
  {
    id: "pages",
    title: "Editing a page",
    where: { label: "Pages", href: "/admin/pages" },
    points: [
      "Each page is split into sections (hero, intro, FAQs…). Open a section, make your changes and save: this keeps a draft and nothing changes on the site yet.",
      <>
        <strong>Preview changes</strong> opens the real page with your drafts,
        so you can check them before anyone else sees them.
      </>,
      <>
        <strong>Publish</strong> puts the drafts live straight away. Every
        section keeps a <strong>History</strong>: open it to restore an earlier
        version (it comes back as a draft for you to publish).
      </>,
      "Use the switch on a section to hide it from the page without deleting what's in it.",
      "Each page has a Search & sharing section: the title and description Google shows, and the image used when the page is shared on WhatsApp or social media.",
    ],
  },
  {
    id: "media",
    title: "Images, videos and files",
    where: { label: "Media library", href: "/admin/media" },
    points: [
      "Upload once to the media library, then choose files from it anywhere in the admin.",
      "Images up to 10 MB, videos up to 500 MB, documents up to 50 MB. Large photos are resized for each screen automatically.",
      "Add alt text to images (a short description) so the site works for screen readers and search engines.",
      "A file that's in use can't be deleted by accident: the library shows where each file is used.",
    ],
  },
  {
    id: "content",
    title: "Services, works and products",
    points: [
      "Services: the service groups and each service page, with prices, deliverables and FAQs.",
      "Works: projects with their galleries. Drag to change the order; switch on Featured to show one on the homepage.",
      "Our Expressions: the products and brands built in-house, each with its own story page.",
      "Clients: the logos in the client strip. Catalogues: designs and price sheets people can order on WhatsApp.",
      "Offers: each offer's price, what's included and when it runs. Ended offers hide themselves.",
    ],
  },
  {
    id: "thoughts",
    title: "Articles (Thoughts)",
    where: { label: "Thoughts", href: "/admin/thoughts" },
    points: [
      "Write in the editor as you'd like it to read: headings, lists, quotes, images with captions and YouTube or Vimeo videos.",
      "Save as a draft, publish now, or schedule a date and time: the article goes live by itself then.",
      "While it's a draft, use Preview to see it on the site; only signed-in team members can.",
    ],
  },
  {
    id: "events",
    title: "Events and registrations",
    where: { label: "Events", href: "/admin/events" },
    points: [
      "Create the event, then build its registration form (add, reorder and require fields).",
      "Registrations arrive in the event and in the Inbox. Accepting or declining emails the person automatically.",
      "Email attendees sends one message to everyone (or only accepted, pending…) with optional attachments. Send yourself a test first.",
    ],
  },
  {
    id: "team",
    title: "Team profiles",
    where: { label: "Team", href: "/admin/team" },
    points: [
      "Each person has their own profile page at the site address followed by /their-name. You can change the address; the old one keeps working and forwards to the new one.",
      "Addresses used by site pages (like /about) can't be taken; the form tells you if one is reserved.",
    ],
  },
  {
    id: "inbox",
    title: "The inbox",
    where: { label: "Inbox", href: "/admin/inbox" },
    points: [
      "Contact form messages, event registrations and We Brand Schools applications all arrive here.",
      "Reply from the admin (with files if needed): the email goes from the site and the reply is saved with the message.",
      "Assign a message to a teammate and mark it done when it's handled; the number in the menu counts what's still unread.",
    ],
  },
  {
    id: "schools",
    title: "We Brand Schools",
    where: {
      label: "Applications",
      href: "/admin/we-brand-schools/applications",
    },
    points: [
      "Applications: read what a school sent, set the status, start their website, then Go live (this emails the school their website and portal details).",
      "Website projects: edit a school's copy of its template page by page, preview it, and export the files.",
      "Templates, Testimonials and Free portal control those sections of /webrandschools; The page holds the hero and section text.",
      "Referral links: personal links for partners, with the visits, applications and live sites each one brings.",
    ],
  },
  {
    id: "settings",
    title: "Site settings",
    where: { label: "Site settings", href: "/admin/pages/site" },
    points: [
      "Business details (phones, emails, address, social links), the WhatsApp number and the message each button pre-fills.",
      "The header and footer menus, and the default title, description and share image for search engines.",
    ],
  },
  {
    id: "people",
    title: "People and access (Admins)",
    where: { label: "Users", href: "/admin/users" },
    points: [
      "Admins can do everything, including users, settings and activity. Editors can edit and publish only the areas you tick for them.",
      "Invite someone by email: they get a link to set their own password. You can change their areas, sign them out everywhere or switch them off at any time.",
    ],
  },
];

export default async function HelpPage() {
  await requirePageAccess(null);
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="How to edit *your site*"
        description="A short guide to the admin: where things are, how drafts and publishing work, and a few tips."
      />
      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Topics" className="lg:sticky lg:top-8 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="hover:bg-charcoal/[0.06] text-surface-muted hover:text-surface-fg inline-flex rounded-full px-3 py-1.5 text-sm font-bold lg:flex lg:rounded-[8px]"
                >
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-5">
          {TOPICS.map((t) => (
            <section key={t.id} id={t.id} className="scroll-mt-8">
              <AdminCard
                title={t.title}
                actions={
                  t.where ? (
                    <Link
                      href={t.where.href}
                      className="dx-link text-royal text-sm font-bold"
                    >
                      Open {t.where.label} →
                    </Link>
                  ) : undefined
                }
              >
                <ul className="flex flex-col gap-3">
                  {t.points.map((p, i) => (
                    <li key={i} className="flex gap-3 leading-relaxed">
                      <span
                        aria-hidden
                        className="bg-brand-cyan mt-2.5 size-1.5 shrink-0 rounded-full"
                      />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </AdminCard>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
