/**
 * Product stories are stored as simple HTML (h2, p, ul, a). The admin edits
 * them as sections: a heading, text, bullet points and closing text.
 * Links are written as [text](address). Safe on server and client.
 */

export type StoryBlock = {
  heading: string;
  body: string;
  bullets: string[];
  after: string;
};

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Inline HTML to editable text: links become [text](address). */
function toText(html: string) {
  return decode(
    html
      .replace(
        /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
        (_, href, text) => `[${text.replace(/<[^>]+>/g, "")}](${href})`,
      )
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  ).trim();
}

/** Editable text to inline HTML: [text](address) becomes a link. */
function toInline(text: string) {
  return escape(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => {
    const safe = /^(https?:\/\/|\/|mailto:|tel:|#)/i.test(href) ? href : "#";
    return `<a href="${safe}">${t}</a>`;
  });
}

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${toInline(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

export function htmlToBlocks(html: string): StoryBlock[] {
  const parts = html.split(/<h2[^>]*>/i);
  const blocks: StoryBlock[] = [];
  parts.forEach((part, i) => {
    let heading = "";
    let rest = part;
    if (i > 0) {
      const end = part.search(/<\/h2>/i);
      heading = toText(end >= 0 ? part.slice(0, end) : part);
      rest = end >= 0 ? part.slice(end + 5) : "";
    }
    const listAt = rest.search(/<ul[^>]*>/i);
    const before = listAt >= 0 ? rest.slice(0, listAt) : rest;
    const listEnd = listAt >= 0 ? rest.search(/<\/ul>/i) : -1;
    const list =
      listAt >= 0 ? rest.slice(listAt, listEnd >= 0 ? listEnd : undefined) : "";
    const after = listEnd >= 0 ? rest.slice(listEnd + 5) : "";
    const paras = (s: string) =>
      [...s.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((m) => toText(m[1]))
        .filter(Boolean)
        .join("\n\n") || toText(s);
    const block: StoryBlock = {
      heading,
      body: paras(before),
      bullets: [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((m) => toText(m[1]))
        .filter(Boolean),
      after: after ? paras(after) : "",
    };
    if (block.heading || block.body || block.bullets.length || block.after)
      blocks.push(block);
  });
  return blocks;
}

export function blocksToHtml(blocks: StoryBlock[]): string {
  return blocks
    .map((b) => {
      const heading = b.heading.trim()
        ? `<h2>${escape(b.heading.trim())}</h2>`
        : "";
      const bullets = b.bullets.filter((x) => x.trim()).length
        ? `<ul>${b.bullets
            .filter((x) => x.trim())
            .map((x) => `<li>${toInline(x.trim())}</li>`)
            .join("")}</ul>`
        : "";
      return (
        heading + paragraphs(b.body ?? "") + bullets + paragraphs(b.after ?? "")
      );
    })
    .join("");
}
