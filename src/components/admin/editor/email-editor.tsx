"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Braces,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Figure } from "./nodes";
import { ImageDialog, LinkDialog } from "./rich-text-editor";

const normalise = (editor: Editor) =>
  editor.isEmpty ? "" : editor.getHTML().replace(/(<p><\/p>)+$/, "");

/**
 * The editor for emails (Tiptap): only what email apps show reliably:
 * bold, italic, underline, links, a heading, lists, quotes, dividers and
 * images. Optional tags ({first_name}…) can be inserted from the toolbar.
 * The HTML is made email-safe when it's sent (src/lib/email-html.ts).
 */
export function EmailEditor({
  value,
  onChange,
  label,
  placeholder = "Write your message…",
  tags,
  minHeight = "16rem",
}: {
  value: string;
  onChange: (html: string) => void;
  label: string;
  placeholder?: string;
  tags?: readonly { tag: string; label: string }[];
  minHeight?: string;
}) {
  const baseline = useRef<{ html: string; value: string } | null>(null);
  const [dialog, setDialog] = useState<"link" | "image" | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        code: false,
        codeBlock: false,
        strike: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
        },
      }),
      Figure,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "dx-article dx-email-body px-4 py-4 outline-none md:px-5",
        style: `min-height:${minHeight}`,
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
      onChange(
        baseline.current && html === baseline.current.html
          ? baseline.current.value
          : html,
      );
    },
  });

  const c = () => editor!.chain().focus();
  const T = ({
    label: l,
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
  }) => (
    <button
      type="button"
      title={l}
      aria-label={l}
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

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{label}</span>
      <div className="relative flex flex-col overflow-hidden rounded-[10px] bg-white ring-1 ring-black/[0.12] focus-within:ring-2 focus-within:ring-[#00abff]/50">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="bg-canvas/70 flex flex-wrap items-center gap-0.5 border-b border-black/[0.06] px-1.5 py-1.5"
        >
          {editor && (
            <>
              <T
                label="Bold"
                icon={<Bold />}
                active={editor.isActive("bold")}
                onClick={() => c().toggleBold().run()}
              />
              <T
                label="Italic"
                icon={<Italic />}
                active={editor.isActive("italic")}
                onClick={() => c().toggleItalic().run()}
              />
              <T
                label="Underline"
                icon={<Underline />}
                active={editor.isActive("underline")}
                onClick={() => c().toggleUnderline().run()}
              />
              <T
                label={editor.isActive("link") ? "Edit link" : "Add link"}
                icon={<Link2 />}
                active={editor.isActive("link")}
                onClick={() => setDialog("link")}
              />
              {editor.isActive("link") && (
                <T
                  label="Remove link"
                  icon={<Unlink />}
                  onClick={() => c().extendMarkRange("link").unsetLink().run()}
                />
              )}
              <span aria-hidden className="bg-charcoal/10 mx-1 h-5 w-px" />
              <T
                label="Heading"
                icon={<Heading2 />}
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => c().toggleHeading({ level: 2 }).run()}
              />
              <T
                label="Bullet list"
                icon={<List />}
                active={editor.isActive("bulletList")}
                onClick={() => c().toggleBulletList().run()}
              />
              <T
                label="Numbered list"
                icon={<ListOrdered />}
                active={editor.isActive("orderedList")}
                onClick={() => c().toggleOrderedList().run()}
              />
              <T
                label="Quote"
                icon={<Quote />}
                active={editor.isActive("blockquote")}
                onClick={() => c().toggleBlockquote().run()}
              />
              <T
                label="Divider"
                icon={<Minus />}
                onClick={() => c().setHorizontalRule().run()}
              />
              <T
                label={editor.isActive("figure") ? "Edit image" : "Add image"}
                icon={<ImagePlus />}
                active={editor.isActive("figure")}
                onClick={() => setDialog("image")}
              />
              {tags && tags.length > 0 && (
                <span className="relative">
                  <T
                    label="Insert a personal detail"
                    icon={<Braces />}
                    active={tagsOpen}
                    onClick={() => setTagsOpen((o) => !o)}
                  />
                  {tagsOpen && (
                    <span className="absolute top-9 left-0 z-20 flex w-48 flex-col rounded-[10px] bg-white p-1 shadow-lg ring-1 ring-black/[0.08]">
                      {tags.map((t) => (
                        <button
                          key={t.tag}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            c().insertContent(t.tag).run();
                            setTagsOpen(false);
                          }}
                          className="hover:bg-canvas rounded-[7px] px-2.5 py-1.5 text-left text-sm"
                        >
                          {t.label}
                          <span className="text-surface-muted ml-1 text-xs">
                            {t.tag}
                          </span>
                        </button>
                      ))}
                    </span>
                  )}
                </span>
              )}
              <span className="ml-auto flex">
                <T
                  label="Undo"
                  icon={<Undo2 />}
                  disabled={!editor.can().undo()}
                  onClick={() => c().undo().run()}
                />
                <T
                  label="Redo"
                  icon={<Redo2 />}
                  disabled={!editor.can().redo()}
                  onClick={() => c().redo().run()}
                />
              </span>
            </>
          )}
        </div>
        <div className="dx-site max-h-[55dvh] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
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
        </>
      )}
    </div>
  );
}
