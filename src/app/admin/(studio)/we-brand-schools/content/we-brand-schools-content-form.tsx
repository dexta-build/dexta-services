"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  normalizeHeroRichText,
  type HeroRichTextMode,
} from "@/lib/hero-rich-text";
import {
  weBrandSchoolsPageContentSchema,
  type WeBrandSchoolsPageContentInput,
} from "@/lib/validators";
import { FormSection, TextField } from "@/components/admin/kit/fields";
import { Tabs } from "@/components/admin/kit/overlays";
import { AdminCard } from "@/components/admin/kit/layout";
import { SaveBar } from "@/components/admin/kit/save-bar";
import { MediaValueField } from "@/components/admin/content/media-value-field";
import { FormattedTextEditor } from "@/components/admin/editor/formatted-text-editor";
import type { WeBrandSchoolsPageContentRow } from "../actions";
import { updateWeBrandSchoolsPageContent } from "../actions";

type Form = WeBrandSchoolsPageContentInput;
type Key = keyof Form;

const RICH: Partial<Record<Key, HeroRichTextMode>> = {
  heroEyebrow: "inline",
  heroHeadline: "inline",
  heroBody: "block",
  heroFeature1: "inline",
  heroFeature2: "inline",
  heroFeature3: "inline",
  overviewLabel: "inline",
  overviewTitle: "inline",
  overviewBody: "block",
  overviewBenefitsLabel: "inline",
  overviewBenefit1: "inline",
  overviewBenefit2: "inline",
  overviewBenefit3: "inline",
  overviewBenefit4: "inline",
  processLabel: "inline",
  processTitle: "inline",
  processBody: "block",
  processStep1Title: "inline",
  processStep1Body: "block",
  processStep2Title: "inline",
  processStep2Body: "block",
  processStep3Title: "inline",
  processStep3Body: "block",
  processStep4Title: "inline",
  processStep4Body: "block",
  templatesLabel: "inline",
  templatesTitle: "inline",
  templatesBody: "block",
};

function toForm(content: WeBrandSchoolsPageContentRow): Form {
  const out = { ...content } as Form;
  for (const [k, mode] of Object.entries(RICH) as [Key, HeroRichTextMode][])
    (out as Record<Key, unknown>)[k] = normalizeHeroRichText(
      out[k] as string,
      mode,
    );
  return out;
}

