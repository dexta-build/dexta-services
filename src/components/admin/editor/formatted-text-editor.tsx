"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { Popover } from "radix-ui";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Code2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_SWATCHES } from "@/components/admin/kit/inputs";
import { LinkDialog } from "./rich-text-editor";

/**
 * A formatting editor (Tiptap) for short styled copy: headlines, intros,
 * template text. It keeps the formatting the We Brand Schools pages and
 * school templates use: block style, font, size, colour, highlight,
 * alignment, lists, quotes and links, plus an HTML view for fine tweaks.
 * HTML written by the older editor loads with its styling intact.
 */

const FONTS = [
  "Montserrat",
  "Clash Display",
  "Inter",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Lato",
  "Nunito",
  "Raleway",
  "Oswald",
  "Merriweather",
  "Playfair Display",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
];

const FONT_STACK: Record<string, string> = {
  "Clash Display": "var(--font-clash-display), system-ui, sans-serif",
  Merriweather: "Merriweather, Georgia, serif",
  "Playfair Display": "'Playfair Display', Georgia, serif",
  Georgia: "Georgia, serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Courier New": "'Courier New', Courier, monospace",
};
const stackFor = (font: string) =>
  FONT_STACK[font] ??
  `${/\s/.test(font) ? `'${font}'` : font}, system-ui, sans-serif`;

const SIZES = [
  10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 96, 112, 128, 144,
];

const BLOCKS = [
  { value: "p", label: "Paragraph" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "blockquote", label: "Quote" },
] as const;

const normalise = (editor: Editor) =>
  editor.isEmpty ? "" : editor.getHTML().replace(/(<p><\/p>)+$/, "");

