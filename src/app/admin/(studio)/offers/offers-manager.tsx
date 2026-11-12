"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import type { Rates } from "@/lib/site/currency";
import type { OfferCardLabels } from "@/lib/site/offer-labels";
import { Button } from "@/components/site/button";
import type { Surface } from "@/components/site/section";
import {
  CurrencyProvider,
  CurrencySwitcher,
} from "@/components/site/catalogue/currency";
import { OfferCard } from "@/components/site/offers/offer-card";
import { useNow } from "@/components/site/offers/countdown";
import {
  EmptyState,
  StatusPill,
  type PillTone,
} from "@/components/admin/kit/layout";
import {
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import {
  DateTimeField,
  ListEditor,
  NumberField,
} from "@/components/admin/kit/inputs";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { RowActions } from "@/components/admin/kit/row-actions";
import { Callout } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import { useUnsavedChangesWarning } from "@/components/admin/kit/save-bar";
import {
  deleteOffer,
  duplicateOffer,
  reorderOffers,
  saveOffer,
  setOfferFlags,
  type OfferForm,
} from "./actions";

export type AdminOffer = { id: string; form: OfferForm };
type Result = { success: boolean; message?: string };

/** Same colours, in the same order, as the Offers page. */
const PASTELS: Surface[] = ["ice", "mint", "gold", "lilac", "coral", "stone"];

const EMPTY: OfferForm = {
  name: "",
  description: "",
  features: [],
  priceNGN: null,
  priceNote: "",
  badge: "",
  paymentLink: "",
  whatsappEnabled: true,
  startsAt: null,
  endsAt: null,
  isHighlighted: false,
  isVisible: true,
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Where an offer stands right now. */
function statusOf(
  o: OfferForm,
  now: number,
): { label: string; tone: PillTone; detail: string } {
  if (!o.isVisible)
    return { label: "Hidden", tone: "neutral", detail: "Not on the site" };
  if (o.endsAt && Date.parse(o.endsAt) <= now)
    return {
      label: "Ended",
      tone: "danger",
      detail: `Ended ${shortDate(o.endsAt)}`,
    };
  if (o.startsAt && Date.parse(o.startsAt) > now)
    return {
      label: "Scheduled",
      tone: "warning",
      detail: `Starts ${shortDate(o.startsAt)}`,
    };
  return {
    label: "Live",
    tone: "success",
    detail: o.endsAt ? `Ends ${shortDate(o.endsAt)}` : "No end date",
  };
}

const priceText = (o: OfferForm) =>
  o.priceNGN == null
    ? "Custom quote"
    : `₦${o.priceNGN.toLocaleString("en-NG")}${o.priceNote ? ` ${o.priceNote}` : ""}`;

export function OffersManager({
  offers,
  rates,
  whatsappBase,
  labels,
  serverNow,
}: {
  offers: AdminOffer[];
  rates: Rates;
  whatsappBase: string | null;
  labels: OfferCardLabels;
  serverNow: number;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const now = useNow() ?? serverNow;
  const [items, setItems] = useState(offers);
  const [editing, setEditing] = useState<AdminOffer | "new" | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setItems(offers), [offers]);

  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  const live = offers.filter((o) => statusOf(o.form, now).label === "Live");
  const editingIndex =
    editing && editing !== "new"
      ? items.findIndex((o) => o.id === editing.id)
      : items.length;

  return (
    <div className="flex flex-col gap-5">
      {offers.length > 0 && live.length === 0 && (
        <Callout tone="warning" title="No offer is running right now">
          The Offers page shows its &ldquo;No offers&rdquo; message until one is
          live. Check the dates and the &ldquo;Show on the site&rdquo; switch.
        </Callout>
      )}
      {offers.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-surface-muted text-sm">
            {live.length} live · {offers.length} in total. Offers with an end
            date also show in the homepage offers band.
          </p>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus aria-hidden className="size-4" /> Add offer
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Tag />}
          title="No offers yet"
          description="Add your first offer: a price, what's included and how people pay. You'll see the card as you type."
          action={
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus aria-hidden className="size-4" /> Add offer
            </Button>
          }
        />
      ) : (
        <SortableList
          label="Offer order"
          items={items}
          getId={(o) => o.id}
          onReorder={(next) => {
            setItems(next);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(async () => {
              const res = await reorderOffers(next.map((o) => o.id));
              if (!res.success) toast.error(res.message);
              else toast.success("Order saved");
            }, 700);
          }}
          renderItem={(o) => {
            const s = statusOf(o.form, now);
            return (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(o)}
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left outline-none focus-visible:underline"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{o.form.name}</span>
                    <StatusPill tone={s.tone} dot>
                      {s.label}
                    </StatusPill>
                    {o.form.isHighlighted && (
                      <StatusPill tone="royal">Highlighted</StatusPill>
                    )}
                    {o.form.badge && <StatusPill>{o.form.badge}</StatusPill>}
                  </span>
                  <span className="text-surface-muted text-xs">
                    <span className="text-surface-fg font-bold">
                      {priceText(o.form)}
                    </span>{" "}
                    · {s.detail}
                    {" · "}
                    {[
                      o.form.paymentLink && "Pay link",
                      o.form.whatsappEnabled && "WhatsApp",
                    ]
                      .filter(Boolean)
                      .join(" + ") || "Contact page"}
                  </span>
                </button>
                <RowActions
                  label={`Actions for ${o.form.name}`}
                  title={o.form.name}
                  actions={[
                    {
                      label: "Edit",
                      icon: <Pencil />,
                      onSelect: () => setEditing(o),
                    },
                    {
                      label: "View Offers page",
                      icon: <ExternalLink />,
                      href: "/offers#offers",
                      external: true,
                      hidden: s.label !== "Live",
                    },
                    {
                      label: "Duplicate",
                      icon: <Copy />,
                      onSelect: () =>
                        run(
                          () => duplicateOffer(o.id),
                          "Copied (hidden until you show it)",
                        ),
                    },
                    "separator",
                    {
                      label: o.form.isHighlighted
                        ? "Remove highlight"
                        : "Highlight",
                      icon: <Sparkles />,
                      onSelect: () =>
                        run(
                          () =>
                            setOfferFlags(o.id, {
                              isHighlighted: !o.form.isHighlighted,
                            }),
                          o.form.isHighlighted
                            ? "Unhighlighted"
                            : "Highlighted",
                        ),
                    },
                    {
                      label: o.form.isVisible ? "Hide" : "Show",
                      icon: o.form.isVisible ? <EyeOff /> : <Eye />,
                      onSelect: () =>
                        run(
                          () =>
                            setOfferFlags(o.id, {
                              isVisible: !o.form.isVisible,
                            }),
                          o.form.isVisible ? "Hidden" : "Shown",
                        ),
                    },
                    "separator",
                    {
                      label: "Delete",
                      icon: <Trash2 />,
                      danger: true,
                      onSelect: async () => {
                        const ok = await confirm({
                          title: `Delete ${o.form.name}?`,
                          description:
                            "It leaves the site for good. To keep it for later, hide it instead.",
                          confirmLabel: "Delete",
                          danger: true,
                        });
                        if (ok) run(() => deleteOffer(o.id), "Offer deleted");
                      },
                    },
                  ]}
                />
              </div>
            );
          }}
        />
      )}

      <CurrencyProvider rates={rates}>
        <OfferPanel
          key={editing === "new" ? "new" : (editing?.id ?? "closed")}
          offer={editing === "new" ? null : editing}
          open={editing !== null}
          surface={PASTELS[Math.max(0, editingIndex) % PASTELS.length]}
          whatsappBase={whatsappBase}
          labels={labels}
          serverNow={serverNow}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      </CurrencyProvider>
    </div>
  );
}

