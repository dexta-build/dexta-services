"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  Monitor,
  Package,
  Palette,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Redo2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { MediaValueField } from "@/components/admin/content/media-value-field";
import { FormattedTextEditor } from "@/components/admin/editor/formatted-text-editor";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  Switch,
  Textarea,
} from "./ui";
import { resolveSchoolTemplateAsset } from "@/lib/school-template-assets";
import { cn } from "@/lib/utils";
import {
  type SchoolTemplateProjectContent,
  type SchoolTemplateProjectFieldSnapshot,
  type SchoolTemplateProjectPageContent,
  type SchoolTemplateProjectSectionContent,
  type SchoolTemplateProjectSectionSnapshot,
  type SchoolTemplateSourceSnapshot,
} from "@/lib/school-template-project-content";
import {
  extractSchoolWebsiteCopySuggestions,
  exportSchoolWebsiteProject,
  generateSchoolWebsiteProjectPreviewLink,
  saveSchoolWebsiteProjectDraft,
} from "../../../actions";

type ProjectEditorWorkspaceProps = {
  projectId: string;
  applicationId: string;
  projectStatus: string;
  content: SchoolTemplateProjectContent;
  sourceSnapshot: SchoolTemplateSourceSnapshot;
  updatedAt: string;
  lastExportedAt: string | null;
  exportZipUrl: string | null;
};

type SelectedScope = "navbar" | "page" | "shared";
type PreviewMode = "desktop" | "tablet" | "mobile";
type EditableFieldValue = string | number | boolean | null;

type SectionBinding = {
  content: SchoolTemplateProjectSectionContent;
  snapshot: SchoolTemplateProjectSectionSnapshot | null;
  scope: "page" | "shared";
  pageSlug?: string;
};

type SaveDraftOptions = {
  createRevision?: boolean;
  note?: string;
  showToast?: boolean;
  autosave?: boolean;
};

type DraftUpdater =
  | SchoolTemplateProjectContent
  | ((
      currentDraft: SchoolTemplateProjectContent,
    ) => SchoolTemplateProjectContent);

type ComponentHistorySnapshot =
  | SchoolTemplateProjectContent["theme"]
  | SchoolTemplateProjectSectionContent;

type ComponentHistoryEntry = {
  past: ComponentHistorySnapshot[];
  future: ComponentHistorySnapshot[];
};

type CopySuggestion = {
  fieldKey: string;
  label: string;
  value: string;
  previousValue: EditableFieldValue;
  itemIndex?: number;
  itemFieldKey?: string;
};

type CopyImportTarget = {
  requestKey: string;
  field: SchoolTemplateProjectFieldSnapshot;
  label: string;
  currentValue: EditableFieldValue;
  itemIndex?: number;
  itemFieldKey?: string;
};

type ModelValidationCandidate = {
  field: SchoolTemplateProjectFieldSnapshot;
  value: EditableFieldValue;
  label: string;
};

type ModelValidationProbeResult = {
  ok: boolean;
  status: number;
  contentType: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  READY_FOR_EXPORT: "Ready to export",
  EXPORTED: "Exported",
  LIVE: "Live",
};

const MODEL_VALIDATION_PREVIEW_KEY = "preview-models";
const THEME_HISTORY_KEY = "theme";
const COMPONENT_HISTORY_LIMIT = 50;
const DEXTA_ACADEMY_2_SLUG = "dexta-academy-2";
const DEXTA_ACADEMY_3_SLUG = "dexta-academy-3";
const DEXTA_ACADEMY_4_SLUG = "dexta-academy-4";
const DEXTA_ACADEMY_3_FOOTER_PAGE_SECTION_IDS = new Set([
  "contact-footer-brand",
  "contact-footer-explore",
  "contact-footer-details",
  "contact-footer",
  "contact-footer-legal",
]);
const NAVBAR_SHARED_SECTION_ID = "site-header";
const DEXTA_ACADEMY_5_SLUG = "dexta-academy-5";
const DEXTA_ACADEMY_1_SLUG = "dexta-academy-1";
const FOOTER_ONLY_SHARED_SECTION_IDS = new Set(["site-footer", "footer"]);
const DEXTA_ACADEMY_2_NAVBAR_FIELD_KEYS = new Set([
  "portalCtaText",
  "portalCtaHref",
  "portalButtonBgColor",
  "portalButtonBgOpacity",
  "portalButtonTextColor",
  "portalButtonBorderColor",
  "portalButtonBorderWidth",
  "primaryCtaText",
  "primaryCtaHref",
  "primaryButtonBgColor",
  "primaryButtonBgOpacity",
  "primaryButtonTextColor",
  "primaryButtonBorderColor",
  "primaryButtonBorderWidth",
]);
const DEXTA_ACADEMY_3_NAVBAR_FIELD_KEYS = new Set([
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
  "portalButtonBgColor",
  "portalButtonBgOpacity",
  "portalButtonTextColor",
  "portalButtonBorderColor",
  "portalButtonBorderWidth",
  "headerCtaText",
  "headerCtaHref",
  "buttonBgColor",
  "buttonBgOpacity",
  "buttonTextColor",
  "buttonBorderColor",
  "buttonBorderWidth",
]);
const DEXTA_ACADEMY_4_NAVBAR_FIELD_KEYS = new Set([
  "portalText",
  "portalHref",
  "portalButtonBgColor",
  "portalButtonBgOpacity",
  "portalButtonTextColor",
  "portalButtonBorderColor",
  "portalButtonBorderWidth",
  "applyText",
  "applyHref",
  "applyButtonBgColor",
  "applyButtonBgOpacity",
  "applyButtonTextColor",
  "applyButtonBorderColor",
  "applyButtonBorderWidth",
]);
const DEXTA_ACADEMY_4_HIDDEN_EDITOR_FIELD_KEYS = new Set([
  "mobileStageWidth",
  "mobileStageHeight",
]);
const ORIGINAL_THEME_COLORS: Record<
  string,
  Partial<Record<keyof SchoolTemplateProjectContent["theme"], string>>
> = {
  "dexta-academy-5": {
    brandNameColor: "#2b2b2b",
    brandTaglineColor: "#d4a437",
    logoBorderColor: "#d4a437",
    logoBackgroundColor: "transparent",
    primaryColor: "#31401c",
    secondaryColor: "#d4a437",
    loadingBackgroundColor: "#ffffff",
    loadingTextColor: "#2b2b2b",
    navBarColor: "#ffffff",
  },
  "dexta-academy-4": {
    brandNameColor: "#ffffff",
    brandTaglineColor: "#dbeafe",
    logoBorderColor: "#d1d5db",
    logoBackgroundColor: "transparent",
    primaryColor: "#4a8fff",
    secondaryColor: "#6aaeff",
    loadingBackgroundColor: "#ffffff",
    loadingTextColor: "#111827",
    navBarColor: "#ffffff",
  },
  "dexta-academy-3": {
    brandNameColor: "#061a40",
    brandTaglineColor: "#061a40",
    logoBorderColor: "#ffc43d",
    logoBackgroundColor: "#ffffff",
    primaryColor: "#061a40",
    secondaryColor: "#f5b82e",
    tertiaryColor: "#dc422e",
    loadingBackgroundColor: "#fff7df",
    loadingTextColor: "#061a40",
    loadingCardBorderColor: "rgba(255,255,255,0.1)",
    loadingCardShadowColor: "#010814",
    navBarColor: "#020c20",
    navLinkColor: "#ffffff",
    navHoverColor: "#f5b82e",
    buttonOverlayColor: "#ffffff",
  },
  "dexta-academy-2": {
    brandNameColor: "#ffffff",
    brandTaglineColor: "#facc15",
    logoBorderColor: "#ffc433",
    logoBackgroundColor: "transparent",
    primaryColor: "#081827",
    secondaryColor: "#facc15",
    tertiaryColor: "#facc15",
    templateGreenColor: "#378F00",
    templateLightGreenColor: "#91B900",
    templateYellowColor: "#E6AE00",
    templateOrangeColor: "#D98100",
    loadingBackgroundColor: "#081827",
    loadingTextColor: "#ffffff",
    navBarColor: "#081827",
  },
  "dexta-academy-1": {
    brandNameColor: "#0f172a",
    brandTaglineColor: "#64748b",
    logoBorderColor: "#0f766e",
    logoBackgroundColor: "transparent",
    primaryColor: "#0f766e",
    secondaryColor: "#f97316",
    loadingBackgroundColor: "#ffffff",
    loadingTextColor: "#0f172a",
    navBarColor: "#ffffff",
  },
  default: {
    brandNameColor: "#111827",
    brandTaglineColor: "#6b7280",
    logoBorderColor: "#d1d5db",
    logoBackgroundColor: "transparent",
    primaryColor: "#0f766e",
    secondaryColor: "#facc15",
    loadingBackgroundColor: "#ffffff",
    loadingTextColor: "#111827",
    navBarColor: "#ffffff",
  },
};

const PREVIEW_MODES: Array<{
  id: PreviewMode;
  label: string;
  width: number | "100%";
  icon: typeof Monitor;
}> = [
  { id: "desktop", label: "Desktop", width: "100%", icon: Monitor },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
];

function getProjectPreviewHref(
  projectId: string,
  pageSlug: string,
  key: number,
) {
  return `/admin/we-brand-schools/projects/${projectId}/preview/${pageSlug}?editorPreview=${key}`;
}

function getAbsoluteHref(href: string) {
  if (typeof window === "undefined") return href;
  return new URL(href, window.location.origin).toString();
}

