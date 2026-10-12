import {
  backgroundImageField,
  colorField,
  imageField,
  linkField,
  model3dField,
  numberField,
  selectField,
  textField,
  textareaField,
  type SchoolTemplateField,
  type SchoolTemplateManifest,
} from "./types";

// ── Rich text helper ──────────────────────────────────────────
function richTextField(
  key: string,
  label: string,
  selector: string,
  overrides: Partial<SchoolTemplateField> = {},
): SchoolTemplateField {
  return textareaField(key, label, selector, {
    type: "richText",
    target: "innerHTML",
    ...overrides,
  });
}

// ── CSS variable naming ───────────────────────────────────────
function t4CssVar(pageKey: string, sectionKey: string, token: string) {
  return `--dexta-academy-4-${pageKey}-${sectionKey}-${token}`;
}

// ── Section background fields ─────────────────────────────────
function t4SectionStyleFields({
  pageKey,
  sectionKey,
  selector,
  defaultBackgroundColor,
  defaultBackgroundOpacity = 100,
  includeBackgroundImage = true,
}: {
  pageKey: string;
  sectionKey: string;
  selector: string;
  defaultBackgroundColor: string;
  defaultBackgroundOpacity?: number;
  includeBackgroundImage?: boolean;
}): SchoolTemplateField[] {
  return [
    colorField("sectionBgColor", "Section background color", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "section-bg-color"),
      defaultValue: defaultBackgroundColor,
      uiGroup: "Section background",
      uiOrder: 100,
    }),
    numberField("sectionBgOpacity", "Section background opacity", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "section-bg-opacity"),
      defaultValue: defaultBackgroundOpacity,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      uiGroup: "Section background",
      uiOrder: 101,
    }),
    ...(includeBackgroundImage
      ? [
          backgroundImageField(
            "sectionBgImage",
            "Section background image",
            selector,
            {
              target: "cssVariable",
              cssVariable: t4CssVar(pageKey, sectionKey, "section-bg-image"),
              defaultValue: "",
              uiGroup: "Section background",
              uiOrder: 102,
              helpText:
                "Use the image control to add, replace, or remove this section background image.",
            },
          ),
          textField(
            "sectionBgPosition",
            "Background image position",
            selector,
            {
              target: "cssVariable",
              cssVariable: t4CssVar(pageKey, sectionKey, "section-bg-position"),
              defaultValue: "center center",
              uiGroup: "Section background",
              uiOrder: 103,
            },
          ),
          textField("sectionBgSize", "Background image size", selector, {
            target: "cssVariable",
            cssVariable: t4CssVar(pageKey, sectionKey, "section-bg-size"),
            defaultValue: "cover",
            helpText:
              "Use cover, contain, or a custom CSS size such as 100% auto.",
            uiGroup: "Section background",
            uiOrder: 104,
          }),
        ]
      : []),
  ];
}

// ── Typography / font import ──────────────────────────────────
function t4TypographyFields({
  selector,
}: {
  selector: string;
}): SchoolTemplateField[] {
  return [
    linkField("fontStylesheetUrl", "Google Fonts stylesheet URL", selector, {
      target: "attribute",
      attribute: "data-dexta-font-stylesheet",
      defaultValue: "",
      placeholder:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap",
      helpText: fontImportHelpText,
      uiGroup: "Rich text fonts",
      uiOrder: 200,
    }),
  ];
}

// ── Button style fields ───────────────────────────────────────
function t4ButtonStyleFields({
  pageKey,
  sectionKey,
  selector,
  defaultBackgroundColor = "#4a8fff",
  defaultBackgroundOpacity = 100,
  defaultTextColor = "#ffffff",
  defaultBorderColor = "#4a8fff",
  defaultBorderWidth = 0,
}: {
  pageKey: string;
  sectionKey: string;
  selector: string;
  defaultBackgroundColor?: string;
  defaultBackgroundOpacity?: number;
  defaultTextColor?: string;
  defaultBorderColor?: string;
  defaultBorderWidth?: number;
}): SchoolTemplateField[] {
  return [
    colorField("buttonBgColor", "Button background color", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "button-bg-color"),
      defaultValue: defaultBackgroundColor,
      uiGroup: "Button style",
      uiOrder: 300,
    }),
    numberField("buttonBgOpacity", "Button background opacity", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "button-bg-opacity"),
      defaultValue: defaultBackgroundOpacity,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      uiGroup: "Button style",
      uiOrder: 301,
    }),
    colorField("buttonTextColor", "Button text color", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "button-text-color"),
      defaultValue: defaultTextColor,
      uiGroup: "Button style",
      uiOrder: 302,
    }),
    colorField("buttonBorderColor", "Button border color", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "button-border-color"),
      defaultValue: defaultBorderColor,
      uiGroup: "Button style",
      uiOrder: 303,
    }),
    numberField("buttonBorderWidth", "Button border width", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "button-border-width"),
      defaultValue: defaultBorderWidth,
      min: 0,
      max: 12,
      step: 1,
      unit: "px",
      helpText: "Set to 0 to remove the border.",
      uiGroup: "Button style",
      uiOrder: 304,
    }),
  ];
}

// ── Icon style fields (section-level) ─────────────────────────
function t4IconStyleFields({
  pageKey,
  sectionKey,
  selector,
  defaultIconBgColor = "#ffffff",
  defaultIconBgOpacity = 0,
  defaultIconBorderColor = "#4a8fff",
  defaultIconBorderWidth = 0,
}: {
  pageKey: string;
  sectionKey: string;
  selector: string;
  defaultIconBgColor?: string;
  defaultIconBgOpacity?: number;
  defaultIconBorderColor?: string;
  defaultIconBorderWidth?: number;
}): SchoolTemplateField[] {
  return [
    backgroundImageField("iconImage", "Upload icon image", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "icon-image"),
      defaultValue: "",
      helpText:
        "Upload a custom icon image (PNG, SVG) to replace the default icon.",
      uiGroup: "Icon style",
      uiOrder: 400,
    }),
    colorField("iconBgColor", "Icon background color", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "icon-bg-color"),
      defaultValue: defaultIconBgColor,
      uiGroup: "Icon style",
      uiOrder: 401,
    }),
    numberField("iconBgOpacity", "Icon background opacity", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "icon-bg-opacity"),
      defaultValue: defaultIconBgOpacity,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      uiGroup: "Icon style",
      uiOrder: 402,
    }),
    colorField("iconBorderColor", "Icon border color", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "icon-border-color"),
      defaultValue: defaultIconBorderColor,
      uiGroup: "Icon style",
      uiOrder: 403,
    }),
    numberField("iconBorderWidth", "Icon border width", selector, {
      target: "cssVariable",
      cssVariable: t4CssVar(pageKey, sectionKey, "icon-border-width"),
      defaultValue: defaultIconBorderWidth,
      min: 0,
      max: 12,
      step: 1,
      unit: "px",
      helpText: "Set to 0 to remove the icon border.",
      uiGroup: "Icon style",
      uiOrder: 404,
    }),
  ];
}

// ── Per-page shorthand wrappers ───────────────────────────────
function homeSectionStyle(
  opts: Omit<Parameters<typeof t4SectionStyleFields>[0], "pageKey">,
) {
  return t4SectionStyleFields({ pageKey: "home", ...opts });
}
function homeButtonStyle(
  opts: Omit<Parameters<typeof t4ButtonStyleFields>[0], "pageKey">,
) {
  return t4ButtonStyleFields({ pageKey: "home", ...opts });
}
function homeTypography(opts: { selector: string }) {
  return t4TypographyFields(opts);
}
function homeEyebrowColorField({
  sectionKey,
  selector,
  defaultValue = "#0f766e",
}: {
  sectionKey: string;
  selector: string;
  defaultValue?: string;
}) {
  return colorField("eyebrowTextColor", "Eyebrow color", selector, {
    target: "cssVariable",
    cssVariable: t4CssVar("home", sectionKey, "eyebrow-text-color"),
    defaultValue,
    uiGroup: "Section text style",
    uiOrder: 18,
  });
}
function _homeIconStyle(
  opts: Omit<Parameters<typeof t4IconStyleFields>[0], "pageKey">,
) {
  return t4IconStyleFields({ pageKey: "home", ...opts });
}

