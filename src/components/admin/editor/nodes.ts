import { Node } from "@tiptap/react";

/**
 * An image with optional caption, stored as
 * <figure><img src alt><figcaption>…</figcaption></figure> — exactly what
 * the site's article styles and sanitiser expect.
 */
export const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (el) => {
          const img = (el as HTMLElement).querySelector("img");
          if (!img) return false;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption:
              (el as HTMLElement).querySelector("figcaption")?.textContent ??
              "",
          };
        },
      },
      {
        tag: "img[src]",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("src"),
          alt: (el as HTMLElement).getAttribute("alt") ?? "",
          caption: "",
        }),
      },
    ];
  },

  renderHTML({ node }) {
    const img = ["img", { src: node.attrs.src, alt: node.attrs.alt ?? "" }];
    return node.attrs.caption
      ? ["figure", img, ["figcaption", node.attrs.caption]]
      : ["figure", img];
  },
});

/** Turns a YouTube or Vimeo link into its embeddable player address. */
export function toEmbedUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    id =
      url.searchParams.get("v") ??
      (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : null);
  }
  if (id && /^[\w-]{6,20}$/.test(id))
    return `https://www.youtube-nocookie.com/embed/${id}`;
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vid = url.pathname.split("/").filter((p) => /^\d+$/.test(p))[0];
    if (vid) return `https://player.vimeo.com/video/${vid}`;
  }
  return null;
}

/** A YouTube or Vimeo video, stored as a plain <iframe>. */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "Video" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe[src]",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("src"),
          title: (el as HTMLElement).getAttribute("title") ?? "Video",
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "iframe",
      {
        src: node.attrs.src,
        title: node.attrs.title,
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: "true",
      },
    ];
  },

  // In the editor the player can't take clicks, so the block is easy to
  // select, move or delete.
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "dx-editor-embed";
      dom.contentEditable = "false";
      const frame = document.createElement("iframe");
      frame.src = node.attrs.src;
      frame.title = node.attrs.title;
      frame.tabIndex = -1;
      frame.style.pointerEvents = "none";
      dom.append(frame);
      return { dom };
    };
  },
});