function getTemplateBaseHref(previewPath: string) {
  const parts = previewPath.split("/");
  parts.pop();
  return `${parts.join("/") || ""}/`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFieldControlKind(field: SchoolTemplateProjectFieldSnapshot | null) {
  return field?.type ?? "text";
}

function isIframeEmbedEditorField(field: SchoolTemplateProjectFieldSnapshot) {
  return (
    field.type === "textarea" &&
    field.target === "attribute" &&
    ["formIframe", "formEmbedCode", "iframeEmbedCode"].includes(field.key)
  );
}

function isHiddenEditorField(
  templateSlug: string,
  field: SchoolTemplateProjectFieldSnapshot,
) {
  return (
    templateSlug === DEXTA_ACADEMY_4_SLUG &&
    DEXTA_ACADEMY_4_HIDDEN_EDITOR_FIELD_KEYS.has(field.key)
  );
}

function isProtectedCopyImportField(field: SchoolTemplateProjectFieldSnapshot) {
  return /eyebrow|eye\s*brow|kicker/.test(
    `${field.key} ${field.label}`.toLowerCase(),
  );
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

type StoryPreviewUpdate = {
  pageSlug: "about";
  sectionId: "story";
  fields?: Record<string, string>;
  repeatableItem?: {
    itemIndex: number;
    fields: Record<string, string>;
  };
};

const STORY_FULL_FIELD_KEYS = new Set(["bodyHtml", "fullStory"]);

const STORY_PREVIEW_FALLBACK_LENGTHS: Record<string, number[]> = {
  "dexta-academy-1": [250, 170],
  "dexta-academy-2": [255],
  "dexta-academy-3": [165, 165],
  "dexta-academy-4": [220, 210],
  "dexta-academy-5": [155, 175],
};

function normalizeStoryText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getStoryTextBlocks(value: EditableFieldValue) {
  const rawValue = getStringValue(value).trim();
  if (!rawValue) return [];

  if (/<[a-z][\s\S]*>/i.test(rawValue) && typeof document !== "undefined") {
    const container = document.createElement("div");
    container.innerHTML = rawValue;
    const blocks = Array.from(container.querySelectorAll("p, li"))
      .map((node) => normalizeStoryText(node.textContent ?? ""))
      .filter(Boolean);

    if (blocks.length) {
      return blocks;
    }

    const fallbackText = normalizeStoryText(container.textContent ?? "");
    return fallbackText ? [fallbackText] : [];
  }

  return rawValue
    .split(/\n{2,}/)
    .map(normalizeStoryText)
    .filter(Boolean);
}

function splitStorySentences(value: string) {
  return (value.match(/[^.!?]+[.!?]?/g) ?? [value])
    .map(normalizeStoryText)
    .filter(Boolean);
}

function fitStoryText(value: string, targetLength: number) {
  const normalizedValue = normalizeStoryText(value);
  if (!normalizedValue) return "";

  const upperBound = Math.max(70, Math.round(targetLength * 1.08));
  if (normalizedValue.length <= upperBound) {
    return normalizedValue;
  }

  const sentences = splitStorySentences(normalizedValue);
  let output = "";
  for (const sentence of sentences) {
    const nextOutput = `${output} ${sentence}`.trim();
    if (nextOutput.length > upperBound) break;
    output = nextOutput;
  }

  const clipped =
    output || normalizedValue.slice(0, Math.max(upperBound - 3, 67)).trimEnd();
  return clipped.endsWith(".") || clipped.endsWith("!") || clipped.endsWith("?")
    ? clipped
    : `${clipped.replace(/[,\s]+$/g, "")}...`;
}

function getStoryFieldTargetLength(
  section: SchoolTemplateProjectSectionContent | undefined,
  fieldKey: string,
  fallbackLength: number,
) {
  const currentLength = normalizeStoryText(
    getStringValue(section?.fields[fieldKey]),
  ).length;

  return currentLength > 40 ? currentLength : fallbackLength;
}

function getStoryRepeatableFieldTargetLength(
  section: SchoolTemplateProjectSectionContent | undefined,
  itemIndex: number,
  fieldKey: string,
  fallbackLength: number,
) {
  const currentLength = normalizeStoryText(
    getStringValue(section?.repeatable?.items[itemIndex]?.[fieldKey]),
  ).length;

  return currentLength > 40 ? currentLength : fallbackLength;
}

function buildStoryPreviewSegments(
  fullStoryValue: EditableFieldValue,
  targetLengths: number[],
) {
  const blocks = getStoryTextBlocks(fullStoryValue);
  const fullText = normalizeStoryText(blocks.join(" "));

  if (!blocks.length || !fullText) {
    return targetLengths.map(() => "");
  }

  if (targetLengths.length === 1) {
    return [fitStoryText(fullText, targetLengths[0])];
  }

  if (blocks.length >= targetLengths.length) {
    return targetLengths.map((targetLength, index) =>
      fitStoryText(blocks[index] ?? fullText, targetLength),
    );
  }

  const sentences = splitStorySentences(fullText);
  let sentenceIndex = 0;

  return targetLengths.map((targetLength) => {
    let output = "";
    while (sentenceIndex < sentences.length) {
      const sentence = sentences[sentenceIndex];
      const nextOutput = `${output} ${sentence}`.trim();
      if (output && nextOutput.length > targetLength * 1.08) break;
      output = nextOutput;
      sentenceIndex += 1;
      if (output.length >= targetLength * 0.72) break;
    }

    return fitStoryText(output || fullText, targetLength);
  });
}

function buildStoryPreviewUpdate({
  draft,
  sectionId,
  fieldKey,
  value,
}: {
  draft: SchoolTemplateProjectContent;
  sectionId: string;
  fieldKey: string;
  value: EditableFieldValue;
}): StoryPreviewUpdate | null {
  if (sectionId !== "story-modal" || !STORY_FULL_FIELD_KEYS.has(fieldKey)) {
    return null;
  }

  const aboutPage = draft.pages.find((page) => page.slug === "about");
  const storySection = aboutPage?.sections.find(
    (section) => section.id === "story",
  );
  if (!storySection) {
    return null;
  }

  const fallbackLengths =
    STORY_PREVIEW_FALLBACK_LENGTHS[draft.templateSlug] ??
    STORY_PREVIEW_FALLBACK_LENGTHS["dexta-academy-5"];

  switch (draft.templateSlug) {
    case "dexta-academy-1":
    case "dexta-academy-4":
    case "dexta-academy-5": {
      const targetFields = ["body1", "body2"];
      const segments = buildStoryPreviewSegments(
        value,
        targetFields.map((targetField, index) =>
          getStoryFieldTargetLength(
            storySection,
            targetField,
            fallbackLengths[index] ?? 180,
          ),
        ),
      );

      return {
        pageSlug: "about",
        sectionId: "story",
        fields: Object.fromEntries(
          targetFields.map((targetField, index) => [
            targetField,
            segments[index] ?? "",
          ]),
        ),
      };
    }
    case "dexta-academy-2": {
      const [segment] = buildStoryPreviewSegments(value, [
        getStoryFieldTargetLength(storySection, "body", fallbackLengths[0]),
      ]);

      return {
        pageSlug: "about",
        sectionId: "story",
        fields: { body: segment ?? "" },
      };
    }
    case "dexta-academy-3": {
      const targetFields = ["cardBody1", "cardBody2"];
      const segments = buildStoryPreviewSegments(
        value,
        targetFields.map((targetField, index) =>
          getStoryRepeatableFieldTargetLength(
            storySection,
            0,
            targetField,
            fallbackLengths[index] ?? 165,
          ),
        ),
      );

      return {
        pageSlug: "about",
        sectionId: "story",
        repeatableItem: {
          itemIndex: 0,
          fields: Object.fromEntries(
            targetFields.map((targetField, index) => [
              targetField,
              segments[index] ?? "",
            ]),
          ),
        },
      };
    }
    default:
      return null;
  }
}

function storyPreviewUpdateHasChanges(
  draft: SchoolTemplateProjectContent,
  update: StoryPreviewUpdate,
) {
  const aboutPage = draft.pages.find((page) => page.slug === update.pageSlug);
  const section = aboutPage?.sections.find(
    (item) => item.id === update.sectionId,
  );
  if (!section) return false;

  const fieldsChanged = Object.entries(update.fields ?? {}).some(
    ([key, value]) => section.fields[key] !== value,
  );
  const repeatableChanged = Object.entries(
    update.repeatableItem?.fields ?? {},
  ).some(
    ([key, value]) =>
      section.repeatable?.items[update.repeatableItem?.itemIndex ?? 0]?.[
        key
      ] !== value,
  );

  return fieldsChanged || repeatableChanged;
}

function applyStoryPreviewUpdate(
  draft: SchoolTemplateProjectContent,
  update: StoryPreviewUpdate,
) {
  return {
    ...draft,
    pages: draft.pages.map((page) =>
      page.slug === update.pageSlug
        ? {
            ...page,
            sections: page.sections.map((section) =>
              section.id === update.sectionId
                ? {
                    ...section,
                    fields: {
                      ...section.fields,
                      ...(update.fields ?? {}),
                    },
                    repeatable: update.repeatableItem
                      ? {
                          items: (section.repeatable?.items ?? []).map(
                            (item, index) =>
                              index === update.repeatableItem?.itemIndex
                                ? {
                                    ...item,
                                    ...update.repeatableItem.fields,
                                  }
                                : item,
                          ),
                        }
                      : section.repeatable,
                  }
                : section,
            ),
          }
        : page,
    ),
  };
}

function getCopyImportMemoryKey({
  pageSlug,
  url,
}: {
  pageSlug: string;
  url: string;
}) {
  return `${pageSlug}:${url.trim().toLowerCase()}`;
}

function getNumberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value) || 0;
}

function cloneEditorValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getSectionHistoryKey({
  scope,
  pageSlug,
  sectionId,
}: {
  scope: SelectedScope;
  pageSlug: string;
  sectionId: string;
}) {
  return scope === "shared"
    ? `shared:${sectionId}`
    : `page:${pageSlug}:${sectionId}`;
}

function getDraftSection({
  draft,
  scope,
  pageSlug,
  sectionId,
}: {
  draft: SchoolTemplateProjectContent;
  scope: SelectedScope;
  pageSlug: string;
  sectionId: string;
}) {
  if (scope === "shared") {
    return draft.sharedSections.find((section) => section.id === sectionId);
  }

  return draft.pages
    .find((page) => page.slug === pageSlug)
    ?.sections.find((section) => section.id === sectionId);
}

function replaceDraftSection({
  draft,
  scope,
  pageSlug,
  section,
}: {
  draft: SchoolTemplateProjectContent;
  scope: SelectedScope;
  pageSlug: string;
  section: SchoolTemplateProjectSectionContent;
}) {
  if (scope === "shared") {
    return {
      ...draft,
      sharedSections: draft.sharedSections.map((currentSection) =>
        currentSection.id === section.id ? section : currentSection,
      ),
    };
  }

  return {
    ...draft,
    pages: draft.pages.map((page) =>
      page.slug === pageSlug
        ? {
            ...page,
            sections: page.sections.map((currentSection) =>
              currentSection.id === section.id ? section : currentSection,
            ),
          }
        : page,
    ),
  };
}

function isFilledFieldValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function getFieldDisplayValue(
  field: SchoolTemplateProjectFieldSnapshot,
  value: EditableFieldValue,
  originalValue?: EditableFieldValue,
) {
  if (getFieldControlKind(field) === "color") {
    const computedDefaultValue =
      field.computedDefaultValue !== undefined
        ? field.computedDefaultValue
        : null;
    const fieldDefaultValue =
      field.defaultValue !== undefined ? field.defaultValue : null;

    const valueMatchesFieldDefault = (candidate: EditableFieldValue) =>
      isFilledFieldValue(candidate) &&
      isFilledFieldValue(fieldDefaultValue) &&
      normalizeColorValue(getStringValue(candidate)) ===
        normalizeColorValue(getStringValue(fieldDefaultValue));

    if (isFilledFieldValue(value)) {
      if (
        isFilledFieldValue(computedDefaultValue) &&
        valueMatchesFieldDefault(value)
      ) {
        return computedDefaultValue;
      }

      return value;
    }

    if (isFilledFieldValue(originalValue)) {
      if (
        isFilledFieldValue(computedDefaultValue) &&
        valueMatchesFieldDefault(originalValue ?? null)
      ) {
        return computedDefaultValue;
      }

      return originalValue;
    }

    if (isFilledFieldValue(computedDefaultValue)) {
      return computedDefaultValue;
    }

    return field.defaultValue ?? value;
  }

  if (value !== null && value !== undefined) {
    return value;
  }

  return field.defaultValue ?? value;
}

function normalizeColorValue(value: string) {
  return value.trim().toLowerCase();
}