// ── About page wrappers ───────────────────────────────────────
function aboutSectionStyle(
  opts: Omit<Parameters<typeof t4SectionStyleFields>[0], "pageKey">,
) {
  return t4SectionStyleFields({ pageKey: "about", ...opts });
}
function aboutButtonStyle(
  opts: Omit<Parameters<typeof t4ButtonStyleFields>[0], "pageKey">,
) {
  return t4ButtonStyleFields({ pageKey: "about", ...opts });
}
function aboutTypography(opts: { selector: string }) {
  return t4TypographyFields(opts);
}

// ── Admissions page wrappers ──────────────────────────────────
function admissionsSectionStyle(
  opts: Omit<Parameters<typeof t4SectionStyleFields>[0], "pageKey">,
) {
  return t4SectionStyleFields({ pageKey: "admissions", ...opts });
}
function admissionsButtonStyle(
  opts: Omit<Parameters<typeof t4ButtonStyleFields>[0], "pageKey">,
) {
  return t4ButtonStyleFields({ pageKey: "admissions", ...opts });
}
function admissionsTypography(opts: { selector: string }) {
  return t4TypographyFields(opts);
}

// ── Gallery page wrappers ─────────────────────────────────────
function gallerySectionStyle(
  opts: Omit<Parameters<typeof t4SectionStyleFields>[0], "pageKey">,
) {
  return t4SectionStyleFields({ pageKey: "gallery", ...opts });
}
function _galleryButtonStyle(
  opts: Omit<Parameters<typeof t4ButtonStyleFields>[0], "pageKey">,
) {
  return t4ButtonStyleFields({ pageKey: "gallery", ...opts });
}
function galleryTypography(opts: { selector: string }) {
  return t4TypographyFields(opts);
}

// ── Contact page wrappers ─────────────────────────────────────
function contactSectionStyle(
  opts: Omit<Parameters<typeof t4SectionStyleFields>[0], "pageKey">,
) {
  return t4SectionStyleFields({ pageKey: "contact", ...opts });
}
function _contactButtonStyle(
  opts: Omit<Parameters<typeof t4ButtonStyleFields>[0], "pageKey">,
) {
  return t4ButtonStyleFields({ pageKey: "contact", ...opts });
}
function contactTypography(opts: { selector: string }) {
  return t4TypographyFields(opts);
}

const pageHero = (pageKey: string) => ({
  id: "page-hero",
  label: "Page Hero",
  selector: ".school-page-hero",
  fields: [
    richTextField("eyebrow", "Eyebrow", ".section-kicker"),
    richTextField("title", "Title", "h1"),
    richTextField("body", "Body", "p"),
    backgroundImageField(
      "heroImage",
      "Hero background image",
      ".school-page-hero",
      {
        target: "cssVariable",
        cssVariable: `--dexta-academy-4-${pageKey}-page-hero-bg-image`,
        helpText:
          "Replaces the page hero background image. The gradient overlay is preserved.",
      },
    ),
    ...t4SectionStyleFields({
      pageKey,
      sectionKey: "page-hero",
      selector: ".school-page-hero",
      defaultBackgroundColor: "#102542",
    }),
    ...t4TypographyFields({ selector: ".school-page-hero" }),
    ...t4ButtonStyleFields({
      pageKey,
      sectionKey: "page-hero",
      selector: ".school-page-hero",
      defaultBackgroundColor: "#4a8fff",
      defaultTextColor: "#ffffff",
      defaultBorderColor: "#4a8fff",
      defaultBorderWidth: 0,
    }),
  ],
});

const formIframePlaceholder =
  '<iframe src="https://docs.google.com/forms/..." width="640" height="1602" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>';

const formIframeHelpText =
  "Paste the full Google Forms iframe embed code. Leave blank to use the Google Form URL field.";

const fontImportHelpText =
  "Paste a Google Fonts embed URL to change the font for this section. Example: https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap";

