"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Underline,
  Undo2,
  Unlink,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaValue } from "@/lib/media/shared";
import { stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { Modal } from "@/components/admin/kit/overlays";
import { TextField } from "@/components/admin/kit/fields";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";
import { Embed, Figure, toEmbedUrl } from "./nodes";

const normalise = (editor: Editor) =>
  editor.isEmpty ? "" : editor.getHTML().replace(/(<p><\/p>)+$/, "");

/**
 * The article editor (Tiptap). Writes the HTML the site expects: headings
 * (h2–h4), paragraphs, lists, quotes, links, code, dividers, images with
 * captions and YouTube/Vimeo videos. It looks like the published article.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  invalid,
  label = "Article",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
  label?: string;
}) {
  const baseline = useRef<{ html: string; value: string } | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        strike: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
        },
      }),
      Figure,
      Embed,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "dx-article min-h-[24rem] px-5 py-6 outline-none md:px-8 md:py-8",
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onCreate: ({ editor }) => {
      baseline.current = { html: normalise(editor), value };
    },
    onUpdate: ({ editor }) => {
      const html = normalise(editor);
      // Tiptap tidies the HTML it loads (and adds an empty last line after
      // an image or video); unchanged content keeps its original HTML.
      onChange(
        baseline.current && html === baseline.current.html
          ? baseline.current.value
          : html,
      );
    },
  });

  const [dialog, setDialog] = useState<"link" | "image" | "embed" | null>(null);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[12px] bg-white ring-1",
        invalid ? "ring-[#c2410c]" : "ring-black/[0.08]",
      )}
    >
      <Toolbar editor={editor} onDialog={setDialog} />
      <div className="dx-site max-h-[70dvh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <div className="border-surface-rule text-surface-muted flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs">
        <span>
          Tip: wrap words in a heading in *asterisks* for the serif accent.
        </span>
        {editor && (
          <span className="tabular-nums">
            {editor.storage.characterCount.words().toLocaleString("en-GB")}{" "}
            words · about{" "}
            {Math.max(
              1,
              Math.round(editor.storage.characterCount.words() / 220),
            )}{" "}
            min to read
          </span>
        )}
      </div>

      {editor && (
        <>
          <LinkDialog
            editor={editor}
            open={dialog === "link"}
            onClose={() => setDialog(null)}
          />
          <ImageDialog
            editor={editor}
            open={dialog === "image"}
            onClose={() => setDialog(null)}
          />
          <EmbedDialog
            editor={editor}
            open={dialog === "embed"}
            onClose={() => setDialog(null)}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Tool({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[8px] transition-colors disabled:opacity-35 [&_svg]:size-4",
        active ? "bg-royal text-white" : "hover:bg-charcoal/[0.06]",
      )}
    >
      {icon}
    </button>
  );
}

const Sep = () => (
  <span aria-hidden className="bg-charcoal/10 mx-1 h-6 w-px shrink-0" />
);

function Toolbar({
  editor,
  onDialog,
}: {
  editor: Editor | null;
  onDialog: (d: "link" | "image" | "embed") => void;
}) {
  if (!editor) return <div className="border-surface-rule h-[53px] border-b" />;
  const c = () => editor.chain().focus();
  const figure = editor.isActive("figure");
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="border-surface-rule bg-canvas/60 sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto border-b px-2 py-2 [scrollbar-width:none]"
    >
      <Tool
        label="Paragraph"
        icon={<Pilcrow />}
        active={editor.isActive("paragraph")}
        onClick={() => c().setParagraph().run()}
      />
      <Tool
        label="Heading"
        icon={<Heading2 />}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => c().toggleHeading({ level: 2 }).run()}
      />
      <Tool
        label="Subheading"
        icon={<Heading3 />}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => c().toggleHeading({ level: 3 }).run()}
      />
      <Tool
        label="Small heading"
        icon={<Heading4 />}
        active={editor.isActive("heading", { level: 4 })}
        onClick={() => c().toggleHeading({ level: 4 }).run()}
      />
      <Sep />
      <Tool
        label="Bold"
        icon={<Bold />}
        active={editor.isActive("bold")}
        onClick={() => c().toggleBold().run()}
      />
      <Tool
        label="Italic"
        icon={<Italic />}
        active={editor.isActive("italic")}
        onClick={() => c().toggleItalic().run()}
      />
      <Tool
        label="Underline"
        icon={<Underline />}
        active={editor.isActive("underline")}
        onClick={() => c().toggleUnderline().run()}
      />
      <Tool
        label={editor.isActive("link") ? "Edit link" : "Add link"}
        icon={<Link2 />}
        active={editor.isActive("link")}
        onClick={() => onDialog("link")}
      />
      {editor.isActive("link") && (
        <Tool
          label="Remove link"
          icon={<Unlink />}
          onClick={() => c().extendMarkRange("link").unsetLink().run()}
        />
      )}
      <Sep />
      <Tool
        label="Bullet list"
        icon={<List />}
        active={editor.isActive("bulletList")}
        onClick={() => c().toggleBulletList().run()}
      />
      <Tool
        label="Numbered list"
        icon={<ListOrdered />}
        active={editor.isActive("orderedList")}
        onClick={() => c().toggleOrderedList().run()}
      />
      <Tool
        label="Quote"
        icon={<Quote />}
        active={editor.isActive("blockquote")}
        onClick={() => c().toggleBlockquote().run()}
      />
      <Tool
        label="Code"
        icon={<Code2 />}
        active={editor.isActive("codeBlock")}
        onClick={() => c().toggleCodeBlock().run()}
      />
      <Tool
        label="Divider"
        icon={<Minus />}
        onClick={() => c().setHorizontalRule().run()}
      />
      <Sep />
      <Tool
        label={figure ? "Edit image" : "Add image"}
        icon={<ImagePlus />}
        active={figure}
        onClick={() => onDialog("image")}
      />
      <Tool
        label="Add YouTube or Vimeo video"
        icon={<Video />}
        active={editor.isActive("embed")}
        onClick={() => onDialog("embed")}
      />
      <Sep />
      <Tool
        label="Undo"
        icon={<Undo2 />}
        disabled={!editor.can().undo()}
        onClick={() => c().undo().run()}
      />
      <Tool
        label="Redo"
        icon={<Redo2 />}
        disabled={!editor.can().redo()}
        onClick={() => c().redo().run()}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function LinkDialog({
  editor,
  open,
  onClose,
}: {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}) {
  const [href, setHref] = useState("");
  useEffect(() => {
    if (open) setHref((editor.getAttributes("link").href as string) ?? "");
  }, [open, editor]);
  const valid =
    /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href.trim()) ||
    /^[\w-]+(\.[\w-]+)+/.test(href.trim());
  const apply = () => {
    const raw = href.trim();
    const url = /^(https?:|mailto:|tel:|\/|#)/i.test(raw)
      ? raw
      : `https://${raw}`;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link"))
      chain.insertContent({
        type: "text",
        text: raw,
        marks: [{ type: "link", attrs: { href: url } }],
      });
    else chain.setLink({ href: url });
    chain.run();
    onClose();
  };
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Link"
      description="Select text first to turn it into a link."
      size="sm"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!valid} onClick={apply}>
            Apply
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) apply();
        }}
      >
        <TextField
          label="Address"
          autoFocus
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://… or /services"
          hint="Links to other sites open in a new tab."
        />
      </form>
    </Modal>
  );
}

export function ImageDialog({
  editor,
  open,
  onClose,
}: {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}) {
  const editing = editor.isActive("figure");
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [picking, setPicking] = useState(false);
  useEffect(() => {
    if (!open) return;
    const a = editing ? editor.getAttributes("figure") : {};
    setSrc((a.src as string) ?? "");
    setAlt((a.alt as string) ?? "");
    setCaption((a.caption as string) ?? "");
  }, [open, editing, editor]);

  const apply = () => {
    const attrs = { src: src.trim(), alt: alt.trim(), caption: caption.trim() };
    if (editing) editor.chain().focus().updateAttributes("figure", attrs).run();
    else editor.chain().focus().insertContent({ type: "figure", attrs }).run();
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !picking}
        onOpenChange={(o) => !o && onClose()}
        title={editing ? "Edit image" : "Add an image"}
        size="md"
        footer={
          <>
            {editing && (
              <Button
                size="sm"
                variant="subtle"
                className="mr-auto"
                onClick={() => {
                  editor.chain().focus().deleteSelection().run();
                  onClose();
                }}
              >
                Remove image
              </Button>
            )}
            <Button size="sm" variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!/^https?:\/\//.test(src.trim())}
              onClick={apply}
            >
              {editing ? "Save" : "Add image"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview from any host
            <img
              src={src}
              alt=""
              className="bg-canvas max-h-56 w-full rounded-[10px] object-contain"
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setPicking(true)}>
              <ImagePlus aria-hidden className="size-4" />
              {src ? "Choose another" : "Choose from media library"}
            </Button>
          </div>
          <TextField
            label="Or paste an image address"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="https://…"
          />
          <TextField
            label="Description for screen readers"
            value={alt}
            maxLength={200}
            onChange={(e) => setAlt(e.target.value)}
            hint="What the image shows, for people who can't see it."
          />
          <TextField
            label="Caption (optional)"
            value={caption}
            maxLength={200}
            onChange={(e) => setCaption(e.target.value)}
            hint="Shown under the image."
          />
        </div>
      </Modal>
      <MediaPickerDialog
        open={picking}
        onOpenChange={setPicking}
        kinds={["IMAGE"]}
        onSelect={([asset]) => {
          if (!asset) return;
          const value = mediaValue(asset);
          setSrc(/^https?:\/\//.test(value) ? value : stock(value, 1600));
          if (!alt) setAlt(asset.alt || asset.title || "");
        }}
      />
    </>
  );
}

function EmbedDialog({
  editor,
  open,
  onClose,
}: {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (open) {
      setUrl("");
      setTitle("");
    }
  }, [open]);
  const embed = toEmbedUrl(url);
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Add a video"
      description="Paste a YouTube or Vimeo link."
      size="md"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!embed}
            onClick={() => {
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "embed",
                  attrs: { src: embed, title: title.trim() || "Video" },
                })
                .run();
              onClose();
            }}
          >
            Add video
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Video link"
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          error={url && !embed ? "Use a YouTube or Vimeo link" : undefined}
        />
        <TextField
          label="Video title"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          hint="Read out by screen readers."
        />
        {embed && (
          <iframe
            src={embed}
            title="Preview"
            className="aspect-video w-full rounded-[10px]"
          />
        )}
      </div>
    </Modal>
  );
}