function OfferPanel({
  offer,
  open,
  surface,
  whatsappBase,
  labels,
  serverNow,
  onClose,
  onSaved,
}: {
  offer: AdminOffer | null;
  open: boolean;
  surface: Surface;
  whatsappBase: string | null;
  labels: OfferCardLabels;
  serverNow: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = offer?.form ?? EMPTY;
  const [form, setForm] = useState<OfferForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, start] = useTransition();
  const confirm = useConfirm();
  const now = useNow() ?? serverNow;
  const dirty = open && JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChangesWarning(dirty);
  const set = <K extends keyof OfferForm>(k: K, v: OfferForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const status = statusOf(form, now);

  const close = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Close without saving?",
        description: "Your changes will be lost.",
        confirmLabel: "Close",
        danger: true,
      }))
    )
      return;
    onClose();
  };

  const preview = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold">Live preview</span>
        <CurrencySwitcher />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <StatusPill tone={status.tone} dot>
          {status.label}
        </StatusPill>
        <span className="text-surface-muted">{status.detail}</span>
      </div>
      <div className="dx-site pointer-events-none select-none" aria-hidden>
        <OfferCard
          offer={{
            id: offer?.id ?? "preview",
            name: form.name || "Offer name",
            description:
              form.description || "A short description of the offer.",
            features: form.features.filter((f) => f.trim()),
            priceNGN: form.priceNGN,
            priceNote: form.priceNote.trim() || null,
            badge: form.badge.trim() || null,
            paymentLink: form.paymentLink.trim() || null,
            whatsappEnabled: form.whatsappEnabled,
            startsAt: form.startsAt,
            endsAt: form.endsAt,
            highlighted: form.isHighlighted,
          }}
          surface={surface}
          whatsappBase={whatsappBase ?? "https://wa.me/"}
          labels={labels}
        />
      </div>
      <p className="text-surface-muted text-xs">
        Buttons are inactive here. The countdown runs to the end date.
      </p>
    </div>
  );

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => !o && void close()}
      title={offer ? initial.name : "Add an offer"}
      description="Everything on its card. The preview updates as you type."
      width="2xl"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={() => void close()}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !dirty}
            onClick={() =>
              start(async () => {
                const res = await saveOffer(offer?.id ?? null, form);
                if (!res.success) {
                  setErrors(res.errors ?? {});
                  return void toast.error(res.message);
                }
                toast.success(offer ? "Offer saved" : "Offer added");
                onSaved();
              })
            }
          >
            {saving ? "Saving" : offer ? "Save" : "Add offer"}
          </Button>
        </>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {Object.keys(errors).length > 0 && (
            <Callout tone="danger" title="Some fields need attention">
              They&apos;re marked in red below.
            </Callout>
          )}
          <TextField
            label="Name"
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            placeholder="e.g. Launch bundle"
          />
          <TextareaField
            label="Description"
            required
            rows={3}
            maxLength={400}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
          />
          <ListEditor
            label="What's included"
            value={form.features}
            onChange={(v) => set("features", v)}
            max={16}
            addLabel="Add a feature"
            placeholder="e.g. Five-page website"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Price"
              prefix="₦"
              min={0}
              value={form.priceNGN}
              onChange={(v) =>
                set("priceNGN", v == null ? null : Math.round(v))
              }
              error={errors.priceNGN}
              placeholder="Empty = Custom quote"
              hint="Whole naira. Leave empty for a custom quote."
            />
            <TextField
              label="Price note"
              maxLength={40}
              value={form.priceNote}
              onChange={(e) => set("priceNote", e.target.value)}
              placeholder="/ month, one-off, per event"
              disabled={form.priceNGN == null}
            />
          </div>
          <TextField
            label="Badge"
            maxLength={30}
            value={form.badge}
            onChange={(e) => set("badge", e.target.value)}
            placeholder="e.g. Best value, 15% off, Bundle"
            hint="Optional label above the name."
          />

          <fieldset className="border-surface-rule flex flex-col gap-4 rounded-[12px] border p-4">
            <legend className="px-1 text-sm font-bold">How people pay</legend>
            <TextField
              label="Payment link"
              value={form.paymentLink}
              onChange={(e) => set("paymentLink", e.target.value.trim())}
              placeholder="https://paystack.com/pay/…"
              error={errors.paymentLink}
              hint="Paystack, Flutterwave, Stripe or any checkout page. Adds a Pay now button."
            />
            <SwitchField
              label="Order on WhatsApp"
              description={
                whatsappBase
                  ? "Adds a WhatsApp button with the offer and price filled in."
                  : "Add a WhatsApp number in Site settings for this button to show."
              }
              checked={form.whatsappEnabled}
              onCheckedChange={(v) => set("whatsappEnabled", v)}
            />
            {!form.paymentLink && !form.whatsappEnabled && (
              <p className="text-surface-muted text-xs">
                With neither, the card links to the contact page.
              </p>
            )}
          </fieldset>

          <fieldset className="border-surface-rule flex flex-col gap-4 rounded-[12px] border p-4">
            <legend className="px-1 text-sm font-bold">When it runs</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <DateTimeField
                label="Starts"
                value={form.startsAt ? new Date(form.startsAt) : null}
                onChange={(d) => set("startsAt", d ? d.toISOString() : null)}
                hint="Empty = right away."
                error={errors.startsAt}
              />
              <DateTimeField
                label="Ends"
                value={form.endsAt ? new Date(form.endsAt) : null}
                onChange={(d) => set("endsAt", d ? d.toISOString() : null)}
                min={form.startsAt ? new Date(form.startsAt) : undefined}
                hint="Shows a countdown; the offer disappears at this time."
                error={errors.endsAt}
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-4">
            <SwitchField
              label="Highlight"
              description="Royal blue card, to draw the eye to one offer."
              checked={form.isHighlighted}
              onCheckedChange={(v) => set("isHighlighted", v)}
            />
            <SwitchField
              label="Show on the site"
              description="Hidden offers stay here for later."
              checked={form.isVisible}
              onCheckedChange={(v) => set("isVisible", v)}
            />
          </div>
        </div>

        <aside className="xl:sticky xl:top-0 xl:self-start">{preview}</aside>
      </div>
    </SidePanel>
  );
}
