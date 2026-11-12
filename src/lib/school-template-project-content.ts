import { readFileSync } from "node:fs";
import path from "node:path";
import {
  getSchoolTemplateManifest,
  type SchoolTemplateField,
  type SchoolTemplateManifest,
  type SchoolTemplatePage,
  type SchoolTemplateSection,
} from "@/lib/school-template-manifests";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

export type SchoolTemplateProjectFieldValue = string | number | boolean | null;

export type SchoolTemplateProjectTheme = {
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  logoBackgroundColor: string;
  loadingText: string;
  documentTitle: string;
  loadingTextColor: string;
  loadingLogoWidth: number;
  loadingLogoHeight: number;
  brandName: string;
  brandTagline: string;
  brandTextVisible: boolean;
  brandNameColor: string;
  brandTaglineColor: string;
  brandNameFontSize: number;
  brandTaglineFontSize: number;
  logoBorderEnabled: boolean;
  logoBorderColor: string;
  logoBorderRadius: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  templateGreenColor: string;
  templateLightGreenColor: string;
  templateYellowColor: string;
  templateOrangeColor: string;
  fontFamily: string;
  navLinkFontFamily: string;
  navLinkColor: string;
  loadingBackgroundColor: string;
  loadingBarColor: string;
  loadingCardBorderColor: string;
  loadingCardBorderWidth: number;
  loadingCardShadowColor: string;
  loadingCardShadowOpacity: number;
  navBarColor: string;
  navBarOpacity: number;
  navBarTransparent: boolean;
  navHoverEnabled: boolean;
  navHoverColor: string;
  buttonOverlayEnabled: boolean;
  buttonOverlayColor: string;
};

export type SchoolTemplateProjectAsset = {
  id: string;
  kind: "image" | "video" | "model3d" | "file";
  source: string;
  originalSource?: string;
  label?: string;
  pageSlug?: string;
  sectionId?: string;
  fieldKey?: string;
  createdAt: string;
};

export type SchoolTemplateProjectSectionContent = {
  id: string;
  label: string;
  fields: Record<string, SchoolTemplateProjectFieldValue>;
  repeatable?: {
    items: Array<Record<string, SchoolTemplateProjectFieldValue>>;
  };
};

export type SchoolTemplateProjectPageContent = {
  slug: string;
  fileName: string;
  title: string;
  isHome: boolean;
  sections: SchoolTemplateProjectSectionContent[];
};

export type SchoolTemplateProjectContent = {
  version: 1;
  templateSlug: string;
  templateName: string;
  generatedAt: string;
  theme: SchoolTemplateProjectTheme;
  assets: SchoolTemplateProjectAsset[];
  sharedSections: SchoolTemplateProjectSectionContent[];
  pages: SchoolTemplateProjectPageContent[];
};

export type SchoolTemplateProjectFieldSnapshot = {
  key: string;
  label: string;
  type: SchoolTemplateField["type"];
  selector: string;
  target: SchoolTemplateField["target"];
  defaultValue?: SchoolTemplateField["defaultValue"];
  computedDefaultValue?: SchoolTemplateField["defaultValue"];
  attribute?: string;
  configPath?: string;
  cssVariable?: string;
  scope?: SchoolTemplateField["scope"];
  unit?: string;
  acceptedFileTypes?: string[];
  placeholder?: string;
  helpText?: string;
  uiGroup?: string;
  uiOrder?: number;
  min?: number;
  max?: number;
  step?: number;
  options?: SchoolTemplateField["options"];
};

export type SchoolTemplateProjectSectionSnapshot = {
  id: string;
  label: string;
  selector: string;
  description?: string;
  fields: SchoolTemplateProjectFieldSnapshot[];
  repeatable?: {
    itemSelector: string;
    labelSingular: string;
    labelPlural: string;
    minItems?: number;
    maxItems?: number;
  };
};

export type SchoolTemplateSourceSnapshot = {
  version: 1;
  capturedAt: string;
  templateSlug: string;
  templateName: string;
  sourceDir: string;
  entryFile: string;
  previewPath: string;
  assetInventory: SchoolTemplateManifest["assetInventory"];
  sharedSections: SchoolTemplateProjectSectionSnapshot[];
  pages: Array<{
    slug: string;
    fileName: string;
    title: string;
    isHome: boolean;
    sections: SchoolTemplateProjectSectionSnapshot[];
  }>;
};

type TemplateTextNode = {
  type: "text";
  content: string;
  parent: TemplateElementNode | null;
};

type TemplateRawNode = {
  type: "raw";
  content: string;
  parent: TemplateElementNode | null;
};

type TemplateElementNode = {
  type: "element";
  tagName: string;
  attrs: Array<{ name: string; value: string | null }>;
  children: TemplateNode[];
  parent: TemplateElementNode | null;
};

type TemplateNode = TemplateElementNode | TemplateTextNode | TemplateRawNode;

type SelectorStep = {
  raw: string;
  combinator: "descendant" | "child";
};

type ParsedSelector = {
  tagName?: string;
  id?: string;
  classes: string[];
  notClasses: string[];
  attrs: Array<{
    name: string;
    operator?: "=" | "^=";
    value?: string;
  }>;
  nthOfType?: number;
};

export const schoolTemplateProjectFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const schoolTemplateProjectAssetSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["image", "video", "model3d", "file"]),
  source: z.string(),
  originalSource: z.string().optional(),
  label: z.string().optional(),
  pageSlug: z.string().optional(),
  sectionId: z.string().optional(),
  fieldKey: z.string().optional(),
  createdAt: z.string().min(1),
});

export const schoolTemplateProjectSectionContentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  fields: z.record(z.string(), schoolTemplateProjectFieldValueSchema),
  repeatable: z
    .object({
      items: z.array(
        z.record(z.string(), schoolTemplateProjectFieldValueSchema),
      ),
    })
    .optional(),
});

export const schoolTemplateProjectContentSchema = z.object({
  version: z.literal(1),
  templateSlug: z.string().min(1),
  templateName: z.string().min(1),
  generatedAt: z.string().min(1),
  theme: z.object({
    logoUrl: z.string().default(""),
    logoWidth: z.number().default(56),
    logoHeight: z.number().default(56),
    logoBackgroundColor: z.string().default("transparent"),
    loadingText: z.string().default("Loading school website"),
    documentTitle: z.string().default(""),
    loadingTextColor: z.string().default("#111827"),
    loadingLogoWidth: z.number().default(64),
    loadingLogoHeight: z.number().default(64),
    brandName: z.string().default(""),
    brandTagline: z.string().default(""),
    brandTextVisible: z.boolean().default(true),
    brandNameColor: z.string().default("#111827"),
    brandTaglineColor: z.string().default("#6b7280"),
    brandNameFontSize: z.number().default(16),
    brandTaglineFontSize: z.number().default(12),
    logoBorderEnabled: z.boolean().default(true),
    logoBorderColor: z.string().default("#d1d5db"),
    logoBorderRadius: z.number().default(18),
    primaryColor: z.string().min(1),
    secondaryColor: z.string().min(1),
    tertiaryColor: z.string().default("#dc422e"),
    templateGreenColor: z.string().default("#378F00"),
    templateLightGreenColor: z.string().default("#91B900"),
    templateYellowColor: z.string().default("#E6AE00"),
    templateOrangeColor: z.string().default("#D98100"),
    fontFamily: z.string().min(1),
    navLinkFontFamily: z.string().default(""),
    navLinkColor: z.string().default(""),
    loadingBackgroundColor: z.string().default("#ffffff"),
    loadingBarColor: z.string().default(""),
    loadingCardBorderColor: z.string().default("transparent"),
    loadingCardBorderWidth: z.number().default(0),
    loadingCardShadowColor: z.string().default("#000000"),
    loadingCardShadowOpacity: z.number().default(0),
    navBarColor: z.string().default("#ffffff"),
    navBarOpacity: z.number().default(100),
    navBarTransparent: z.boolean().default(false),
    navHoverEnabled: z.boolean().default(true),
    navHoverColor: z.string().default("#facc15"),
    buttonOverlayEnabled: z.boolean().default(true),
    buttonOverlayColor: z.string().default("#ffffff"),
  }),
  assets: z.array(schoolTemplateProjectAssetSchema),
  sharedSections: z.array(schoolTemplateProjectSectionContentSchema),
  pages: z.array(
    z.object({
      slug: z.string().min(1),
      fileName: z.string().min(1),
      title: z.string().min(1),
      isHome: z.boolean(),
      sections: z.array(schoolTemplateProjectSectionContentSchema),
    }),
  ),
});

export function parseSchoolTemplateProjectContent(value: unknown) {
  return schoolTemplateProjectContentSchema.safeParse(value);
}

export function isSchoolTemplateProjectContent(
  value: unknown,
): value is SchoolTemplateProjectContent {
  return schoolTemplateProjectContentSchema.safeParse(value).success;
}

export function isSchoolTemplateSourceSnapshot(
  value: unknown,
): value is SchoolTemplateSourceSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<SchoolTemplateSourceSnapshot>;

  return (
    snapshot.version === 1 &&
    typeof snapshot.templateSlug === "string" &&
    typeof snapshot.sourceDir === "string" &&
    typeof snapshot.entryFile === "string" &&
    typeof snapshot.previewPath === "string" &&
    Array.isArray(snapshot.sharedSections) &&
    Array.isArray(snapshot.pages)
  );
}

const SAFE_RICH_TEXT_TAGS = [
  "p",
  "br",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "sub",
  "sup",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "h2",
  "h3",
  "h4",
];