export function WeBrandSchoolsContentForm({
  content,
}: {
  content: WeBrandSchoolsPageContentRow;
}) {
  const [saved, setSaved] = useState(() => toForm(content));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("hero");

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved],
  );

  const set = <K extends Key>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const parsed = weBrandSchoolsPageContentSchema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<Key, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as Key;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      const first = Object.keys(next)[0] as Key;
      setTab(tabOf(first));
      toast.error(next[first] ?? "Check the highlighted fields.");
      return;
    }
    setSaving(true);
    const result = await updateWeBrandSchoolsPageContent(parsed.data);
    setSaving(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setSaved(form);
    toast.success("Page saved");
  };

  const rich = (k: Key, label: string, opts?: { tall?: boolean }) => (
    <FormattedTextEditor
      label={label}
      value={(form[k] as string) ?? ""}
      onChange={(v) => set(k, v as Form[typeof k])}
      minHeight={RICH[k] === "block" || opts?.tall ? 150 : 72}
      invalid={!!errors[k]}
      hint={
        errors[k] ? (
          <span className="font-bold text-[#c2410c]">{errors[k]}</span>
        ) : undefined
      }
    />
  );

  const text = (k: Key, label: string, placeholder?: string) => (
    <TextField
      label={label}
      value={(form[k] as string) ?? ""}
      onChange={(e) => set(k, e.target.value as Form[typeof k])}
      error={errors[k]}
      placeholder={placeholder}
    />
  );

  const buttons = (prefix: "hero" | "overview") => (
    <div className="grid gap-4 sm:grid-cols-2">
      {text(`${prefix}PrimaryCtaText` as Key, "Main button text")}
      {text(
        `${prefix}PrimaryCtaHref` as Key,
        "Main button link",
        "#apply or /contact",
      )}
      {text(`${prefix}SecondaryCtaText` as Key, "Second button text")}
      {text(
        `${prefix}SecondaryCtaHref` as Key,
        "Second button link",
        "#templates",
      )}
    </div>
  );

  const tabs = [
    {
      value: "hero",
      label: "Logo & hero",
      content: (
        <AdminCard>
          <div className="flex flex-col gap-8">
            <FormSection
              title="Logo and image"
              description="The logo above the headline, and the photo beside the hero on larger screens."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <MediaValueField
                  label="Logo"
                  value={form.logoPublicId ?? ""}
                  onChange={(v) => set("logoPublicId", v || null)}
                  optional
                />
                <MediaValueField
                  label="Hero image"
                  value={form.heroImagePublicId ?? ""}
                  onChange={(v) => set("heroImagePublicId", v || null)}
                  optional
                  hint="With none chosen, the page uses its built-in school photo."
                />
              </div>
            </FormSection>
            <FormSection
              title="Headline"
              description="The first thing visitors read."
            >
              {rich("heroEyebrow", "Small line above the headline")}
              {rich("heroHeadline", "Headline", { tall: true })}
              {rich("heroBody", "Intro")}
            </FormSection>
            <FormSection title="Buttons">{buttons("hero")}</FormSection>
            <FormSection
              title="Highlights"
              description="Three short points under the buttons."
            >
              {rich("heroFeature1", "Highlight 1")}
              {rich("heroFeature2", "Highlight 2")}
              {rich("heroFeature3", "Highlight 3")}
            </FormSection>
          </div>
        </AdminCard>
      ),
    },
    {
      value: "overview",
      label: "Overview",
      content: (
        <AdminCard>
          <div className="flex flex-col gap-8">
            <FormSection
              title="Introduction"
              description="The block right after the hero."
            >
              {rich("overviewLabel", "Label")}
              {rich("overviewTitle", "Title", { tall: true })}
              {rich("overviewBody", "Text")}
            </FormSection>
            <FormSection title="Buttons">{buttons("overview")}</FormSection>
            <FormSection
              title="What schools get"
              description="The benefits panel beside the introduction."
            >
              {rich("overviewBenefitsLabel", "Panel title")}
              {rich("overviewBenefit1", "Benefit 1")}
              {rich("overviewBenefit2", "Benefit 2")}
              {rich("overviewBenefit3", "Benefit 3")}
              {rich("overviewBenefit4", "Benefit 4")}
            </FormSection>
          </div>
        </AdminCard>
      ),
    },
    {
      value: "process",
      label: "Process",
      content: (
        <AdminCard>
          <div className="flex flex-col gap-8">
            <FormSection title="Introduction">
              {rich("processLabel", "Label")}
              {rich("processTitle", "Title", { tall: true })}
              {rich("processBody", "Text")}
            </FormSection>
            {([1, 2, 3, 4] as const).map((n) => (
              <FormSection key={n} title={`Step ${n}`}>
                {rich(`processStep${n}Title` as Key, "Title")}
                {rich(`processStep${n}Body` as Key, "Text")}
              </FormSection>
            ))}
          </div>
        </AdminCard>
      ),
    },
    {
      value: "templates",
      label: "Templates",
      content: (
        <AdminCard>
          <FormSection
            title="Above the templates"
            description="The heading over the grid of website templates. The templates themselves are managed under Templates."
          >
            {rich("templatesLabel", "Label")}
            {rich("templatesTitle", "Title", { tall: true })}
            {rich("templatesBody", "Text")}
          </FormSection>
        </AdminCard>
      ),
    },
  ].map((t) => ({
    ...t,
    badge: TAB_KEYS[t.value].some((k) => errors[k]) ? (
      <span
        aria-label="Has errors"
        className="size-2 rounded-full bg-[#c2410c]"
      />
    ) : undefined,
  }));

  return (
    <div className="pb-24">
      <Tabs
        label="Page sections"
        tabs={tabs}
        value={tab}
        onValueChange={setTab}
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={save}
        onDiscard={() => {
          setForm(saved);
          setErrors({});
        }}
      />
    </div>
  );
}

const TAB_KEYS: Record<string, Key[]> = {
  hero: [
    "logoPublicId",
    "heroImagePublicId",
    "heroEyebrow",
    "heroHeadline",
    "heroBody",
    "heroPrimaryCtaText",
    "heroPrimaryCtaHref",
    "heroSecondaryCtaText",
    "heroSecondaryCtaHref",
    "heroFeature1",
    "heroFeature2",
    "heroFeature3",
  ],
  overview: [
    "overviewLabel",
    "overviewTitle",
    "overviewBody",
    "overviewPrimaryCtaText",
    "overviewPrimaryCtaHref",
    "overviewSecondaryCtaText",
    "overviewSecondaryCtaHref",
    "overviewBenefitsLabel",
    "overviewBenefit1",
    "overviewBenefit2",
    "overviewBenefit3",
    "overviewBenefit4",
  ],
  process: [
    "processLabel",
    "processTitle",
    "processBody",
    "processStep1Title",
    "processStep1Body",
    "processStep2Title",
    "processStep2Body",
    "processStep3Title",
    "processStep3Body",
    "processStep4Title",
    "processStep4Body",
  ],
  templates: ["templatesLabel", "templatesTitle", "templatesBody"],
};

const tabOf = (k: Key) =>
  Object.entries(TAB_KEYS).find(([, keys]) => keys.includes(k))?.[0] ?? "hero";
