"use client";
// TinyMCE editor skin: only the admin needs it, so it loads here, not site-wide.
import "tinymce/skins/ui/oxide/skin.css";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/models/dom";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/autolink";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/help";
import "tinymce/plugins/help/js/i18n/keynav/en";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/visualchars";
import "tinymce/plugins/wordcount";
import "tinymce/themes/silver";
import { Editor } from "@tinymce/tinymce-react";

export type RichTextEditorClientProps = {
  defaultFontFamily?: string;
  disabled?: boolean;
  minHeight?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  tone?: "dark" | "light";
  value: string;
};

const FONT_FAMILY_FORMATS = [
  "Montserrat=Montserrat,sans-serif",
  "Clash Display=var(--font-clash-display),system-ui,sans-serif",
  "Inter=Inter,system-ui,sans-serif",
  "Poppins=Poppins,system-ui,sans-serif",
  "Roboto=Roboto,Arial,sans-serif",
  "Open Sans='Open Sans',Arial,sans-serif",
  "Lato=Lato,Arial,sans-serif",
  "Nunito=Nunito,Arial,sans-serif",
  "Raleway=Raleway,Arial,sans-serif",
  "Oswald=Oswald,Arial,sans-serif",
  "Merriweather=Merriweather,Georgia,serif",
  "Playfair Display='Playfair Display',Georgia,serif",
  "Arial=Arial,Helvetica,sans-serif",
  "Georgia=Georgia,serif",
  "Times New Roman='Times New Roman',Times,serif",
  "Courier New='Courier New',Courier,monospace",
].join(";");

const FONT_SIZE_FORMATS = [
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "40px",
  "48px",
  "56px",
  "64px",
  "72px",
  "80px",
  "96px",
  "112px",
  "128px",
  "144px",
].join(" ");

const BLOCK_FORMATS =
  "Paragraph=p;Heading 2=h2;Heading 3=h3;Heading 4=h4;Quote=blockquote";

export function RichTextEditorClient({
  defaultFontFamily = "Montserrat",
  disabled = false,
  minHeight = 220,
  onChange,
  placeholder,
  tone = "dark",
  value,
}: RichTextEditorClientProps) {
  const isLightTone = tone === "light";
  const normalizedDefaultFont =
    defaultFontFamily.trim().replace(/^["']|["']$/g, "") || "Montserrat";
  const defaultFontFormatValue = /\s/.test(normalizedDefaultFont)
    ? `'${normalizedDefaultFont}'`
    : normalizedDefaultFont;
  const defaultFontStack = `${JSON.stringify(normalizedDefaultFont)}, system-ui, sans-serif`;
  const fontFamilyFormats = [
    `${normalizedDefaultFont}=${defaultFontFormatValue},system-ui,sans-serif`,
    FONT_FAMILY_FORMATS,
  ]
    .join(";")
    .split(";")
    .filter((item, index, items) => items.indexOf(item) === index)
    .join(";");
  const editorPalette = isLightTone
    ? {
        background: "#ffffff",
        border: "border-[#d8dee8]",
        bodyText: "#1f2937",
        headingText: "#111827",
        linkText: "#0369a1",
        quoteBorder: "#0284c7",
        quoteText: "#374151",
        wrapperBackground: "bg-white",
      }
    : {
        background: "#0d0d0d",
        border: "border-[#2a2a2a]",
        bodyText: "#f5f5f5",
        headingText: "#ffffff",
        linkText: "#67e8f9",
        quoteBorder: "#22d3ee",
        quoteText: "#d7d7d7",
        wrapperBackground: "bg-[#0d0d0d]",
      };

  return (
    <div
      className={`overflow-hidden rounded-xl border ${editorPalette.border} ${editorPalette.wrapperBackground}`}
    >
      <Editor
        disabled={disabled}
        licenseKey="gpl"
        init={{
          autoresize_bottom_margin: 16,
          autoresize_max_height: 520,
          autoresize_min_height: minHeight,
          body_class: "dexta-tinymce-body",
          branding: false,
          browser_spellcheck: true,
          content_css: false,
          content_style: `
            body {
              background: ${editorPalette.background};
              color: ${editorPalette.bodyText};
              font-family: ${defaultFontStack};
              font-size: 16px;
              margin: 0;
              padding: 16px;
            }
            p {
              margin: 0 0 0.85rem;
            }
            p:last-child {
              margin-bottom: 0;
            }
            h2, h3, h4 {
              color: ${editorPalette.headingText};
              line-height: 1.2;
              margin: 0 0 0.75rem;
            }
            ul, ol {
              margin: 0 0 0.85rem 1.25rem;
              padding: 0;
            }
            blockquote {
              border-left: 3px solid ${editorPalette.quoteBorder};
              color: ${editorPalette.quoteText};
              margin: 0 0 0.85rem;
              padding-left: 1rem;
            }
            a {
              color: ${editorPalette.linkText};
            }
          `,
          block_formats: BLOCK_FORMATS,
          font_family_formats: fontFamilyFormats,
          font_size_formats: FONT_SIZE_FORMATS,
          menubar: false,
          min_height: minHeight,
          plugins:
            "autolink charmap code help link lists quickbars visualchars wordcount",
          placeholder,
          promotion: false,
          quickbars_insert_toolbar: false,
          quickbars_selection_toolbar:
            "blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | link removeformat",
          resize: true,
          skin: false,
          statusbar: true,
          toolbar:
            "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist blockquote | link unlink | removeformat | visualchars code",
          toolbar_mode: "wrap",
        }}
        onEditorChange={onChange}
        value={value}
      />
    </div>
  );
}
