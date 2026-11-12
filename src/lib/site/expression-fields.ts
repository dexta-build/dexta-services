import { f, type Fields } from "@/lib/content/fields";
import { SURFACE_OPTIONS } from "@/lib/content/options";

/** The product form (Our Expressions). Shared by the screen and its actions. */
export const EXPRESSION_FIELDS: Fields = {
  name: f.text("Name", { max: 60 }),
  slug: f.text("Page address", {
    max: 80,
    hint: "The end of /expressions/…: lower-case letters, numbers and dashes.",
  }),
  tagline: f.accent("Tagline", { max: 120 }),
  category: f.text("Category", {
    max: 60,
    hint: "e.g. Publishing · Print on demand",
  }),
  description: f.textarea("Short description", {
    max: 400,
    rows: 3,
    hint: "On the Our Expressions page and in search results.",
  }),
  websiteUrl: f.url("Website", {
    hint: "The live product, e.g. https://www.bookprinta.com",
  }),
  color: f.select("Panel colour", SURFACE_OPTIONS),
  logo: f.image("Logo or app icon", {
    optional: true,
    hint: "Square works best. Shown in logo strips and on the product page.",
  }),
  cover: f.image("Desktop screenshot", {
    hint: "The main image of the product.",
  }),
  mobile: f.image("Phone screenshot", { optional: true }),
  gallery: f.images("More screenshots", {
    max: 12,
    hint: "Shown as a gallery on the product page.",
  }),
  facts: f.list(
    "Key facts",
    "Fact",
    {
      value: f.text("Figure", { max: 12, hint: "e.g. 6+ or 25" }),
      label: f.text("What it means", { max: 100 }),
    },
    { titleKey: "label", max: 6 },
  ),
  features: f.strings("Key features", { max: 12, addLabel: "Add a feature" }),
  story: f.list(
    "Story",
    "Section",
    {
      heading: f.accent("Heading", { max: 120 }),
      body: f.textarea("Text", {
        max: 3000,
        rows: 4,
        optional: true,
        hint: "Leave a blank line between paragraphs. Links: [text](https://…).",
      }),
      bullets: f.strings("Bullet points", { max: 12, addLabel: "Add a point" }),
      after: f.textarea("Text after the bullets", {
        max: 2000,
        rows: 3,
        optional: true,
      }),
    },
    { titleKey: "heading", max: 12 },
  ),
  isVisible: f.toggle("Show on the site", {
    description:
      "Hidden products leave the Our Expressions page, menus and logo strips.",
  }),
};
