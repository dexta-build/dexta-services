import { f, type Fields } from "@/lib/content/fields";
import { ICON_OPTIONS, SURFACE_OPTIONS } from "@/lib/content/options";

/** The catalogue form. Shared by the screen and its actions. */
export const CATALOGUE_FIELDS: Fields = {
  title: f.text("Name", { max: 60, hint: "e.g. Wedding" }),
  slug: f.text("Page address", {
    max: 60,
    hint: "The end of /catalogue/…: lower-case letters, numbers and dashes.",
  }),
  description: f.text("Short description", {
    max: 80,
    hint: "In the menus and on the catalogue cards, e.g. Invitations, programmes, souvenirs",
  }),
  color: f.select("Colour", SURFACE_OPTIONS, {
    hint: "The page hero, its cards and the homepage showcase take this colour.",
  }),
  icon: f.select("Menu icon", ICON_OPTIONS),
  cover: f.image("Cover image", {
    optional: true,
    hint: "On the catalogue's hero, cards and menu card. Empty uses its first design.",
  }),
  heroTitle: f.accent("Hero heading", {
    max: 100,
    optional: true,
    hint: "Leave empty for the shared heading (Pages → Catalogue pages).",
  }),
  heroText: f.textarea("Hero text", {
    max: 300,
    rows: 3,
    optional: true,
    hint: "Leave empty for the short description plus the shared line.",
  }),
  isFeatured: f.toggle("Featured in the menu", {
    description:
      "Shown as an image card in the Catalogues menu (the first two).",
  }),
  showOnHome: f.toggle("Show on the homepage", {
    description: "A tab in the homepage catalogue showcase.",
  }),
  isVisible: f.toggle("Show on the site", {
    description:
      "Hidden catalogues leave the menus, footer, homepage and their page.",
  }),
};

export type CatalogueForm = {
  title: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  cover: string;
  heroTitle: string;
  heroText: string;
  isFeatured: boolean;
  showOnHome: boolean;
  isVisible: boolean;
};

export type ItemForm = {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  price: number;
  moq: number;
  unit: string;
  tags: string[];
  media: string[];
  isFeatured: boolean;
  isVisible: boolean;
};