const SAFE_CSS_COLOR_PATTERN =
  /^(?:#[0-9a-fA-F]{3,8}|rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|transparent|currentColor|inherit)$/;

const SAFE_CSS_LENGTH_PATTERN =
  /^(?:\d+(?:\.\d+)?(?:px|em|rem|%)|small|medium|large|x-large|xx-large|smaller|larger|inherit)$/;

const SAFE_FONT_FAMILY_PATTERN = /^[a-zA-Z0-9\s"',()._-]+$/;

const SAFE_FONT_STYLE_PATTERN =
  /^(?:normal|italic|oblique(?:\s+\d{1,2}deg)?|inherit)$/;

const SAFE_TEXT_ALIGN_PATTERN = /^(?:left|right|center|justify|inherit)$/;

const SAFE_TEXT_DECORATION_PATTERN =
  /^(?:none|underline|line-through|underline line-through|inherit)$/;

const DANGEROUS_TEXT_PATTERN =
  /<\s*\/?\s*script\b|<\s*\/?\s*(iframe|object|embed|link|meta|base|form|input|button|textarea|select|option)\b|on[a-z]+\s*=|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html/i;

const IFRAME_EMBED_FIELD_KEYS = new Set([
  "formIframe",
  "formEmbedCode",
  "iframeEmbedCode",
]);

const SECTION_FIELD_ALIASES: Record<string, Record<string, string[]>> = {
  "contact-details": {
    address: ["location"],
  },
  values: {
    introTitle: ["title"],
    introBody: ["body"],
  },
};

const DEXTA_ACADEMY_3_CLEARABLE_HEADER_FIELD_KEYS = new Set([
  "navHomeText",
  "navHomeHref",
  "navAboutText",
  "navAboutHref",
  "navProgrammesText",
  "navProgrammesHref",
  "navGalleryText",
  "navGalleryHref",
  "navApplyText",
  "navApplyHref",
  "navContactText",
  "navContactHref",
  "portalText",
  "portalHref",
  "headerCtaText",
  "headerCtaHref",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
]);
const ALLOWED_MODEL_EXTENSIONS = new Set([".glb", ".gltf"]);
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
function sanitizePlainText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}

function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value: string) {
  return escapeHtmlText(value).replace(/"/g, "&quot;");
}

function decodeHtmlAttributeEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&#x2f;|&#47;/gi, "/")
    .replace(/&#x3a;|&#58;/gi, ":");
}

function unwrapQuotedValue(value: string) {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  return (
    (first === `"` && last === `"`) || (first === `'` && last === `'`)
      ? trimmed.slice(1, -1)
      : trimmed
  ).trim();
}

function normalizeAssetReferenceValue(value: string) {
  return unwrapQuotedValue(decodeHtmlAttributeEntities(value));
}

function parseIframeAttributes(rawAttributes: string) {
  const attrs = new Map<string, string>();
  const pattern =
    /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(rawAttributes))) {
    attrs.set(
      match[1].toLowerCase(),
      decodeHtmlAttributeEntities(match[2] ?? match[3] ?? match[4] ?? ""),
    );
  }

  return attrs;
}

function parseIframeEmbedValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(
    /<\s*iframe\b([\s\S]*?)>([\s\S]*?)<\s*\/\s*iframe\s*>/i,
  );

  if (!match) {
    return {
      attrs: new Map([["src", decodeHtmlAttributeEntities(trimmed)]]),
      fallbackText: "",
    };
  }

  return {
    attrs: parseIframeAttributes(match[1] ?? ""),
    fallbackText: sanitizePlainText(match[2] ?? ""),
  };
}

function isSafeIframeSrc(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

function isIframeEmbedField(field?: {
  key: string;
  type: string;
  target?: string;
}) {
  return (
    field?.type === "textarea" &&
    field.target === "attribute" &&
    IFRAME_EMBED_FIELD_KEYS.has(field.key)
  );
}

function sanitizeIframeEmbedValue(value: string) {
  const parsed = parseIframeEmbedValue(value);
  const src = parsed?.attrs.get("src")?.trim() ?? "";

  if (!parsed || !src || !isSafeIframeSrc(src)) {
    return "";
  }

  const safeAttrs: Array<[string, string | null]> = [
    ["src", src],
    ["title", sanitizePlainText(parsed.attrs.get("title") ?? "")],
    ["width", parsed.attrs.get("width") ?? ""],
    ["height", parsed.attrs.get("height") ?? ""],
    ["frameborder", parsed.attrs.get("frameborder") ?? ""],
    ["marginheight", parsed.attrs.get("marginheight") ?? ""],
    ["marginwidth", parsed.attrs.get("marginwidth") ?? ""],
    ["loading", parsed.attrs.get("loading") ?? ""],
    ["referrerpolicy", parsed.attrs.get("referrerpolicy") ?? ""],
    ["allow", parsed.attrs.get("allow") ?? ""],
  ];

  const attrs = safeAttrs
    .map(([name, rawValue]) => {
      const attrValue = (rawValue ?? "").trim();
      if (!attrValue) return null;

      if (
        (name === "width" || name === "height") &&
        !/^\d{1,5}%?$/.test(attrValue)
      ) {
        return null;
      }

      if (
        ["frameborder", "marginheight", "marginwidth"].includes(name) &&
        !/^\d{1,4}$/.test(attrValue)
      ) {
        return null;
      }

      if (name === "loading" && !/^(lazy|eager)$/i.test(attrValue)) {
        return null;
      }

      if (name === "referrerpolicy" && !/^[a-z-]+$/i.test(attrValue)) {
        return null;
      }

      if (name === "allow" && !/^[a-z0-9;: *._-]+$/i.test(attrValue)) {
        return null;
      }

      return `${name}="${escapeHtmlAttribute(attrValue)}"`;
    })
    .filter(Boolean)
    .join(" ");

  const fallbackText = parsed.fallbackText.trim() || "Loading...";

  return `<iframe ${attrs}>${escapeHtmlText(fallbackText)}</iframe>`;
}

function validateIframeEmbedValue(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = parseIframeEmbedValue(value);
  const src = parsed?.attrs.get("src")?.trim() ?? "";

  if (!parsed || !src) {
    return "Iframe embed code must include an iframe src URL.";
  }

  if (!isSafeIframeSrc(src)) {
    return "Iframe src must use an http(s) URL or an absolute path.";
  }

  return null;
}

function sanitizeRichText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: SAFE_RICH_TEXT_TAGS,
    allowedAttributes: {
      "*": ["style"],
      a: ["href", "target", "rel", "style"],
    },
    allowedStyles: {
      "*": {
        color: [SAFE_CSS_COLOR_PATTERN],
        "background-color": [SAFE_CSS_COLOR_PATTERN],
        "font-size": [SAFE_CSS_LENGTH_PATTERN],
        "font-family": [SAFE_FONT_FAMILY_PATTERN],
        "font-style": [SAFE_FONT_STYLE_PATTERN],
        "text-align": [SAFE_TEXT_ALIGN_PATTERN],
        "text-decoration": [SAFE_TEXT_DECORATION_PATTERN],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          href: attribs.href ?? "",
          target: "_blank",
          rel: "noopener noreferrer",
          ...(attribs.style ? { style: attribs.style } : {}),
        },
      }),
    },
    disallowedTagsMode: "discard",
  });
}

function getFileExtension(value: string) {
  try {
    const url = new URL(value, "https://example.com");
    const pathname = url.pathname.toLowerCase();
    const extension = pathname.match(/\.[a-z0-9]+$/i)?.[0];
    return extension ?? "";
  } catch {
    const extension = value
      .toLowerCase()
      .split("?")[0]
      ?.match(/\.[a-z0-9]+$/i)?.[0];
    return extension ?? "";
  }
}

function parseAttributes(rawAttributes: string) {
  const attrs: TemplateElementNode["attrs"] = [];
  const pattern =
    /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(rawAttributes))) {
    attrs.push({
      name: match[1],
      value: match[2] ?? match[3] ?? match[4] ?? null,
    });
  }

  return attrs;
}