export const dextaAcademy4Manifest: SchoolTemplateManifest = {
  templateSlug: "dexta-academy-4",
  templateName: "Dexta Academy 4",
  sourceDir: "src/app/(public)/dexta-academy-4",
  entryFile: "index.html",
  previewPath: "/dexta-academy-4/index.html",
  assetInventory: {
    directories: ["assets", "css", "fonts", "js"],
    stylesheets: ["css/style.css", "css/hero-3d.css", "css/gallery-page.css"],
    scripts: ["js/main.js", "js/hero-3d.js"],
  },
  sharedSections: [
    {
      id: "header",
      label: "Header",
      selector: ".hero-header",
      fields: [
        imageField("logo", "Logo", ".hero-brand img"),
        textField("portalText", "Portal button text", ".hero-portal-btn", {
          defaultValue: "Portal",
          uiGroup: "Portal button",
          uiOrder: 5,
        }),
        linkField("portalHref", "Portal button link", ".hero-portal-btn", {
          defaultValue: "#",
          uiGroup: "Portal button",
          uiOrder: 6,
        }),
        textField(
          "applyText",
          "Apply button text",
          ".hero-apply-btn .hero-btn-text",
          {
            defaultValue: "Apply Now",
            uiGroup: "Apply button",
            uiOrder: 5,
          },
        ),
        linkField("applyHref", "Apply button link", ".hero-apply-btn", {
          defaultValue: "admissions.html",
          uiGroup: "Apply button",
          uiOrder: 6,
        }),
        ...t4SectionStyleFields({
          pageKey: "shared",
          sectionKey: "header",
          selector: ".hero-header",
          defaultBackgroundColor: "rgba(2,8,20,0.82)",
          includeBackgroundImage: false,
        }),
        ...t4ButtonStyleFields({
          pageKey: "shared",
          sectionKey: "header-portal",
          selector: ".hero-portal-btn",
          defaultBackgroundColor: "transparent",
          defaultBackgroundOpacity: 0,
          defaultTextColor: "#ffffff",
          defaultBorderColor: "#4a8fff",
          defaultBorderWidth: 2,
        }).map((f) => ({
          ...f,
          label: `Portal ${f.label}`,
          key: `portal${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
          uiGroup: "Portal button",
        })),
        ...t4ButtonStyleFields({
          pageKey: "shared",
          sectionKey: "header-apply",
          selector: ".hero-apply-btn",
          defaultBackgroundColor: "#4a8fff",
          defaultTextColor: "#ffffff",
          defaultBorderColor: "#4a8fff",
          defaultBorderWidth: 0,
        }).map((f) => ({
          ...f,
          label: `Apply ${f.label}`,
          key: `apply${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
          uiGroup: "Apply button",
        })),
      ],
    },
    {
      id: "footer",
      label: "Footer",
      selector: ".school-footer",
      fields: [
        imageField("logo", "Footer logo", ".school-footer-brand-logo"),
        richTextField("schoolName", "School name", ".school-footer-brand h3"),
        richTextField("description", "Description", ".school-footer-brand p"),
        textField("phone", "Phone", "a[href^='tel:']"),
        textField("email", "Email", "a[href^='mailto:']"),
        richTextField(
          "address",
          "Address",
          ".school-footer .col-md-6:nth-of-type(3) p",
        ),
        textField(
          "hours",
          "Office hours",
          ".school-footer .col-md-6:nth-of-type(2) p.mb-0",
        ),
        richTextField(
          "copyright",
          "Copyright text",
          ".school-footer-bottom > p",
        ),
        linkField(
          "facebookUrl",
          "Facebook URL",
          ".footer-social a[aria-label='Facebook']",
        ),
        linkField(
          "twitterUrl",
          "Twitter / X URL",
          ".footer-social a[aria-label='Twitter']",
        ),
        linkField(
          "instagramUrl",
          "Instagram URL",
          ".footer-social a[aria-label='Instagram']",
        ),
        linkField(
          "linkedinUrl",
          "LinkedIn URL",
          ".footer-social a[aria-label='LinkedIn']",
        ),
        ...t4SectionStyleFields({
          pageKey: "shared",
          sectionKey: "footer",
          selector: ".school-footer",
          defaultBackgroundColor: "#0b1220",
          includeBackgroundImage: false,
        }),
      ],
    },
  ],
  pages: [
    {
      slug: "home",
      fileName: "index.html",
      title: "Home",
      isHome: true,
      sections: [
        {
          id: "hero",
          label: "Hero",
          selector: ".school-hero",
          fields: [
            richTextField("eyebrow", "Eyebrow", ".hero-eyebrow"),
            richTextField("headline", "Headline", ".hero-display"),
            numberField(
              "mobileHeadlineFontSize",
              "Mobile headline text size",
              ".school-hero",
              {
                target: "threeConfig",
                configPath: "responsive.mobile.headlineFontSize",
                defaultValue: 64,
                min: 28,
                max: 120,
                step: 1,
                unit: "px",
                uiGroup: "Hero text style",
                uiOrder: 17,
                helpText:
                  "Mobile only. Adjusts the large hero headline size on phones without changing desktop.",
              },
            ),
            colorField(
              "eyebrowDashColor",
              "Eyebrow dash color",
              ".school-hero",
              {
                target: "cssVariable",
                cssVariable: "--dexta-academy-4-home-hero-eyebrow-dash-color",
                defaultValue: "#ffffff",
                uiGroup: "Hero text style",
                uiOrder: 18,
              },
            ),
            textField(
              "primaryCtaText",
              "Primary CTA text",
              ".hero-primary-btn",
            ),
            linkField(
              "primaryCtaHref",
              "Primary CTA link",
              ".hero-primary-btn",
            ),
            textField(
              "secondaryCtaText",
              "Secondary CTA text",
              ".hero-secondary-btn",
            ),
            linkField(
              "secondaryCtaHref",
              "Secondary CTA link",
              ".hero-secondary-btn",
            ),
            backgroundImageField(
              "heroImage",
              "Hero background image",
              ".hero",
              {
                target: "cssVariable",
                cssVariable: "--dexta-academy-4-home-hero-bg-image",
                helpText:
                  "Replaces the default hero background image. The dark gradient overlay is preserved.",
              },
            ),
            ...homeSectionStyle({
              sectionKey: "hero",
              selector: ".school-hero",
              defaultBackgroundColor: "#020810",
              includeBackgroundImage: false,
            }),
            ...homeTypography({ selector: ".school-hero" }),
            ...t4ButtonStyleFields({
              pageKey: "home",
              sectionKey: "hero-primary",
              selector: ".school-hero",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }).map((f) => ({
              ...f,
              label: `Primary ${f.label}`,
              key: `primary${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
              uiGroup: "Primary CTA style",
            })),
            ...t4ButtonStyleFields({
              pageKey: "home",
              sectionKey: "hero-secondary",
              selector: ".school-hero",
              defaultBackgroundColor: "transparent",
              defaultBackgroundOpacity: 0,
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 2,
            }).map((f) => ({
              ...f,
              label: `Secondary ${f.label}`,
              key: `secondary${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
              uiGroup: "Secondary CTA style",
            })),
          ],
        },
        {
          id: "hero-3d-model",
          label: "Hero 3D Model",
          selector: "#hero-3d-stage",
          description:
            "Controls the homepage 3D model source, size, rotation, scene offset, and responsive stage placement.",
          fields: [
            model3dField("modelUrl", "3D model file", "#hero-3d-stage", {
              configPath: "model.url",
              defaultValue: "assets/3d/gr.glb",
              helpText:
                "Upload an optimized .glb file. The original template uses assets/3d/gr.glb.",
            }),
            numberField("modelScale", "Model size", "#hero-3d-stage", {
              target: "threeConfig",
              configPath: "transform.scale",
              defaultValue: 4.5,
              min: 0.2,
              max: 16,
              step: 0.1,
              helpText:
                "Increase to make the model bigger, or decrease to make it smaller.",
            }),
            numberField(
              "mobileModelScale",
              "Mobile model size",
              "#hero-3d-stage",
              {
                target: "threeConfig",
                configPath: "transform.mobile.scale",
                defaultValue: 4.5,
                min: 0.2,
                max: 16,
                step: 0.1,
                helpText:
                  "Controls the 3D model size on mobile only. Desktop size is unchanged.",
              },
            ),
            numberField(
              "modelOffsetX",
              "Model horizontal offset",
              "#hero-3d-stage",
              {
                target: "threeConfig",
                configPath: "transform.offset.x",
                defaultValue: 0.1,
                min: -1,
                max: 1,
                step: 0.01,
                helpText:
                  "Moves the model inside the 3D scene after centering. Positive values move right.",
              },
            ),
            numberField(
              "modelOffsetY",
              "Model vertical offset",
              "#hero-3d-stage",
              {
                target: "threeConfig",
                configPath: "transform.offset.y",
                defaultValue: -0.18,
                min: -1,
                max: 1,
                step: 0.01,
                helpText:
                  "Moves the model inside the 3D scene after centering. Negative values move down.",
              },
            ),
            numberField("rotationX", "Rotate X / tilt", "#hero-3d-stage", {
              target: "threeConfig",
              configPath: "transform.rotation.x",
              defaultValue: -0.2,
              min: -3.14,
              max: 3.14,
              step: 0.01,
              unit: "rad",
              helpText: "Tilts the model forward or backward.",
            }),
            numberField("rotationY", "Rotate Y / turn", "#hero-3d-stage", {
              target: "threeConfig",
              configPath: "transform.rotation.y",
              defaultValue: -0.21,
              min: -3.14,
              max: 3.14,
              step: 0.01,
              unit: "rad",
              helpText: "Sets the model's final left/right facing angle.",
            }),
            numberField("spinRotationX", "Spin X / tilt", "#hero-3d-stage", {
              target: "threeConfig",
              configPath: "transform.spinRotation.x",
              defaultValue: -0.2,
              min: -3.14,
              max: 3.14,
              step: 0.01,
              unit: "rad",
              helpText:
                "Controls the X tilt used by the intro spin animation without moving the model's final position.",
            }),
            numberField("spinRotationY", "Spin Y / turn", "#hero-3d-stage", {
              target: "threeConfig",
              configPath: "transform.spinRotation.y",
              defaultValue: -0.21,
              min: -3.14,
              max: 3.14,
              step: 0.01,
              unit: "rad",
              helpText:
                "Controls the Y turn used by the intro spin animation without changing Rotate Y / turn.",
            }),
            numberField("rotationZ", "Sideways tilt / roll", "#hero-3d-stage", {
              target: "threeConfig",
              configPath: "transform.rotation.z",
              defaultValue: 0.2,
              min: -3.14,
              max: 3.14,
              step: 0.01,
              unit: "rad",
              helpText:
                "Rolls the model clockwise or counter-clockwise on desktop and mobile.",
            }),
            selectField(
              "modelVisibility",
              "3D logo visibility",
              "#hero-3d-stage",
              [
                { label: "Show 3D logo", value: "show" },
                { label: "Hide 3D logo", value: "hide" },
              ],
              {
                target: "threeConfig",
                configPath: "visibility.mode",
                defaultValue: "show",
                helpText:
                  "Hide the 3D logo without changing the headline or other hero content.",
              },
            ),
            selectField(
              "mobileLayerOrder",
              "Mobile text/3D layer",
              "#hero-3d-stage",
              [
                { label: "3D logo in front", value: "modelFront" },
                { label: "Text in front", value: "textFront" },
              ],
              {
                target: "threeConfig",
                configPath: "responsive.mobile.layer",
                defaultValue: "modelFront",
                helpText:
                  "Mobile only. Choose whether the headline text appears in front of the 3D logo.",
              },
            ),
            selectField(
              "desktopModelPlacement",
              "Desktop model/text position",
              "#hero-3d-stage",
              [
                { label: "Manual overlay", value: "overlay" },
                { label: "3D model above text", value: "modelTop" },
                { label: "3D model below text", value: "modelBottom" },
              ],
              {
                target: "threeConfig",
                configPath: "responsive.desktop.placement",
                defaultValue: "overlay",
                uiGroup: "Desktop placement",
                uiOrder: 10,
                helpText:
                  "Use Manual overlay to keep the current free-positioned hero. Choose above or below to stack the 3D model with the hero text.",
              },
            ),
            numberField(
              "desktopModelTextGap",
              "Desktop model/text gap",
              "#hero-3d-stage",
              {
                target: "threeConfig",
                configPath: "responsive.desktop.gap",
                defaultValue: 18,
                min: -120,
                max: 180,
                step: 2,
                unit: "px",
                uiGroup: "Desktop placement",
                uiOrder: 11,
                helpText:
                  "Adjusts the space between the 3D model and hero text when desktop position is above or below. Use negative values to bring them closer.",
              },
            ),
            selectField(
              "mobileModelPlacement",
              "Mobile model/text position",
              "#hero-3d-stage",
              [
                { label: "Manual overlay", value: "overlay" },
                { label: "3D model above text", value: "modelTop" },
                { label: "3D model below text", value: "modelBottom" },
              ],
              {
                target: "threeConfig",
                configPath: "responsive.mobile.placement",
                defaultValue: "overlay",
                uiGroup: "Mobile placement",
                uiOrder: 20,
                helpText:
                  "Use Manual overlay to keep the current mobile hero. Choose above or below to stack the 3D model with the hero text on phones.",
              },
            ),
            numberField(
              "mobileModelTextGap",
              "Mobile model/text gap",
              "#hero-3d-stage",
              {
                target: "threeConfig",
                configPath: "responsive.mobile.gap",
                defaultValue: 12,
                min: -100,
                max: 140,
                step: 2,
                unit: "px",
                uiGroup: "Mobile placement",
                uiOrder: 21,
                helpText:
                  "Adjusts the space between the 3D model and hero text when mobile position is above or below. Use negative values to bring them closer.",
              },
            ),
            selectField(
              "modelLightingMode",
              "Model color mode",
              "#hero-3d-stage",
              [
                { label: "Flat original color", value: "flatColor" },
                { label: "True color", value: "trueColor" },
                { label: "Stylized blue highlight", value: "stylized" },
              ],
              {
                target: "threeConfig",
                configPath: "lighting.mode",
                defaultValue: "flatColor",
                helpText:
                  "Use flat original color to match simple Blender material colors most closely.",
              },
            ),
            numberField(
              "modelBrightness",
              "Model brightness",
              "#hero-3d-stage",
              {
                target: "threeConfig",
                configPath: "lighting.brightness",
                defaultValue: 0.65,
                min: 0.05,
                max: 2,
                step: 0.05,
                helpText:
                  "Controls the strength of the lights on the 3D model.",
              },
            ),
            numberField("modelExposure", "Model exposure", "#hero-3d-stage", {
              target: "threeConfig",
              configPath: "lighting.exposure",
              defaultValue: 0.9,
              min: 0.1,
              max: 1.8,
              step: 0.05,
              helpText:
                "Lower this if the model looks washed out or too bright.",
            }),
            numberField(
              "modelEnvironmentStrength",
              "Environment reflection strength",
              "#hero-3d-stage",
              {
                target: "threeConfig",
                configPath: "lighting.environmentIntensity",
                defaultValue: 0.45,
                min: 0,
                max: 1.5,
                step: 0.05,
                helpText:
                  "Controls reflective room lighting. Lower values keep original colors stronger.",
              },
            ),
            numberField(
              "desktopStageX",
              "Desktop horizontal position",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-center-x",
                scope: "desktop",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
              },
            ),
            numberField(
              "desktopModelSideOffset",
              "Desktop left/right offset",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-side-offset",
                scope: "desktop",
                defaultValue: 0,
                min: -520,
                max: 520,
                step: 5,
                unit: "px",
                helpText:
                  "Moves the whole 3D model left or right on larger screens without changing its size.",
              },
            ),
            numberField(
              "desktopStageY",
              "Desktop vertical position",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-center-y",
                scope: "desktop",
                defaultValue: 63,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
              },
            ),
            numberField(
              "desktopStageWidth",
              "Desktop stage width",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-width",
                scope: "desktop",
                defaultValue: 575,
                min: 180,
                max: 900,
                step: 5,
                unit: "px",
              },
            ),
            numberField(
              "desktopStageHeight",
              "Desktop stage height",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-height",
                scope: "desktop",
                defaultValue: 380,
                min: 120,
                max: 700,
                step: 5,
                unit: "px",
              },
            ),
            numberField(
              "mobileStageX",
              "Mobile horizontal position",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-center-x",
                scope: "mobile",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
              },
            ),
            numberField(
              "mobileModelSideOffset",
              "Mobile left/right offset",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-side-offset",
                scope: "mobile",
                defaultValue: 0,
                min: -260,
                max: 260,
                step: 5,
                unit: "px",
                helpText:
                  "Moves the whole 3D model left or right on phones without changing its size.",
              },
            ),
            numberField(
              "mobileStageY",
              "Mobile vertical position",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-center-y",
                scope: "mobile",
                defaultValue: 73,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
              },
            ),
            numberField(
              "mobileStageWidth",
              "Mobile stage width",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-width",
                scope: "mobile",
                defaultValue: 286,
                min: 120,
                max: 520,
                step: 5,
                unit: "px",
              },
            ),
            numberField(
              "mobileStageHeight",
              "Mobile stage height",
              "#hero-3d-stage",
              {
                target: "cssVariable",
                cssVariable: "--cap-height",
                scope: "mobile",
                defaultValue: 188,
                min: 90,
                max: 360,
                step: 5,
                unit: "px",
              },
            ),
          ],
        },
        {
          id: "about-preview",
          label: "About Preview",
          selector: ".school-about-preview",
          fields: [
            imageField("image", "Image", ".about-media img"),
            richTextField("eyebrow", "Eyebrow", ".section-kicker"),
            richTextField("title", "Title", ".section-copy > h2"),
            richTextField("body", "Body", ".section-copy > p"),
            textField("ctaText", "CTA text", ".btn-primary"),
            linkField("ctaHref", "CTA link", ".btn-primary"),
            // Per-item stat card fields
            richTextField("statValue", "Stat value", ".stat-card__value"),
            richTextField("statLabel", "Stat body", ".stat-card__body"),
            // Section-level styling
            ...homeSectionStyle({
              sectionKey: "about-preview",
              selector: ".school-about-preview",
              defaultBackgroundColor: "#ffffff",
            }),
            ...homeTypography({ selector: ".school-about-preview" }),
            homeEyebrowColorField({
              sectionKey: "about-preview",
              selector: ".school-about-preview",
            }),
            ...homeButtonStyle({
              sectionKey: "about-preview",
              selector: ".school-about-preview",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
          repeatable: {
            itemSelector: ".stat-card",
            labelSingular: "Stat",
            labelPlural: "Stats",
          },
        },
        {
          id: "programs",
          label: "Programs",
          selector: ".school-programs",
          fields: [
            richTextField("eyebrow", "Eyebrow", ".section-kicker"),
            richTextField(
              "title",
              "Title",
              ".school-programs .text-center > h2",
            ),
            richTextField("body", "Intro", ".section-intro"),
            // Per-item program card fields
            backgroundImageField(
              "programImage",
              "Program image",
              ".program-card-image",
            ),
            richTextField(
              "programTitle",
              "Program title",
              ".program-card-body h3",
            ),
            richTextField(
              "programBody",
              "Program description",
              ".program-card-body p",
            ),
            linkField("programHref", "Program link", ".program-card-link"),
            // Section-level styling
            ...homeSectionStyle({
              sectionKey: "programs",
              selector: ".school-programs",
              defaultBackgroundColor: "#e8f4f1",
            }),
            ...homeTypography({ selector: ".school-programs" }),
            homeEyebrowColorField({
              sectionKey: "programs",
              selector: ".school-programs",
            }),
            ...homeButtonStyle({
              sectionKey: "programs",
              selector: ".school-programs",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
          repeatable: {
            itemSelector: ".program-card",
            labelSingular: "Program card",
            labelPlural: "Program cards",
          },
        },
        {
          id: "gallery-preview",
          label: "Gallery Preview",
          selector: ".homepage-gallery-preview",
          fields: [
            richTextField("eyebrow", "Eyebrow", ".section-kicker"),
            richTextField("title", "Title", "h2"),
            richTextField("body", "Body", ".gallery-preview-intro"),
            textField("ctaText", "CTA text", ".btn-primary"),
            linkField("ctaHref", "CTA link", ".btn-primary"),
            // Per-item gallery card fields
            backgroundImageField(
              "image",
              "Gallery image",
              ".gallery-preview-card",
            ),
            // Section-level styling
            ...homeSectionStyle({
              sectionKey: "gallery-preview",
              selector: ".homepage-gallery-preview",
              defaultBackgroundColor: "#f7fafc",
            }),
            ...homeTypography({ selector: ".homepage-gallery-preview" }),
            homeEyebrowColorField({
              sectionKey: "gallery-preview",
              selector: ".homepage-gallery-preview",
            }),
            ...homeButtonStyle({
              sectionKey: "gallery-preview",
              selector: ".homepage-gallery-preview",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
          repeatable: {
            itemSelector: ".gallery-preview-card",
            labelSingular: "Gallery card",
            labelPlural: "Gallery cards",
          },
        },
      ],
    },
    {
      slug: "about",
      fileName: "about.html",
      title: "About",
      sections: [
        pageHero("about"),
        {
          id: "story",
          label: "Story",
          selector: ".about-story-section",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".section-copy .section-kicker",
            ),
            richTextField("title", "Title", ".section-copy > h2"),
            richTextField(
              "body1",
              "Paragraph 1",
              ".section-copy > p:nth-of-type(1)",
            ),
            richTextField(
              "body2",
              "Paragraph 2",
              ".section-copy > p:nth-of-type(2)",
            ),
            textField(
              "ctaText",
              "Read more button text",
              ".about-story-readmore",
            ),
            backgroundImageField("image", "Image", ".story-media-image"),
            richTextField(
              "imageTitle",
              "Image note title",
              ".story-media-note strong",
            ),
            richTextField(
              "imageCaption",
              "Image note caption",
              ".story-media-note span",
            ),
            ...aboutSectionStyle({
              sectionKey: "story",
              selector: ".about-story-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...aboutTypography({ selector: ".about-story-section" }),
            ...aboutButtonStyle({
              sectionKey: "story",
              selector: ".about-story-section",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
        },
        {
          id: "story-modal",
          label: "Story Modal",
          selector: "#aboutStoryModal .modal-content",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".modal-header .section-kicker",
            ),
            richTextField("title", "Modal title", "#aboutStoryModalLabel"),
            richTextField("bodyHtml", "Full story", ".about-story-modal-body"),
          ],
        },
        {
          id: "principles",
          label: "Mission, Vision & Core Values",
          selector: ".about-principles-section",
          fields: [
            richTextField("eyebrow", "Eyebrow", ".section-kicker"),
            richTextField("title", "Title", ".about-principles-section h2"),
            richTextField("intro", "Section intro", ".section-intro"),
            // Per-item principle card fields
            richTextField(
              "principleLabel",
              "Principle label",
              ".principle-card__label",
            ),
            richTextField(
              "principleTitle",
              "Principle title",
              ".principle-card__title",
            ),
            richTextField(
              "principleBody",
              "Principle body",
              ".principle-card__body",
            ),
            ...aboutSectionStyle({
              sectionKey: "principles",
              selector: ".about-principles-section",
              defaultBackgroundColor: "#f0f4f8",
            }),
            ...aboutTypography({ selector: ".about-principles-section" }),
          ],
          repeatable: {
            itemSelector: ".principle-card",
            labelSingular: "Principle",
            labelPlural: "Principles",
          },
        },
        {
          id: "principal-note",
          label: "Principal Note",
          selector: ".principal-note-section",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".principal-note-copy .section-kicker",
            ),
            richTextField("title", "Title", ".principal-note-copy > h2"),
            richTextField(
              "body1",
              "Body paragraph 1",
              ".principal-note-copy > p:nth-of-type(1)",
            ),
            richTextField(
              "body2",
              "Body paragraph 2",
              ".principal-note-copy > p:nth-of-type(2)",
            ),
            textField(
              "principalName",
              "Principal name & qualifications",
              ".principal-note-signoff strong",
            ),
            textField(
              "principalRole",
              "Principal role / title",
              ".principal-note-signoff span",
            ),
            richTextField(
              "principalBio",
              "Principal bio",
              ".principal-note-signoff p",
            ),
            colorField(
              "panelBgColor",
              "Main note container background color",
              ".principal-note-panel",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "about",
                  "principal-note",
                  "panel-bg-color",
                ),
                defaultValue: "#102542",
                uiGroup: "Principal note containers",
                uiOrder: 130,
              },
            ),
            numberField(
              "panelBgOpacity",
              "Main note container background opacity",
              ".principal-note-panel",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "about",
                  "principal-note",
                  "panel-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Principal note containers",
                uiOrder: 131,
              },
            ),
            colorField(
              "signoffBgColor",
              "Principal name container background color",
              ".principal-note-signoff",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "about",
                  "principal-note",
                  "signoff-bg-color",
                ),
                defaultValue: "#ffffff",
                uiGroup: "Principal note containers",
                uiOrder: 132,
              },
            ),
            numberField(
              "signoffBgOpacity",
              "Principal name container background opacity",
              ".principal-note-signoff",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "about",
                  "principal-note",
                  "signoff-bg-opacity",
                ),
                defaultValue: 8,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Principal note containers",
                uiOrder: 133,
              },
            ),
            ...aboutSectionStyle({
              sectionKey: "principal-note",
              selector: ".principal-note-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...aboutTypography({ selector: ".principal-note-section" }),
          ],
        },
        {
          id: "student-experience",
          label: "Student Experience",
          selector: ".student-experience-section",
          fields: [
            textField("eyebrow", "Eyebrow", ".section-kicker"),
            textField("title", "Title", ".student-experience-section__title"),
            imageField(
              "image",
              "Experience image",
              ".student-experience-image img",
            ),
            textField("experienceTitle", "Experience title", "h3"),
            textareaField("experienceBody", "Experience body", "p"),
            ...aboutSectionStyle({
              sectionKey: "student-experience",
              selector: ".student-experience-section",
              defaultBackgroundColor: "#f7fafc",
            }),
            ...aboutTypography({ selector: ".student-experience-section" }),
          ],
          repeatable: {
            itemSelector: ".experience-card",
            labelSingular: "Experience item",
            labelPlural: "Experience items",
          },
        },
        {
          id: "facts",
          label: "Facts",
          selector: ".about-facts-section",
          fields: [
            textField("eyebrow", "Eyebrow", ".section-kicker"),
            textField("title", "Title", ".about-facts-section h2"),
            textField("factValue", "Fact value", ".about-fact-card__value"),
            textField("factLabel", "Fact label", ".about-fact-card__label"),
            ...aboutSectionStyle({
              sectionKey: "facts",
              selector: ".about-facts-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...aboutTypography({ selector: ".about-facts-section" }),
          ],
          repeatable: {
            itemSelector: ".about-fact-card",
            labelSingular: "Fact",
            labelPlural: "Facts",
          },
        },
      ],
    },
    {
      slug: "admissions",
      fileName: "admissions.html",
      title: "Admissions",
      sections: [
        {
          id: "page-hero",
          label: "Page Hero",
          selector: ".school-page-hero",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".admissions-page-hero-content > .section-kicker",
            ),
            richTextField(
              "title",
              "Title",
              ".admissions-page-hero-content > h1",
            ),
            richTextField("body", "Body", ".admissions-page-hero-content > p"),
            backgroundImageField(
              "heroImage",
              "Hero background image",
              ".school-page-hero",
              {
                target: "cssVariable",
                cssVariable: "--dexta-academy-4-admissions-page-hero-bg-image",
                helpText:
                  "Replaces the page hero background image. The gradient overlay is preserved.",
              },
            ),
            ...t4SectionStyleFields({
              pageKey: "admissions",
              sectionKey: "page-hero",
              selector: ".school-page-hero",
              defaultBackgroundColor: "#102542",
            }),
            ...t4TypographyFields({ selector: ".school-page-hero" }),
            ...t4ButtonStyleFields({
              pageKey: "admissions",
              sectionKey: "page-hero",
              selector: ".school-page-hero",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
        },
        {
          id: "process",
          label: "Admissions Process",
          selector: ".admissions-process-section",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".section-copy .section-kicker",
            ),
            richTextField("title", "Title", ".section-copy h2"),
            richTextField("body", "Description", ".section-copy > p"),
            richTextField("stepTitle", "Step title", "h3"),
            richTextField("stepBody", "Step body", "p"),
            // ── Side panel fields ──
            richTextField(
              "panelKicker",
              "Panel kicker",
              ".admissions-panel-kicker",
            ),
            richTextField(
              "panelTitle",
              "Panel heading",
              ".admissions-side-panel h3",
            ),
            richTextField(
              "checklist",
              "Checklist items",
              ".admissions-checklist",
            ),
            richTextField(
              "contactCardTitle",
              "Contact card title",
              ".admissions-contact-card strong",
            ),
            richTextField(
              "contactCardBody",
              "Contact card body",
              ".admissions-contact-card > p",
            ),
            textField(
              "contactPhone",
              "Phone number",
              ".admissions-contact-links a[href^='tel:']",
            ),
            textField(
              "contactEmail",
              "Email address",
              ".admissions-contact-links a[href^='mailto:']",
            ),
            colorField(
              "sidePanelBgColor",
              "Before you begin container background color",
              ".admissions-side-panel",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "side-panel-bg-color",
                ),
                defaultValue: "#102542",
                uiGroup: "Process card styles",
                uiOrder: 120,
              },
            ),
            numberField(
              "sidePanelBgOpacity",
              "Before you begin container background opacity",
              ".admissions-side-panel",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "side-panel-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Process card styles",
                uiOrder: 121,
              },
            ),
            colorField(
              "contactCardBgColor",
              "Need help before submitting card background color",
              ".admissions-contact-card",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "contact-card-bg-color",
                ),
                defaultValue: "#ffffff",
                uiGroup: "Process card styles",
                uiOrder: 122,
              },
            ),
            numberField(
              "contactCardBgOpacity",
              "Need help before submitting card background opacity",
              ".admissions-contact-card",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "contact-card-bg-opacity",
                ),
                defaultValue: 8,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Process card styles",
                uiOrder: 123,
              },
            ),
            colorField(
              "stepCardBgColor",
              "Process step card background color",
              ".admissions-step-card",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "step-card-bg-color",
                ),
                defaultValue: "#f7fafc",
                uiGroup: "Process card styles",
                uiOrder: 124,
              },
            ),
            numberField(
              "stepCardBgOpacity",
              "Process step card background opacity",
              ".admissions-step-card",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "step-card-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Process card styles",
                uiOrder: 125,
              },
            ),
            colorField(
              "stepNumberColor",
              "Process step number color",
              ".admissions-step-number",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "step-number-color",
                ),
                defaultValue: "#ffffff",
                uiGroup: "Process card styles",
                uiOrder: 126,
              },
            ),
            colorField(
              "stepNumberBgColor",
              "Process step number background color",
              ".admissions-step-number",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "step-number-bg-color",
                ),
                defaultValue: "#102542",
                uiGroup: "Process card styles",
                uiOrder: 127,
              },
            ),
            numberField(
              "stepNumberBgOpacity",
              "Process step number background opacity",
              ".admissions-step-number",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "process",
                  "step-number-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Process card styles",
                uiOrder: 128,
              },
            ),
            ...admissionsSectionStyle({
              sectionKey: "process",
              selector: ".admissions-process-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...admissionsTypography({
              selector: ".admissions-process-section",
            }),
          ],
          repeatable: {
            itemSelector: ".admissions-step-card",
            labelSingular: "Process step",
            labelPlural: "Process steps",
          },
        },
        {
          id: "application-form-intro",
          label: "Application Form Intro",
          selector: ".admissions-form-section",
          fields: [
            ...admissionsSectionStyle({
              sectionKey: "form",
              selector: ".admissions-form-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...admissionsTypography({ selector: ".admissions-form-section" }),
            richTextField("eyebrow", "Eyebrow", ".section-kicker"),
            richTextField("title", "Title", "h2"),
            richTextField("body", "Intro text", ".section-intro"),
            textField(
              "formName",
              "Form name",
              ".admissions-form-shell-header strong",
            ),
            textField(
              "formDescription",
              "Form description",
              ".admissions-form-shell-header span",
            ),
            textField(
              "openFormText",
              "Open form link text",
              ".admissions-form-link",
            ),
            linkField(
              "openFormHref",
              "Open form link URL",
              ".admissions-form-link",
            ),
            ...admissionsButtonStyle({
              sectionKey: "form",
              selector: ".admissions-form-section",
              defaultBackgroundColor: "#102542",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#102542",
              defaultBorderWidth: 0,
            }),
            linkField("formUrl", "Admission Google Form URL", "iframe", {
              attribute: "src",
            }),
            textareaField(
              "formIframe",
              "Admission iframe embed code",
              "iframe",
              {
                target: "attribute",
                attribute: "src",
                defaultValue: "",
                placeholder: formIframePlaceholder,
                helpText: formIframeHelpText,
              },
            ),
            textField("formTitle", "Iframe title", "iframe", {
              target: "attribute",
              attribute: "title",
            }),
          ],
        },
        {
          id: "admissions-cta",
          label: "Admissions CTA",
          selector: ".admissions-page-cta",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".cta-content > .section-kicker",
            ),
            richTextField("title", "Title", ".cta-content > h2"),
            richTextField("body", "Body", ".cta-content > p"),
            textField("primaryCtaText", "Primary CTA text", ".btn-primary"),
            linkField("primaryCtaHref", "Primary CTA link", ".btn-primary"),
            textField(
              "secondaryCtaText",
              "Secondary CTA text",
              ".btn-outline-primary",
            ),
            linkField(
              "secondaryCtaHref",
              "Secondary CTA link",
              ".btn-outline-primary",
            ),
            ...admissionsSectionStyle({
              sectionKey: "admissions-cta",
              selector: ".admissions-page-cta",
              defaultBackgroundColor: "#f0f4f8",
            }),
            colorField(
              "panelBgColor",
              "Inner card background color",
              ".admissions-page-cta",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "admissions-cta",
                  "panel-bg-color",
                ),
                defaultValue: "#102542",
                uiGroup: "Section background",
                uiOrder: 105,
              },
            ),
            numberField(
              "panelBgOpacity",
              "Inner card background opacity",
              ".admissions-page-cta",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "admissions",
                  "admissions-cta",
                  "panel-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Section background",
                uiOrder: 106,
              },
            ),
            ...admissionsTypography({ selector: ".admissions-page-cta" }),
            ...admissionsButtonStyle({
              sectionKey: "admissions-cta",
              selector: ".admissions-page-cta",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
        },
      ],
    },
    {
      slug: "gallery",
      fileName: "gallery.html",
      title: "Gallery",
      sections: [
        {
          id: "page-hero",
          label: "Page Hero",
          selector: ".school-page-hero",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".gallery-page-hero-content > .section-kicker",
            ),
            richTextField("title", "Title", ".gallery-page-hero-content > h1"),
            richTextField("body", "Body", ".gallery-page-hero-content > p"),
            backgroundImageField(
              "heroImage",
              "Hero background image",
              ".school-page-hero",
              {
                target: "cssVariable",
                cssVariable: "--dexta-academy-4-gallery-page-hero-bg-image",
                helpText:
                  "Replaces the page hero background image. The gradient overlay is preserved.",
              },
            ),
            ...t4SectionStyleFields({
              pageKey: "gallery",
              sectionKey: "page-hero",
              selector: ".school-page-hero",
              defaultBackgroundColor: "#102542",
            }),
            ...t4TypographyFields({ selector: ".school-page-hero" }),
            ...t4ButtonStyleFields({
              pageKey: "gallery",
              sectionKey: "page-hero",
              selector: ".school-page-hero",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
        },
        {
          id: "gallery-showcase",
          label: "Gallery Showcase",
          selector: ".gallery-showcase-section",
          fields: [
            richTextField("eyebrow", "Eyebrow", ".text-center .section-kicker"),
            richTextField("title", "Title", ".text-center h2"),
            richTextField("body", "Intro text", ".section-intro"),
            backgroundImageField("image", "Image", ".gallery-page-card"),
            ...gallerySectionStyle({
              sectionKey: "gallery-showcase",
              selector: ".gallery-showcase-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...galleryTypography({ selector: ".gallery-showcase-section" }),
          ],
          repeatable: {
            itemSelector: ".gallery-page-card",
            labelSingular: "Gallery item",
            labelPlural: "Gallery items",
          },
        },
        {
          id: "gallery-cta",
          label: "Gallery CTA",
          selector: ".gallery-page-cta",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".cta-content > .section-kicker",
            ),
            richTextField("title", "Title", ".cta-content > h2"),
            richTextField("body", "Body", ".cta-content > p"),
            textField("primaryCtaText", "Primary CTA text", ".btn-primary"),
            linkField("primaryCtaHref", "Primary CTA link", ".btn-primary"),
            textField(
              "secondaryCtaText",
              "Secondary CTA text",
              ".btn-outline-primary",
            ),
            linkField(
              "secondaryCtaHref",
              "Secondary CTA link",
              ".btn-outline-primary",
            ),
            ...gallerySectionStyle({
              sectionKey: "gallery-cta",
              selector: ".gallery-page-cta",
              defaultBackgroundColor: "#f0f4f8",
            }),
            colorField(
              "panelBgColor",
              "Panel background color",
              ".gallery-page-cta",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "gallery",
                  "gallery-cta",
                  "panel-bg-color",
                ),
                defaultValue: "#102542",
                uiGroup: "Section background",
                uiOrder: 101,
              },
            ),
            numberField(
              "panelBgOpacity",
              "Panel background opacity",
              ".gallery-page-cta",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "gallery",
                  "gallery-cta",
                  "panel-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Section background",
                uiOrder: 102,
              },
            ),
            ...galleryTypography({ selector: ".gallery-page-cta" }),
            ...t4ButtonStyleFields({
              pageKey: "gallery",
              sectionKey: "gallery-cta-primary",
              selector: ".gallery-page-cta",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }).map((f) => ({
              ...f,
              label: `Primary ${f.label}`,
              key: `primary${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
              uiGroup: "Primary CTA style",
            })),
            ...t4ButtonStyleFields({
              pageKey: "gallery",
              sectionKey: "gallery-cta-secondary",
              selector: ".gallery-page-cta",
              defaultBackgroundColor: "transparent",
              defaultBackgroundOpacity: 0,
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#ffffff",
              defaultBorderWidth: 2,
            }).map((f) => ({
              ...f,
              label: `Secondary ${f.label}`,
              key: `secondary${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
              uiGroup: "Secondary CTA style",
            })),
          ],
        },
      ],
    },
    {
      slug: "contact",
      fileName: "contact.html",
      title: "Contact",
      sections: [
        {
          id: "page-hero",
          label: "Page Hero",
          selector: ".school-page-hero",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".contact-page-hero-content > .section-kicker",
            ),
            richTextField("title", "Title", ".contact-page-hero-content > h1"),
            richTextField("body", "Body", ".contact-page-hero-content > p"),
            textField(
              "secondaryCtaText",
              "Secondary CTA text",
              ".contact-secondary-link-text",
            ),
            linkField(
              "secondaryCtaHref",
              "Secondary CTA phone link",
              ".contact-secondary-link",
            ),
            backgroundImageField(
              "heroImage",
              "Hero background image",
              ".school-page-hero",
              {
                target: "cssVariable",
                cssVariable: "--dexta-academy-4-contact-page-hero-bg-image",
                helpText:
                  "Replaces the page hero background image. The gradient overlay is preserved.",
              },
            ),
            ...t4SectionStyleFields({
              pageKey: "contact",
              sectionKey: "page-hero",
              selector: ".school-page-hero",
              defaultBackgroundColor: "#102542",
            }),
            ...t4TypographyFields({ selector: ".school-page-hero" }),
            ...t4ButtonStyleFields({
              pageKey: "contact",
              sectionKey: "page-hero",
              selector: ".school-page-hero",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }),
          ],
        },
        {
          id: "contact-details",
          label: "Contact Details",
          selector: ".contact-details-section",
          fields: [
            richTextField("eyebrow", "Eyebrow", ".text-center .section-kicker"),
            richTextField("title", "Title", ".text-center h2"),
            richTextField("body", "Intro text", ".section-intro"),
            textField("detailTitle", "Detail title", "strong"),
            textField("detailValue", "Detail value", "span"),
            colorField(
              "cardBgColor",
              "Detail card background color",
              ".contact-detail-card",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "contact-details",
                  "card-bg-color",
                ),
                defaultValue: "#f7fafc",
                uiGroup: "Detail card style",
                uiOrder: 120,
              },
            ),
            numberField(
              "cardBgOpacity",
              "Detail card background opacity",
              ".contact-detail-card",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "contact-details",
                  "card-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Detail card style",
                uiOrder: 121,
              },
            ),
            colorField(
              "cardBorderColor",
              "Detail card border color",
              ".contact-detail-card",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "contact-details",
                  "card-border-color",
                ),
                defaultValue: "rgba(15, 23, 42, 0.06)",
                uiGroup: "Detail card style",
                uiOrder: 122,
              },
            ),
            colorField(
              "cardTitleTextColor",
              "Detail card title text color",
              "strong",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "contact-details",
                  "card-title-text-color",
                ),
                defaultValue: "#102542",
                uiGroup: "Detail card style",
                uiOrder: 123,
              },
            ),
            colorField(
              "cardBodyTextColor",
              "Detail card body text color",
              "span, a",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "contact-details",
                  "card-body-text-color",
                ),
                defaultValue: "#5f6f81",
                uiGroup: "Detail card style",
                uiOrder: 124,
              },
            ),
            ...contactSectionStyle({
              sectionKey: "contact-details",
              selector: ".contact-details-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...contactTypography({ selector: ".contact-details-section" }),
          ],
          repeatable: {
            itemSelector: ".contact-detail-card",
            labelSingular: "Contact detail",
            labelPlural: "Contact details",
          },
        },
        {
          id: "contact-form",
          label: "Contact Form",
          selector: ".contact-form-section",
          fields: [
            ...contactSectionStyle({
              sectionKey: "form",
              selector: ".contact-form-section",
              defaultBackgroundColor: "#ffffff",
            }),
            ...contactTypography({ selector: ".contact-form-section" }),
            richTextField("eyebrow", "Eyebrow", ".contact-panel-kicker"),
            richTextField("title", "Title", ".contact-side-panel h2"),
            richTextField("body", "Body", ".contact-side-panel > p"),
            richTextField(
              "focusList",
              "Focus list items",
              ".contact-focus-list",
            ),
            textField(
              "contactPhone",
              "Phone number",
              ".contact-side-links a[href^='tel:']",
            ),
            textField(
              "contactEmail",
              "Email address",
              ".contact-side-links a[href^='mailto:']",
            ),
            textField(
              "formName",
              "Form name",
              ".contact-form-shell-header strong",
            ),
            textField(
              "formDescription",
              "Form description",
              ".contact-form-shell-header span",
            ),
            textField(
              "openFormText",
              "Open form link text",
              ".contact-form-link",
            ),
            linkField(
              "openFormHref",
              "Open form link URL",
              ".contact-form-link",
            ),
            ...t4ButtonStyleFields({
              pageKey: "contact",
              sectionKey: "form",
              selector: ".contact-form-section",
              defaultBackgroundColor: "#102542",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#102542",
              defaultBorderWidth: 0,
            }),
            colorField(
              "sidePanelBgColor",
              "Before you send container background color",
              ".contact-side-panel",
              {
                target: "cssVariable",
                cssVariable: t4CssVar("contact", "form", "side-panel-bg-color"),
                defaultValue: "#102542",
                uiGroup: "Before you send style",
                uiOrder: 120,
              },
            ),
            numberField(
              "sidePanelBgOpacity",
              "Before you send container background opacity",
              ".contact-side-panel",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "form",
                  "side-panel-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Before you send style",
                uiOrder: 121,
              },
            ),
            colorField(
              "sidePanelKickerTextColor",
              "Before you send kicker text color",
              ".contact-panel-kicker",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "form",
                  "side-panel-kicker-text-color",
                ),
                defaultValue: "rgba(255, 255, 255, 0.72)",
                uiGroup: "Before you send style",
                uiOrder: 122,
              },
            ),
            colorField(
              "sidePanelTitleTextColor",
              "Before you send title text color",
              ".contact-side-panel h2",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "form",
                  "side-panel-title-text-color",
                ),
                defaultValue: "#ffffff",
                uiGroup: "Before you send style",
                uiOrder: 123,
              },
            ),
            colorField(
              "sidePanelBodyTextColor",
              "Before you send body text color",
              ".contact-side-panel > p",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "form",
                  "side-panel-body-text-color",
                ),
                defaultValue: "rgba(255, 255, 255, 0.78)",
                uiGroup: "Before you send style",
                uiOrder: 124,
              },
            ),
            colorField(
              "sidePanelListTextColor",
              "Before you send list text color",
              ".contact-focus-list li",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "form",
                  "side-panel-list-text-color",
                ),
                defaultValue: "rgba(255, 255, 255, 0.8)",
                uiGroup: "Before you send style",
                uiOrder: 125,
              },
            ),
            colorField(
              "sidePanelLinkTextColor",
              "Before you send link text color",
              ".contact-side-links a",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "form",
                  "side-panel-link-text-color",
                ),
                defaultValue: "#ffffff",
                uiGroup: "Before you send style",
                uiOrder: 126,
              },
            ),
            linkField("formUrl", "School/contact Google Form URL", "iframe", {
              attribute: "src",
            }),
            textareaField(
              "formIframe",
              "School/contact iframe embed code",
              "iframe",
              {
                target: "attribute",
                attribute: "src",
                defaultValue: "",
                placeholder: formIframePlaceholder,
                helpText: formIframeHelpText,
              },
            ),
            textField("formTitle", "Iframe title", "iframe", {
              target: "attribute",
              attribute: "title",
            }),
          ],
        },
        {
          id: "contact-cta",
          label: "Contact CTA",
          selector: ".contact-page-cta",
          fields: [
            richTextField(
              "eyebrow",
              "Eyebrow",
              ".cta-content > .section-kicker",
            ),
            richTextField("title", "Title", ".cta-content > h2"),
            richTextField("body", "Body", ".cta-content > p"),
            textField("primaryCtaText", "Primary CTA text", ".btn-primary"),
            linkField("primaryCtaHref", "Primary CTA link", ".btn-primary"),
            textField(
              "secondaryCtaText",
              "Secondary CTA text",
              ".btn-outline-primary",
            ),
            linkField(
              "secondaryCtaHref",
              "Secondary CTA link",
              ".btn-outline-primary",
            ),
            ...contactSectionStyle({
              sectionKey: "contact-cta",
              selector: ".contact-page-cta",
              defaultBackgroundColor: "#f0f4f8",
            }),
            colorField(
              "panelBgColor",
              "Panel background color",
              ".contact-page-cta",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "contact-cta",
                  "panel-bg-color",
                ),
                defaultValue: "#102542",
                uiGroup: "Section background",
                uiOrder: 101,
              },
            ),
            numberField(
              "panelBgOpacity",
              "Panel background opacity",
              ".contact-page-cta",
              {
                target: "cssVariable",
                cssVariable: t4CssVar(
                  "contact",
                  "contact-cta",
                  "panel-bg-opacity",
                ),
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                uiGroup: "Section background",
                uiOrder: 102,
              },
            ),
            ...contactTypography({ selector: ".contact-page-cta" }),
            ...t4ButtonStyleFields({
              pageKey: "contact",
              sectionKey: "contact-cta-primary",
              selector: ".contact-page-cta",
              defaultBackgroundColor: "#4a8fff",
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#4a8fff",
              defaultBorderWidth: 0,
            }).map((f) => ({
              ...f,
              label: `Primary ${f.label}`,
              key: `primary${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
              uiGroup: "Primary CTA style",
            })),
            ...t4ButtonStyleFields({
              pageKey: "contact",
              sectionKey: "contact-cta-secondary",
              selector: ".contact-page-cta",
              defaultBackgroundColor: "transparent",
              defaultBackgroundOpacity: 0,
              defaultTextColor: "#ffffff",
              defaultBorderColor: "#ffffff",
              defaultBorderWidth: 2,
            }).map((f) => ({
              ...f,
              label: `Secondary ${f.label}`,
              key: `secondary${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`,
              uiGroup: "Secondary CTA style",
            })),
          ],
        },
      ],
    },
  ],
} satisfies SchoolTemplateManifest;
