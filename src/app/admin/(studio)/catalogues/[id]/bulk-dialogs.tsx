"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, FileWarning } from "lucide-react";
import type { AdminCategory, AdminItem } from "@/lib/catalogue/admin";
import {
  readItemsCsv,
  writeItemsCsv,
  type CsvItem,
  type CsvRow,
} from "@/lib/catalogue/csv";
import { Button } from "@/components/site/button";
import { Modal } from "@/components/admin/kit/overlays";
import { SelectField } from "@/components/admin/kit/fields";
import { CheckboxField } from "@/components/admin/kit/fields";
import { NumberField, SegmentedControl } from "@/components/admin/kit/inputs";
import { FileDropzone } from "@/components/admin/kit/dropzone";
import { Callout } from "@/components/admin/kit/display";
import {
  adjustPrices,
  importItems,
  moveItems,
  type PriceChange,
} from "../actions";

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

/* ------------------------------------------------------------------ */

/** Change the prices of several designs at once, with a preview. */
export function PriceDialog({
  catalogueId,
  items,
  open,
  onClose,
  onDone,
}: {
  catalogueId: string;
  items: AdminItem[];
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<PriceChange["mode"]>("percent");
  const [value, setValue] = useState<number | null>(10);
  const [roundTo, setRoundTo] = useState<PriceChange["roundTo"]>(10);
  const [saving, start] = useTransition();

  const next = (price: number) => {
    const v = value ?? 0;
    const raw =
      mode === "percent"
        ? price * (1 + v / 100)
        : mode === "amount"
          ? price + v
          : v;
    return Math.max(0, Math.round(raw / roundTo) * roundTo);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={`Change ${items.length} price${items.length === 1 ? "" : "s"}`}
      description="Raise or lower prices together, then round them neatly."
      size="lg"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || value == null || items.length === 0}
            onClick={() =>
              start(async () => {
                const res = await adjustPrices(
                  catalogueId,
                  items.map((i) => i.id),
                  { mode, value: value ?? 0, roundTo },
                );
                if (!res.success) return void toast.error(res.message);
                toast.success(
                  `${res.count} price${res.count === 1 ? "" : "s"} updated`,
                );
                onDone();
              })
            }
          >
            {saving ? "Saving" : "Update prices"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl
          label="How"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setValue(m === "percent" ? 10 : m === "amount" ? 500 : null);
          }}
          options={[
            { value: "percent", label: "By percent" },
            { value: "amount", label: "By amount" },
            { value: "set", label: "Set price" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label={
              mode === "percent"
                ? "Percent (use − to lower)"
                : mode === "amount"
                  ? "Naira (use − to lower)"
                  : "New price"
            }
            prefix={mode === "percent" ? undefined : "₦"}
            suffix={mode === "percent" ? "%" : undefined}
            min={mode === "set" ? 0 : undefined}
            value={value}
            onChange={setValue}
          />
          <SelectField
            label="Round to the nearest"
            value={String(roundTo)}
            onChange={(e) =>
              setRoundTo(Number(e.target.value) as PriceChange["roundTo"])
            }
            options={[
              { value: "1", label: "₦1" },
              { value: "10", label: "₦10" },
              { value: "50", label: "₦50" },
              { value: "100", label: "₦100" },
            ]}
          />
        </div>
        <div className="border-surface-rule max-h-64 overflow-y-auto rounded-[10px] border">
          <table className="w-full text-sm">
            <caption className="sr-only">Price preview</caption>
            <thead className="bg-canvas text-surface-muted sticky top-0 text-left text-xs">
              <tr>
                <th className="px-3 py-2 font-bold">Design</th>
                <th className="px-3 py-2 text-right font-bold">Now</th>
                <th className="px-3 py-2 text-right font-bold">New</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-surface-rule border-t">
                  <td className="px-3 py-2">{it.title}</td>
                  <td className="text-surface-muted px-3 py-2 text-right tabular-nums">
                    {naira(it.price)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">
                    {naira(next(it.price))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

export function MoveDialog({
  catalogueId,
  ids,
  categories,
  open,
  onClose,
  onDone,
}: {
  catalogueId: string;
  ids: string[];
  categories: AdminCategory[];
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [target, setTarget] = useState(categories[0]?.id ?? "");
  const [saving, start] = useTransition();
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={`Move ${ids.length} design${ids.length === 1 ? "" : "s"}`}
      size="sm"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={() =>
              start(async () => {
                const res = await moveItems(catalogueId, ids, target || null);
                if (!res.success) return void toast.error(res.message);
                toast.success("Moved");
                onDone();
              })
            }
          >
            {saving ? "Moving" : "Move"}
          </Button>
        </>
      }
    >
      <SelectField
        label="To category"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        options={[
          ...categories.map((c) => ({ value: c.id, label: c.name })),
          { value: "", label: "No category (Other)" },
        ]}
      />
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

export function exportCsv(
  catalogueSlug: string,
  items: AdminItem[],
  categories: AdminCategory[],
) {
  const rows: CsvItem[] = items.map((it) => ({
    title: it.title,
    category: categories.find((c) => c.id === it.categoryId)?.name ?? "",
    price: it.price,
    moq: it.moq,
    unit: it.unit,
    description: it.description,
    tags: it.tags,
    images: it.media,
    featured: it.isFeatured,
    visible: it.isVisible,
    slug: it.slug,
  }));
  const blob = new globalThis.Blob([writeItemsCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${catalogueSlug}-designs.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const TEMPLATE_ROWS: CsvItem[] = [
  {
    title: "Gold foil invitation",
    category: "Invitation cards",
    price: 1800,
    moq: 50,
    unit: "card",
    description: "Thick card with gold foil names and envelope.",
    tags: ["Foil", "Premium"],
    images: [],
    featured: true,
    visible: true,
    slug: "",
  },
];

/** Import designs from a spreadsheet saved as CSV, with a check first. */
export function CsvImportDialog({
  catalogueId,
  catalogueSlug,
  open,
  onClose,
  onDone,
}: {
  catalogueId: string;
  catalogueSlug: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [update, setUpdate] = useState(true);
  const [saving, start] = useTransition();
  const good = useMemo(
    () => rows.flatMap((r) => (r.item ? [r.item] : [])),
    [rows],
  );
  const bad = rows.filter((r) => !r.item);

  const reset = () => {
    setFileName("");
    setRows([]);
    setMissing([]);
  };

  const downloadTemplate = () => {
    const blob = new globalThis.Blob([writeItemsCsv(TEMPLATE_ROWS)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogue-designs-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
      title="Import designs from CSV"
      description="Save your spreadsheet as CSV (Excel and Google Sheets both can)."
      size="lg"
      footer={
        <>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || good.length === 0}
            onClick={() =>
              start(async () => {
                const res = await importItems(catalogueId, good, update);
                if (!res.success) return void toast.error(res.message);
                toast.success(
                  `${res.created} added${res.updated ? `, ${res.updated} updated` : ""}`,
                );
                reset();
                onDone();
              })
            }
          >
            {saving
              ? "Importing"
              : good.length
                ? `Import ${good.length} design${good.length === 1 ? "" : "s"}`
                : "Import"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {!fileName ? (
          <>
            <FileDropzone
              accept=".csv,text/csv"
              maxSizeMB={5}
              label="Drop a CSV file here or click to choose"
              description="One design per row. The first row holds the column names."
              onReject={(m) => toast.error(m)}
              onFiles={async ([file]) => {
                if (!file) return;
                const text = await file.text();
                const result = readItemsCsv(text);
                setFileName(file.name);
                setRows(result.rows.slice(0, 1000));
                setMissing(result.missingColumns);
              }}
            />
            <div className="bg-canvas flex flex-col gap-2 rounded-[10px] p-4 text-sm">
              <p className="font-bold">Columns</p>
              <p className="text-surface-muted">
                <b>title</b> and <b>price</b> are required. Optional: category,
                moq, unit, description, tags, images, featured, visible, slug.
                Separate several tags or images with <code>|</code>. Images are
                media library IDs or web addresses. featured and visible take
                yes or no.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="subtle" onClick={downloadTemplate}>
                  <Download aria-hidden className="size-4" /> Download a
                  template
                </Button>
              </div>
            </div>
          </>
        ) : missing.length ? (
          <Callout
            tone="danger"
            title={`${fileName} is missing ${missing.join(" and ")}`}
            action={
              <Button size="sm" variant="subtle" onClick={reset}>
                Choose another file
              </Button>
            }
          >
            The first row must hold the column names, including{" "}
            {missing.join(" and ")}.
          </Callout>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                <b>{fileName}</b>: {good.length} ready
                {bad.length > 0 && `, ${bad.length} with problems`}
              </p>
              <Button size="sm" variant="subtle" onClick={reset}>
                Choose another file
              </Button>
            </div>
            {bad.length > 0 && (
              <Callout
                tone="warning"
                title={`${bad.length} row${bad.length === 1 ? "" : "s"} will be skipped`}
              >
                <ul className="mt-1 flex max-h-32 flex-col gap-1 overflow-y-auto">
                  {bad.slice(0, 50).map((r) => (
                    <li key={r.line} className="flex gap-2">
                      <FileWarning
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0"
                      />
                      Row {r.line}: {r.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </Callout>
            )}
            {good.length > 0 && (
              <div className="border-surface-rule max-h-64 overflow-auto rounded-[10px] border">
                <table className="w-full min-w-[32rem] text-sm">
                  <caption className="sr-only">Designs to import</caption>
                  <thead className="bg-canvas text-surface-muted sticky top-0 text-left text-xs">
                    <tr>
                      <th className="px-3 py-2 font-bold">Name</th>
                      <th className="px-3 py-2 font-bold">Category</th>
                      <th className="px-3 py-2 text-right font-bold">Price</th>
                      <th className="px-3 py-2 text-right font-bold">MOQ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {good.slice(0, 100).map((it, i) => (
                      <tr key={i} className="border-surface-rule border-t">
                        <td className="px-3 py-2">{it.title}</td>
                        <td className="text-surface-muted px-3 py-2">
                          {it.category || "Other"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {naira(it.price)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {it.moq} × {it.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <CheckboxField
              label="Update designs that already exist"
              description={`A row whose address (slug, or its name made into one) matches a design in /catalogue/${catalogueSlug} updates it. Untick to always add new designs.`}
              checked={update}
              onCheckedChange={setUpdate}
            />
            <p className="text-surface-muted text-xs">
              New categories are created automatically.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
