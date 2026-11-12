import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Turns what the email editor (Tiptap) writes into HTML that email apps
 * show properly. Gmail and Outlook ignore stylesheets, so each tag gets its
 * styles inline; anything else (scripts, iframes, odd attributes) is
 * removed. Tags like {first_name} are filled in afterwards, escaped.
 */

const C = {
  royal: "#000c99",
  ink: "#202321",
  muted: "#5f625f",
  rule: "#e6e6e1",
};
const base = `color:${C.ink};font-size:15px;line-height:24px;`;

const STYLE: Record<string, string> = {
  p: `margin:0 0 14px;${base}`,
  h2: `margin:22px 0 10px;color:${C.ink};font-size:19px;line-height:26px;font-weight:700;`,
  h3: `margin:18px 0 8px;color:${C.ink};font-size:16px;line-height:24px;font-weight:700;`,
  ul: `margin:0 0 14px;padding-left:22px;${base}`,
  ol: `margin:0 0 14px;padding-left:22px;${base}`,
  li: `margin:0 0 6px;${base}`,
  blockquote: `margin:0 0 14px;padding:2px 0 2px 14px;border-left:3px solid ${C.rule};color:${C.muted};font-style:italic;`,
  hr: `border:none;border-top:1px solid ${C.rule};margin:20px 0;`,
  a: `color:${C.royal};text-decoration:underline;`,
  img: "display:block;max-width:100%;height:auto;border-radius:10px;border:0;",
  figcaption: `margin:6px 0 0;color:${C.muted};font-size:12px;line-height:18px;`,
};

const withStyle =
  (tag: string, renameTo?: string): sanitizeHtml.Transformer =>
  (_name, attribs) => ({
    tagName: renameTo ?? tag,
    attribs: { ...attribs, style: STYLE[tag] ?? "" },
  });

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "blockquote",
    "hr",
    "img",
    "figure",
    "figcaption",
    "div",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "style"],
    img: ["src", "alt", "width", "style"],
    "*": ["style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  transformTags: {
    p: withStyle("p"),
    h2: withStyle("h2"),
    h3: withStyle("h3"),
    ul: withStyle("ul"),
    ol: withStyle("ol"),
    li: withStyle("li"),
    blockquote: withStyle("blockquote"),
    hr: withStyle("hr"),
    img: withStyle("img"),
    // Older email apps handle a paragraph better than <figcaption>.
    figcaption: withStyle("figcaption", "p"),
    // Some email apps add margins to <figure>; a plain block is steadier.
    figure: (_n, attribs) => ({
      tagName: "div",
      attribs: { ...attribs, style: "margin:0 0 16px;" },
    }),
    a: (_n, attribs) => ({
      tagName: "a",
      attribs: {
        href: attribs.href ?? "#",
        target: "_blank",
        rel: "noopener noreferrer",
        style: STYLE.a,
      },
    }),
  },
};

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Older messages were plain text: blank lines start paragraphs. */
function textToHtml(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export const isHtml = (body: string) => /^\s*</.test(body);

/** Email-ready HTML; `tags` values are escaped as they're filled in. */
export function emailHtml(body: string, tags: Record<string, string> = {}) {
  const html = sanitizeHtml(isHtml(body) ? body : textToHtml(body), OPTIONS);
  return html.replace(/\{(\w+)\}/g, (m, key: string) =>
    key in tags ? escape(tags[key]) : m,
  );
}

/** Safe HTML for showing a sent message back in the admin. */
export function safeHtml(body: string) {
  return sanitizeHtml(isHtml(body) ? body : textToHtml(body), {
    ...OPTIONS,
    transformTags: { a: OPTIONS.transformTags!.a },
  });
}

/** The words only, for previews and checks. */
export function htmlToText(body: string) {
  return body
    .replace(/<(br|\/p|\/li|\/h[23])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
