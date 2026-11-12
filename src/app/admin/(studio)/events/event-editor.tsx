"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  AdminRegistration,
  EventFieldsMap,
  EventForm,
} from "@/lib/events/admin";
import {
  FIELD_TYPES,
  fieldKey,
  type FieldType,
  type FormFieldDef,
} from "@/lib/events/fields";
import { isoToZoned, TIMEZONES, zonedToIso } from "@/lib/events/time";
import { Button } from "@/components/site/button";
import { RegistrationForm } from "@/components/site/events/registration-form";
import {
  PageHeader,
  StatusPill,
  AdminCard,
} from "@/components/admin/kit/layout";
import {
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import {
  ListEditor,
  NumberField,
  SegmentedControl,
  SlugField,
} from "@/components/admin/kit/inputs";
import { Tabs } from "@/components/admin/kit/overlays";
import { Callout } from "@/components/admin/kit/display";
import { SaveBar } from "@/components/admin/kit/save-bar";
import { GalleryField } from "@/components/admin/content/section-form";
import { removeEventRedirect, saveEvent } from "./actions";
import { eventState, eventWhen } from "./events-manager";
import { RegistrationsTable } from "./registrations-table";

const EMPTY: EventForm = {
  title: "",
  slug: "",
  description: "",
  dateTime: null,
  timezone: "Africa/Lagos",
  location: "",
  image: "",
  attendeeLimit: null,
  status: "DRAFT",
  isPaid: false,
  priceNGN: null,
  priceNote: "",
  paymentLink: "",
  fields: [],
};

export function EventEditor({
  id,
  initial,
  oldSlugs: initialOld = [],
  counts,
  registrations,
  fieldsMap,
  eventOptions,
}: {
  id: string | null;
  initial: EventForm | null;
  oldSlugs?: string[];
  counts?: { pending: number; accepted: number; declined: number };
  registrations?: AdminRegistration[];
  fieldsMap?: EventFieldsMap;
  eventOptions?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [saved, setSaved] = useState<EventForm>(initial ?? EMPTY);
  const [form, setForm] = useState<EventForm>(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState(params.get("tab") ?? "details");
  const [saving, start] = useTransition();
  const [oldSlugs, setOldSlugs] = useState(initialOld);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof EventForm>(k: K, v: EventForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const total = counts ? counts.pending + counts.accepted + counts.declined : 0;
  const state = eventState(
    { status: saved.status, dateTime: saved.dateTime ?? "" },
    saved.dateTime ? Date.now() : 0,
  );

  const save = () =>
    start(async () => {
      const res = await saveEvent(id, form);
      if (!res.success) {
        setErrors(res.errors ?? {});
        toast.error(res.message);
        if (
          res.errors &&
          Object.keys(res.errors).some((k) => k.startsWith("fields."))
        )
          setTab("form");
        else if (res.errors) setTab("details");
        return;
      }
      setErrors({});
      if (id && saved.slug && saved.slug !== res.slug)
        setOldSlugs((o) => [
          saved.slug,
          ...o.filter((x) => x !== saved.slug && x !== res.slug),
        ]);
      else setOldSlugs((o) => o.filter((x) => x !== res.slug));
      const clean = { ...form, slug: res.slug };
      setForm(clean);
      setSaved(clean);
      toast.success(id ? "Event saved" : "Event created");
      if (!id) router.replace(`/admin/events/${res.id}`);
      else router.refresh();
    });

  const localValue = isoToZoned(form.dateTime, form.timezone);

  const details = (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <TextField
          label="Event name"
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          error={errors.title}
          placeholder="e.g. Devs Day 2026"
        />
        <div className="flex flex-col gap-2">
          <SlugField
            value={form.slug}
            onChange={(v) => set("slug", v)}
            source={form.title}
            basePath="/events/"
            error={errors.slug}
          />
          {id && saved.slug && form.slug !== saved.slug && (
            <p className="text-surface-muted text-xs">
              When you save, /events/{saved.slug} will keep working and forward
              to the new address.
            </p>
          )}
          {oldSlugs.length > 0 && (
            <div className="bg-canvas flex flex-col gap-2 rounded-[8px] p-3">
              <p className="text-xs font-bold">
                Old addresses that forward here
              </p>
              <ul className="flex flex-col gap-1">
                {oldSlugs.map((o) => (
                  <li
                    key={o}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">/events/{o}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!id) return;
                        const res = await removeEventRedirect(id, o);
                        if (!res.success) return void toast.error(res.message);
                        setOldSlugs((x) => x.filter((y) => y !== o));
                        toast.success(`/events/${o} no longer forwards here`);
                      }}
                      className="text-surface-muted hover:text-[#c2410c] shrink-0 text-xs font-bold underline"
                    >
                      Stop forwarding
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <TextareaField
          label="About this event"
          required
          rows={8}
          maxLength={5000}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
          hint="Who it's for, what happens and what to bring. Line breaks are kept."
        />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <TextField
            label="Date and time"
            required
            type="datetime-local"
            value={localValue}
            onChange={(e) =>
              set("dateTime", zonedToIso(e.target.value, form.timezone))
            }
            error={errors.dateTime}
            hint="As the clock reads where the event happens."
          />
          <SelectField
            label="Timezone"
            value={form.timezone}
            onChange={(e) => {
              const tz = e.target.value;
              // Keep the same clock time in the new timezone.
              setForm((f) => ({
                ...f,
                timezone: tz,
                dateTime: localValue ? zonedToIso(localValue, tz) : f.dateTime,
              }));
            }}
            options={
              TIMEZONES.some((t) => t.value === form.timezone)
                ? TIMEZONES
                : [{ value: form.timezone, label: form.timezone }, ...TIMEZONES]
            }
          />
        </div>
        <TextField
          label="Location"
          required
          maxLength={300}
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          error={errors.location}
          placeholder="e.g. Dexta Studios, Port Harcourt, or Online (Zoom)"
          hint="Include “Online”, Zoom, Google Meet or similar for online events; the site labels it Online."
        />
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <AdminCard title="Registration">
          <div className="flex flex-col gap-4">
            <SegmentedControl
              label="Status"
              size="sm"
              value={form.status}
              onChange={(v) => set("status", v)}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "PUBLISHED", label: "Open" },
                { value: "CLOSED", label: "Closed" },
              ]}
            />
            <p className="text-surface-muted -mt-2 text-xs">
              {form.status === "DRAFT"
                ? "Hidden from the site until you open it."
                : form.status === "PUBLISHED"
                  ? "On the site and taking registrations."
                  : "On the site, but the form says registration is closed."}
            </p>
            <NumberField
              label="Seats"
              min={1}
              value={form.attendeeLimit}
              onChange={(v) =>
                set(
                  "attendeeLimit",
                  v == null ? null : Math.max(1, Math.round(v)),
                )
              }
              placeholder="No limit"
              error={errors.attendeeLimit}
              hint="Leave empty for no limit. When accepted people reach this number, registration closes and anyone still pending is told it's full."
            />
            {counts &&
              form.attendeeLimit != null &&
              counts.accepted > form.attendeeLimit && (
                <p className="text-xs text-[#9a6700]">
                  {counts.accepted} people are already accepted.
                </p>
              )}
          </div>
        </AdminCard>
        <AdminCard title="Entry">
          <div className="flex flex-col gap-4">
            <SegmentedControl
              label="Tickets"
              size="sm"
              value={form.isPaid ? "paid" : "free"}
              onChange={(v) => set("isPaid", v === "paid")}
              options={[
                { value: "free", label: "Free" },
                { value: "paid", label: "Paid" },
              ]}
            />
            {form.isPaid ? (
              <>
                <NumberField
                  label="Price"
                  prefix="₦"
                  min={0}
                  value={form.priceNGN}
                  onChange={(v) =>
                    set("priceNGN", v == null ? null : Math.round(v))
                  }
                  error={errors.priceNGN}
                  required
                />
                <TextField
                  label="Payment link"
                  type="url"
                  value={form.paymentLink}
                  onChange={(e) => set("paymentLink", e.target.value)}
                  placeholder="https://paystack.com/pay/…"
                  error={errors.paymentLink}
                  hint="Your Paystack, Flutterwave or bank payment page. People register on the site, then pay here."
                  required
                />
                <TextField
                  label="Price note"
                  maxLength={120}
                  value={form.priceNote}
                  onChange={(e) => set("priceNote", e.target.value)}
                  placeholder="e.g. Early bird until 1 March"
                  error={errors.priceNote}
                />
              </>
            ) : (
              <p className="text-surface-muted -mt-2 text-xs">
                Shown as Free on the event page and cards.
              </p>
            )}
          </div>
        </AdminCard>
        <AdminCard title="Image">
          <GalleryField
            label="Event image"
            value={form.image ? [form.image] : []}
            onChange={(v) => set("image", v[0] ?? "")}
            max={1}
            hint="A photo, poster or flyer. It shows in full on the event page, and cropped on cards and link previews."
          />
        </AdminCard>
      </div>
    </div>
  );

  const formTab = (
    <FormBuilder
      fields={form.fields}
      onChange={(fields) => set("fields", fields)}
      errors={errors}
      hasRegistrations={total > 0}
    />
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Events", href: "/admin/events" },
          { label: id ? saved.title || "Event" : "New event" },
        ]}
        title={id ? "Edit *event*" : "New *event*"}
        description={
          id && saved.dateTime
            ? `${eventWhen(saved.dateTime, saved.timezone)} · ${saved.location}`
            : undefined
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {id && (
              <StatusPill tone={state.tone} dot>
                {state.label}
              </StatusPill>
            )}
            {id && saved.status !== "DRAFT" && (
              <Button
                size="sm"
                variant="subtle"
                href={`/events/${saved.slug}`}
                external
              >
                View <ExternalLink aria-hidden className="size-4" />
              </Button>
            )}
            <Button
              size="sm"
              disabled={saving || (!dirty && !!id)}
              onClick={save}
            >
              {saving ? "Saving" : id ? "Save" : "Create event"}
            </Button>
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
      <Tabs
        label="Event sections"
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "details", label: "Details", content: details },
          {
            value: "form",
            label: "Registration form",
            badge: form.fields.length + 2,
            content: formTab,
          },
          ...(id && registrations && fieldsMap
            ? [
                {
                  value: "registrations",
                  label: "Registrations",
                  badge: counts?.pending ? `${counts.pending} new` : total,
                  content: (
                    <RegistrationsTable
                      registrations={registrations}
                      fields={fieldsMap}
                      events={eventOptions ?? []}
                      eventId={id}
                    />
                  ),
                },
              ]
            : []),
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
        saveLabel={id ? "Save event" : "Create event"}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function FormBuilder({
  fields,
  onChange,
  errors,
  hasRegistrations,
}: {
  fields: FormFieldDef[];
  onChange: (fields: FormFieldDef[]) => void;
  errors: Record<string, string>;
  hasRegistrations: boolean;
}) {
  const update = (i: number, patch: Partial<FormFieldDef>) =>
    onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, by: -1 | 1) => {
    const next = [...fields];
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (type: FieldType) => {
    const label =
      type === "CHECKBOX"
        ? "Agreement"
        : FIELD_TYPES.find((t) => t.value === type)!.label;
    onChange([
      ...fields,
      {
        name: fieldKey(
          label,
          fields.map((f) => f.name),
        ),
        label,
        type,
        placeholder:
          type === "CHECKBOX" ? "I agree to the event guidelines" : "",
        required: false,
        options: type === "SELECT" ? ["Option 1", "Option 2"] : [],
      },
    ]);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex min-w-0 flex-col gap-4">
        {hasRegistrations && (
          <Callout tone="info" title="People have already registered">
            Changing a question&apos;s wording is safe. Removed questions keep
            the answers already given; they show as &ldquo;old question&rdquo;.
          </Callout>
        )}
        {(["Full name", "Email"] as const).map((label) => (
          <div
            key={label}
            className="bg-canvas flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm"
          >
            <Lock aria-hidden className="text-surface-muted size-4" />
            <span className="font-bold">{label}</span>
            <span className="text-surface-muted ml-auto text-xs">
              Always asked · required
            </span>
          </div>
        ))}

        {fields.map((f, i) => (
          <AdminCard key={`${f.name}-${i}`} padded>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-surface-muted text-xs font-bold tracking-wide uppercase">
                  Question {i + 1}
                </span>
                <span className="flex items-center gap-1">
                  <IconBtn
                    label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Move down"
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Remove question"
                    danger
                    onClick={() => onChange(fields.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </IconBtn>
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <TextField
                  label="Question"
                  required
                  maxLength={120}
                  value={f.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  error={errors[`fields.${i}.label`]}
                />
                <SelectField
                  label="Answer type"
                  value={f.type}
                  onChange={(e) => {
                    const type = e.target.value as FieldType;
                    update(i, {
                      type,
                      options:
                        type === "SELECT" && f.options.length === 0
                          ? ["Option 1", "Option 2"]
                          : f.options,
                    });
                  }}
                  options={FIELD_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                />
              </div>
              <TextField
                label={
                  f.type === "CHECKBOX"
                    ? "Text beside the tick box"
                    : f.type === "SELECT"
                      ? "Placeholder (before a choice)"
                      : "Placeholder (example answer)"
                }
                maxLength={200}
                value={f.placeholder}
                onChange={(e) => update(i, { placeholder: e.target.value })}
                placeholder={
                  f.type === "CHECKBOX"
                    ? "I agree to the event guidelines"
                    : f.type === "SELECT"
                      ? "Choose…"
                      : "Optional"
                }
              />
              {f.type === "SELECT" && (
                <div className="flex flex-col gap-1.5">
                  <ListEditor
                    label="Choices"
                    value={f.options}
                    onChange={(v) => update(i, { options: v })}
                    max={50}
                    addLabel="Add a choice"
                    placeholder="A choice"
                  />
                  {errors[`fields.${i}.options`] && (
                    <p className="text-xs text-[#c2410c]">
                      {errors[`fields.${i}.options`]}
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SwitchField
                  label="Required"
                  checked={f.required}
                  onCheckedChange={(v) => update(i, { required: v })}
                />
                <span className="text-surface-muted text-xs">
                  Answer key: <code>{f.name}</code>
                  {errors[`fields.${i}.name`] && (
                    <span className="text-[#c2410c]">
                      {" "}
                      · {errors[`fields.${i}.name`]}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </AdminCard>
        ))}

        <div className="border-surface-rule flex flex-col gap-3 rounded-[12px] border border-dashed p-4">
          <p className="text-sm font-bold">Add a question</p>
          <div className="flex flex-wrap gap-2">
            {FIELD_TYPES.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant="subtle"
                onClick={() => add(t.value)}
                title={t.hint}
              >
                <Plus aria-hidden className="size-4" /> {t.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-3 text-sm font-bold">Preview</p>
        <div className="dx-site bg-canvas rounded-[14px] p-4">
          <RegistrationForm fields={fields} preview />
        </div>
        <p className="text-surface-muted mt-2 text-xs">
          Try it: the checks work, nothing is sent. Words around the form are in
          Pages → Event pages.
        </p>
      </aside>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={
        danger
          ? "inline-flex size-8 items-center justify-center rounded-[8px] text-[#c2410c] hover:bg-[#c2410c]/10 disabled:opacity-35"
          : "inline-flex size-8 items-center justify-center rounded-[8px] hover:bg-black/[0.06] disabled:opacity-35"
      }
    >
      {children}
    </button>
  );
}
