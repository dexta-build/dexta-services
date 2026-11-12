"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink } from "lucide-react";
import {
  ABOUT_FIELDS,
  CONTACT_FIELDS,
  HISTORY_FIELDS,
  PROFILE_FIELDS,
  SKILL_FIELDS,
  WORK_FIELDS,
  profileSections,
  type TeamForm,
} from "@/lib/team/fields";
import { cn } from "@/lib/utils";
import { Button } from "@/components/site/button";
import {
  PageHeader,
  StatusPill,
  AdminCard,
} from "@/components/admin/kit/layout";
import { Tabs } from "@/components/admin/kit/overlays";
import { Callout } from "@/components/admin/kit/display";
import { SaveBar } from "@/components/admin/kit/save-bar";
import { SectionForm } from "@/components/admin/content/section-form";
import { RichTextEditor } from "@/components/admin/editor/rich-text-editor";
import type { AddressBook } from "@/lib/team/admin";
import { saveMember } from "./actions";
import { AddressField } from "./address-field";
import {
  addressProblem,
  cleanAddress,
  describeProblem,
} from "@/lib/team/addresses";

const { photo, name, role, ...PROFILE_REST } = PROFILE_FIELDS;
const IDENTITY_FIELDS = { photo, name, role };

export const EMPTY_MEMBER: TeamForm = {
  photo: "",
  name: "",
  role: "",
  slug: "",
  headline: "",
  bio: "",
  location: "",
  yearsExperience: null,
  availability: "",
  color: "",
  isVisible: true,
  quote: "",
  story: "",
  funFact: "",
  expertise: [],
  brands: [],
  skillGroups: [],
  languages: [],
  experience: [],
  education: [],
  certifications: [],
  projects: [],
  email: "",
  cv: "",
  socials: [],
};

/** Which tab each field lives on, to jump to the first error. */
const TAB_OF: Record<string, string> = {
  ...Object.fromEntries(
    [...Object.keys(PROFILE_FIELDS), "slug"].map((k) => [k, "profile"]),
  ),
  ...Object.fromEntries(
    [...Object.keys(ABOUT_FIELDS), "story", ...Object.keys(SKILL_FIELDS)].map(
      (k) => [k, "about"],
    ),
  ),
  ...Object.fromEntries(Object.keys(HISTORY_FIELDS).map((k) => [k, "history"])),
  ...Object.fromEntries(
    [...Object.keys(WORK_FIELDS), ...Object.keys(CONTACT_FIELDS)].map((k) => [
      k,
      "work",
    ]),
  ),
};

