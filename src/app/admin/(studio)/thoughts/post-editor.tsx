"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, Eye } from "lucide-react";
import type { AdminPost, Option } from "@/lib/thoughts/admin";
import { stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { AccentText } from "@/components/site/accent-text";
import {
  PageHeader,
  StatusPill,
  AdminCard,
  type PillTone,
} from "@/components/admin/kit/layout";
import {
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import {
  DateTimeField,
  SegmentedControl,
  SlugField,
  TagInput,
} from "@/components/admin/kit/inputs";
import { Callout } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import { useUnsavedChangesWarning } from "@/components/admin/kit/save-bar";
import { GalleryField } from "@/components/admin/content/section-form";
import { RichTextEditor } from "@/components/admin/editor/rich-text-editor";
import { savePost, type PostForm } from "./actions";

const plain = (t: string) => t.replace(/\*/g, "");

function formOf(p: AdminPost | null): PostForm {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    excerpt: p?.excerpt ?? "",
    content: p?.content ?? "",
    cover: p?.cover ?? "",
    categoryId: p?.categoryId ?? "",
    authorId: p?.authorId ?? "",
    tags: p?.tags ?? [],
    isFeatured: p?.isFeatured ?? false,
    seoTitle: p?.seoTitle ?? "",
    seoDescription: p?.seoDescription ?? "",
    status: p?.status ?? "DRAFT",
    publishedAt: p?.publishedAt ?? null,
  };
}

const longDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function PostEditor({
  post,
  categories,
  authors,
  tagSuggestions,
  siteUrl,
}: {
  post: AdminPost | null;
  categories: Option[];
  authors: Option[];
  tagSuggestions: string[];
  siteUrl: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [saved, setSaved] = useState<PostForm>(() => formOf(post));
  const [form, setForm] = useState<PostForm>(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [when, setWhen] = useState<"now" | "later">(
    post?.status === "DRAFT" && post.publishedAt ? "later" : "now",
  );
  const [saving, start] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedChangesWarning(dirty);
  const set = <K extends keyof PostForm>(k: K, v: PostForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const live = saved.status === "PUBLISHED";
  const scheduled =
    live && !!saved.publishedAt && Date.parse(saved.publishedAt) > now;
  const state: { label: string; tone: PillTone; note: string } = !post
    ? { label: "New", tone: "neutral", note: "Not saved yet." }
    : !live
      ? { label: "Draft", tone: "neutral", note: "Only you can see it." }
      : scheduled
        ? {
            label: "Scheduled",
            tone: "warning",
            note: `Goes live ${longDate(saved.publishedAt!)}.`,
          }
        : {
            label: "Published",
            tone: "success",
            note: `Live since ${longDate(saved.publishedAt!)}.`,
          };

  /** Saves with a status; returns the saved slug, or null. */
  const save = (
    patch: Partial<PostForm>,
    ok: string,
    after?: (slug: string) => void,
  ) =>
    start(async () => {
      const next = { ...form, ...patch };
      const res = await savePost(post?.id ?? null, next);
      if (!res.success) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        return;
      }
      setErrors({});
      const clean = { ...next, slug: res.slug };
      setForm(clean);
      setSaved(clean);
      toast.success(ok);
      after?.(res.slug);
      if (!post) router.replace(`/admin/thoughts/${res.id}`);
      else router.refresh();
    });

  const laterDate = form.publishedAt ? new Date(form.publishedAt) : null;
  const laterValid = !!laterDate && laterDate.getTime() > now;

  const publish = () => {
    if (when === "later") {
      if (!laterValid)
        return void toast.error("Pick a date and time in the future.");
      save(
        { status: "PUBLISHED", publishedAt: laterDate!.toISOString() },
        `Scheduled for ${longDate(laterDate!.toISOString())}`,
      );
    } else
      save(
        { status: "PUBLISHED", publishedAt: new Date().toISOString() },
        "Published",
      );
  };

  // Keep the current status (drafts stay drafts), then open the preview.
  const preview = () => {
    const win = window.open("about:blank", "_blank");
    save({}, dirty || !post ? "Saved" : "Opening preview", (slug) => {
      const url = `/api/preview?path=${encodeURIComponent(`/thoughts/${slug}`)}`;
      if (win) win.location.href = url;
      else window.open(url, "_blank");
    });
  };

  // Ctrl/Cmd + S saves without changing the status.
  const saveRef = useRef(() => {});
  saveRef.current = () => {
    if (!saving) save({}, live ? "Saved" : "Draft saved");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const seoTitle = form.seoTitle || plain(form.title) || "Article title";
  const seoDescription =
    form.seoDescription || form.excerpt || "The article's summary.";
  const host = siteUrl.replace(/^https?:\/\//, "");
  const coverUrl = form.cover ? stock(form.cover, 800, 420) : "";

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Thoughts", href: "/admin/thoughts" },
          { label: post ? plain(saved.title) || "Article" : "New article" },
        ]}
        title={post ? "Edit *article*" : "New *article*"}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill tone={state.tone} dot>
              {state.label}
            </StatusPill>
            {dirty && (
              <span className="text-surface-muted text-xs">
                Unsaved changes
              </span>
            )}
          </div>
        }
      />

      {Object.keys(errors).length > 0 && (
        <Callout
          tone="danger"
          title="Some fields need attention"
          className="mb-6"
        >
          {Object.values(errors).join(" · ")}
        </Callout>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Writing */}
        <div className="flex min-w-0 flex-col gap-5">
          <TextareaField
            label="Title"
            required
            rows={2}
            maxLength={160}
            value={form.title}
            onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))}
            error={errors.title}
            placeholder="e.g. Why every small business needs a *brand system*"
            hint="Wrap words in *asterisks* for the serif accent."
            className="text-xl font-bold md:text-2xl"
          />
          {form.title && (
            <p className="dx-site text-surface-muted -mt-2 text-sm">
              Shows as: <AccentText text={form.title} />
            </p>
          )}
          <TextareaField
            label="Summary (TL;DR)"
            rows={3}
            maxLength={400}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            error={errors.excerpt}
            hint="On the article cards and at the top of the article. Required to publish."
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-bold">
              Article <span className="text-[#c2410c]">*</span>
            </p>
            <RichTextEditor
              value={form.content}
              onChange={(html) => set("content", html)}
              invalid={!!errors.content}
            />
            {errors.content && (
              <p className="text-xs text-[#c2410c]">{errors.content}</p>
            )}
          </div>
        </div>

        {/* Settings */}
        <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-4">
          <AdminCard title="Publish">
            <div className="flex flex-col gap-4">
              <p className="text-surface-muted text-sm">{state.note}</p>

              {!live && (
                <>
                  <SegmentedControl
                    label="When"
                    size="sm"
                    value={when}
                    onChange={(v) => {
                      setWhen(v);
                      if (v === "now") set("publishedAt", null);
                    }}
                    options={[
                      { value: "now", label: "Right away" },
                      {
                        value: "later",
                        label: "Schedule",
                        icon: <CalendarClock className="size-4" />,
                      },
                    ]}
                  />
                  {when === "later" && (
                    <DateTimeField
                      label="Goes live on"
                      value={laterDate}
                      min={new Date(now)}
                      onChange={(d) =>
                        set("publishedAt", d ? d.toISOString() : null)
                      }
                      error={
                        laterDate && !laterValid
                          ? "Pick a time in the future"
                          : undefined
                      }
                      hint="It appears on the site at this time by itself."
                    />
                  )}
                </>
              )}

              {live && (
                <DateTimeField
                  label={scheduled ? "Goes live on" : "Published on"}
                  value={form.publishedAt ? new Date(form.publishedAt) : null}
                  onChange={(d) =>
                    set("publishedAt", d ? d.toISOString() : null)
                  }
                  clearable={false}
                  hint={
                    scheduled
                      ? "Change the time, then Update."
                      : "Shown on the article. A future time schedules it again."
                  }
                />
              )}

              <div className="flex flex-col gap-2">
                {!live ? (
                  <Button block disabled={saving} onClick={publish}>
                    {when === "later" ? "Schedule" : "Publish"}
                  </Button>
                ) : (
                  <Button
                    block
                    disabled={saving || !dirty}
                    onClick={() =>
                      save(
                        {},
                        form.publishedAt &&
                          Date.parse(form.publishedAt) > Date.now()
                          ? "Schedule updated"
                          : "Updated",
                      )
                    }
                  >
                    {scheduled ? "Update schedule" : "Update"}
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {!live ? (
                    <Button
                      size="sm"
                      variant="subtle"
                      disabled={saving || (!dirty && !!post)}
                      onClick={() =>
                        save(
                          {
                            status: "DRAFT",
                            publishedAt:
                              when === "later" ? form.publishedAt : null,
                          },
                          "Draft saved",
                        )
                      }
                    >
                      Save draft
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="subtle"
                      disabled={saving}
                      onClick={async () => {
                        const ok = await confirm({
                          title: scheduled
                            ? "Cancel the schedule?"
                            : "Unpublish this article?",
                          description: scheduled
                            ? "It goes back to drafts and won't go live."
                            : "It leaves the site and goes back to drafts. You can publish it again any time.",
                          confirmLabel: scheduled
                            ? "Back to draft"
                            : "Unpublish",
                        });
                        if (ok)
                          save(
                            { status: "DRAFT", publishedAt: null },
                            "Moved back to drafts",
                          );
                      }}
                    >
                      {scheduled ? "Back to draft" : "Unpublish"}
                    </Button>
                  )}
                  {live && !scheduled && !dirty ? (
                    <Button
                      size="sm"
                      variant="subtle"
                      href={`/thoughts/${saved.slug}`}
                      external
                    >
                      View <ExternalLink aria-hidden className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="subtle"
                      disabled={saving || !form.title.trim()}
                      onClick={preview}
                    >
                      <Eye aria-hidden className="size-4" /> Preview
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-surface-muted text-xs">
                Ctrl + S saves without changing its status. Preview saves first,
                then opens the article as readers will see it.
              </p>
            </div>
          </AdminCard>

          <AdminCard title="Cover image">
            <GalleryField
              label="Cover"
              value={form.cover ? [form.cover] : []}
              onChange={(v) => set("cover", v[0] ?? "")}
              max={1}
              hint="Wide images (16:10) work best. Used on cards, the article and link previews."
            />
          </AdminCard>

          <AdminCard title="Organise">
            <div className="flex flex-col gap-4">
              <SelectField
                label="Category"
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                options={[
                  { value: "", label: "No category" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                hint={
                  <Link href="/admin/thoughts/categories" className="underline">
                    Manage categories
                  </Link>
                }
              />
              <SelectField
                label="Author"
                value={form.authorId}
                onChange={(e) => set("authorId", e.target.value)}
                options={[
                  { value: "", label: "No author shown" },
                  ...authors.map((a) => ({
                    value: a.id,
                    label: a.note ? `${a.name} · ${a.note}` : a.name,
                  })),
                ]}
                hint="Authors are your team members (About & team)."
              />
              <TagInput
                label="Tags"
                value={form.tags}
                onChange={(v) => set("tags", v)}
                suggestions={tagSuggestions}
                max={12}
              />
              <SwitchField
                label="Featured"
                description="Shown large at the top of the Thoughts page (the two newest featured)."
                checked={form.isFeatured}
                onCheckedChange={(v) => set("isFeatured", v)}
              />
            </div>
          </AdminCard>

          <AdminCard title="Page address">
            <SlugField
              value={form.slug}
              onChange={(v) => set("slug", v)}
              source={plain(form.title)}
              basePath="/thoughts/"
              error={errors.slug}
            />
            {live && !scheduled && saved.slug !== form.slug && (
              <p className="mt-2 text-xs text-[#9a6700]">
                Changing the address of a published article breaks links people
                have shared.
              </p>
            )}
          </AdminCard>

          <AdminCard title="Search and social">
            <div className="flex flex-col gap-4">
              <TextField
                label="Search title"
                maxLength={70}
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                placeholder={plain(form.title) || "Uses the title"}
                hint="Leave empty to use the title."
              />
              <TextareaField
                label="Search description"
                rows={3}
                maxLength={170}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                placeholder={form.excerpt || "Uses the summary"}
                hint="Leave empty to use the summary."
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-surface-muted text-xs font-bold tracking-wide uppercase">
                  In Google
                </p>
                <div className="rounded-[10px] bg-white p-3 ring-1 ring-black/[0.08]">
                  <p className="truncate text-xs text-[#4d5156]">
                    {host} › thoughts › {form.slug || "…"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[1.0625rem] text-[#1a0dab]">
                    {seoTitle} | Dexta
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#4d5156]">
                    {seoDescription}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-surface-muted text-xs font-bold tracking-wide uppercase">
                  When shared (WhatsApp, LinkedIn, X)
                </p>
                <div className="overflow-hidden rounded-[10px] bg-white ring-1 ring-black/[0.08]">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- preview from any host
                    <img
                      src={coverUrl}
                      alt=""
                      className="aspect-[1.91/1] w-full object-cover"
                    />
                  ) : (
                    <div className="bg-canvas text-surface-muted flex aspect-[1.91/1] items-center justify-center text-xs">
                      Add a cover image
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-surface-muted text-[0.6875rem] uppercase">
                      {host}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-bold">
                      {seoTitle}
                    </p>
                    <p className="text-surface-muted mt-0.5 line-clamp-2 text-xs">
                      {seoDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AdminCard>
        </aside>
      </div>
    </>
  );
}