/** The first font in a CSS font-family value, unquoted. */
const firstFont = (v: unknown) =>
  typeof v === "string"
    ? (v
        .split(",")[0]
        ?.trim()
        .replace(/^["']|["']$/g, "") ?? "")
    : "";

export function FormattedTextEditor({
  value,
  onChange,
  label,
  hideLabel,
  placeholder,
  minHeight = 160,
  defaultFontFamily = "Montserrat",
  invalid,
  hint,
  disabled,
}: {
  value: string;
  onChange: (html: string) => void;
  label: string;
  hideLabel?: boolean;
  placeholder?: string;
  /** Height of the writing area, in pixels. */
  minHeight?: number;
  /** The font text uses when none is set (e.g. the template's font). */
  defaultFontFamily?: string;
  invalid?: boolean;
  hint?: React.ReactNode;
  disabled?: boolean;
}) {
  const baseline = useRef<{ html: string; value: string } | null>(null);
  const emitted = useRef(value);
  const [dialog, setDialog] = useState<"link" | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
        },
      }),
      TextStyleKit.configure({ lineHeight: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "dx-formatted px-4 py-3.5 outline-none",
        style: `min-height:${minHeight}px;font-family:${stackFor(defaultFontFamily)}`,
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onCreate: ({ editor }) => {
      baseline.current = { html: normalise(editor), value };
    },
    onUpdate: ({ editor, transaction }) => {
      // Ignore updates that aren't edits (e.g. switching editable on load).
      if (!transaction.docChanged || !baseline.current) return;
      const html = normalise(editor);
      // Unchanged content keeps the HTML it was loaded with, so opening a
      // field never counts as an edit.
      const next =
        baseline.current && html === baseline.current.html
          ? baseline.current.value
          : html;
      emitted.current = next;
      onChange(next);
    },
  });

  // When the value is replaced from outside (reset, switching items), load it.
  useEffect(() => {
    if (!editor || value === emitted.current) return;
    emitted.current = value;
    editor.commands.setContent(value, { emitUpdate: false });
    baseline.current = { html: normalise(editor), value };
  }, [editor, value]);

  useEffect(() => {
    if (editor && editor.isEditable === !!disabled)
      editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  const applyCode = () => {
    if (!editor || code === null) return;
    editor.commands.setContent(code, { emitUpdate: true });
    setCode(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className={cn("text-sm font-bold", hideLabel && "sr-only")}>
        {label}
      </span>
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-[10px] bg-white ring-1 focus-within:ring-2",
          invalid
            ? "ring-[#c2410c]"
            : "ring-black/[0.12] focus-within:ring-[#00abff]/50",
          disabled && "opacity-60",
        )}
      >
        {editor && (
          <Toolbar
            editor={editor}
            codeOpen={code !== null}
            onLink={() => setDialog("link")}
            onCode={() =>
              code === null ? setCode(normalise(editor)) : applyCode()
            }
            disabled={disabled}
          />
        )}
        {code !== null ? (
          <textarea
            aria-label={`${label} (HTML)`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={applyCode}
            spellCheck={false}
            className="w-full resize-y bg-[#fbfbf8] px-4 py-3.5 font-mono text-[0.8125rem] leading-relaxed outline-none"
            style={{ minHeight }}
          />
        ) : (
          <div className="max-h-[32rem] overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
      {hint && (
        <p className="text-surface-muted text-xs leading-relaxed">{hint}</p>
      )}
      {editor && (
        <LinkDialog
          editor={editor}
          open={dialog === "link"}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function Toolbar({
  editor,
  codeOpen,
  onLink,
  onCode,
  disabled,
}: {
  editor: Editor;
  codeOpen: boolean;
  onLink: () => void;
  onCode: () => void;
  disabled?: boolean;
}) {
  const c = () => editor.chain().focus();
  const off = disabled || codeOpen;
  const style = editor.getAttributes("textStyle");
  const block =
    BLOCKS.find((b) =>
      b.value === "p"
        ? editor.isActive("paragraph") && !editor.isActive("blockquote")
        : b.value === "blockquote"
          ? editor.isActive("blockquote")
          : editor.isActive("heading", { level: Number(b.value[1]) }),
    )?.value ?? "p";
  const font = firstFont(style.fontFamily);
  const size = typeof style.fontSize === "string" ? style.fontSize : "";

  const setBlock = (v: string) => {
    if (v === "blockquote") c().toggleBlockquote().run();
    else if (v === "p") {
      const ch = c();
      if (editor.isActive("blockquote")) ch.lift("blockquote");
      ch.setParagraph().run();
    } else
      c()
        .setHeading({ level: Number(v[1]) as 2 | 3 | 4 })
        .run();
  };

  const select =
    "h-8 rounded-[7px] bg-transparent px-1.5 text-xs font-bold outline-none hover:bg-charcoal/[0.06] focus-visible:shadow-[0_0_0_2px_rgb(0_171_255/0.45)] disabled:opacity-35";

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="bg-canvas/70 flex flex-wrap items-center gap-0.5 border-b border-black/[0.06] px-1.5 py-1.5"
    >
      <select
        aria-label="Text style"
        value={block}
        disabled={off}
        onChange={(e) => setBlock(e.target.value)}
        className={cn(select, "w-[6.5rem]")}
      >
        {BLOCKS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Font"
        value={FONTS.includes(font) ? font : font ? "__other" : ""}
        disabled={off}
        onChange={(e) =>
          e.target.value
            ? c().setFontFamily(stackFor(e.target.value)).run()
            : c().unsetFontFamily().run()
        }
        className={cn(select, "w-[7.5rem]")}
      >
        <option value="">Default font</option>
        {font && !FONTS.includes(font) && (
          <option value="__other">{font}</option>
        )}
        {FONTS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        aria-label="Size"
        value={SIZES.includes(parseInt(size)) ? String(parseInt(size)) : ""}
        disabled={off}
        onChange={(e) =>
          e.target.value
            ? c().setFontSize(`${e.target.value}px`).run()
            : c().unsetFontSize().run()
        }
        className={cn(select, "w-[4.5rem]")}
      >
        <option value="">
          {size && !SIZES.includes(parseInt(size)) ? size : "Size"}
        </option>
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}px
          </option>
        ))}
      </select>
      <Sep />
      <T
        label="Bold"
        icon={<Bold />}
        disabled={off}
        active={editor.isActive("bold")}
        onClick={() => c().toggleBold().run()}
      />
      <T
        label="Italic"
        icon={<Italic />}
        disabled={off}
        active={editor.isActive("italic")}
        onClick={() => c().toggleItalic().run()}
      />
      <T
        label="Underline"
        icon={<Underline />}
        disabled={off}
        active={editor.isActive("underline")}
        onClick={() => c().toggleUnderline().run()}
      />
      <T
        label="Strikethrough"
        icon={<Strikethrough />}
        disabled={off}
        active={editor.isActive("strike")}
        onClick={() => c().toggleStrike().run()}
      />
      <ColorButton
        label="Text colour"
        icon={<Baseline />}
        disabled={off}
        value={typeof style.color === "string" ? style.color : ""}
        onPick={(v) => c().setColor(v).run()}
        onClear={() => c().unsetColor().run()}
      />
      <ColorButton
        label="Highlight"
        icon={<Highlighter />}
        disabled={off}
        value={
          typeof style.backgroundColor === "string" ? style.backgroundColor : ""
        }
        onPick={(v) => c().setBackgroundColor(v).run()}
        onClear={() => c().unsetBackgroundColor().run()}
      />
      <Sep />
      {(
        [
          ["left", "Align left", <AlignLeft key="l" />],
          ["center", "Centre", <AlignCenter key="c" />],
          ["right", "Align right", <AlignRight key="r" />],
          ["justify", "Justify", <AlignJustify key="j" />],
        ] as const
      ).map(([a, l, icon]) => (
        <T
          key={a}
          label={l}
          icon={icon}
          disabled={off}
          active={a !== "left" && editor.isActive({ textAlign: a })}
          onClick={() =>
            a === "left"
              ? c().unsetTextAlign().run()
              : c().setTextAlign(a).run()
          }
        />
      ))}
      <Sep />
      <T
        label="Bullet list"
        icon={<List />}
        disabled={off}
        active={editor.isActive("bulletList")}
        onClick={() => c().toggleBulletList().run()}
      />
      <T
        label="Numbered list"
        icon={<ListOrdered />}
        disabled={off}
        active={editor.isActive("orderedList")}
        onClick={() => c().toggleOrderedList().run()}
      />
      <T
        label="Quote"
        icon={<Quote />}
        disabled={off}
        active={editor.isActive("blockquote")}
        onClick={() => c().toggleBlockquote().run()}
      />
      <T
        label={editor.isActive("link") ? "Edit link" : "Add link"}
        icon={<Link2 />}
        disabled={off}
        active={editor.isActive("link")}
        onClick={onLink}
      />
      {editor.isActive("link") && (
        <T
          label="Remove link"
          icon={<Unlink />}
          disabled={off}
          onClick={() => c().extendMarkRange("link").unsetLink().run()}
        />
      )}
      <T
        label="Clear formatting"
        icon={<RemoveFormatting />}
        disabled={off}
        onClick={() => c().unsetAllMarks().unsetTextAlign().run()}
      />
      <span className="ml-auto flex">
        <T
          label={codeOpen ? "Back to editor" : "Edit HTML"}
          icon={<Code2 />}
          disabled={disabled}
          active={codeOpen}
          onClick={onCode}
        />
        <T
          label="Undo"
          icon={<Undo2 />}
          disabled={off || !editor.can().undo()}
          onClick={() => c().undo().run()}
        />
        <T
          label="Redo"
          icon={<Redo2 />}
          disabled={off || !editor.can().redo()}
          onClick={() => c().redo().run()}
        />
      </span>
    </div>
  );
}

const Sep = () => <span aria-hidden className="bg-charcoal/10 mx-1 h-5 w-px" />;

function T({
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
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] transition-colors disabled:opacity-35 [&_svg]:size-4",
        active ? "bg-royal text-white" : "hover:bg-charcoal/[0.06]",
      )}
    >
      {icon}
    </button>
  );
}

const EXTRA_SWATCHES = ["#ffffff", "#000000", "#c2410c", "#fff3b0"];

function ColorButton({
  label,
  icon,
  value,
  onPick,
  onClear,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onPick: (v: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const swatches = [...BRAND_SWATCHES.map((s) => s.value), ...EXTRA_SWATCHES];
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          className="hover:bg-charcoal/[0.06] relative inline-flex size-8 shrink-0 flex-col items-center justify-center rounded-[7px] disabled:opacity-35 [&_svg]:size-4"
        >
          {icon}
          <span
            aria-hidden
            className="absolute bottom-1 h-[3px] w-4 rounded-full"
            style={{ background: value || "transparent" }}
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="dx-site z-[90] flex w-56 flex-col gap-3 rounded-[12px] bg-white p-3 shadow-[0_24px_60px_-20px_rgb(0_8_107/0.4)] ring-1 ring-black/[0.06]"
        >
          <p className="text-xs font-bold">{label}</p>
          <div className="grid grid-cols-7 gap-1.5">
            {swatches.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={s}
                title={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(s);
                  setOpen(false);
                }}
                className={cn(
                  "size-6 rounded-full ring-1 ring-black/10",
                  value.toLowerCase() === s && "ring-royal ring-2",
                )}
                style={{ background: s }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 text-xs font-bold">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000c99"}
                onChange={(e) => onPick(e.target.value)}
                className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              Custom
            </label>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="text-surface-muted hover:text-surface-fg text-xs font-bold underline"
            >
              None
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