export function MemberEditor({
  id,
  initial,
  book,
  host,
}: {
  id: string | null;
  initial: TeamForm | null;
  book: AddressBook;
  host: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<TeamForm>(initial ?? EMPTY_MEMBER);
  const [form, setForm] = useState<TeamForm>(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("profile");
  const [saving, start] = useTransition();
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const value = form as unknown as Record<string, unknown>;
  const onChange = (v: Record<string, unknown>) =>
    setForm(v as unknown as TeamForm);
  // The live address (the editor always shows one; see formFromRow).
  const slug = saved.slug;
  const sections = profileSections(form);

  const save = () => {
    // A bad address is caught here, before anything is sent.
    const problem = addressProblem(cleanAddress(form.slug), book.taken);
    if (problem) {
      setErrors({ slug: describeProblem(problem) });
      setTab("profile");
      toast.error(describeProblem(problem));
      return;
    }
    start(async () => {
      const res = await saveMember(id, form);
      if (!res.success) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        const first = Object.keys(res.errors ?? {})[0]?.split(".")[0];
        if (first && TAB_OF[first]) setTab(TAB_OF[first]);
        return;
      }
      setErrors({});
      const clean = { ...form, slug: res.slug };
      setForm(clean);
      setSaved(clean);
      toast.success(id ? "Profile saved" : "Person added");
      if (res.note) toast.info(res.note, { duration: 8000 });
      if (!id) router.replace(`/admin/team/${res.id}`);
      else router.refresh();
    });
  };

  const card = (
    title: string,
    children: React.ReactNode,
    description?: string,
  ) => (
    <AdminCard title={title} description={description}>
      {children}
    </AdminCard>
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Team", href: "/admin/team" },
          { label: id ? saved.name || "Profile" : "New person" },
        ]}
        title={id ? `*${saved.name || "Profile"}*` : "Add a *person*"}
        description={
          id
            ? saved.role
            : "Fill in what you have; empty sections stay off their profile."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {id && !saved.isVisible && <StatusPill>Hidden</StatusPill>}
            {id && saved.isVisible && (
              <Button size="sm" variant="subtle" href={`/${slug}`} external>
                View profile <ExternalLink aria-hidden className="size-4" />
              </Button>
            )}
            <Button
              size="sm"
              disabled={saving || (!dirty && !!id)}
              onClick={save}
            >
              {saving ? "Saving" : id ? "Save" : "Add person"}
            </Button>
          </div>
        }
      />

      {/* What's filled in: each part becomes a section of their profile. */}
      <ul className="mb-6 flex flex-wrap gap-2" aria-label="Profile sections">
        {sections.map(([name, ok]) => (
          <li
            key={name}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
              ok
                ? "bg-mint-soft text-mint-deep"
                : "bg-charcoal/[0.06] text-surface-muted",
            )}
          >
            {ok && <Check aria-hidden className="size-3.5" />}
            {name}
          </li>
        ))}
      </ul>

      {Object.keys(errors).length > 0 && (
        <Callout
          tone="danger"
          title="Some fields need attention"
          className="mb-6"
        >
          They&apos;re marked in red in the tabs below.
        </Callout>
      )}

      <Tabs
        label="Profile sections"
        value={tab}
        onValueChange={setTab}
        tabs={[
          {
            value: "profile",
            label: "Profile",
            content: card(
              "Profile",
              <div className="flex flex-col gap-5">
                <SectionForm
                  fields={IDENTITY_FIELDS}
                  value={value}
                  onChange={onChange}
                  errors={errors}
                />
                <AddressField
                  memberId={id}
                  value={form.slug}
                  onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
                  name={form.name}
                  savedAddress={id ? saved.slug : null}
                  book={book}
                  host={host}
                  error={errors.slug}
                />
                <SectionForm
                  fields={PROFILE_REST}
                  value={value}
                  onChange={onChange}
                  errors={errors}
                />
              </div>,
              "The basics: on the About page card and the top of their profile.",
            ),
          },
          {
            value: "about",
            label: "About & skills",
            content: (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-6">
                  {card(
                    "Their story",
                    <div className="flex flex-col gap-1.5">
                      <RichTextEditor
                        value={form.story}
                        onChange={(html) =>
                          setForm((f) => ({ ...f, story: html }))
                        }
                        placeholder="Who they are, what they work on and what drives them…"
                        label="Story"
                      />
                      <p className="text-surface-muted text-xs">
                        The &ldquo;About me&rdquo; section. Without it, the
                        short bio is used.
                      </p>
                    </div>,
                  )}
                  {card(
                    "Personal touches",
                    <SectionForm
                      fields={ABOUT_FIELDS}
                      value={value}
                      onChange={onChange}
                      errors={errors}
                    />,
                  )}
                </div>
                {card(
                  "Skills and languages",
                  <SectionForm
                    fields={SKILL_FIELDS}
                    value={value}
                    onChange={onChange}
                    errors={errors}
                  />,
                  "Group skills by area. Skills with a level show a bar; the rest show as tags.",
                )}
              </div>
            ),
          },
          {
            value: "history",
            label: "Experience & education",
            content: card(
              "Experience, education and certifications",
              <SectionForm
                fields={HISTORY_FIELDS}
                value={value}
                onChange={onChange}
                errors={errors}
              />,
              "Newest first. Each list becomes a timeline on their profile.",
            ),
          },
          {
            value: "work",
            label: "Work & contact",
            content: (
              <div className="grid gap-6 xl:grid-cols-2">
                {card(
                  "Projects",
                  <SectionForm
                    fields={WORK_FIELDS}
                    value={value}
                    onChange={onChange}
                    errors={errors}
                  />,
                  "Without projects of their own, their profile shows the studio's latest work.",
                )}
                {card(
                  "Contact and links",
                  <SectionForm
                    fields={CONTACT_FIELDS}
                    value={value}
                    onChange={onChange}
                    errors={errors}
                  />,
                )}
              </div>
            ),
          },
        ]}
      />

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={save}
        onDiscard={() => {
          setForm(saved);
          setErrors({});
        }}
        saveLabel={id ? "Save profile" : "Add person"}
      />
    </>
  );
}
