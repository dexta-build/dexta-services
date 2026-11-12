import { f, type Fields } from "@/lib/content/fields";

/** The client logo form. Shared by the screen and its actions. */
export const CLIENT_FIELDS: Fields = {
  name: f.text("Client name", { max: 80 }),
  logo: f.image("Logo", {
    optional: true,
    hint: "A wide logo on a clear or white background works best. Without one, the name is shown.",
  }),
  websiteUrl: f.url("Website", {
    optional: true,
    hint: "Optional. The logo links here.",
  }),
  isVisible: f.toggle("Show on the site", {
    description: "Hidden clients leave the logo strips but stay here.",
  }),
};

export type ClientForm = {
  name: string;
  logo: string;
  websiteUrl: string;
  isVisible: boolean;
};
