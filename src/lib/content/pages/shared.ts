import { f } from "../fields";
import { section } from "../define";

export type ClosingData = {
  title: string;
  body: string;
  image: string;
  primary: { label: string; href: string };
  whatsappLabel: string;
};

/** The call to action at the end of most pages. */
export function closingSection(d: {
  title: string;
  body?: string;
  image: string;
  primary?: { label: string; href: string };
}) {
  return section({
    key: "closing",
    label: "Closing call to action",
    description:
      "The band at the end of the page with the main button and WhatsApp.",
    fields: {
      title: f.heading(),
      body: f.textarea("Body", { max: 300, rows: 2, optional: true }),
      image: f.image("Image"),
      primary: f.link("Main button"),
      whatsappLabel: f.text("WhatsApp button text", { max: 40 }),
    },
    defaults: {
      title: d.title,
      body: d.body ?? "",
      image: d.image,
      primary: d.primary ?? { label: "Start a project", href: "/contact" },
      whatsappLabel: "Chat on WhatsApp",
    } satisfies ClosingData,
  });
}

/** Hero block used by the hub pages (eyebrow, heading, intro). */
export function heroFields(o: { image?: boolean; cta?: boolean } = {}) {
  return {
    eyebrow: f.eyebrow(),
    title: f.heading("Headline"),
    body: f.textarea("Intro", { max: 400, rows: 3 }),
    ...(o.cta ? { cta: f.link("Button") } : {}),
    ...(o.image ? { image: f.image("Image") } : {}),
  };
}

/** Frequently asked questions. */
export const faqFields = {
  eyebrow: f.eyebrow(),
  title: f.heading(),
  items: f.list(
    "Questions",
    "Question",
    {
      q: f.text("Question", { max: 200 }),
      a: f.textarea("Answer", { max: 1500, rows: 4 }),
    },
    { titleKey: "q", max: 30 },
  ),
};