function getColorPickerValue(value: string) {
  const normalizedValue = normalizeColorValue(value);

  if (/^#[0-9a-f]{6}$/i.test(normalizedValue)) {
    return normalizedValue;
  }

  if (/^#[0-9a-f]{3}$/i.test(normalizedValue)) {
    return `#${normalizedValue
      .slice(1)
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`;
  }

  const rgbMatch = normalizedValue.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
  );

  if (!rgbMatch) return "#000000";

  return `#${rgbMatch
    .slice(1, 4)
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(Number(channel) || 0)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function getOriginalThemeColor(
  templateSlug: string,
  key: keyof SchoolTemplateProjectContent["theme"],
  fallback: unknown,
) {
  return (
    ORIGINAL_THEME_COLORS[templateSlug]?.[key] ??
    ORIGINAL_THEME_COLORS.default[key] ??
    getStringValue(fallback)
  );
}

function ensureDextaAcademy4HomeAboutPreviewStats(
  content: SchoolTemplateProjectContent,
): SchoolTemplateProjectContent {
  if (content.templateSlug !== DEXTA_ACADEMY_4_SLUG) {
    return content;
  }

  let changed = false;
  const pages = content.pages.map((page) => {
    if (page.slug !== "home") return page;

    const sections = page.sections.map((section) => {
      if (section.id !== "about-preview" || !section.repeatable) {
        return section;
      }

      if (section.repeatable.items.length >= 3) {
        return section;
      }

      changed = true;
      const items = [...section.repeatable.items];
      while (items.length < 3) {
        items.push({});
      }

      return {
        ...section,
        repeatable: {
          ...section.repeatable,
          items,
        },
      };
    });

    return sections === page.sections ? page : { ...page, sections };
  });

  return changed ? { ...content, pages } : content;
}

function getRepeatableItemFields(
  section: SectionBinding,
): SchoolTemplateProjectFieldSnapshot[] {
  const fields = section.snapshot?.fields ?? [];
  const repeatable = section.snapshot?.repeatable;
  if (!repeatable) return [];

  // Fields that are always section-level (never per-item)
  const sectionLevelUiGroups = new Set([
    "Section background",
    "Button style",
    "Primary CTA style",
    "Secondary CTA style",
    "Icon style",
    "Rich text fonts",
    "Portal button",
    "Apply button",
  ]);

  function isSectionLevelField(field: SchoolTemplateProjectFieldSnapshot) {
    if (field.uiGroup && sectionLevelUiGroups.has(field.uiGroup)) return true;
    return false;
  }

  // Extract class names from the item selector to determine if a field
  // targets elements inside repeatable items
  const itemSelector = repeatable.itemSelector.trim();
  const itemClasses =
    itemSelector.match(/\.[a-zA-Z0-9_-]+/g)?.map((c) => c) ?? [];
  // Extract base prefix from item classes (e.g., ".program-card" → "program-card")
  const itemPrefixes = itemClasses.map((c) => c.slice(1));

  function isLikelyItemField(field: SchoolTemplateProjectFieldSnapshot) {
    const sel = field.selector.trim();
    // If the field selector contains any of the item selector's classes
    for (const cls of itemClasses) {
      if (sel.includes(cls)) return true;
    }
    // If the field selector starts with or contains the bare item element
    // e.g., itemSelector "article" matches field selector "article h2"
    const bareItemTag = itemSelector.replace(/\.[a-zA-Z0-9_-]+/g, "").trim();
    if (bareItemTag && /^[a-z]+$/i.test(bareItemTag)) {
      if (
        sel === bareItemTag ||
        sel.startsWith(bareItemTag + " ") ||
        sel.startsWith(bareItemTag + ">")
      )
        return true;
    }
    // If the selector class name shares a prefix with the item class
    // e.g., ".gallery-preview-label" shares prefix with ".gallery-preview-card"
    const fieldClasses = sel.match(/\.[a-zA-Z0-9_-]+/g) ?? [];
    for (const fc of fieldClasses) {
      const fcName = fc.slice(1); // strip leading dot
      for (const prefix of itemPrefixes) {
        // Check if they share a common root (first 2+ hyphen-segments)
        const prefixParts = prefix.split("-");
        const fcParts = fcName.split("-");
        if (
          prefixParts.length >= 2 &&
          fcParts.length >= 2 &&
          prefixParts.slice(0, 2).join("-") === fcParts.slice(0, 2).join("-")
        ) {
          return true;
        }
      }
    }
    // Bare inline/content elements that typically appear inside repeatable cards
    if (
      /^(strong|span|em|small|a|img|figure|figcaption|li|h2|h3|h4|h5|h6|p)$/i.test(
        sel,
      )
    )
      return true;
    return false;
  }

  const sectionSelector = section.snapshot?.selector.trim();
  const sectionTargetsItems =
    sectionSelector === itemSelector ||
    sectionSelector
      ?.split(",")
      .map((selector) => selector.trim())
      .includes(itemSelector);

  // When section selector = item selector, all non-styling fields are item-level
  if (sectionTargetsItems) return fields.filter((f) => !isSectionLevelField(f));

  // Use selector-based heuristic to determine item-level fields
  // If the field matches item selectors, include it even if its key is in sectionLevelKeys
  return fields.filter(
    (field) => !isSectionLevelField(field) && isLikelyItemField(field),
  );
}

function resolveModelValidationUrl({
  value,
  field,
  sourceSnapshot,
}: {
  value: EditableFieldValue;
  field: SchoolTemplateProjectFieldSnapshot;
  sourceSnapshot: SchoolTemplateSourceSnapshot;
}) {
  const resolved = resolveSchoolTemplateAsset(value, field, {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
    proxyCloudinaryRawModels: false,
  }).trim();

  if (!resolved) {
    return "";
  }

  const modelUrl = resolved;

  if (/^(https?:|blob:|data:)/i.test(modelUrl)) {
    return modelUrl;
  }

  if (modelUrl.startsWith("/")) {
    return new URL(modelUrl, window.location.origin).href;
  }

  try {
    const templateBaseUrl = new URL(
      getTemplateBaseHref(sourceSnapshot.previewPath),
      window.location.origin,
    );

    return new URL(modelUrl.replace(/^\.\//, ""), templateBaseUrl).href;
  } catch {
    return modelUrl;
  }
}

function getProbeResult(
  response: globalThis.Response,
): ModelValidationProbeResult {
  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get("content-type"),
  };
}

async function probeModelValidationUrl(
  url: string,
): Promise<ModelValidationProbeResult> {
  if (/^(blob:|data:)/i.test(url)) {
    return {
      ok: true,
      status: 200,
      contentType: null,
    };
  }

  const headResponse = await fetch(url, {
    method: "HEAD",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (headResponse.status !== 405 && headResponse.status !== 501) {
    return getProbeResult(headResponse);
  }

  const getResponse = await fetch(url, {
    method: "GET",
    headers: {
      Range: "bytes=0-0",
    },
    credentials: "same-origin",
    cache: "no-store",
  });
  await getResponse.body?.cancel();

  return getProbeResult(getResponse);
}

function getModelValidationErrorMessage({
  label,
  status,
  contentType,
}: {
  label: string;
  status: number;
  contentType: string | null;
}) {
  if (contentType?.toLowerCase().includes("text/html")) {
    return `${label} resolved to an HTML page instead of a .glb/.gltf file. Check the model URL or upload the model again.`;
  }

  if (status === 400) {
    return `${label} has an invalid Cloudinary model URL or public ID. Upload a valid .glb file and try preview again.`;
  }

  if (status === 401) {
    return `${label} could not be checked because your admin session was not authorized. Sign in again, then try preview.`;
  }

  if (status === 403) {
    return `${label} exists but is not accessible from preview. Check the Cloudinary file permissions or upload it again.`;
  }

  if (status === 404) {
    return `${label} was not found on Cloudinary. Upload the 3D model again or choose another file.`;
  }

  return `${label} could not be loaded for preview. Cloudinary returned ${status}.`;
}

function collectSectionModelValidationCandidates(
  section: SectionBinding,
  labelPrefix: string,
) {
  const candidates: ModelValidationCandidate[] = [];
  const repeatableItemFields = section.content.repeatable
    ? new Set(getRepeatableItemFields(section).map((field) => field.key))
    : new Set<string>();

  for (const field of section.snapshot?.fields ?? []) {
    if (field.type !== "model3d") {
      continue;
    }

    if (section.content.repeatable && repeatableItemFields.has(field.key)) {
      continue;
    }

    const value = getFieldDisplayValue(
      field,
      section.content.fields[field.key] ?? null,
    );

    if (!isFilledFieldValue(value)) {
      continue;
    }

    candidates.push({
      field,
      value: value as EditableFieldValue,
      label: `${labelPrefix} ${field.label}`,
    });
  }

  if (!section.content.repeatable) {
    return candidates;
  }

  const modelItemFields = getRepeatableItemFields(section).filter(
    (field) => field.type === "model3d",
  );

  for (const [itemIndex, item] of section.content.repeatable.items.entries()) {
    for (const field of modelItemFields) {
      const value = getFieldDisplayValue(field, item[field.key] ?? null);

      if (!isFilledFieldValue(value)) {
        continue;
      }

      candidates.push({
        field,
        value: value as EditableFieldValue,
        label: `${labelPrefix} item ${itemIndex + 1} ${field.label}`,
      });
    }
  }

  return candidates;
}

function getPreviewModelValidationCandidates({
  content,
  sourceSnapshot,
  pageSlug,
}: {
  content: SchoolTemplateProjectContent;
  sourceSnapshot: SchoolTemplateSourceSnapshot;
  pageSlug: string;
}) {
  const candidates: ModelValidationCandidate[] = [];

  for (const sectionContent of content.sharedSections) {
    candidates.push(
      ...collectSectionModelValidationCandidates(
        {
          content: sectionContent,
          scope: "shared",
          snapshot:
            sourceSnapshot.sharedSections.find(
              (section) => section.id === sectionContent.id,
            ) ?? null,
        },
        sectionContent.label,
      ),
    );
  }

  const page = content.pages.find((item) => item.slug === pageSlug);
  const pageSnapshot = sourceSnapshot.pages.find(
    (item) => item.slug === pageSlug,
  );

  for (const sectionContent of page?.sections ?? []) {
    candidates.push(
      ...collectSectionModelValidationCandidates(
        {
          content: sectionContent,
          scope: "page",
          pageSlug,
          snapshot:
            pageSnapshot?.sections.find(
              (section) => section.id === sectionContent.id,
            ) ?? null,
        },
        sectionContent.label,
      ),
    );
  }

  return candidates;
}

function FieldControl({
  field,
  value,
  originalValue,
  defaultFontFamily,
  onChange,
  onValidateModel,
  isValidatingModel = false,
  className,
}: {
  field: SchoolTemplateProjectFieldSnapshot;
  value: EditableFieldValue;
  originalValue?: EditableFieldValue;
  defaultFontFamily?: string;
  onChange: (value: EditableFieldValue) => void;
  onValidateModel?: (value: EditableFieldValue) => Promise<void> | void;
  isValidatingModel?: boolean;
  className?: string;
}) {
  const controlKind = getFieldControlKind(field);
  const displayValue = getFieldDisplayValue(field, value, originalValue);
  const displayStringValue = getStringValue(displayValue);
  const originalStringValue = getStringValue(originalValue);
  const shouldShowOriginalColor =
    controlKind === "color" &&
    originalStringValue.trim().length > 0 &&
    normalizeColorValue(originalStringValue) !==
      normalizeColorValue(displayStringValue);
  const commonInputClass = "";

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-bold text-charcoal">
        {field.label}
      </label>

      {controlKind === "richText" ? (
        <FormattedTextEditor
          label={field.label}
          hideLabel
          defaultFontFamily={defaultFontFamily}
          minHeight={240}
          placeholder={field.placeholder ?? ""}
          value={getStringValue(displayValue)}
          onChange={(nextValue) => onChange(nextValue)}
        />
      ) : controlKind === "textarea" ? (
        <Textarea
          rows={isIframeEmbedEditorField(field) ? 7 : 4}
          value={getStringValue(displayValue)}
          onChange={(event) => onChange(event.target.value)}
          className={cn("resize-none", commonInputClass)}
          placeholder={field.placeholder ?? ""}
        />
      ) : controlKind === "image" || controlKind === "model3d" ? (
        <div className="space-y-2">
          <MediaValueField
            label=""
            kind={controlKind === "model3d" ? "MODEL" : "IMAGE"}
            value={displayStringValue}
            optional
            onChange={(next) => {
              onChange(next);
              if (controlKind === "model3d" && next) {
                void onValidateModel?.(next);
              }
            }}
          />
          {controlKind === "model3d" &&
          displayStringValue &&
          onValidateModel ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void onValidateModel?.(displayStringValue)}
              disabled={isValidatingModel}
              className="w-full"
            >
              {isValidatingModel ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-1.5 h-4 w-4" />
              )}
              Test model in preview
            </Button>
          ) : null}
        </div>
      ) : controlKind === "color" ? (
        <div className="space-y-2">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-2">
            <div
              className="relative h-10 overflow-hidden rounded-md border border-black/[0.08] bg-white"
              style={{
                backgroundColor: displayStringValue || "#000000",
              }}
              title={displayStringValue || "#000000"}
            >
              <Input
                type="color"
                value={getColorPickerValue(displayStringValue)}
                onChange={(event) => onChange(event.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <Input
              value={displayStringValue}
              onChange={(event) => onChange(event.target.value)}
              className={commonInputClass}
              placeholder={getStringValue(field.defaultValue) || "#000000"}
            />
          </div>
          {shouldShowOriginalColor ? (
            <button
              type="button"
              onClick={() => onChange(originalStringValue)}
              className="flex w-full items-center gap-2 rounded-md border border-black/[0.08] bg-white px-2.5 py-2 text-left text-xs text-surface-muted transition-colors hover:border-royal/30 hover:text-charcoal"
            >
              <span
                className="h-4 w-4 shrink-0 rounded border border-black/15"
                style={{ backgroundColor: originalStringValue }}
              />
              <span className="truncate">
                Original color {originalStringValue}
              </span>
            </button>
          ) : null}
        </div>
      ) : controlKind === "number" ? (
        <div className="space-y-2">
          {field.min !== undefined && field.max !== undefined ? (
            <Input
              type="range"
              value={getNumberValue(displayValue)}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              onChange={(event) => onChange(Number(event.target.value))}
            />
          ) : null}
          <div className="relative">
            <Input
              type="number"
              value={getNumberValue(displayValue)}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              onChange={(event) => onChange(Number(event.target.value))}
              className={cn(commonInputClass, field.unit && "pr-10")}
            />
            {field.unit ? (
              <span className="text-surface-muted pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs">
                {field.unit}
              </span>
            ) : null}
          </div>
        </div>
      ) : controlKind === "select" ? (
        <select
          value={displayStringValue}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-9 rounded-md border px-3 text-sm outline-none transition-colors focus:border-brand",
            commonInputClass,
          )}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={getStringValue(displayValue)}
          onChange={(event) => onChange(event.target.value)}
          className={commonInputClass}
          placeholder={field.placeholder ?? ""}
        />
      )}
      {field.helpText ? (
        <p className="text-xs leading-5 text-surface-muted">{field.helpText}</p>
      ) : null}
    </div>
  );
}

export function SchoolWebsiteProjectEditor({
  projectId,
  applicationId,
  projectStatus,
  content,
  sourceSnapshot,
  updatedAt,
  lastExportedAt,
  exportZipUrl,
}: ProjectEditorWorkspaceProps) {
  const [draft, setDraft] = useState(content);
  const [selectedScope, setSelectedScope] = useState<SelectedScope>("page");
  const [selectedPageSlug, setSelectedPageSlug] = useState(
    content.pages.find((page) => page.isHome)?.slug ??
      content.pages[0]?.slug ??
      "",
  );
  const [selectedSectionId, setSelectedSectionId] = useState(
    content.pages.find((page) => page.isHome)?.sections[0]?.id ??
      content.pages[0]?.sections[0]?.id ??
      content.sharedSections[0]?.id ??
      "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPreviewLink, setIsGeneratingPreviewLink] = useState(false);
  const [generatedPreviewLink, setGeneratedPreviewLink] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(updatedAt);
  const [currentProjectStatus, setCurrentProjectStatus] =
    useState(projectStatus);
  const [currentExportZipUrl, setCurrentExportZipUrl] = useState(exportZipUrl);
  const [currentLastExportedAt, setCurrentLastExportedAt] =
    useState(lastExportedAt);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [validatingModelKey, setValidatingModelKey] = useState<string | null>(
    null,
  );
  const [copyImportUrl, setCopyImportUrl] = useState("");
  const [copySuggestions, setCopySuggestions] = useState<CopySuggestion[]>([]);
  const [copyImportMemory, setCopyImportMemory] = useState<
    Record<string, string[]>
  >({});
  const [isExtractingCopy, setIsExtractingCopy] = useState(false);
  const [componentHistory, setComponentHistory] = useState<
    Record<string, ComponentHistoryEntry>
  >({});
  const draftRef = useRef(draft);
  const originalDraftRef = useRef(content);
  const isDirtyRef = useRef(isDirty);
  const isSavingRef = useRef(isSaving);
  const dirtyVersionRef = useRef(0);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const selectedPage = useMemo(
    () =>
      draft.pages.find((page) => page.slug === selectedPageSlug) ??
      draft.pages[0],
    [draft.pages, selectedPageSlug],
  );

  const selectedPageSnapshot = useMemo(
    () =>
      sourceSnapshot.pages.find((page) => page.slug === selectedPage?.slug) ??
      sourceSnapshot.pages[0],
    [selectedPage?.slug, sourceSnapshot.pages],
  );
  const isDextaAcademy2Template = draft.templateSlug === DEXTA_ACADEMY_2_SLUG;
  const isDextaAcademy3Template = draft.templateSlug === DEXTA_ACADEMY_3_SLUG;
  const isDextaAcademy4Template = draft.templateSlug === DEXTA_ACADEMY_4_SLUG;
  const navbarFieldKeys = isDextaAcademy3Template
    ? DEXTA_ACADEMY_3_NAVBAR_FIELD_KEYS
    : isDextaAcademy2Template
      ? DEXTA_ACADEMY_2_NAVBAR_FIELD_KEYS
      : isDextaAcademy4Template
        ? DEXTA_ACADEMY_4_NAVBAR_FIELD_KEYS
        : null;
  const hasNavbarTab =
    isDextaAcademy2Template ||
    isDextaAcademy3Template ||
    isDextaAcademy4Template ||
    draft.templateSlug === DEXTA_ACADEMY_5_SLUG ||
    draft.templateSlug === DEXTA_ACADEMY_1_SLUG;
  const navbarSharedSectionId = isDextaAcademy4Template
    ? "header"
    : NAVBAR_SHARED_SECTION_ID;
  const visibleSharedSections = useMemo(
    () =>
      hasNavbarTab
        ? draft.sharedSections.filter((section) =>
            FOOTER_ONLY_SHARED_SECTION_IDS.has(section.id),
          )
        : draft.sharedSections,
    [draft.sharedSections, hasNavbarTab],
  );
  const sharedTabLabel = hasNavbarTab ? "Footer" : "Sitewide";
  const sharedScopeDescription = hasNavbarTab
    ? "Footer content and links"
    : "Shared sections";
  const navbarHeaderSection = useMemo(
    () =>
      draft.sharedSections.find(
        (section) => section.id === navbarSharedSectionId,
      ) ?? null,
    [draft.sharedSections, navbarSharedSectionId],
  );
  const navbarHeaderSnapshot = useMemo(
    () =>
      sourceSnapshot.sharedSections.find(
        (section) => section.id === navbarSharedSectionId,
      ) ?? null,
    [navbarSharedSectionId, sourceSnapshot.sharedSections],
  );
  const navbarButtonFieldGroups = useMemo(() => {
    if (!hasNavbarTab || !navbarHeaderSection || !navbarHeaderSnapshot) {
      return [];
    }

    const isTemplate5 = draft.templateSlug === DEXTA_ACADEMY_5_SLUG;
    const isTemplate1 = draft.templateSlug === DEXTA_ACADEMY_1_SLUG;
    const isTemplate4 = draft.templateSlug === DEXTA_ACADEMY_4_SLUG;
    const groups = new Map<string, SchoolTemplateProjectFieldSnapshot[]>();
    for (const field of navbarHeaderSnapshot.fields) {
      if (navbarFieldKeys && !navbarFieldKeys.has(field.key)) continue;
      // Template 5/1 shows all header fields except Section background.
      // Template 4 uses the normal navbar background controls instead.
      if (
        (isTemplate5 || isTemplate1 || isTemplate4) &&
        field.uiGroup === "Section background"
      )
        continue;

      const groupName = field.uiGroup ?? "Navbar buttons";
      groups.set(groupName, [...(groups.get(groupName) ?? []), field]);
    }

    return Array.from(groups.entries()).map(([name, fields]) => ({
      name,
      fields: fields.sort(
        (left, right) => (left.uiOrder ?? 0) - (right.uiOrder ?? 0),
      ),
    }));
  }, [
    draft.templateSlug,
    hasNavbarTab,
    navbarFieldKeys,
    navbarHeaderSection,
    navbarHeaderSnapshot,
  ]);

  const visiblePageSections = useMemo(() => {
    const pageSections = selectedPage?.sections ?? [];

    if (isDextaAcademy3Template && selectedPage?.slug === "contact") {
      return pageSections.filter(
        (section) => !DEXTA_ACADEMY_3_FOOTER_PAGE_SECTION_IDS.has(section.id),
      );
    }

    return pageSections;
  }, [isDextaAcademy3Template, selectedPage?.sections, selectedPage?.slug]);

  const sectionBindings = useMemo<SectionBinding[]>(() => {
    if (selectedScope === "navbar") {
      return [];
    }

    if (selectedScope === "shared") {
      return visibleSharedSections.map((section) => ({
        content: section,
        scope: "shared",
        snapshot:
          sourceSnapshot.sharedSections.find(
            (snapshotSection) => snapshotSection.id === section.id,
          ) ?? null,
      }));
    }

    return visiblePageSections.map((section) => ({
      content: section,
      scope: "page",
      pageSlug: selectedPage?.slug,
      snapshot:
        selectedPageSnapshot?.sections.find(
          (snapshotSection) => snapshotSection.id === section.id,
        ) ?? null,
    }));
  }, [
    selectedPageSnapshot?.sections,
    selectedScope,
    sourceSnapshot.sharedSections,
    visiblePageSections,
    visibleSharedSections,
  ]);

  const activeSection =
    sectionBindings.find(
      (section) => section.content.id === selectedSectionId,
    ) ??
    sectionBindings[0] ??
    null;
  const activeSectionHistoryKey = activeSection
    ? getSectionHistoryKey({
        scope: selectedScope,
        pageSlug: selectedPage?.slug ?? selectedPageSlug,
        sectionId: activeSection.content.id,
      })
    : null;
  const activeSectionHistory = activeSectionHistoryKey
    ? componentHistory[activeSectionHistoryKey]
    : null;
  const themeHistory = componentHistory[THEME_HISTORY_KEY];
  const canUndoActiveSection = Boolean(activeSectionHistory?.past.length);
  const canRedoActiveSection = Boolean(activeSectionHistory?.future.length);
  const canUndoTheme = Boolean(themeHistory?.past.length);
  const canRedoTheme = Boolean(themeHistory?.future.length);

  const previewHref = selectedPage
    ? getProjectPreviewHref(projectId, selectedPage.slug, previewKey)
    : sourceSnapshot.previewPath;
  const activePreviewMode =
    PREVIEW_MODES.find((mode) => mode.id === previewMode) ?? PREVIEW_MODES[0];
  const isPreviewValidatingModel =
    validatingModelKey === MODEL_VALIDATION_PREVIEW_KEY;
  const activeFieldGroups = useMemo(() => {
    const groups = new Map<string, SchoolTemplateProjectFieldSnapshot[]>();
    const mergeContactPageGroups =
      isDextaAcademy3Template && selectedPage?.slug === "contact";
    const repeatableItemFields = activeSection
      ? new Set(
          getRepeatableItemFields(activeSection).map((field) => field.key),
        )
      : new Set<string>();

    for (const field of activeSection?.snapshot?.fields ?? []) {
      if (isHiddenEditorField(draft.templateSlug, field)) {
        continue;
      }

      if (
        activeSection?.content.repeatable &&
        repeatableItemFields.has(field.key)
      ) {
        continue;
      }

      const groupName = mergeContactPageGroups
        ? "Contact page"
        : (field.uiGroup ?? "Content");
      groups.set(groupName, [...(groups.get(groupName) ?? []), field]);
    }

    return Array.from(groups.entries()).map(([name, fields]) => ({
      name,
      fields: fields.sort(
        (left, right) => (left.uiOrder ?? 0) - (right.uiOrder ?? 0),
      ),
    }));
  }, [
    activeSection?.snapshot?.fields,
    draft.templateSlug,
    isDextaAcademy3Template,
    selectedPage?.slug,
  ]);
  const activeRepeatableItemFields = activeSection
    ? getRepeatableItemFields(activeSection)
    : [];
  const hasActiveRepeatableFields = activeRepeatableItemFields.length > 0;
  const canDeleteActiveRepeatableItems =
    draft.templateSlug === DEXTA_ACADEMY_1_SLUG &&
    ((selectedPage?.slug === "home" &&
      activeSection?.content.id === "testimonials") ||
      (selectedPage?.slug === "about" &&
        activeSection?.content.id === "values") ||
      (selectedPage?.slug === "testimonials" &&
        activeSection?.content.id === "testimonial-wall"));
  const activeImportTargets = useMemo<CopyImportTarget[]>(() => {
    if (!activeSection) return [];

    const isImportableField = (field: SchoolTemplateProjectFieldSnapshot) =>
      ["text", "textarea", "richText"].includes(field.type) &&
      !isProtectedCopyImportField(field) &&
      !/label|category/.test(`${field.key} ${field.label}`.toLowerCase());

    const sectionTargets = activeFieldGroups
      .flatMap((group) => group.fields)
      .filter(isImportableField)
      .map((field) => ({
        requestKey: field.key,
        field,
        label: field.label,
        currentValue: activeSection.content.fields[field.key] ?? null,
      }));

    const repeatableFields = activeSection.content.repeatable
      ? getRepeatableItemFields(activeSection).filter(isImportableField)
      : [];
    const repeatableTargets =
      activeSection.content.repeatable?.items.flatMap((item, itemIndex) =>
        repeatableFields.map((field) => ({
          requestKey: `repeatable:${itemIndex}:${field.key}`,
          field,
          label: `${
            activeSection.snapshot?.repeatable?.labelSingular ?? "Item"
          } ${itemIndex + 1} ${field.label}`,
          currentValue: item[field.key] ?? null,
          itemIndex,
          itemFieldKey: field.key,
        })),
      ) ?? [];

    return [...sectionTargets, ...repeatableTargets];
  }, [activeFieldGroups, activeSection]);
  const getOriginalSectionFieldValue = (
    sectionId: string,
    field: SchoolTemplateProjectFieldSnapshot,
  ) =>
    getDraftSection({
      draft: originalDraftRef.current,
      scope: selectedScope,
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      sectionId,
    })?.fields[field.key] ??
    field.defaultValue ??
    null;
  const getOriginalRepeatableItemFieldValue = (
    sectionId: string,
    itemIndex: number,
    field: SchoolTemplateProjectFieldSnapshot,
  ) =>
    getDraftSection({
      draft: originalDraftRef.current,
      scope: selectedScope,
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      sectionId,
    })?.repeatable?.items[itemIndex]?.[field.key] ??
    field.defaultValue ??
    null;
  const getOriginalThemeColorValue = (
    key: keyof SchoolTemplateProjectContent["theme"],
  ) =>
    getOriginalThemeColor(
      draft.templateSlug,
      key,
      originalDraftRef.current.theme[key],
    );
  const getOriginalSharedSectionFieldValue = (
    sectionId: string,
    field: SchoolTemplateProjectFieldSnapshot,
  ) =>
    originalDraftRef.current.sharedSections.find(
      (section) => section.id === sectionId,
    )?.fields[field.key] ??
    field.defaultValue ??
    null;

  useEffect(() => {
    setCopySuggestions([]);
    setCopyImportUrl("");
  }, [activeSectionHistoryKey, selectedScope]);

  const selectPage = (page: SchoolTemplateProjectPageContent) => {
    setSelectedScope("page");
    setSelectedPageSlug(page.slug);
    setSelectedSectionId(page.sections[0]?.id ?? "");
  };

  const selectNavbar = () => {
    setSelectedScope("navbar");
    setSelectedSectionId("");
  };

  const selectSharedSections = () => {
    setSelectedScope("shared");
    setSelectedSectionId(visibleSharedSections[0]?.id ?? "");
  };

  const updateDraft = (updater: DraftUpdater) => {
    const nextDraft =
      typeof updater === "function" ? updater(draftRef.current) : updater;

    dirtyVersionRef.current += 1;
    draftRef.current = nextDraft;
    isDirtyRef.current = true;
    setDraft(nextDraft);
    setIsDirty(true);
  };

  const recordComponentHistory = (
    historyKey: string,
    snapshot: ComponentHistorySnapshot,
  ) => {
    setComponentHistory((currentHistory) => {
      const currentEntry = currentHistory[historyKey] ?? {
        past: [],
        future: [],
      };

      return {
        ...currentHistory,
        [historyKey]: {
          past: [
            ...currentEntry.past.slice(
              Math.max(
                currentEntry.past.length - COMPONENT_HISTORY_LIMIT + 1,
                0,
              ),
            ),
            cloneEditorValue(snapshot),
          ],
          future: [],
        },
      };
    });
  };

  const recordSectionHistory = (sectionId: string) => {
    const pageSlug = selectedPage?.slug ?? selectedPageSlug;
    const section = getDraftSection({
      draft: draftRef.current,
      scope: selectedScope,
      pageSlug,
      sectionId,
    });

    if (!section) return;

    recordComponentHistory(
      getSectionHistoryKey({
        scope: selectedScope,
        pageSlug,
        sectionId,
      }),
      section,
    );
  };

  const recordSharedSectionHistory = (sectionId: string) => {
    const section = draftRef.current.sharedSections.find(
      (candidate) => candidate.id === sectionId,
    );

    if (!section) return;

    recordComponentHistory(
      getSectionHistoryKey({
        scope: "shared",
        pageSlug: selectedPage?.slug ?? selectedPageSlug,
        sectionId,
      }),
      section,
    );
  };

  const undoSectionChange = () => {
    if (!activeSection || !activeSectionHistoryKey || !activeSectionHistory) {
      return;
    }

    const previousSection = activeSectionHistory.past.at(-1);
    const currentSection = getDraftSection({
      draft: draftRef.current,
      scope: selectedScope,
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      sectionId: activeSection.content.id,
    });

    if (!previousSection || !currentSection) return;

    setComponentHistory((currentHistory) => {
      const currentEntry = currentHistory[activeSectionHistoryKey] ?? {
        past: [],
        future: [],
      };

      return {
        ...currentHistory,
        [activeSectionHistoryKey]: {
          past: currentEntry.past.slice(0, -1),
          future: [cloneEditorValue(currentSection), ...currentEntry.future],
        },
      };
    });
    updateDraft((currentDraft) =>
      replaceDraftSection({
        draft: currentDraft,
        scope: selectedScope,
        pageSlug: selectedPage?.slug ?? selectedPageSlug,
        section: cloneEditorValue(
          previousSection as SchoolTemplateProjectSectionContent,
        ),
      }),
    );
  };

  const redoSectionChange = () => {
    if (!activeSection || !activeSectionHistoryKey || !activeSectionHistory) {
      return;
    }

    const nextSection = activeSectionHistory.future[0];
    const currentSection = getDraftSection({
      draft: draftRef.current,
      scope: selectedScope,
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      sectionId: activeSection.content.id,
    });

    if (!nextSection || !currentSection) return;

    setComponentHistory((currentHistory) => {
      const currentEntry = currentHistory[activeSectionHistoryKey] ?? {
        past: [],
        future: [],
      };

      return {
        ...currentHistory,
        [activeSectionHistoryKey]: {
          past: [
            ...currentEntry.past.slice(
              Math.max(
                currentEntry.past.length - COMPONENT_HISTORY_LIMIT + 1,
                0,
              ),
            ),
            cloneEditorValue(currentSection),
          ],
          future: currentEntry.future.slice(1),
        },
      };
    });
    updateDraft((currentDraft) =>
      replaceDraftSection({
        draft: currentDraft,
        scope: selectedScope,
        pageSlug: selectedPage?.slug ?? selectedPageSlug,
        section: cloneEditorValue(
          nextSection as SchoolTemplateProjectSectionContent,
        ),
      }),
    );
  };

  const undoThemeChange = () => {
    const previousTheme = themeHistory?.past.at(-1);
    if (!previousTheme) return;

    const currentTheme = draftRef.current.theme;
    setComponentHistory((currentHistory) => {
      const currentEntry = currentHistory[THEME_HISTORY_KEY] ?? {
        past: [],
        future: [],
      };

      return {
        ...currentHistory,
        [THEME_HISTORY_KEY]: {
          past: currentEntry.past.slice(0, -1),
          future: [cloneEditorValue(currentTheme), ...currentEntry.future],
        },
      };
    });
    updateDraft((currentDraft) => ({
      ...currentDraft,
      theme: cloneEditorValue(
        previousTheme as SchoolTemplateProjectContent["theme"],
      ),
    }));
  };

  const redoThemeChange = () => {
    const nextTheme = themeHistory?.future[0];
    if (!nextTheme) return;

    const currentTheme = draftRef.current.theme;
    setComponentHistory((currentHistory) => {
      const currentEntry = currentHistory[THEME_HISTORY_KEY] ?? {
        past: [],
        future: [],
      };

      return {
        ...currentHistory,
        [THEME_HISTORY_KEY]: {
          past: [
            ...currentEntry.past.slice(
              Math.max(
                currentEntry.past.length - COMPONENT_HISTORY_LIMIT + 1,
                0,
              ),
            ),
            cloneEditorValue(currentTheme),
          ],
          future: currentEntry.future.slice(1),
        },
      };
    });
    updateDraft((currentDraft) => ({
      ...currentDraft,
      theme: cloneEditorValue(
        nextTheme as SchoolTemplateProjectContent["theme"],
      ),
    }));
  };

  const updateSectionFields = (
    sectionId: string,
    values: Record<string, EditableFieldValue>,
    { saveHistory = true }: { saveHistory?: boolean } = {},
  ) => {
    const currentSection = getDraftSection({
      draft: draftRef.current,
      scope: selectedScope,
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      sectionId,
    });

    if (
      !currentSection ||
      Object.entries(values).every(
        ([fieldKey, value]) => currentSection.fields[fieldKey] === value,
      )
    ) {
      return;
    }

    if (saveHistory) {
      recordSectionHistory(sectionId);
    }

    if (selectedScope === "shared") {
      updateDraft((currentDraft) => ({
        ...currentDraft,
        sharedSections: currentDraft.sharedSections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                fields: {
                  ...section.fields,
                  ...values,
                },
              }
            : section,
        ),
      }));
      return;
    }

    updateDraft((currentDraft) => ({
      ...currentDraft,
      pages: currentDraft.pages.map((page) =>
        page.slug === selectedPageSlug
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      fields: {
                        ...section.fields,
                        ...values,
                      },
                    }
                  : section,
              ),
            }
          : page,
      ),
    }));
  };

  const updateSectionField = (
    sectionId: string,
    fieldKey: string,
    value: string | number | boolean | null,
  ) => {
    const storyPreviewUpdate = buildStoryPreviewUpdate({
      draft: draftRef.current,
      sectionId,
      fieldKey,
      value,
    });

    if (storyPreviewUpdate) {
      const currentSection = getDraftSection({
        draft: draftRef.current,
        scope: selectedScope,
        pageSlug: selectedPage?.slug ?? selectedPageSlug,
        sectionId,
      });
      const sourceChanged = currentSection?.fields[fieldKey] !== value;
      const previewChanged = storyPreviewUpdateHasChanges(
        draftRef.current,
        storyPreviewUpdate,
      );

      if (!sourceChanged && !previewChanged) {
        return;
      }

      recordSectionHistory(sectionId);
      if (previewChanged && storyPreviewUpdate.sectionId !== sectionId) {
        recordSectionHistory(storyPreviewUpdate.sectionId);
      }

      updateDraft((currentDraft) => {
        const draftWithSourceValue =
          selectedScope === "shared"
            ? {
                ...currentDraft,
                sharedSections: currentDraft.sharedSections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        fields: {
                          ...section.fields,
                          [fieldKey]: value,
                        },
                      }
                    : section,
                ),
              }
            : {
                ...currentDraft,
                pages: currentDraft.pages.map((page) =>
                  page.slug === selectedPageSlug
                    ? {
                        ...page,
                        sections: page.sections.map((section) =>
                          section.id === sectionId
                            ? {
                                ...section,
                                fields: {
                                  ...section.fields,
                                  [fieldKey]: value,
                                },
                              }
                            : section,
                        ),
                      }
                    : page,
                ),
              };

        return applyStoryPreviewUpdate(
          draftWithSourceValue,
          storyPreviewUpdate,
        );
      });
      return;
    }

    updateSectionFields(sectionId, { [fieldKey]: value });
  };

  const updateSharedSectionField = (
    sectionId: string,
    fieldKey: string,
    value: string | number | boolean | null,
  ) => {
    const currentSection = draftRef.current.sharedSections.find(
      (section) => section.id === sectionId,
    );

    if (!currentSection || currentSection.fields[fieldKey] === value) {
      return;
    }

    recordSharedSectionHistory(sectionId);
    updateDraft((currentDraft) => ({
      ...currentDraft,
      sharedSections: currentDraft.sharedSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: {
                ...section.fields,
                [fieldKey]: value,
              },
            }
          : section,
      ),
    }));
  };

  const updateRepeatableItemField = (
    sectionId: string,
    itemIndex: number,
    fieldKey: string,
    value: string | number | boolean | null,
    { saveHistory = true }: { saveHistory?: boolean } = {},
  ) => {
    const currentSection = getDraftSection({
      draft: draftRef.current,
      scope: selectedScope,
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      sectionId,
    });

    if (currentSection?.repeatable?.items[itemIndex]?.[fieldKey] === value) {
      return;
    }

    if (saveHistory) {
      recordSectionHistory(sectionId);
    }

    const updateSection = (
      section: SchoolTemplateProjectSectionContent,
    ): SchoolTemplateProjectSectionContent => {
      if (section.id !== sectionId) return section;

      const items = [...(section.repeatable?.items ?? [])];
      while (items.length <= itemIndex) {
        items.push({});
      }
      items[itemIndex] = {
        ...items[itemIndex],
        [fieldKey]: value,
      };

      return {
        ...section,
        repeatable: {
          items,
        },
      };
    };

    if (selectedScope === "shared") {
      updateDraft((currentDraft) => ({
        ...currentDraft,
        sharedSections: currentDraft.sharedSections.map(updateSection),
      }));
      return;
    }

    updateDraft((currentDraft) => ({
      ...currentDraft,
      pages: currentDraft.pages.map((page) =>
        page.slug === selectedPageSlug
          ? {
              ...page,
              sections: page.sections.map(updateSection),
            }
          : page,
      ),
    }));
  };

  const addRepeatableItem = (sectionId: string) => {
    recordSectionHistory(sectionId);

    const createRepeatableItem = (
      section: SchoolTemplateProjectSectionContent,
    ): Record<string, EditableFieldValue> => {
      if (
        draftRef.current.templateSlug === DEXTA_ACADEMY_1_SLUG &&
        selectedPage?.slug === "about" &&
        section.id === "values"
      ) {
        return {
          valueTitle: "New core value",
          valueBody: "Describe this core value.",
          iconClass: "fa fa-star",
        };
      }

      return {};
    };

    const updateSection = (
      section: SchoolTemplateProjectSectionContent,
    ): SchoolTemplateProjectSectionContent =>
      section.id === sectionId
        ? {
            ...section,
            repeatable: {
              items: [
                ...(section.repeatable?.items ?? []),
                createRepeatableItem(section),
              ],
            },
          }
        : section;

    if (selectedScope === "shared") {
      updateDraft((currentDraft) => ({
        ...currentDraft,
        sharedSections: currentDraft.sharedSections.map(updateSection),
      }));
      return;
    }

    updateDraft((currentDraft) => ({
      ...currentDraft,
      pages: currentDraft.pages.map((page) =>
        page.slug === selectedPageSlug
          ? {
              ...page,
              sections: page.sections.map(updateSection),
            }
          : page,
      ),
    }));
  };

  const removeRepeatableItem = (sectionId: string, itemIndex: number) => {
    const currentSection = getDraftSection({
      draft: draftRef.current,
      scope: selectedScope,
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      sectionId,
    });

    if (!currentSection?.repeatable?.items[itemIndex]) {
      return;
    }

    recordSectionHistory(sectionId);

    const updateSection = (
      section: SchoolTemplateProjectSectionContent,
    ): SchoolTemplateProjectSectionContent =>
      section.id === sectionId
        ? {
            ...section,
            repeatable: {
              items: (section.repeatable?.items ?? []).filter(
                (_item, index) => index !== itemIndex,
              ),
            },
          }
        : section;

    if (selectedScope === "shared") {
      updateDraft((currentDraft) => ({
        ...currentDraft,
        sharedSections: currentDraft.sharedSections.map(updateSection),
      }));
      return;
    }

    updateDraft((currentDraft) => ({
      ...currentDraft,
      pages: currentDraft.pages.map((page) =>
        page.slug === selectedPageSlug
          ? {
              ...page,
              sections: page.sections.map(updateSection),
            }
          : page,
      ),
    }));
  };

  const updateTheme = <Key extends keyof SchoolTemplateProjectContent["theme"]>(
    key: Key,
    value: SchoolTemplateProjectContent["theme"][Key],
  ) => {
    if (draftRef.current.theme[key] === value) {
      return;
    }

    recordComponentHistory(THEME_HISTORY_KEY, draftRef.current.theme);

    updateDraft((currentDraft) => ({
      ...currentDraft,
      theme: {
        ...currentDraft.theme,
        [key]: value,
      },
    }));
  };

  const saveDraft = useCallback(
    async ({
      createRevision = true,
      note,
      showToast = true,
      autosave = false,
    }: SaveDraftOptions = {}) => {
      if (isSavingRef.current) {
        return false;
      }

      const versionAtSaveStart = dirtyVersionRef.current;
      const contentToSave = ensureDextaAcademy4HomeAboutPreviewStats(
        draftRef.current,
      );
      if (contentToSave !== draftRef.current) {
        draftRef.current = contentToSave;
        setDraft(contentToSave);
      }

      isSavingRef.current = true;
      if (autosave) {
        setAutosaveStatus("saving");
      }
      setIsSaving(true);

      let result: Awaited<ReturnType<typeof saveSchoolWebsiteProjectDraft>>;
      try {
        result = await saveSchoolWebsiteProjectDraft(projectId, contentToSave, {
          createRevision,
          note,
          applicationId,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to save project draft.";
        if (autosave) {
          setAutosaveStatus("error");
        }
        if (showToast) {
          toast.error(message);
        }
        return false;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }

      if (!result.success) {
        if (autosave) {
          setAutosaveStatus("error");
        }
        if (showToast) {
          toast.error(result.message);
        }
        return false;
      }

      if (dirtyVersionRef.current === versionAtSaveStart) {
        isDirtyRef.current = false;
        setIsDirty(false);
      }
      if (result.updatedAt) {
        setLastSavedAt(result.updatedAt);
      }
      if (autosave) {
        setAutosaveStatus("saved");
      }
      if (showToast) {
        toast.success(result.message);
      }
      return true;
    },
    [applicationId, projectId],
  );

  const validateModelCandidate = useCallback(
    async (
      candidate: ModelValidationCandidate,
      { showSuccess = false }: { showSuccess?: boolean } = {},
    ) => {
      const validationUrl = resolveModelValidationUrl({
        value: candidate.value,
        field: candidate.field,
        sourceSnapshot,
      });

      if (!validationUrl) {
        toast.error(`${candidate.label} does not have a model file selected.`);
        return false;
      }

      let result: ModelValidationProbeResult;
      try {
        result = await probeModelValidationUrl(validationUrl);
      } catch {
        toast.error(
          `${candidate.label} could not be reached from preview. Check the upload, then try again.`,
        );
        return false;
      }

      if (!result.ok) {
        toast.error(
          getModelValidationErrorMessage({
            label: candidate.label,
            status: result.status,
            contentType: result.contentType,
          }),
        );
        return false;
      }

      if (result.contentType?.toLowerCase().includes("text/html")) {
        toast.error(
          getModelValidationErrorMessage({
            label: candidate.label,
            status: result.status,
            contentType: result.contentType,
          }),
        );
        return false;
      }

      if (showSuccess) {
        toast.success(`${candidate.label} is ready for preview.`);
      }

      return true;
    },
    [sourceSnapshot],
  );

  const validatePreviewModelFields = useCallback(
    async ({ showSuccess = false }: { showSuccess?: boolean } = {}) => {
      const candidates = getPreviewModelValidationCandidates({
        content: draftRef.current,
        sourceSnapshot,
        pageSlug: selectedPage?.slug ?? selectedPageSlug,
      });

      if (!candidates.length) {
        return true;
      }

      setValidatingModelKey(MODEL_VALIDATION_PREVIEW_KEY);

      try {
        for (const candidate of candidates) {
          const isValid = await validateModelCandidate(candidate);
          if (!isValid) {
            return false;
          }
        }

        if (showSuccess) {
          toast.success(
            candidates.length === 1
              ? "3D model is ready for preview."
              : "3D models are ready for preview.",
          );
        }

        return true;
      } finally {
        setValidatingModelKey(null);
      }
    },
    [
      selectedPage?.slug,
      selectedPageSlug,
      sourceSnapshot,
      validateModelCandidate,
    ],
  );

  const validateActiveModelField = useCallback(
    async (
      field: SchoolTemplateProjectFieldSnapshot,
      value: EditableFieldValue,
      validationKey: string,
      label: string,
    ) => {
      if (!isFilledFieldValue(value)) {
        return;
      }

      setValidatingModelKey(validationKey);

      try {
        await validateModelCandidate(
          {
            field,
            value,
            label,
          },
          { showSuccess: true },
        );
      } finally {
        setValidatingModelKey(null);
      }
    },
    [validateModelCandidate],
  );

  const saveDraftAndValidatePreviewModels = async () => {
    const saved = await saveDraft({
      createRevision: true,
      note: "Manual draft save.",
      showToast: true,
    });

    if (saved) {
      await validatePreviewModelFields();
    }
  };

  useEffect(() => {
    const autosaveInterval = window.setInterval(() => {
      if (!isDirtyRef.current || isSavingRef.current) {
        return;
      }

      void saveDraft({
        createRevision: false,
        note: "Autosaved draft.",
        showToast: false,
        autosave: true,
      });
    }, 25_000);

    return () => window.clearInterval(autosaveInterval);
  }, [saveDraft]);

  const refreshPreview = async () => {
    if (isDirty) {
      const saved = await saveDraft({
        createRevision: false,
        note: "Saved before preview refresh.",
        showToast: false,
      });
      if (!saved) return;
    }

    const modelsReady = await validatePreviewModelFields();
    if (!modelsReady) {
      return;
    }

    setPreviewKey((current) => current + 1);
    setIsPreviewOpen(true);
  };

  const generatePreviewLink = async () => {
    if (isGeneratingPreviewLink) {
      return;
    }

    setIsGeneratingPreviewLink(true);

    try {
      if (isDirtyRef.current) {
        const saved = await saveDraft({
          createRevision: false,
          note: "Saved before generating preview link.",
          showToast: false,
        });

        if (!saved) {
          return;
        }
      }

      const pageSlug =
        selectedPage?.slug ??
        draftRef.current.pages.find((page) => page.isHome)?.slug ??
        draftRef.current.pages[0]?.slug ??
        "home";
      const result = await generateSchoolWebsiteProjectPreviewLink({
        projectId,
        applicationId,
        pageSlug,
      });

      if (!result.success || !result.previewHref) {
        toast.error(result.message);
        return;
      }

      const absoluteHref = getAbsoluteHref(result.previewHref);
      setGeneratedPreviewLink(absoluteHref);

      try {
        await navigator.clipboard.writeText(absoluteHref);
        toast.success(
          "Preview link copied. It will show the latest saved draft.",
        );
      } catch {
        toast.success("Preview link generated.");
      }
    } finally {
      setIsGeneratingPreviewLink(false);
    }
  };

  const exportZip = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      if (isDirtyRef.current) {
        const saved = await saveDraft({
          createRevision: true,
          note: "Saved before export.",
          showToast: false,
        });

        if (!saved) {
          return;
        }
      }

      const result = await exportSchoolWebsiteProject(projectId, applicationId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      if (result.exportZipUrl) {
        setCurrentExportZipUrl(result.exportZipUrl);
      }
      if (result.lastExportedAt) {
        setCurrentLastExportedAt(result.lastExportedAt);
      }
      if (result.status) {
        setCurrentProjectStatus(result.status);
      }

      toast.success(result.message);
    } finally {
      setIsExporting(false);
    }
  };

  const extractCopySuggestions = async () => {
    if (!activeSection || !activeImportTargets.length) {
      toast.error("Select a component with editable text fields first.");
      return;
    }

    const copyMemoryKey = getCopyImportMemoryKey({
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      url: copyImportUrl,
    });

    setIsExtractingCopy(true);

    try {
      const result = await extractSchoolWebsiteCopySuggestions({
        url: copyImportUrl,
        sectionLabel: activeSection.content.label,
        excludedTexts: copyImportMemory[copyMemoryKey] ?? [],
        fields: activeImportTargets.map((target) => ({
          key: target.requestKey,
          label: target.label,
          type: target.field.type,
          currentValue: target.currentValue ?? "",
        })),
      });

      if (!result.success || !result.suggestions?.length) {
        toast.error(result.message);
        return;
      }

      const nextSuggestions = result.suggestions.map((suggestion) => {
        const target = activeImportTargets.find(
          (item) => item.requestKey === suggestion.fieldKey,
        );

        return {
          ...suggestion,
          label: target?.label ?? suggestion.label,
          previousValue: target?.currentValue ?? null,
          itemIndex: target?.itemIndex,
          itemFieldKey: target?.itemFieldKey,
        };
      });
      updateSectionFields(
        activeSection.content.id,
        Object.fromEntries(
          nextSuggestions
            .filter((suggestion) => suggestion.itemIndex === undefined)
            .map((suggestion) => [suggestion.fieldKey, suggestion.value]),
        ),
      );
      nextSuggestions
        .filter(
          (
            suggestion,
          ): suggestion is CopySuggestion & {
            itemIndex: number;
            itemFieldKey: string;
          } =>
            suggestion.itemIndex !== undefined &&
            suggestion.itemFieldKey !== undefined,
        )
        .forEach((suggestion) => {
          updateRepeatableItemField(
            activeSection.content.id,
            suggestion.itemIndex,
            suggestion.itemFieldKey,
            suggestion.value,
            { saveHistory: false },
          );
        });
      setCopySuggestions(nextSuggestions);
      setCopyImportMemory((currentMemory) => ({
        ...currentMemory,
        [copyMemoryKey]: Array.from(
          new Set([
            ...(currentMemory[copyMemoryKey] ?? []),
            ...nextSuggestions.map((suggestion) => suggestion.value),
          ]),
        ),
      }));
      toast.success(result.message);
    } finally {
      setIsExtractingCopy(false);
    }
  };

  const updateCopySuggestion = (fieldKey: string, value: string) => {
    const suggestion = copySuggestions.find(
      (currentSuggestion) => currentSuggestion.fieldKey === fieldKey,
    );

    if (
      activeSection &&
      suggestion?.itemIndex !== undefined &&
      suggestion.itemFieldKey
    ) {
      updateRepeatableItemField(
        activeSection.content.id,
        suggestion.itemIndex,
        suggestion.itemFieldKey,
        value,
        { saveHistory: false },
      );
    } else if (activeSection) {
      updateSectionFields(
        activeSection.content.id,
        { [fieldKey]: value },
        { saveHistory: false },
      );
    }

    setCopySuggestions((currentSuggestions) =>
      currentSuggestions.map((suggestion) =>
        suggestion.fieldKey === fieldKey
          ? { ...suggestion, value }
          : suggestion,
      ),
    );

    const copyMemoryKey = getCopyImportMemoryKey({
      pageSlug: selectedPage?.slug ?? selectedPageSlug,
      url: copyImportUrl,
    });
    setCopyImportMemory((currentMemory) => ({
      ...currentMemory,
      [copyMemoryKey]: Array.from(
        new Set([...(currentMemory[copyMemoryKey] ?? []), value]),
      ),
    }));
  };

  const declineCopySuggestion = (fieldKey: string) => {
    const suggestion = copySuggestions.find(
      (currentSuggestion) => currentSuggestion.fieldKey === fieldKey,
    );
    if (
      activeSection &&
      suggestion?.itemIndex !== undefined &&
      suggestion.itemFieldKey
    ) {
      updateRepeatableItemField(
        activeSection.content.id,
        suggestion.itemIndex,
        suggestion.itemFieldKey,
        suggestion.previousValue,
        { saveHistory: false },
      );
    } else if (activeSection && suggestion) {
      updateSectionFields(
        activeSection.content.id,
        { [fieldKey]: suggestion.previousValue },
        { saveHistory: false },
      );
    }

    setCopySuggestions((currentSuggestions) =>
      currentSuggestions.filter(
        (suggestion) => suggestion.fieldKey !== fieldKey,
      ),
    );
  };

  const approveCopySuggestion = (fieldKey: string) => {
    setCopySuggestions((currentSuggestions) =>
      currentSuggestions.filter(
        (suggestion) => suggestion.fieldKey !== fieldKey,
      ),
    );
  };

  return (
    <div className="min-h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border border-black/[0.08] bg-canvas">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.08] bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-ice text-royal">
            {STATUS_LABEL[currentProjectStatus] ?? currentProjectStatus}
          </Badge>
          {isDirty ? (
            <Badge variant="outline" className="bg-gold-soft text-gold-deep">
              Unsaved
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-mint-soft text-mint-deep">
              Saved
            </Badge>
          )}
          <span className="text-xs text-surface-muted">
            Last saved {formatDate(lastSavedAt)}
          </span>
          {autosaveStatus !== "idle" ? (
            <span className="text-xs text-surface-muted">
              {autosaveStatus === "saving"
                ? "Autosaving"
                : autosaveStatus === "saved"
                  ? "Autosaved"
                  : "Autosave failed"}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => void saveDraftAndValidatePreviewModels()}
            disabled={isSaving || isExporting}
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save draft
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshPreview()}
            disabled={
              isSaving ||
              isExporting ||
              isGeneratingPreviewLink ||
              isPreviewValidatingModel
            }
          >
            {isPreviewValidatingModel ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-1.5 h-4 w-4" />
            )}
            {isPreviewValidatingModel ? "Checking" : "Preview"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void generatePreviewLink()}
            disabled={isSaving || isExporting || isGeneratingPreviewLink}
          >
            {isGeneratingPreviewLink ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-1.5 h-4 w-4" />
            )}
            {isGeneratingPreviewLink ? "Generating" : "Get a share link"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void exportZip()}
            disabled={isSaving || isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-1.5 h-4 w-4" />
            )}
            Export zip
          </Button>
          {currentExportZipUrl ? (
            <Button asChild type="button" variant="outline">
              <a href={currentExportZipUrl} target="_blank" rel="noreferrer">
                <Download className="mr-1.5 h-4 w-4" />
                Download zip
              </a>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              <Download className="mr-1.5 h-4 w-4" />
              Download zip
            </Button>
          )}
          {generatedPreviewLink ? (
            <Button asChild type="button" variant="outline">
              <a href={generatedPreviewLink} target="_blank" rel="noreferrer">
                <Eye className="mr-1.5 h-4 w-4" />
                Open share link
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-15rem)] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-black/[0.08] bg-white p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
            <FileText className="h-3.5 w-3.5" />
            Pages
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={selectNavbar}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                selectedScope === "navbar"
                  ? "bg-ice font-bold text-royal"
                  : "text-charcoal hover:bg-charcoal/[0.05]",
              )}
            >
              <span className="truncate">Navbar</span>
              <span className="text-[11px] text-surface-muted">Identity</span>
            </button>

            {draft.pages.map((page) => (
              <button
                key={page.slug}
                type="button"
                onClick={() => selectPage(page)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  selectedScope === "page" && selectedPage?.slug === page.slug
                    ? "bg-ice font-bold text-royal"
                    : "text-charcoal hover:bg-charcoal/[0.05]",
                )}
              >
                <span className="truncate">{page.title}</span>
                <span className="text-[11px] text-surface-muted">
                  {isDextaAcademy3Template && page.slug === "contact"
                    ? page.sections.filter(
                        (section) =>
                          !DEXTA_ACADEMY_3_FOOTER_PAGE_SECTION_IDS.has(
                            section.id,
                          ),
                      ).length
                    : page.sections.length}
                </span>
              </button>
            ))}

            {visibleSharedSections.length ? (
              <button
                type="button"
                onClick={selectSharedSections}
                className={cn(
                  "mt-3 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  selectedScope === "shared"
                    ? "bg-ice font-bold text-royal"
                    : "text-charcoal hover:bg-charcoal/[0.05]",
                )}
              >
                <span className="truncate">{sharedTabLabel}</span>
                <span className="text-[11px] text-surface-muted">
                  {visibleSharedSections.length}
                </span>
              </button>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border border-black/[0.08] bg-white p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                <Palette className="h-3.5 w-3.5" />
                Theme
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={undoThemeChange}
                  disabled={!canUndoTheme}
                  className="h-8 border-black/[0.08] px-2 text-surface-muted hover:bg-charcoal/[0.05] hover:text-charcoal"
                  title="Restore last theme change"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={redoThemeChange}
                  disabled={!canRedoTheme}
                  className="h-8 border-black/[0.08] px-2 text-surface-muted hover:bg-charcoal/[0.05] hover:text-charcoal"
                  title="Redo last theme change"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <FieldControl
                field={{
                  key: "primaryColor",
                  label: "Primary",
                  type: "color",
                  selector: ":root",
                  target: "cssVariable",
                }}
                value={draft.theme.primaryColor}
                originalValue={getOriginalThemeColorValue("primaryColor")}
                onChange={(value) =>
                  updateTheme("primaryColor", getStringValue(value))
                }
              />
              <FieldControl
                field={{
                  key: "secondaryColor",
                  label: "Secondary",
                  type: "color",
                  selector: ":root",
                  target: "cssVariable",
                }}
                value={draft.theme.secondaryColor}
                originalValue={getOriginalThemeColorValue("secondaryColor")}
                onChange={(value) =>
                  updateTheme("secondaryColor", getStringValue(value))
                }
              />
              {draft.templateSlug === DEXTA_ACADEMY_2_SLUG ? (
                <div className="rounded-lg border border-black/[0.08] bg-white p-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                    Template palette
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldControl
                      field={{
                        key: "templateGreenColor",
                        label: "Green",
                        type: "color",
                        selector: ":root",
                        target: "cssVariable",
                      }}
                      value={draft.theme.templateGreenColor}
                      originalValue={getOriginalThemeColorValue(
                        "templateGreenColor",
                      )}
                      onChange={(value) =>
                        updateTheme("templateGreenColor", getStringValue(value))
                      }
                    />
                    <FieldControl
                      field={{
                        key: "templateLightGreenColor",
                        label: "Light green",
                        type: "color",
                        selector: ":root",
                        target: "cssVariable",
                      }}
                      value={draft.theme.templateLightGreenColor}
                      originalValue={getOriginalThemeColorValue(
                        "templateLightGreenColor",
                      )}
                      onChange={(value) =>
                        updateTheme(
                          "templateLightGreenColor",
                          getStringValue(value),
                        )
                      }
                    />
                    <FieldControl
                      field={{
                        key: "templateYellowColor",
                        label: "Yellow",
                        type: "color",
                        selector: ":root",
                        target: "cssVariable",
                      }}
                      value={draft.theme.templateYellowColor}
                      originalValue={getOriginalThemeColorValue(
                        "templateYellowColor",
                      )}
                      onChange={(value) =>
                        updateTheme(
                          "templateYellowColor",
                          getStringValue(value),
                        )
                      }
                    />
                    <FieldControl
                      field={{
                        key: "templateOrangeColor",
                        label: "Orange",
                        type: "color",
                        selector: ":root",
                        target: "cssVariable",
                      }}
                      value={draft.theme.templateOrangeColor}
                      originalValue={getOriginalThemeColorValue(
                        "templateOrangeColor",
                      )}
                      onChange={(value) =>
                        updateTheme(
                          "templateOrangeColor",
                          getStringValue(value),
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}
              {draft.templateSlug === "dexta-academy-3" ? (
                <FieldControl
                  field={{
                    key: "tertiaryColor",
                    label: "Tertiary",
                    type: "color",
                    selector: ":root",
                    target: "inlineStyle",
                  }}
                  value={draft.theme.tertiaryColor}
                  originalValue={getOriginalThemeColorValue("tertiaryColor")}
                  onChange={(value) =>
                    updateTheme("tertiaryColor", getStringValue(value))
                  }
                />
              ) : null}
              <FieldControl
                field={{
                  key: "fontFamily",
                  label: "Font",
                  type: "text",
                  selector: "body",
                  target: "inlineStyle",
                  placeholder: "Poppins",
                  helpText:
                    "Enter a Google Font family name such as Poppins, Inter, or Nunito Sans. Template 3 will load it automatically.",
                }}
                value={draft.theme.fontFamily}
                onChange={(value) =>
                  updateTheme("fontFamily", getStringValue(value))
                }
              />
              <FieldControl
                field={{
                  key: "loadingBackgroundColor",
                  label: "Loading background",
                  type: "color",
                  selector: "body",
                  target: "inlineStyle",
                }}
                value={draft.theme.loadingBackgroundColor}
                originalValue={getOriginalThemeColorValue(
                  "loadingBackgroundColor",
                )}
                onChange={(value) =>
                  updateTheme("loadingBackgroundColor", getStringValue(value))
                }
              />
              <FieldControl
                field={{
                  key: "loadingTextColor",
                  label: "Loading text color",
                  type: "color",
                  selector: "body",
                  target: "inlineStyle",
                }}
                value={draft.theme.loadingTextColor}
                originalValue={getOriginalThemeColorValue("loadingTextColor")}
                onChange={(value) =>
                  updateTheme("loadingTextColor", getStringValue(value))
                }
              />
              <FieldControl
                field={{
                  key: "loadingText",
                  label: "Loading text",
                  type: "text",
                  selector: "body",
                  target: "textContent",
                }}
                value={draft.theme.loadingText}
                onChange={(value) =>
                  updateTheme("loadingText", getStringValue(value))
                }
              />
              <FieldControl
                field={{
                  key: "loadingBarColor",
                  label: "Loading bar color",
                  type: "color",
                  selector: "body",
                  target: "inlineStyle",
                }}
                value={draft.theme.loadingBarColor}
                originalValue={getOriginalThemeColorValue("loadingBarColor")}
                onChange={(value) =>
                  updateTheme("loadingBarColor", getStringValue(value))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldControl
                  field={{
                    key: "loadingLogoWidth",
                    label: "Loading logo width",
                    type: "number",
                    selector: "body",
                    target: "inlineStyle",
                    unit: "px",
                    min: 16,
                    max: 320,
                    step: 1,
                  }}
                  value={draft.theme.loadingLogoWidth}
                  onChange={(value) =>
                    updateTheme("loadingLogoWidth", getNumberValue(value))
                  }
                />
                <FieldControl
                  field={{
                    key: "loadingLogoHeight",
                    label: "Loading logo height",
                    type: "number",
                    selector: "body",
                    target: "inlineStyle",
                    unit: "px",
                    min: 16,
                    max: 320,
                    step: 1,
                  }}
                  value={draft.theme.loadingLogoHeight}
                  onChange={(value) =>
                    updateTheme("loadingLogoHeight", getNumberValue(value))
                  }
                />
              </div>
              {isDextaAcademy3Template ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldControl
                      field={{
                        key: "loadingCardBorderColor",
                        label: "Loading card border",
                        type: "color",
                        selector: "body",
                        target: "inlineStyle",
                      }}
                      value={draft.theme.loadingCardBorderColor}
                      originalValue={getOriginalThemeColorValue(
                        "loadingCardBorderColor",
                      )}
                      onChange={(value) =>
                        updateTheme(
                          "loadingCardBorderColor",
                          getStringValue(value),
                        )
                      }
                    />
                    <FieldControl
                      field={{
                        key: "loadingCardBorderWidth",
                        label: "Loading card border width",
                        type: "number",
                        selector: "body",
                        target: "inlineStyle",
                        unit: "px",
                        min: 0,
                        max: 12,
                        step: 1,
                        helpText: "Set to 0 to remove the border.",
                      }}
                      value={draft.theme.loadingCardBorderWidth}
                      onChange={(value) =>
                        updateTheme(
                          "loadingCardBorderWidth",
                          getNumberValue(value),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldControl
                      field={{
                        key: "loadingCardShadowColor",
                        label: "Loading card shadow",
                        type: "color",
                        selector: "body",
                        target: "inlineStyle",
                      }}
                      value={draft.theme.loadingCardShadowColor}
                      originalValue={getOriginalThemeColorValue(
                        "loadingCardShadowColor",
                      )}
                      onChange={(value) =>
                        updateTheme(
                          "loadingCardShadowColor",
                          getStringValue(value),
                        )
                      }
                    />
                    <FieldControl
                      field={{
                        key: "loadingCardShadowOpacity",
                        label: "Loading card shadow opacity",
                        type: "number",
                        selector: "body",
                        target: "inlineStyle",
                        unit: "%",
                        min: 0,
                        max: 100,
                        step: 1,
                        helpText: "Set to 0 to hide the shadow.",
                      }}
                      value={draft.theme.loadingCardShadowOpacity}
                      onChange={(value) =>
                        updateTheme(
                          "loadingCardShadowOpacity",
                          getNumberValue(value),
                        )
                      }
                    />
                  </div>
                </>
              ) : null}
              <FieldControl
                field={{
                  key: "documentTitle",
                  label: "Website title",
                  type: "text",
                  selector: "head title",
                  target: "textContent",
                  placeholder: draft.theme.brandName || "School name",
                  helpText:
                    "Used in the browser tab. Home shows only this title; other pages add | page name.",
                }}
                value={draft.theme.documentTitle}
                onChange={(value) =>
                  updateTheme("documentTitle", getStringValue(value))
                }
              />
            </div>
          </div>
        </aside>

        <main className="min-h-[560px] overflow-y-auto bg-canvas p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-charcoal">
                {selectedScope === "navbar"
                  ? "Navbar"
                  : selectedScope === "shared"
                    ? sharedTabLabel
                    : selectedPage?.title}
              </p>
              <p className="text-xs text-surface-muted">
                {selectedScope === "navbar"
                  ? "Logo, name, and navigation styling"
                  : selectedScope === "shared"
                    ? sharedScopeDescription
                    : selectedPage?.fileName}
              </p>
            </div>
            {currentLastExportedAt ? (
              <span className="text-xs text-surface-muted">
                Exported {formatDate(currentLastExportedAt)}
              </span>
            ) : null}
          </div>

          {selectedScope === "navbar" ? (
            <div className="rounded-xl border border-black/[0.08] bg-white p-4">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-charcoal">
                    Navbar controls
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-surface-muted">
                    Update the logo, brand text, logo frame, and navigation
                    background used across the website.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={undoThemeChange}
                    disabled={!canUndoTheme}
                    title="Restore last navbar change"
                  >
                    <Undo2 className="mr-1.5 h-4 w-4" />
                    Restore
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={redoThemeChange}
                    disabled={!canRedoTheme}
                    title="Redo last restored navbar change"
                  >
                    <Redo2 className="mr-1.5 h-4 w-4" />
                    Redo
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                    Logo
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-charcoal">
                        School logo
                      </label>
                      <MediaValueField
                        label=""
                        value={draft.theme.logoUrl}
                        optional
                        onChange={(next) => updateTheme("logoUrl", next)}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldControl
                        field={{
                          key: "logoWidth",
                          label: "Logo width",
                          type: "number",
                          selector: "nav",
                          target: "inlineStyle",
                          unit: "px",
                          min: 16,
                          max: 240,
                          step: 1,
                        }}
                        value={draft.theme.logoWidth}
                        onChange={(value) =>
                          updateTheme("logoWidth", getNumberValue(value))
                        }
                      />
                      <FieldControl
                        field={{
                          key: "logoHeight",
                          label: "Logo height",
                          type: "number",
                          selector: "nav",
                          target: "inlineStyle",
                          unit: "px",
                          min: 16,
                          max: 240,
                          step: 1,
                        }}
                        value={draft.theme.logoHeight}
                        onChange={(value) =>
                          updateTheme("logoHeight", getNumberValue(value))
                        }
                      />
                    </div>
                    <FieldControl
                      field={{
                        key: "logoBackgroundColor",
                        label: "Logo background",
                        type: "color",
                        selector: "nav",
                        target: "inlineStyle",
                      }}
                      value={draft.theme.logoBackgroundColor}
                      originalValue={getOriginalThemeColorValue(
                        "logoBackgroundColor",
                      )}
                      onChange={(value) =>
                        updateTheme(
                          "logoBackgroundColor",
                          getStringValue(value),
                        )
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                    Brand text
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.08] bg-white p-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          Show name on navbar
                        </p>
                        <p className="text-xs text-surface-muted">
                          Turn off or clear both lines to show only the logo.
                        </p>
                      </div>
                      <Switch
                        checked={draft.theme.brandTextVisible}
                        onCheckedChange={(checked) =>
                          updateTheme("brandTextVisible", checked)
                        }
                      />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <FieldControl
                        field={{
                          key: "brandName",
                          label: "School name",
                          type: "text",
                          selector: "nav",
                          target: "textContent",
                        }}
                        value={draft.theme.brandName}
                        onChange={(value) =>
                          updateTheme("brandName", getStringValue(value))
                        }
                      />
                      <FieldControl
                        field={{
                          key: "brandTagline",
                          label: "Tagline",
                          type: "text",
                          selector: "nav",
                          target: "textContent",
                        }}
                        value={draft.theme.brandTagline}
                        onChange={(value) =>
                          updateTheme("brandTagline", getStringValue(value))
                        }
                      />
                      <FieldControl
                        field={{
                          key: "brandNameColor",
                          label: "Line 1 color",
                          type: "color",
                          selector: "nav",
                          target: "inlineStyle",
                        }}
                        value={draft.theme.brandNameColor}
                        originalValue={getOriginalThemeColorValue(
                          "brandNameColor",
                        )}
                        onChange={(value) =>
                          updateTheme("brandNameColor", getStringValue(value))
                        }
                      />
                      <FieldControl
                        field={{
                          key: "brandTaglineColor",
                          label: "Line 2 color",
                          type: "color",
                          selector: "nav",
                          target: "inlineStyle",
                        }}
                        value={draft.theme.brandTaglineColor}
                        originalValue={getOriginalThemeColorValue(
                          "brandTaglineColor",
                        )}
                        onChange={(value) =>
                          updateTheme(
                            "brandTaglineColor",
                            getStringValue(value),
                          )
                        }
                      />
                      <FieldControl
                        field={{
                          key: "brandNameFontSize",
                          label: "Line 1 size",
                          type: "number",
                          selector: "nav",
                          target: "inlineStyle",
                          unit: "px",
                          min: 8,
                          max: 48,
                          step: 1,
                        }}
                        value={draft.theme.brandNameFontSize}
                        onChange={(value) =>
                          updateTheme(
                            "brandNameFontSize",
                            getNumberValue(value),
                          )
                        }
                      />
                      <FieldControl
                        field={{
                          key: "brandTaglineFontSize",
                          label: "Line 2 size",
                          type: "number",
                          selector: "nav",
                          target: "inlineStyle",
                          unit: "px",
                          min: 8,
                          max: 40,
                          step: 1,
                        }}
                        value={draft.theme.brandTaglineFontSize}
                        onChange={(value) =>
                          updateTheme(
                            "brandTaglineFontSize",
                            getNumberValue(value),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                    Logo border
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.08] bg-white p-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          Show logo border
                        </p>
                        <p className="text-xs text-surface-muted">
                          Controls the frame around every school logo.
                        </p>
                      </div>
                      <Switch
                        checked={draft.theme.logoBorderEnabled}
                        onCheckedChange={(checked) =>
                          updateTheme("logoBorderEnabled", checked)
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldControl
                        field={{
                          key: "logoBorderColor",
                          label: "Border color",
                          type: "color",
                          selector: "nav",
                          target: "inlineStyle",
                        }}
                        value={draft.theme.logoBorderColor}
                        originalValue={getOriginalThemeColorValue(
                          "logoBorderColor",
                        )}
                        onChange={(value) =>
                          updateTheme("logoBorderColor", getStringValue(value))
                        }
                      />
                      <FieldControl
                        field={{
                          key: "logoBorderRadius",
                          label: "Rounded edges",
                          type: "number",
                          selector: "nav",
                          target: "inlineStyle",
                          unit: "px",
                          min: 0,
                          max: 999,
                          step: 1,
                        }}
                        value={draft.theme.logoBorderRadius}
                        onChange={(value) =>
                          updateTheme("logoBorderRadius", getNumberValue(value))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                    Navigation links
                  </p>
                  <div className="space-y-4">
                    <FieldControl
                      field={{
                        key: "navLinkFontFamily",
                        label: "Link font",
                        type: "text",
                        selector: "nav a",
                        target: "inlineStyle",
                        placeholder: draft.theme.fontFamily,
                        helpText:
                          "Enter a Google Font family name such as Montserrat, Poppins, or Nunito Sans. Template 3 will load it automatically.",
                      }}
                      value={draft.theme.navLinkFontFamily}
                      onChange={(value) =>
                        updateTheme("navLinkFontFamily", getStringValue(value))
                      }
                    />
                    <FieldControl
                      field={{
                        key: "navLinkColor",
                        label: "Link color",
                        type: "color",
                        selector: "nav a",
                        target: "inlineStyle",
                      }}
                      value={draft.theme.navLinkColor}
                      originalValue={getOriginalThemeColorValue("navLinkColor")}
                      onChange={(value) =>
                        updateTheme("navLinkColor", getStringValue(value))
                      }
                    />
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.08] bg-white p-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          Show hover effect
                        </p>
                        <p className="text-xs text-surface-muted">
                          Turn off to remove the navbar underline and hover
                          color.
                        </p>
                      </div>
                      <Switch
                        checked={draft.theme.navHoverEnabled}
                        onCheckedChange={(checked) =>
                          updateTheme("navHoverEnabled", checked)
                        }
                      />
                    </div>
                    <FieldControl
                      field={{
                        key: "navHoverColor",
                        label: "Hover color",
                        type: "color",
                        selector: "nav a",
                        target: "inlineStyle",
                      }}
                      value={draft.theme.navHoverColor}
                      originalValue={getOriginalThemeColorValue(
                        "navHoverColor",
                      )}
                      onChange={(value) =>
                        updateTheme("navHoverColor", getStringValue(value))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                    Button overlay
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.08] bg-white p-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          Show overlay on buttons
                        </p>
                        <p className="text-xs text-surface-muted">
                          Applies the hover overlay to every button in this
                          template.
                        </p>
                      </div>
                      <Switch
                        checked={draft.theme.buttonOverlayEnabled}
                        onCheckedChange={(checked) =>
                          updateTheme("buttonOverlayEnabled", checked)
                        }
                      />
                    </div>
                    <FieldControl
                      field={{
                        key: "buttonOverlayColor",
                        label: "Overlay color",
                        type: "color",
                        selector: ".button",
                        target: "inlineStyle",
                      }}
                      value={draft.theme.buttonOverlayColor}
                      originalValue={getOriginalThemeColorValue(
                        "buttonOverlayColor",
                      )}
                      onChange={(value) =>
                        updateTheme("buttonOverlayColor", getStringValue(value))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                    Navbar background
                  </p>
                  <div className="space-y-4">
                    <FieldControl
                      field={{
                        key: "navBarColor",
                        label: "Navbar color",
                        type: "color",
                        selector: "nav",
                        target: "inlineStyle",
                      }}
                      value={draft.theme.navBarColor}
                      originalValue={getOriginalThemeColorValue("navBarColor")}
                      onChange={(value) =>
                        updateTheme("navBarColor", getStringValue(value))
                      }
                    />
                    <FieldControl
                      field={{
                        key: "navBarOpacity",
                        label: "Navbar opacity",
                        type: "number",
                        selector: "nav",
                        target: "inlineStyle",
                        unit: "%",
                        min: 0,
                        max: 100,
                        step: 1,
                        helpText:
                          "Only applies when transparent navbar is on. 100 is full color; lower values let the page show through.",
                      }}
                      value={draft.theme.navBarOpacity}
                      onChange={(value) =>
                        updateTheme("navBarOpacity", getNumberValue(value))
                      }
                    />
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.08] bg-white p-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          Transparent navbar
                        </p>
                        <p className="text-xs text-surface-muted">
                          Turn on to use navbar opacity. Turn off for the full
                          selected color.
                        </p>
                      </div>
                      <Switch
                        checked={draft.theme.navBarTransparent}
                        onCheckedChange={(checked) =>
                          updateTheme("navBarTransparent", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                {navbarButtonFieldGroups.length ? (
                  <div className="rounded-xl border border-black/[0.08] bg-white p-4 xl:col-span-2">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                      Navbar buttons
                    </p>
                    <div className="grid gap-5 xl:grid-cols-2">
                      {navbarButtonFieldGroups.map((group) => (
                        <div
                          key={group.name}
                          className="rounded-xl border border-black/[0.08] bg-white p-4"
                        >
                          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                            {group.name}
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {group.fields.map((field) => (
                              <FieldControl
                                key={field.key}
                                field={field}
                                value={
                                  navbarHeaderSection?.fields[field.key] ??
                                  field.defaultValue ??
                                  null
                                }
                                originalValue={getOriginalSharedSectionFieldValue(
                                  navbarSharedSectionId,
                                  field,
                                )}
                                onChange={(value) =>
                                  updateSharedSectionField(
                                    navbarSharedSectionId,
                                    field.key,
                                    value,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-xl border border-black/[0.08] bg-white p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                  Sections
                </p>
                <div className="flex flex-wrap gap-2">
                  {sectionBindings.map((section) => (
                    <button
                      key={section.content.id}
                      type="button"
                      onClick={() => setSelectedSectionId(section.content.id)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        activeSection?.content.id === section.content.id
                          ? "bg-ice font-bold text-royal"
                          : "text-charcoal hover:bg-charcoal/[0.05]",
                      )}
                    >
                      {section.content.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeSection ? (
                <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-charcoal">
                        {activeSection.content.label}
                      </h2>
                      {activeSection.snapshot?.description ? (
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-surface-muted">
                          {activeSection.snapshot.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={undoSectionChange}
                        disabled={!canUndoActiveSection}
                        title="Restore last change in this component"
                      >
                        <Undo2 className="mr-1.5 h-4 w-4" />
                        Restore
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={redoSectionChange}
                        disabled={!canRedoActiveSection}
                        title="Redo last restored change in this component"
                      >
                        <Redo2 className="mr-1.5 h-4 w-4" />
                        Redo
                      </Button>
                    </div>
                  </div>

                  {activeImportTargets.length ? (
                    <div className="mb-5 rounded-xl border border-black/[0.08] bg-white p-4">
                      <div className="mb-3 flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1 space-y-2">
                          <label className="block text-sm font-bold text-charcoal">
                            Import write-up from URL
                          </label>
                          <Input
                            value={copyImportUrl}
                            onChange={(event) =>
                              setCopyImportUrl(event.target.value)
                            }
                            placeholder="https://example.com/about"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void extractCopySuggestions()}
                          disabled={isExtractingCopy || !copyImportUrl.trim()}
                        >
                          {isExtractingCopy ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="mr-1.5 h-4 w-4" />
                          )}
                          Extract Copy
                        </Button>
                      </div>

                      {copySuggestions.length ? (
                        <div className="space-y-3">
                          {copySuggestions.map((suggestion) => (
                            <div
                              key={suggestion.fieldKey}
                              className="rounded-lg border border-black/[0.08] bg-white p-3"
                            >
                              <label className="mb-2 block text-xs font-medium text-charcoal">
                                {suggestion.label}
                              </label>
                              <Textarea
                                rows={4}
                                value={suggestion.value}
                                onChange={(event) =>
                                  updateCopySuggestion(
                                    suggestion.fieldKey,
                                    event.target.value,
                                  )
                                }
                                className="resize-none"
                              />
                              <div className="mt-3 flex flex-wrap justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    declineCopySuggestion(suggestion.fieldKey)
                                  }
                                >
                                  Decline
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() =>
                                    approveCopySuggestion(suggestion.fieldKey)
                                  }
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {activeFieldGroups.length ? (
                    <div className="space-y-5">
                      {activeFieldGroups.map((group) => (
                        <div
                          key={group.name}
                          className="rounded-xl border border-black/[0.08] bg-white p-4"
                        >
                          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                            {group.name}
                          </p>
                          <div className="grid gap-4 xl:grid-cols-2">
                            {group.fields.map((field) => {
                              const modelValidationKey = `${activeSection.content.id}:${field.key}:model-preview`;

                              return (
                                <FieldControl
                                  key={`${activeSection.content.id}:${field.key}`}
                                  field={field}
                                  value={
                                    activeSection.content.fields[field.key] ??
                                    null
                                  }
                                  defaultFontFamily={draft.theme.fontFamily}
                                  originalValue={getOriginalSectionFieldValue(
                                    activeSection.content.id,
                                    field,
                                  )}
                                  onChange={(value) =>
                                    updateSectionField(
                                      activeSection.content.id,
                                      field.key,
                                      value,
                                    )
                                  }
                                  onValidateModel={
                                    field.type === "model3d"
                                      ? (nextValue) =>
                                          validateActiveModelField(
                                            field,
                                            nextValue,
                                            modelValidationKey,
                                            `${activeSection.content.label} ${field.label}`,
                                          )
                                      : undefined
                                  }
                                  isValidatingModel={
                                    validatingModelKey === modelValidationKey
                                  }
                                  className={
                                    field.type === "richText"
                                      ? "xl:col-span-2"
                                      : undefined
                                  }
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : hasActiveRepeatableFields ? null : (
                    <div className="rounded-xl border border-black/[0.08] bg-white p-4 text-sm text-surface-muted">
                      No editable fields for this section yet.
                    </div>
                  )}

                  {activeSection.content.repeatable &&
                  activeSection.snapshot?.repeatable ? (
                    <div className="mt-5 rounded-xl border border-black/[0.08] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-charcoal">
                          <ImageIcon className="h-4 w-4 text-royal" />
                          {activeSection.snapshot.repeatable.labelPlural}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            addRepeatableItem(activeSection.content.id)
                          }
                        >
                          Add {activeSection.snapshot.repeatable.labelSingular}
                        </Button>
                      </div>
                      {activeSection.content.repeatable.items.length ? (
                        <div className="mt-4 space-y-4">
                          {activeSection.content.repeatable.items.map(
                            (item, itemIndex) => (
                              <div
                                key={`${activeSection.content.id}:item:${itemIndex}`}
                                className="rounded-xl border border-black/[0.08] bg-white p-4"
                              >
                                <div className="mb-4 flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                                    {activeSection.snapshot?.repeatable
                                      ?.labelSingular ?? "Item"}{" "}
                                    {itemIndex + 1}
                                  </p>
                                  {canDeleteActiveRepeatableItems ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        removeRepeatableItem(
                                          activeSection.content.id,
                                          itemIndex,
                                        )
                                      }
                                      className="h-8 bg-transparent px-2 text-[#c2410c] hover:bg-coral-soft"
                                      aria-label={`Delete ${
                                        activeSection.snapshot?.repeatable
                                          ?.labelSingular ?? "item"
                                      } ${itemIndex + 1}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </Button>
                                  ) : null}
                                </div>
                                <div className="grid gap-4 xl:grid-cols-2">
                                  {activeRepeatableItemFields.map((field) => {
                                    const modelValidationKey = `${activeSection.content.id}:${itemIndex}:${field.key}:model-preview`;

                                    return (
                                      <FieldControl
                                        key={`${activeSection.content.id}:${itemIndex}:${field.key}`}
                                        field={field}
                                        value={item[field.key] ?? null}
                                        defaultFontFamily={
                                          draft.theme.fontFamily
                                        }
                                        originalValue={getOriginalRepeatableItemFieldValue(
                                          activeSection.content.id,
                                          itemIndex,
                                          field,
                                        )}
                                        onChange={(value) => {
                                          updateRepeatableItemField(
                                            activeSection.content.id,
                                            itemIndex,
                                            field.key,
                                            value,
                                          );
                                          // Auto-sync image to imageHref for gallery lightbox.
                                          if (
                                            field.key === "image" &&
                                            field.type === "image" &&
                                            typeof value === "string" &&
                                            value &&
                                            activeRepeatableItemFields.some(
                                              (f) => f.key === "imageHref",
                                            )
                                          ) {
                                            updateRepeatableItemField(
                                              activeSection.content.id,
                                              itemIndex,
                                              "imageHref",
                                              value,
                                              { saveHistory: false },
                                            );
                                          }
                                        }}
                                        onValidateModel={
                                          field.type === "model3d"
                                            ? (nextValue) =>
                                                validateActiveModelField(
                                                  field,
                                                  nextValue,
                                                  modelValidationKey,
                                                  `${activeSection.content.label} item ${itemIndex + 1} ${field.label}`,
                                                )
                                            : undefined
                                        }
                                        isValidatingModel={
                                          validatingModelKey ===
                                          modelValidationKey
                                        }
                                        className={
                                          field.type === "richText"
                                            ? "xl:col-span-2"
                                            : undefined
                                        }
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-surface-muted">
                          Add an item to edit individual{" "}
                          {activeSection.snapshot.repeatable.labelPlural.toLowerCase()}
                          .
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-black/[0.08] bg-white p-4 text-sm text-surface-muted">
                  Select a section to edit.
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          showCloseButton
          className="h-[92vh] w-[96vw] max-w-[96vw] gap-0 overflow-hidden p-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.08] bg-white px-4 py-3 pr-12">
            <DialogTitle className="text-sm font-semibold text-charcoal">
              {activePreviewMode.label} Preview
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-black/[0.08] bg-white p-1">
                {PREVIEW_MODES.map((mode) => {
                  const Icon = mode.icon;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPreviewMode(mode.id)}
                      className={cn(
                        "flex h-8 items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
                        previewMode === mode.id
                          ? "bg-ice font-bold text-royal"
                          : "text-surface-muted hover:bg-charcoal/[0.05] hover:text-charcoal",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="h-[calc(92vh-58px)] overflow-auto bg-canvas p-3">
            <div
              className="mx-auto h-full overflow-hidden rounded-lg bg-white transition-[width] duration-200"
              style={{
                width:
                  activePreviewMode.width === "100%"
                    ? "100%"
                    : `${activePreviewMode.width}px`,
                maxWidth: "100%",
              }}
            >
              <iframe
                key={`${previewHref}:${previewMode}:${previewKey}`}
                src={previewHref}
                title={`${activePreviewMode.label} school website preview`}
                className="h-full w-full"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