function parseTemplateHtml(html: string) {
  const root: TemplateElementNode = {
    type: "element",
    tagName: "root",
    attrs: [],
    children: [],
    parent: null,
  };
  const stack: TemplateElementNode[] = [root];
  const tokenPattern =
    /<!--[\s\S]*?-->|<!doctype[\s\S]*?>|<!\[CDATA\[[\s\S]*?\]\]>|<\/?[a-zA-Z][^>]*>|[^<]+|</gi;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(html))) {
    const token = match[0];
    const parent = stack[stack.length - 1];

    if (/^<!--|^<!doctype|^<!\[CDATA\[/i.test(token)) {
      parent.children.push({ type: "raw", content: token, parent });
      continue;
    }

    if (/^<\//.test(token)) {
      const closingTag = token
        .match(/^<\/\s*([a-zA-Z][\w:-]*)/)?.[1]
        ?.toLowerCase();

      while (closingTag && stack.length > 1) {
        const current = stack.pop();
        if (current?.tagName === closingTag) break;
      }
      continue;
    }

    if (/^<[a-zA-Z]/.test(token)) {
      const openingTag = token.match(
        /^<\s*([a-zA-Z][\w:-]*)([\s\S]*?)\/?\s*>$/,
      );
      if (!openingTag) continue;

      const tagName = openingTag[1].toLowerCase();
      const element: TemplateElementNode = {
        type: "element",
        tagName,
        attrs: parseAttributes(openingTag[2] ?? ""),
        children: [],
        parent,
      };
      parent.children.push(element);

      if (!/\/\s*>$/.test(token) && !VOID_TAGS.has(tagName)) {
        stack.push(element);
      }
      continue;
    }

    parent.children.push({ type: "text", content: token, parent });
  }

  return root;
}

function serializeTemplateNode(node: TemplateNode): string {
  if (node.type === "text" || node.type === "raw") return node.content;

  if (node.tagName === "root") {
    return node.children.map(serializeTemplateNode).join("");
  }

  const attrs = node.attrs
    .map((attr) =>
      attr.value === null
        ? attr.name
        : `${attr.name}="${attr.value.replace(/"/g, "&quot;")}"`,
    )
    .join(" ");
  const openingTag = attrs ? `<${node.tagName} ${attrs}>` : `<${node.tagName}>`;

  if (VOID_TAGS.has(node.tagName)) return openingTag;

  return `${openingTag}${node.children.map(serializeTemplateNode).join("")}</${node.tagName}>`;
}

function getAttr(node: TemplateElementNode, name: string) {
  if (!Array.isArray(node.attrs)) return undefined;

  return node.attrs.find(
    (attr) => attr.name.toLowerCase() === name.toLowerCase(),
  )?.value;
}

function getTextContent(node: TemplateElementNode): string {
  return node.children
    .map((child) => {
      if (child.type === "text") return child.content;
      if (child.type === "raw") return "";
      if (child.tagName === "br") return "\n";
      return getTextContent(child);
    })
    .join("");
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSelectorGroups(selector: string) {
  const groups: string[] = [];
  let current = "";
  let bracketDepth = 0;
  let parenDepth = 0;
  let quote: string | null = null;

  for (const char of selector) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth -= 1;
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;

    if (char === "," && bracketDepth === 0 && parenDepth === 0) {
      if (current.trim()) groups.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) groups.push(current.trim());
  return groups;
}

function parseSelector(selector: string): SelectorStep[] {
  const steps: SelectorStep[] = [];
  let current = "";
  let combinator: SelectorStep["combinator"] = "descendant";
  let bracketDepth = 0;
  let parenDepth = 0;
  let quote: string | null = null;

  function pushCurrent() {
    if (!current.trim()) return;
    steps.push({ raw: current.trim(), combinator });
    current = "";
    combinator = "descendant";
  }

  for (const char of selector.trim()) {
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth -= 1;
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;

    if (
      bracketDepth === 0 &&
      parenDepth === 0 &&
      (char === " " || char === ">")
    ) {
      pushCurrent();
      if (char === ">") combinator = "child";
      continue;
    }

    current += char;
  }

  pushCurrent();
  return steps;
}

function parseCompoundSelector(rawSelector: string): ParsedSelector {
  let raw = rawSelector.trim();
  const selector: ParsedSelector = {
    classes: [],
    notClasses: [],
    attrs: [],
  };

  raw = raw.replace(/:not\(\.([a-zA-Z0-9_-]+)\)/g, (_match, className) => {
    selector.notClasses.push(className);
    return "";
  });

  raw = raw.replace(/:nth-of-type\((\d+)\)/g, (_match, value) => {
    selector.nthOfType = Number(value);
    return "";
  });

  raw = raw.replace(
    /\[([^\]=^]+)(\^=|=)?(?:"([^"]*)"|'([^']*)'|([^\]]*))?\]/g,
    (_match, name, operator, quotedDouble, quotedSingle, unquoted) => {
      selector.attrs.push({
        name: String(name).trim(),
        ...(operator ? { operator } : {}),
        ...(operator
          ? {
              value:
                quotedDouble ?? quotedSingle ?? String(unquoted ?? "").trim(),
            }
          : {}),
      });
      return "";
    },
  );

  const idMatch = raw.match(/#([a-zA-Z0-9_-]+)/);
  if (idMatch) selector.id = idMatch[1];

  selector.classes = Array.from(raw.matchAll(/\.([a-zA-Z0-9_-]+)/g)).map(
    (match) => match[1],
  );

  const tagMatch = raw
    .replace(/#[a-zA-Z0-9_-]+/g, "")
    .replace(/\.[a-zA-Z0-9_-]+/g, "")
    .trim()
    .match(/^[a-zA-Z][\w-]*/);
  if (tagMatch) selector.tagName = tagMatch[0].toLowerCase();

  return selector;
}

function getNthOfType(node: TemplateElementNode) {
  if (!node.parent) return 1;

  return (
    node.parent.children
      .filter(
        (child): child is TemplateElementNode =>
          child.type === "element" && child.tagName === node.tagName,
      )
      .indexOf(node) + 1
  );
}

function matchesCompound(node: TemplateElementNode, rawSelector: string) {
  const selector = parseCompoundSelector(rawSelector);
  const classList = (getAttr(node, "class") ?? "").split(/\s+/).filter(Boolean);

  if (selector.tagName && selector.tagName !== node.tagName) return false;
  if (selector.id && getAttr(node, "id") !== selector.id) return false;
  if (!selector.classes.every((className) => classList.includes(className))) {
    return false;
  }
  if (selector.notClasses.some((className) => classList.includes(className))) {
    return false;
  }
  if (selector.nthOfType && getNthOfType(node) !== selector.nthOfType) {
    return false;
  }

  return selector.attrs.every((attrSelector) => {
    const attrValue = getAttr(node, attrSelector.name);
    if (attrValue === undefined || attrValue === null) return false;
    if (!attrSelector.operator) return true;
    return attrSelector.operator === "="
      ? attrValue === attrSelector.value
      : attrValue.startsWith(attrSelector.value ?? "");
  });
}

function matchesSelectorGroup(node: TemplateElementNode, selector: string) {
  const steps = parseSelector(selector);
  if (!steps.length || !matchesCompound(node, steps[steps.length - 1].raw)) {
    return false;
  }

  let current: TemplateElementNode | null = node;
  for (let index = steps.length - 2; index >= 0; index -= 1) {
    const step = steps[index + 1];
    const expected = steps[index];
    if (step.combinator === "child") {
      current = current?.parent ?? null;
      if (!current || !matchesCompound(current, expected.raw)) return false;
      continue;
    }

    let ancestor: TemplateElementNode | null = current?.parent ?? null;
    while (ancestor && !matchesCompound(ancestor, expected.raw)) {
      ancestor = ancestor.parent;
    }
    if (!ancestor) return false;
    current = ancestor;
  }

  return true;
}

function matchesSelector(node: TemplateElementNode, selector: string) {
  return splitSelectorGroups(selector).some((group) =>
    matchesSelectorGroup(node, group),
  );
}

function queryAll(
  root: TemplateElementNode,
  selector: string,
  includeRoot = true,
) {
  const matches: TemplateElementNode[] = [];

  function visit(node: TemplateElementNode) {
    if ((node !== root || includeRoot) && matchesSelector(node, selector)) {
      matches.push(node);
    }

    for (const child of node.children) {
      if (child.type === "element") visit(child);
    }
  }

  visit(root);
  return matches;
}

function extractBackgroundImageUrl(value: string | null | undefined) {
  if (!value) return "";
  const url = (
    value.match(/background(?:-image)?\s*:\s*url\((["']?)(.*?)\1\)/i)?.[2] ??
    value.match(/url\((["']?)(.*?)\1\)/i)?.[2] ??
    ""
  ).trim();

  return normalizeAssetReferenceValue(url);
}

function getFieldValueFromNode(
  node: TemplateElementNode,
  field: SchoolTemplateField,
) {
  const target = field.target ?? "textContent";

  if (target === "attribute") {
    return (
      getAttr(
        node,
        field.attribute ?? (field.type === "link" ? "href" : "src"),
      ) ?? ""
    );
  }

  if (target === "backgroundImage") {
    return extractBackgroundImageUrl(getAttr(node, "style"));
  }

  if (target === "innerHTML") {
    const html = node.children.map(serializeTemplateNode).join("").trim();
    // Line breaks and indentation from the source file aren't content
    // (browsers collapse them), so they shouldn't reach the editor.
    return /<(pre|textarea|script|style)\b/i.test(html)
      ? html
      : html.replace(/\s+/g, " ");
  }

  if (target === "textContent") {
    return normalizeExtractedText(getTextContent(node));
  }

  return field.defaultValue ?? getDefaultFieldValue(field);
}

function getSectionRoots(
  pageRoot: TemplateElementNode | null,
  section: SchoolTemplateSection,
) {
  if (!pageRoot) return [];
  const roots = queryAll(pageRoot, section.selector);
  return roots.length ? roots : [pageRoot];
}

function getFieldDefaultFromRoots(
  roots: TemplateElementNode[],
  field: SchoolTemplateField,
) {
  if (isIframeEmbedField(field) && field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  for (const root of roots) {
    const nodes = queryAll(root, field.selector);
    for (const node of nodes) {
      const value = getFieldValueFromNode(node, field);
      if (value !== "") return value;
    }
  }

  return getDefaultFieldValue(field);
}

function sectionTargetsRepeatableItems(section: SchoolTemplateSection) {
  const sectionSelector = section.selector.trim();
  const itemSelector = section.repeatable?.itemSelector.trim();
  if (!itemSelector) return false;

  return sectionSelector
    .split(",")
    .map((selector) => selector.trim())
    .includes(itemSelector);
}

function buildRepeatableItems(
  roots: TemplateElementNode[],
  section: SchoolTemplateSection,
) {
  if (!section.repeatable) return undefined;

  const items: Array<Record<string, SchoolTemplateProjectFieldValue>> = [];
  for (const root of roots) {
    for (const itemRoot of queryAll(root, section.repeatable.itemSelector)) {
      const item: Record<string, SchoolTemplateProjectFieldValue> = {};
      for (const field of section.fields) {
        if (!queryAll(itemRoot, field.selector).length) continue;
        item[field.key] = getFieldDefaultFromRoots([itemRoot], field);
      }
      items.push(item);
    }
  }

  return { items };
}

function getRepeatableItemFieldKeys(
  roots: TemplateElementNode[],
  section: SchoolTemplateSection,
) {
  const keys = new Set<string>();
  if (!section.repeatable) return keys;

  for (const root of roots) {
    for (const itemRoot of queryAll(root, section.repeatable.itemSelector)) {
      for (const field of section.fields) {
        if (queryAll(itemRoot, field.selector).length) {
          keys.add(field.key);
        }
      }
    }
  }

  return keys;
}

function readTemplatePageRoot(
  manifest: SchoolTemplateManifest,
  page: SchoolTemplatePage,
) {
  try {
    const publicRoot = path.resolve(process.cwd(), "public");
    const appPublicRoot = path.resolve(process.cwd(), "src", "app", "(public)");
    const sourcePath = path.resolve(
      process.cwd(),
      manifest.sourceDir,
      page.fileName,
    );
    const isPublicTemplate = sourcePath.startsWith(`${publicRoot}${path.sep}`);
    const isAppPublicTemplate = sourcePath.startsWith(
      `${appPublicRoot}${path.sep}`,
    );

    if (!isPublicTemplate && !isAppPublicTemplate) return null;
    return parseTemplateHtml(readFileSync(sourcePath, "utf8"));
  } catch {
    return null;
  }
}

function isRelativeOrAllowedUrl(value: string) {
  if (
    /^[a-z0-9][a-z0-9+.-]*:/i.test(value) &&
    !/^https?:\/\//i.test(value) &&
    !/^mailto:/i.test(value) &&
    !/^tel:/i.test(value)
  ) {
    return false;
  }

  if (
    !/^[a-z0-9][a-z0-9+.-]*:/i.test(value) &&
    /^[a-z0-9._~!$&'()*+,;=:@%/-]+(?:[?#][a-z0-9._~!$&'()*+,;=:@%/?#-]*)?$/i.test(
      value,
    )
  ) {
    return true;
  }

  const base = value.split("#")[0];
  const fragment = value.includes("#");
  return (
    base.startsWith("/") ||
    base.startsWith("./") ||
    base.startsWith("../") ||
    value.startsWith("#") ||
    /^[a-z0-9][a-z0-9/_-]*(\.[a-z0-9]+)?$/i.test(base) ||
    /^https?:\/\//i.test(base) ||
    /^mailto:/i.test(value) ||
    /^tel:/i.test(value) ||
    (fragment && !base && value.startsWith("#"))
  );
}

function validateLinkValue(value: string) {
  if (!value || isRelativeOrAllowedUrl(value)) {
    return null;
  }

  return "Links must be relative URLs, http(s), mailto, tel, or anchors.";
}

function validateAssetValue(
  value: string,
  field: SchoolTemplateProjectFieldSnapshot,
) {
  if (!value) {
    return null;
  }

  if (!isRelativeOrAllowedUrl(value)) {
    return `${field.label} must use a relative path, Cloudinary public ID, or http(s) URL.`;
  }

  const extension = getFileExtension(value);
  if (!extension && !value.includes("/")) {
    return null;
  }

  if (
    field.type === "image" &&
    extension &&
    !ALLOWED_IMAGE_EXTENSIONS.has(extension)
  ) {
    return `${field.label} must be an image file (${Array.from(ALLOWED_IMAGE_EXTENSIONS).join(", ")}).`;
  }

  if (
    field.type === "model3d" &&
    extension &&
    !ALLOWED_MODEL_EXTENSIONS.has(extension)
  ) {
    return `${field.label} must be a .glb or .gltf file.`;
  }

  return null;
}

function getFieldSnapshotMap(
  sourceSnapshot: SchoolTemplateSourceSnapshot,
  pageSlug?: string,
) {
  const fields = new Map<string, SchoolTemplateProjectFieldSnapshot>();
  const sections = pageSlug
    ? sourceSnapshot.pages.find((page) => page.slug === pageSlug)?.sections
    : sourceSnapshot.sharedSections;

  for (const section of sections ?? []) {
    for (const field of section.fields) {
      fields.set(`${section.id}:${field.key}`, field);
    }
  }

  return fields;
}

function sanitizeSectionContent(
  section: SchoolTemplateProjectSectionContent,
  fieldMap: Map<string, SchoolTemplateProjectFieldSnapshot>,
) {
  return {
    ...section,
    fields: Object.fromEntries(
      Object.entries(section.fields).map(([key, value]) => {
        if (typeof value !== "string") {
          return [key, value];
        }

        const field = fieldMap.get(`${section.id}:${key}`);
        const sanitized = isIframeEmbedField(field)
          ? sanitizeIframeEmbedValue(value)
          : field?.type === "image" || field?.type === "model3d"
            ? normalizeAssetReferenceValue(sanitizePlainText(value))
            : field?.type === "richText" || field?.target === "innerHTML"
              ? sanitizeRichText(value)
              : sanitizePlainText(value);

        return [key, sanitized];
      }),
    ),
    repeatable: section.repeatable
      ? {
          items: section.repeatable.items.map((item) =>
            Object.fromEntries(
              Object.entries(item).map(([key, value]) => {
                if (typeof value !== "string") {
                  return [key, value];
                }

                const field = fieldMap.get(`${section.id}:${key}`);
                const sanitized = isIframeEmbedField(field)
                  ? sanitizeIframeEmbedValue(value)
                  : field?.type === "image" || field?.type === "model3d"
                    ? normalizeAssetReferenceValue(sanitizePlainText(value))
                    : field?.type === "richText" ||
                        field?.target === "innerHTML"
                      ? sanitizeRichText(value)
                      : sanitizePlainText(value);

                return [key, sanitized];
              }),
            ),
          ),
        }
      : undefined,
  };
}

export function sanitizeSchoolTemplateProjectContent(
  content: SchoolTemplateProjectContent,
  sourceSnapshot: SchoolTemplateSourceSnapshot,
): SchoolTemplateProjectContent {
  const sharedFieldMap = getFieldSnapshotMap(sourceSnapshot);

  return {
    ...content,
    templateSlug: sanitizePlainText(content.templateSlug),
    templateName: sanitizePlainText(content.templateName),
    theme: {
      logoUrl: sanitizePlainText(content.theme.logoUrl ?? ""),
      logoWidth: Number(content.theme.logoWidth ?? 56),
      logoHeight: Number(content.theme.logoHeight ?? 56),
      logoBackgroundColor: sanitizePlainText(
        content.theme.logoBackgroundColor ?? "transparent",
      ),
      loadingText: sanitizePlainText(
        content.theme.loadingText ?? "Loading school website",
      ),
      documentTitle: sanitizePlainText(content.theme.documentTitle ?? ""),
      loadingTextColor: sanitizePlainText(
        content.theme.loadingTextColor ?? "#111827",
      ),
      loadingLogoWidth: Number(content.theme.loadingLogoWidth ?? 64),
      loadingLogoHeight: Number(content.theme.loadingLogoHeight ?? 64),
      brandName: sanitizePlainText(content.theme.brandName ?? ""),
      brandTagline: sanitizePlainText(content.theme.brandTagline ?? ""),
      brandTextVisible: Boolean(content.theme.brandTextVisible ?? true),
      brandNameColor: sanitizePlainText(
        content.theme.brandNameColor ?? "#111827",
      ),
      brandTaglineColor: sanitizePlainText(
        content.theme.brandTaglineColor ?? "#6b7280",
      ),
      brandNameFontSize: Number(content.theme.brandNameFontSize ?? 16),
      brandTaglineFontSize: Number(content.theme.brandTaglineFontSize ?? 12),
      logoBorderEnabled: Boolean(content.theme.logoBorderEnabled),
      logoBorderColor: sanitizePlainText(
        content.theme.logoBorderColor ?? "#d1d5db",
      ),
      logoBorderRadius: Number(content.theme.logoBorderRadius ?? 18),
      primaryColor: sanitizePlainText(content.theme.primaryColor),
      secondaryColor: sanitizePlainText(content.theme.secondaryColor),
      tertiaryColor: sanitizePlainText(
        content.theme.tertiaryColor ?? "#dc422e",
      ),
      templateGreenColor: sanitizePlainText(
        content.theme.templateGreenColor ?? "#378F00",
      ),
      templateLightGreenColor: sanitizePlainText(
        content.theme.templateLightGreenColor ?? "#91B900",
      ),
      templateYellowColor: sanitizePlainText(
        content.theme.templateYellowColor ?? "#E6AE00",
      ),
      templateOrangeColor: sanitizePlainText(
        content.theme.templateOrangeColor ?? "#D98100",
      ),
      fontFamily: sanitizePlainText(content.theme.fontFamily),
      navLinkFontFamily: sanitizePlainText(
        content.theme.navLinkFontFamily || content.theme.fontFamily,
      ),
      navLinkColor: sanitizePlainText(content.theme.navLinkColor ?? ""),
      loadingBackgroundColor: sanitizePlainText(
        content.theme.loadingBackgroundColor ?? "#ffffff",
      ),
      loadingBarColor: sanitizePlainText(content.theme.loadingBarColor ?? ""),
      loadingCardBorderColor: sanitizePlainText(
        content.theme.loadingCardBorderColor ?? "transparent",
      ),
      loadingCardBorderWidth: Math.max(
        0,
        Math.min(12, Number(content.theme.loadingCardBorderWidth ?? 0)),
      ),
      loadingCardShadowColor: sanitizePlainText(
        content.theme.loadingCardShadowColor ?? "#000000",
      ),
      loadingCardShadowOpacity: Math.max(
        0,
        Math.min(100, Number(content.theme.loadingCardShadowOpacity ?? 0)),
      ),
      navBarColor: sanitizePlainText(content.theme.navBarColor ?? "#ffffff"),
      navBarOpacity: Math.max(
        0,
        Math.min(100, Number(content.theme.navBarOpacity ?? 100)),
      ),
      navBarTransparent: Boolean(content.theme.navBarTransparent),
      navHoverEnabled: Boolean(content.theme.navHoverEnabled ?? true),
      navHoverColor: sanitizePlainText(
        content.theme.navHoverColor ?? "#facc15",
      ),
      buttonOverlayEnabled: Boolean(content.theme.buttonOverlayEnabled ?? true),
      buttonOverlayColor: sanitizePlainText(
        content.theme.buttonOverlayColor ?? "#ffffff",
      ),
    },
    assets: content.assets.map((asset) => ({
      ...asset,
      source: sanitizePlainText(asset.source),
      originalSource: asset.originalSource
        ? sanitizePlainText(asset.originalSource)
        : undefined,
      label: asset.label ? sanitizePlainText(asset.label) : undefined,
    })),
    sharedSections: content.sharedSections.map((section) =>
      sanitizeSectionContent(section, sharedFieldMap),
    ),
    pages: content.pages.map((page) => {
      const pageFieldMap = getFieldSnapshotMap(sourceSnapshot, page.slug);

      return {
        ...page,
        slug: sanitizePlainText(page.slug),
        fileName: sanitizePlainText(page.fileName),
        title: sanitizePlainText(page.title),
        sections: page.sections.map((section) =>
          sanitizeSectionContent(section, pageFieldMap),
        ),
      };
    }),
  };
}

function validateSectionContent(
  section: SchoolTemplateProjectSectionContent,
  fieldMap: Map<string, SchoolTemplateProjectFieldSnapshot>,
  location: string,
) {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(section.fields)) {
    if (typeof value !== "string") {
      continue;
    }

    const field = fieldMap.get(`${section.id}:${key}`);
    const label = field?.label ?? key;

    if (isIframeEmbedField(field)) {
      const issue = validateIframeEmbedValue(value);
      if (issue) issues.push(`${location} ${label}: ${issue}`);
      continue;
    }

    if (DANGEROUS_TEXT_PATTERN.test(value)) {
      issues.push(`${location} ${label} contains blocked script-like content.`);
      continue;
    }

    if (!field) {
      continue;
    }

    if (field.type === "link") {
      const issue = validateLinkValue(value);
      if (issue) issues.push(`${location} ${label}: ${issue}`);
    }

    if (field.type === "image" || field.type === "model3d") {
      const issue = validateAssetValue(value, field);
      if (issue) issues.push(`${location} ${issue}`);
    }
  }

  for (const item of section.repeatable?.items ?? []) {
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === "string" && DANGEROUS_TEXT_PATTERN.test(value)) {
        issues.push(
          `${location} repeatable item "${key}" contains blocked script-like content.`,
        );
      }
    }
  }

  return issues;
}

export function validateSchoolTemplateProjectContentReferences(
  content: SchoolTemplateProjectContent,
  sourceSnapshot: SchoolTemplateSourceSnapshot,
) {
  const issues: string[] = [];
  const sharedFieldMap = getFieldSnapshotMap(sourceSnapshot);

  for (const section of content.sharedSections) {
    issues.push(
      ...validateSectionContent(
        section,
        sharedFieldMap,
        `Shared section "${section.label}"`,
      ),
    );
  }

  for (const page of content.pages) {
    const pageFieldMap = getFieldSnapshotMap(sourceSnapshot, page.slug);

    for (const section of page.sections) {
      issues.push(
        ...validateSectionContent(
          section,
          pageFieldMap,
          `Page "${page.title}" section "${section.label}"`,
        ),
      );
    }
  }

  return issues;
}

function getDefaultTheme(templateSlug: string): SchoolTemplateProjectTheme {
  switch (templateSlug) {
    case "dexta-academy-5":
      return {
        logoUrl: "",
        logoWidth: 48,
        logoHeight: 56,
        logoBackgroundColor: "transparent",
        loadingText: "Loading DXT Academy",
        documentTitle: "",
        loadingTextColor: "#2b2b2b",
        loadingLogoWidth: 64,
        loadingLogoHeight: 72,
        brandName: "DXT ACADEMY",
        brandTagline: "Nurturing. Inspiring. Leading.",
        brandTextVisible: true,
        brandNameColor: "#2b2b2b",
        brandTaglineColor: "#d4a437",
        brandNameFontSize: 16,
        brandTaglineFontSize: 12,
        logoBorderEnabled: false,
        logoBorderColor: "#d4a437",
        logoBorderRadius: 0,
        primaryColor: "#31401c",
        secondaryColor: "#d4a437",
        tertiaryColor: "#d4a437",
        templateGreenColor: "#31401c",
        templateLightGreenColor: "#556b2f",
        templateYellowColor: "#d4a437",
        templateOrangeColor: "#d4a437",
        fontFamily: "Manrope",
        navLinkFontFamily: "Manrope",
        navLinkColor: "#2b2b2b",
        loadingBackgroundColor: "#ffffff",
        loadingBarColor: "",
        loadingCardBorderColor: "transparent",
        loadingCardBorderWidth: 0,
        loadingCardShadowColor: "#000000",
        loadingCardShadowOpacity: 0,
        navBarColor: "#ffffff",
        navBarOpacity: 100,
        navBarTransparent: true,
        navHoverEnabled: true,
        navHoverColor: "#d4a437",
        buttonOverlayEnabled: true,
        buttonOverlayColor: "#ffffff",
      };
    case "dexta-academy-4":
      return {
        logoUrl:
          "https://res.cloudinary.com/dxoorukfj/image/upload/v1776778370/schoolportal/4/branding/umnqe2oopwmohrth30en.png",
        logoWidth: 72,
        logoHeight: 48,
        logoBackgroundColor: "transparent",
        loadingText: "Preparing School B",
        documentTitle: "",
        loadingTextColor: "#111827",
        loadingLogoWidth: 260,
        loadingLogoHeight: 112,
        brandName: "School B",
        brandTagline: "",
        brandTextVisible: true,
        brandNameColor: "#ffffff",
        brandTaglineColor: "#dbeafe",
        brandNameFontSize: 16,
        brandTaglineFontSize: 12,
        logoBorderEnabled: false,
        logoBorderColor: "#d1d5db",
        logoBorderRadius: 0,
        primaryColor: "#4a8fff",
        secondaryColor: "#6aaeff",
        tertiaryColor: "#6aaeff",
        templateGreenColor: "#4a8fff",
        templateLightGreenColor: "#6aaeff",
        templateYellowColor: "#6aaeff",
        templateOrangeColor: "#6aaeff",
        fontFamily: "Manrope",
        navLinkFontFamily: "Manrope",
        navLinkColor: "#ffffff",
        loadingBackgroundColor: "#ffffff",
        loadingBarColor: "",
        loadingCardBorderColor: "transparent",
        loadingCardBorderWidth: 0,
        loadingCardShadowColor: "#000000",
        loadingCardShadowOpacity: 0,
        navBarColor: "#ffffff",
        navBarOpacity: 100,
        navBarTransparent: true,
        navHoverEnabled: true,
        navHoverColor: "#6aaeff",
        buttonOverlayEnabled: true,
        buttonOverlayColor: "#ffffff",
      };
    case "dexta-academy-3":
      return {
        logoUrl: "",
        logoWidth: 46,
        logoHeight: 46,
        logoBackgroundColor: "#ffffff",
        loadingText: "Preparing DXT Academy",
        documentTitle: "",
        loadingTextColor: "#061a40",
        loadingLogoWidth: 88,
        loadingLogoHeight: 88,
        brandName: "DXT Academy",
        brandTagline: "Nurturing. Inspiring. Leading.",
        brandTextVisible: true,
        brandNameColor: "#061a40",
        brandTaglineColor: "#061a40",
        brandNameFontSize: 16,
        brandTaglineFontSize: 16,
        logoBorderEnabled: true,
        logoBorderColor: "#ffc43d",
        logoBorderRadius: 18,
        primaryColor: "#061a40",
        secondaryColor: "#f5b82e",
        tertiaryColor: "#dc422e",
        templateGreenColor: "#061a40",
        templateLightGreenColor: "#f5b82e",
        templateYellowColor: "#f5b82e",
        templateOrangeColor: "#dc422e",
        fontFamily: "Sora",
        navLinkFontFamily: "Sora",
        navLinkColor: "#ffffff",
        loadingBackgroundColor: "#fff7df",
        loadingBarColor: "",
        loadingCardBorderColor: "rgba(255,255,255,0.1)",
        loadingCardBorderWidth: 1,
        loadingCardShadowColor: "#010814",
        loadingCardShadowOpacity: 42,
        navBarColor: "#020c20",
        navBarOpacity: 94,
        navBarTransparent: false,
        navHoverEnabled: true,
        navHoverColor: "#f5b82e",
        buttonOverlayEnabled: true,
        buttonOverlayColor: "#ffffff",
      };
    case "dexta-academy-2":
      return {
        logoUrl: "",
        logoWidth: 48,
        logoHeight: 48,
        logoBackgroundColor: "transparent",
        loadingText: "Loading DXT Academy",
        documentTitle: "",
        loadingTextColor: "#ffffff",
        loadingLogoWidth: 48,
        loadingLogoHeight: 48,
        brandName: "DXT ACADEMY",
        brandTagline: "Nurturing. Inspiring. Leading.",
        brandTextVisible: true,
        brandNameColor: "#ffffff",
        brandTaglineColor: "#facc15",
        brandNameFontSize: 26,
        brandTaglineFontSize: 13,
        logoBorderEnabled: true,
        logoBorderColor: "#ffc433",
        logoBorderRadius: 12,
        primaryColor: "#081827",
        secondaryColor: "#facc15",
        tertiaryColor: "#facc15",
        templateGreenColor: "#378F00",
        templateLightGreenColor: "#91B900",
        templateYellowColor: "#E6AE00",
        templateOrangeColor: "#D98100",
        fontFamily: "Montserrat",
        navLinkFontFamily: "Montserrat",
        navLinkColor: "#ffffff",
        loadingBackgroundColor: "#081827",
        loadingBarColor: "",
        loadingCardBorderColor: "transparent",
        loadingCardBorderWidth: 0,
        loadingCardShadowColor: "#000000",
        loadingCardShadowOpacity: 0,
        navBarColor: "#081827",
        navBarOpacity: 100,
        navBarTransparent: true,
        navHoverEnabled: true,
        navHoverColor: "#facc15",
        buttonOverlayEnabled: true,
        buttonOverlayColor: "#ffffff",
      };
    case "dexta-academy-1":
      return {
        logoUrl:
          "https://res.cloudinary.com/dxoorukfj/image/upload/v1776695413/DXT-Logo_mmyi2e.png",
        logoWidth: 72,
        logoHeight: 56,
        logoBackgroundColor: "transparent",
        loadingText: "Loading DXT Grade",
        documentTitle: "",
        loadingTextColor: "#0f172a",
        loadingLogoWidth: 72,
        loadingLogoHeight: 56,
        brandName: "DXT GRADE",
        brandTagline: "",
        brandTextVisible: true,
        brandNameColor: "#0f172a",
        brandTaglineColor: "#64748b",
        brandNameFontSize: 16,
        brandTaglineFontSize: 12,
        logoBorderEnabled: false,
        logoBorderColor: "#0f766e",
        logoBorderRadius: 0,
        primaryColor: "#0f766e",
        secondaryColor: "#f97316",
        tertiaryColor: "#f97316",
        templateGreenColor: "#0f766e",
        templateLightGreenColor: "#14b8a6",
        templateYellowColor: "#facc15",
        templateOrangeColor: "#f97316",
        fontFamily: "Manrope",
        navLinkFontFamily: "Manrope",
        navLinkColor: "#0f172a",
        loadingBackgroundColor: "#ffffff",
        loadingBarColor: "",
        loadingCardBorderColor: "transparent",
        loadingCardBorderWidth: 0,
        loadingCardShadowColor: "#000000",
        loadingCardShadowOpacity: 0,
        navBarColor: "#ffffff",
        navBarOpacity: 100,
        navBarTransparent: false,
        navHoverEnabled: true,
        navHoverColor: "#f97316",
        buttonOverlayEnabled: true,
        buttonOverlayColor: "#ffffff",
      };
    default:
      return {
        logoUrl: "",
        logoWidth: 56,
        logoHeight: 56,
        logoBackgroundColor: "transparent",
        loadingText: "Loading school website",
        documentTitle: "",
        loadingTextColor: "#111827",
        loadingLogoWidth: 64,
        loadingLogoHeight: 64,
        brandName: "",
        brandTagline: "",
        brandTextVisible: true,
        brandNameColor: "#111827",
        brandTaglineColor: "#6b7280",
        brandNameFontSize: 16,
        brandTaglineFontSize: 12,
        logoBorderEnabled: true,
        logoBorderColor: "#d1d5db",
        logoBorderRadius: 18,
        primaryColor: "#0f766e",
        secondaryColor: "#facc15",
        tertiaryColor: "#facc15",
        templateGreenColor: "#0f766e",
        templateLightGreenColor: "#14b8a6",
        templateYellowColor: "#facc15",
        templateOrangeColor: "#f97316",
        fontFamily: "Inter",
        navLinkFontFamily: "Inter",
        navLinkColor: "#111827",
        loadingBackgroundColor: "#ffffff",
        loadingBarColor: "",
        loadingCardBorderColor: "transparent",
        loadingCardBorderWidth: 0,
        loadingCardShadowColor: "#000000",
        loadingCardShadowOpacity: 0,
        navBarColor: "#ffffff",
        navBarOpacity: 100,
        navBarTransparent: false,
        navHoverEnabled: true,
        navHoverColor: "#facc15",
        buttonOverlayEnabled: true,
        buttonOverlayColor: "#ffffff",
      };
  }
}

function normalizeIdentityValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function applySchoolNameFallbackToProjectContent(
  content: SchoolTemplateProjectContent,
  schoolName: string | null | undefined,
): SchoolTemplateProjectContent {
  const resolvedSchoolName = String(schoolName ?? "").trim();
  if (!resolvedSchoolName) return content;

  const defaultTheme = getDefaultTheme(content.templateSlug);
  const currentBrandName = normalizeIdentityValue(content.theme.brandName);
  const defaultBrandName = normalizeIdentityValue(defaultTheme.brandName);
  const shouldUseSchoolName =
    !currentBrandName ||
    (Boolean(defaultBrandName) && currentBrandName === defaultBrandName);
  const resolvedBrandName = shouldUseSchoolName
    ? resolvedSchoolName
    : String(content.theme.brandName ?? "").trim();
  const syncSharedBrandName = (
    section: SchoolTemplateProjectSectionContent,
  ) => {
    if (!Object.prototype.hasOwnProperty.call(section.fields, "brandName")) {
      return section;
    }

    const fieldBrandName = normalizeIdentityValue(section.fields.brandName);
    if (
      !resolvedBrandName ||
      (fieldBrandName &&
        (!defaultBrandName || fieldBrandName !== defaultBrandName))
    ) {
      return section;
    }

    return {
      ...section,
      fields: {
        ...section.fields,
        brandName: resolvedBrandName,
      },
    };
  };
  const sharedSections = content.sharedSections.map(syncSharedBrandName);
  const sharedSectionsChanged = sharedSections.some(
    (section, index) => section !== content.sharedSections[index],
  );

  if (!shouldUseSchoolName && !sharedSectionsChanged) return content;

  return {
    ...content,
    sharedSections,
    theme: {
      ...content.theme,
      ...(shouldUseSchoolName ? { brandName: resolvedSchoolName } : {}),
    },
  };
}

function getDefaultFieldValue(field: SchoolTemplateField) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.type) {
    case "number":
      return null;
    case "color":
      return "#000000";
    case "select":
      return "";
    case "image":
    case "link":
    case "model3d":
    case "richText":
    case "textarea":
    case "text":
      return "";
    default:
      return null;
  }
}

function buildSectionContent(
  section: SchoolTemplateSection,
  pageRoot: TemplateElementNode | null = null,
): SchoolTemplateProjectSectionContent {
  const roots = getSectionRoots(pageRoot, section);
  const repeatableItemFieldKeys = getRepeatableItemFieldKeys(roots, section);
  const sectionRootsAreRepeatableItems = sectionTargetsRepeatableItems(section);

  return {
    id: section.id,
    label: section.label,
    fields: Object.fromEntries(
      section.fields.map((field) => [
        field.key,
        sectionRootsAreRepeatableItems || repeatableItemFieldKeys.has(field.key)
          ? getDefaultFieldValue(field)
          : getFieldDefaultFromRoots(roots, field),
      ]),
    ),
    ...(section.repeatable
      ? { repeatable: buildRepeatableItems(roots, section) ?? { items: [] } }
      : {}),
  };
}

function splitCssFunctionArguments(value: string) {
  const args: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth = Math.max(0, depth - 1);
    } else if (character === "," && depth === 0) {
      args.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  args.push(value.slice(start).trim());
  return args;
}

function extractCssVariableFallbacks(cssText: string) {
  const fallbacks = new Map<string, string>();
  let searchIndex = 0;

  while (searchIndex < cssText.length) {
    const varIndex = cssText.indexOf("var(", searchIndex);
    if (varIndex === -1) break;

    let depth = 0;
    let endIndex = -1;
    for (let index = varIndex + 3; index < cssText.length; index += 1) {
      const character = cssText[index];
      if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
        if (depth === 0) {
          endIndex = index;
          break;
        }
      }
    }

    if (endIndex === -1) break;

    const [name, fallback] = splitCssFunctionArguments(
      cssText.slice(varIndex + 4, endIndex),
    );
    if (
      name?.startsWith("--") &&
      fallback &&
      !fallback.startsWith("var(") &&
      !fallbacks.has(name)
    ) {
      fallbacks.set(name, fallback);
    }

    searchIndex = endIndex + 1;
  }

  return fallbacks;
}

function getTemplateCssVariableFallbacks(manifest: SchoolTemplateManifest) {
  if (manifest.templateSlug !== "dexta-academy-3") {
    return new Map<string, string>();
  }

  const fallbacks = new Map<string, string>();
  for (const stylesheet of manifest.assetInventory.stylesheets) {
    try {
      const cssText = readFileSync(
        path.join(process.cwd(), manifest.sourceDir, stylesheet),
        "utf8",
      );
      for (const [name, fallback] of extractCssVariableFallbacks(cssText)) {
        if (fallbacks.has(name)) continue;
        fallbacks.set(name, fallback);
      }
    } catch {
      continue;
    }
  }

  return fallbacks;
}

function buildFieldSnapshot(
  field: SchoolTemplateField,
  cssVariableFallbacks: Map<string, string> = new Map(),
): SchoolTemplateProjectFieldSnapshot {
  const computedDefaultValue =
    field.type === "color" && field.cssVariable
      ? cssVariableFallbacks.get(field.cssVariable)
      : undefined;

  return {
    key: field.key,
    label: field.label,
    type: field.type,
    selector: field.selector,
    target: field.target ?? "textContent",
    ...(field.defaultValue !== undefined
      ? { defaultValue: field.defaultValue }
      : {}),
    ...(computedDefaultValue !== undefined ? { computedDefaultValue } : {}),
    ...(field.attribute ? { attribute: field.attribute } : {}),
    ...(field.configPath ? { configPath: field.configPath } : {}),
    ...(field.cssVariable ? { cssVariable: field.cssVariable } : {}),
    ...(field.scope ? { scope: field.scope } : {}),
    ...(field.unit ? { unit: field.unit } : {}),
    ...(field.acceptedFileTypes
      ? { acceptedFileTypes: field.acceptedFileTypes }
      : {}),
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    ...(field.helpText ? { helpText: field.helpText } : {}),
    ...(field.uiGroup ? { uiGroup: field.uiGroup } : {}),
    ...(field.uiOrder !== undefined ? { uiOrder: field.uiOrder } : {}),
    ...(field.min !== undefined ? { min: field.min } : {}),
    ...(field.max !== undefined ? { max: field.max } : {}),
    ...(field.step !== undefined ? { step: field.step } : {}),
    ...(field.options ? { options: field.options } : {}),
  };
}

function buildSectionSnapshot(
  section: SchoolTemplateSection,
  cssVariableFallbacks: Map<string, string> = new Map(),
): SchoolTemplateProjectSectionSnapshot {
  return {
    id: section.id,
    label: section.label,
    selector: section.selector,
    ...(section.description ? { description: section.description } : {}),
    fields: section.fields.map((field) =>
      buildFieldSnapshot(field, cssVariableFallbacks),
    ),
    ...(section.repeatable
      ? {
          repeatable: {
            itemSelector: section.repeatable.itemSelector,
            labelSingular: section.repeatable.labelSingular,
            labelPlural: section.repeatable.labelPlural,
            ...(section.repeatable.minItems !== undefined
              ? { minItems: section.repeatable.minItems }
              : {}),
            ...(section.repeatable.maxItems !== undefined
              ? { maxItems: section.repeatable.maxItems }
              : {}),
          },
        }
      : {}),
  };
}

function buildPageContent(
  manifest: SchoolTemplateManifest,
  page: SchoolTemplatePage,
): SchoolTemplateProjectPageContent {
  const pageRoot = readTemplatePageRoot(manifest, page);

  return {
    slug: page.slug,
    fileName: page.fileName,
    title: page.title,
    isHome: Boolean(page.isHome),
    sections: page.sections.map((section) =>
      buildSectionContent(section, pageRoot),
    ),
  };
}

export function buildSchoolTemplateProjectContent(
  manifest: SchoolTemplateManifest,
): SchoolTemplateProjectContent {
  const sharedSourcePage =
    manifest.pages.find((page) => page.fileName === manifest.entryFile) ??
    manifest.pages.find((page) => page.isHome) ??
    manifest.pages[0];
  const sharedSourceRoot = sharedSourcePage
    ? readTemplatePageRoot(manifest, sharedSourcePage)
    : null;

  return {
    version: 1,
    templateSlug: manifest.templateSlug,
    templateName: manifest.templateName,
    generatedAt: new Date().toISOString(),
    theme: getDefaultTheme(manifest.templateSlug),
    assets: [],
    sharedSections: manifest.sharedSections.map((section) =>
      buildSectionContent(section, sharedSourceRoot),
    ),
    pages: manifest.pages.map((page) => buildPageContent(manifest, page)),
  };
}

export function buildSchoolTemplateSourceSnapshot(
  manifest: SchoolTemplateManifest,
): SchoolTemplateSourceSnapshot {
  const cssVariableFallbacks = getTemplateCssVariableFallbacks(manifest);

  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    templateSlug: manifest.templateSlug,
    templateName: manifest.templateName,
    sourceDir: manifest.sourceDir,
    entryFile: manifest.entryFile,
    previewPath: manifest.previewPath,
    assetInventory: manifest.assetInventory,
    sharedSections: manifest.sharedSections.map((section) =>
      buildSectionSnapshot(section, cssVariableFallbacks),
    ),
    pages: manifest.pages.map((page) => ({
      slug: page.slug,
      fileName: page.fileName,
      title: page.title,
      isHome: Boolean(page.isHome),
      sections: page.sections.map((section) =>
        buildSectionSnapshot(section, cssVariableFallbacks),
      ),
    })),
  };
}

function getDextaAcademyThreeFooterLinkValue(
  item: Record<string, SchoolTemplateProjectFieldValue>,
  key: string,
) {
  return String(item[key] ?? "").trim();
}

function isDextaAcademyThreeLegacyFooterContactLink(
  item: Record<string, SchoolTemplateProjectFieldValue>,
) {
  const label = getDextaAcademyThreeFooterLinkValue(item, "footerLinkLabel");
  const href = getDextaAcademyThreeFooterLinkValue(
    item,
    "footerLinkHref",
  ).toLowerCase();

  return (
    href.startsWith("tel:") ||
    href.startsWith("mailto:") ||
    /^[+\d][\d\s().-]{6,}$/.test(label) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(label)
  );
}

function getDextaAcademyThreeLegacyFooterContactItems(
  existingSection?: SchoolTemplateProjectSectionContent,
) {
  const result: {
    phoneText?: string;
    phoneHref?: string;
    emailText?: string;
    emailHref?: string;
  } = {};

  for (const item of existingSection?.repeatable?.items ?? []) {
    const label = getDextaAcademyThreeFooterLinkValue(item, "footerLinkLabel");
    const href = getDextaAcademyThreeFooterLinkValue(item, "footerLinkHref");
    const normalizedHref = href.toLowerCase();

    if (
      !result.phoneText &&
      (normalizedHref.startsWith("tel:") || /^[+\d][\d\s().-]{6,}$/.test(label))
    ) {
      result.phoneText = label;
      result.phoneHref = href;
      continue;
    }

    if (
      !result.emailText &&
      (normalizedHref.startsWith("mailto:") ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(label))
    ) {
      result.emailText = label;
      result.emailHref = href;
    }
  }

  return result;
}

function mergeSectionContent(
  freshSection: SchoolTemplateProjectSectionContent,
  existingSection?: SchoolTemplateProjectSectionContent,
  options: {
    hydrateEmptyExisting?: boolean;
    preserveEmptyExistingField?: (sectionId: string, key: string) => boolean;
    preserveExistingRepeatableItemCount?: (sectionId: string) => boolean;
  } = {},
): SchoolTemplateProjectSectionContent {
  const valuesIntroBody =
    existingSection?.fields.introBody ?? existingSection?.fields.body;
  const valuesLegacyTitle = existingSection?.fields.title;
  const isDextaAcademyThreeFooter =
    freshSection.id === "site-footer" &&
    Object.prototype.hasOwnProperty.call(
      freshSection.fields,
      "footerLinkLabel",
    );
  const legacyFooterContactItems = isDextaAcademyThreeFooter
    ? getDextaAcademyThreeLegacyFooterContactItems(existingSection)
    : {};
  const normalizeFieldValue = (
    key: string,
    value: SchoolTemplateProjectFieldValue | undefined,
  ) => {
    if (
      freshSection.id === "contact-benefits" &&
      key === "benefitIcon" &&
      typeof value === "string" &&
      (value.trim() === "🤝" || value.trim() === "🤝︎")
    ) {
      return "◎";
    }

    return value;
  };
  const mergeFieldValue = (
    key: string,
    freshValue: SchoolTemplateProjectFieldValue,
    existingValue: SchoolTemplateProjectFieldValue | undefined,
  ) => {
    const normalizedFreshValue = normalizeFieldValue(key, freshValue) ?? null;
    const normalizedExistingValue =
      normalizeFieldValue(key, existingValue) ?? null;

    if (freshSection.id === "values" && key === "introTitle") {
      if (
        hasProjectFieldValue(normalizedExistingValue) &&
        !projectFieldTextMatches(normalizedExistingValue, valuesIntroBody)
      ) {
        return normalizedExistingValue;
      }

      if (
        hasProjectFieldValue(valuesLegacyTitle) &&
        !projectFieldTextMatches(valuesLegacyTitle, valuesIntroBody)
      ) {
        return valuesLegacyTitle;
      }

      return normalizedFreshValue;
    }

    if (isDextaAcademyThreeFooter) {
      if (
        key === "footerPhone" &&
        hasProjectFieldValue(legacyFooterContactItems.phoneText)
      ) {
        return legacyFooterContactItems.phoneText;
      }
      if (
        key === "footerPhoneHref" &&
        hasProjectFieldValue(legacyFooterContactItems.phoneHref)
      ) {
        return legacyFooterContactItems.phoneHref;
      }
      if (
        key === "footerEmail" &&
        hasProjectFieldValue(legacyFooterContactItems.emailText)
      ) {
        return legacyFooterContactItems.emailText;
      }
      if (
        key === "footerEmailHref" &&
        hasProjectFieldValue(legacyFooterContactItems.emailHref)
      ) {
        return legacyFooterContactItems.emailHref;
      }
    }

    const shouldHydrateEmptyExisting =
      options.hydrateEmptyExisting &&
      !options.preserveEmptyExistingField?.(freshSection.id, key);

    if (
      existingValue !== undefined &&
      (!shouldHydrateEmptyExisting ||
        hasProjectFieldValue(normalizedExistingValue) ||
        !hasProjectFieldValue(normalizedFreshValue))
    ) {
      return normalizedExistingValue;
    }

    for (const aliasKey of SECTION_FIELD_ALIASES[freshSection.id]?.[key] ??
      []) {
      const aliasValue = existingSection?.fields[aliasKey];
      if (aliasValue !== undefined) {
        return normalizeFieldValue(key, aliasValue) ?? null;
      }
    }

    return normalizedFreshValue;
  };

  const freshItems = freshSection.repeatable?.items ?? [];
  const existingItems = isDextaAcademyThreeFooter
    ? (existingSection?.repeatable?.items ?? []).filter(
        (item) => !isDextaAcademyThreeLegacyFooterContactLink(item),
      )
    : (existingSection?.repeatable?.items ?? []);
  const shouldPreserveExistingRepeatableItemCount =
    !!existingSection &&
    options.preserveExistingRepeatableItemCount?.(freshSection.id);
  const itemCount = shouldPreserveExistingRepeatableItemCount
    ? existingItems.length
    : Math.max(freshItems.length, existingItems.length);

  return {
    ...freshSection,
    fields: {
      ...Object.fromEntries(
        Object.entries(freshSection.fields).map(([key, freshValue]) => [
          key,
          mergeFieldValue(key, freshValue, existingSection?.fields[key]),
        ]),
      ),
    },
    repeatable: freshSection.repeatable
      ? {
          items: Array.from({ length: itemCount }, (_item, index) => ({
            ...(freshItems[index] ?? {}),
            ...Object.fromEntries(
              Object.entries(existingItems[index] ?? {}).map(([key, value]) => [
                key,
                mergeFieldValue(key, freshItems[index]?.[key] ?? "", value),
              ]),
            ),
          })),
        }
      : undefined,
  };
}

function hasProjectFieldValue(
  value: SchoolTemplateProjectFieldValue | undefined,
): value is SchoolTemplateProjectFieldValue {
  return value !== null && value !== undefined && value !== "";
}

function normalizeProjectFieldText(
  value: SchoolTemplateProjectFieldValue | undefined,
) {
  if (!hasProjectFieldValue(value)) {
    return "";
  }

  return normalizeExtractedText(sanitizePlainText(String(value)));
}

function projectFieldTextMatches(
  left: SchoolTemplateProjectFieldValue | undefined,
  right: SchoolTemplateProjectFieldValue | undefined,
) {
  const normalizedLeft = normalizeProjectFieldText(left);
  const normalizedRight = normalizeProjectFieldText(right);

  return normalizedLeft !== "" && normalizedLeft === normalizedRight;
}

function restoreDextaAcademyHeaderCtaDefaults(
  content: SchoolTemplateProjectContent,
  freshContent: SchoolTemplateProjectContent,
) {
  if (
    content.templateSlug !== "dexta-academy-1" &&
    content.templateSlug !== "dexta-academy-2"
  ) {
    return content;
  }

  const freshHeader = freshContent.sharedSections.find(
    (section) => section.id === "site-header",
  );
  if (!freshHeader) {
    return content;
  }

  const defaultHeaderCtaValues = Object.fromEntries(
    ["portalCtaText", "portalCtaHref", "primaryCtaText", "primaryCtaHref"].map(
      (key) => [key, freshHeader.fields[key]],
    ),
  );

  return {
    ...content,
    sharedSections: content.sharedSections.map((section) => {
      if (section.id !== "site-header") {
        return section;
      }

      return {
        ...section,
        fields: {
          ...section.fields,
          ...Object.fromEntries(
            Object.entries(defaultHeaderCtaValues)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => [
                key,
                hasProjectFieldValue(section.fields[key])
                  ? section.fields[key]
                  : value,
              ]),
          ),
        },
      };
    }),
  };
}

function restoreDextaAcademy2AdmissionFormTitle(
  content: SchoolTemplateProjectContent,
  freshContent: SchoolTemplateProjectContent,
): SchoolTemplateProjectContent {
  if (content.templateSlug !== "dexta-academy-2") {
    return content;
  }

  const sharedModalTitle = content.sharedSections.find(
    (section) => section.id === "admission-modal",
  )?.fields.title;
  const freshFormTitle = freshContent.pages
    .find((page) => page.slug === "admissions")
    ?.sections.find((section) => section.id === "admission-form")?.fields.title;
  const fallbackTitle = hasProjectFieldValue(sharedModalTitle)
    ? sharedModalTitle
    : hasProjectFieldValue(freshFormTitle)
      ? freshFormTitle
      : null;

  if (!hasProjectFieldValue(fallbackTitle)) {
    return content;
  }

  return {
    ...content,
    pages: content.pages.map((page) => {
      if (page.slug !== "admissions") {
        return page;
      }

      return {
        ...page,
        sections: page.sections.map((section) => {
          if (section.id !== "admission-form") {
            return section;
          }

          return {
            ...section,
            fields: {
              ...section.fields,
              title: hasProjectFieldValue(section.fields.title)
                ? section.fields.title
                : fallbackTitle,
            },
          };
        }),
      };
    }),
  };
}

export function syncSchoolTemplateProjectContentWithManifest({
  content,
  sourceSnapshot,
  rawContent,
  templateSlug,
}: {
  content: SchoolTemplateProjectContent;
  sourceSnapshot: SchoolTemplateSourceSnapshot;
  rawContent?: unknown;
  templateSlug?: string | null;
}) {
  const manifest =
    (templateSlug ? getSchoolTemplateManifest(templateSlug) : null) ??
    getSchoolTemplateManifest(content.templateSlug) ??
    getSchoolTemplateManifest(sourceSnapshot.templateSlug);

  if (!manifest) {
    return { contentJson: content, sourceSnapshot };
  }

  const freshContent = buildSchoolTemplateProjectContent(manifest);
  const freshSnapshot = buildSchoolTemplateSourceSnapshot(manifest);
  const mergeOptions = {
    hydrateEmptyExisting: manifest.templateSlug === "dexta-academy-3",
    preserveEmptyExistingField: (sectionId: string, key: string) =>
      manifest.templateSlug === "dexta-academy-3" &&
      sectionId === "site-header" &&
      DEXTA_ACADEMY_3_CLEARABLE_HEADER_FIELD_KEYS.has(key),
    preserveExistingRepeatableItemCount: (sectionId: string) =>
      manifest.templateSlug === "dexta-academy-1" &&
      sectionId === "testimonial-wall",
  };
  const rawTheme =
    rawContent &&
    typeof rawContent === "object" &&
    "theme" in rawContent &&
    rawContent.theme &&
    typeof rawContent.theme === "object"
      ? rawContent.theme
      : null;
  const wasThemeFieldMissing = (key: keyof SchoolTemplateProjectTheme) =>
    rawTheme ? !Object.prototype.hasOwnProperty.call(rawTheme, key) : false;
  const syncedTheme: SchoolTemplateProjectTheme = {
    ...freshContent.theme,
    ...content.theme,
  };

  if (wasThemeFieldMissing("loadingText")) {
    syncedTheme.loadingText = freshContent.theme.loadingText;
  }

  if (wasThemeFieldMissing("loadingTextColor")) {
    syncedTheme.loadingTextColor = freshContent.theme.loadingTextColor;
  }

  if (wasThemeFieldMissing("loadingLogoWidth")) {
    syncedTheme.loadingLogoWidth = freshContent.theme.loadingLogoWidth;
  }

  if (wasThemeFieldMissing("loadingLogoHeight")) {
    syncedTheme.loadingLogoHeight = freshContent.theme.loadingLogoHeight;
  }

  if (wasThemeFieldMissing("loadingCardBorderColor")) {
    syncedTheme.loadingCardBorderColor =
      freshContent.theme.loadingCardBorderColor;
  }

  if (wasThemeFieldMissing("loadingCardBorderWidth")) {
    syncedTheme.loadingCardBorderWidth =
      freshContent.theme.loadingCardBorderWidth;
  }

  if (wasThemeFieldMissing("loadingCardShadowColor")) {
    syncedTheme.loadingCardShadowColor =
      freshContent.theme.loadingCardShadowColor;
  }

  if (wasThemeFieldMissing("loadingCardShadowOpacity")) {
    syncedTheme.loadingCardShadowOpacity =
      freshContent.theme.loadingCardShadowOpacity;
  }

  if (wasThemeFieldMissing("navLinkFontFamily")) {
    syncedTheme.navLinkFontFamily =
      content.theme.fontFamily || freshContent.theme.navLinkFontFamily;
  }

  if (wasThemeFieldMissing("tertiaryColor")) {
    syncedTheme.tertiaryColor = freshContent.theme.tertiaryColor;
  }

  if (wasThemeFieldMissing("templateGreenColor")) {
    syncedTheme.templateGreenColor = freshContent.theme.templateGreenColor;
  }

  if (wasThemeFieldMissing("templateLightGreenColor")) {
    syncedTheme.templateLightGreenColor =
      freshContent.theme.templateLightGreenColor;
  }

  if (wasThemeFieldMissing("templateYellowColor")) {
    syncedTheme.templateYellowColor = freshContent.theme.templateYellowColor;
  }

  if (wasThemeFieldMissing("templateOrangeColor")) {
    syncedTheme.templateOrangeColor = freshContent.theme.templateOrangeColor;
  }

  if (wasThemeFieldMissing("navLinkColor")) {
    syncedTheme.navLinkColor = freshContent.theme.navLinkColor;
  }

  if (wasThemeFieldMissing("navBarOpacity")) {
    syncedTheme.navBarOpacity = freshContent.theme.navBarOpacity;
    if (
      manifest.templateSlug === "dexta-academy-3" &&
      syncedTheme.navBarColor.trim().toLowerCase() === "#ffffff"
    ) {
      syncedTheme.navBarColor = freshContent.theme.navBarColor;
    }
  }

  if (wasThemeFieldMissing("navHoverEnabled")) {
    syncedTheme.navHoverEnabled = freshContent.theme.navHoverEnabled;
  }

  if (wasThemeFieldMissing("navHoverColor")) {
    syncedTheme.navHoverColor = freshContent.theme.navHoverColor;
  }

  if (wasThemeFieldMissing("buttonOverlayEnabled")) {
    syncedTheme.buttonOverlayEnabled = freshContent.theme.buttonOverlayEnabled;
  }

  if (wasThemeFieldMissing("buttonOverlayColor")) {
    syncedTheme.buttonOverlayColor = freshContent.theme.buttonOverlayColor;
  }

  const syncedContent: SchoolTemplateProjectContent = {
    ...freshContent,
    generatedAt: content.generatedAt,
    theme: syncedTheme,
    assets: content.assets,
    sharedSections: freshContent.sharedSections.map((section) =>
      mergeSectionContent(
        section,
        content.sharedSections.find(
          (existingSection) => existingSection.id === section.id,
        ),
        mergeOptions,
      ),
    ),
    pages: freshContent.pages.map((page) => {
      const existingPage = content.pages.find(
        (candidate) => candidate.slug === page.slug,
      );

      return {
        ...page,
        sections: page.sections.map((section) => {
          const existingSection = existingPage?.sections.find(
            (candidate) => candidate.id === section.id,
          );
          if (existingSection) {
            return mergeSectionContent(section, existingSection, mergeOptions);
          }

          if (
            content.templateSlug === "dexta-academy-2" &&
            page.slug === "admissions" &&
            section.id === "admission-form"
          ) {
            return mergeSectionContent(
              section,
              content.sharedSections.find(
                (candidate) => candidate.id === "admission-modal",
              ),
              mergeOptions,
            );
          }

          return mergeSectionContent(section, undefined, mergeOptions);
        }),
      };
    }),
  };

  return {
    contentJson: restoreDextaAcademy2AdmissionFormTitle(
      restoreDextaAcademyHeaderCtaDefaults(syncedContent, freshContent),
      freshContent,
    ),
    sourceSnapshot: freshSnapshot,
  };
}

export function resolveSchoolTemplateManifestForSelection(input: {
  templateSlug?: string | null;
  websiteUrl?: string | null;
}) {
  const websiteUrl = input.websiteUrl?.trim();
  const urlManifest = websiteUrl
    ? (websiteUrl
        .split(/[/?#]/)
        .map((part) => getSchoolTemplateManifest(part))
        .find((manifest) => manifest !== null) ?? null)
    : null;

  if (urlManifest) {
    return urlManifest;
  }

  const directManifest = input.templateSlug
    ? getSchoolTemplateManifest(input.templateSlug)
    : null;

  if (directManifest) {
    return directManifest;
  }
  return null;
}
