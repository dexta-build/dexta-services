/**
 * Catalogue items to and from CSV (spreadsheets). Safe on server and client.
 *
 * Columns: title, category, price, moq, unit, description, tags, images,
 * featured, visible, slug. Tags and images are separated by "|".
 * Only "title" and "price" are required.
 */

export const CSV_COLUMNS = [
  "title",
  "category",
  "price",
  "moq",
  "unit",
  "description",
  "tags",
  "images",
  "featured",
  "visible",
  "slug",
] as const;

export type CsvItem = {
  title: string;
  category: string;
  price: number;
  moq: number;
  unit: string;
  description: string;
  tags: string[];
  images: string[];
  featured: boolean;
  visible: boolean;
  slug: string;
};

export type CsvRow = { line: number; item: CsvItem | null; errors: string[] };

/** RFC 4180-ish parser: quotes, doubled quotes, commas and newlines in quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const truthy = (v: string, fallback: boolean) => {
  const s = v.trim().toLowerCase();
  if (!s) return fallback;
  return ["yes", "y", "true", "1", "x"].includes(s);
};

/** "₦1,800", "1800.00", "1 800" → 1800. NaN when it isn't a number. */
export function parseAmount(v: string) {
  const s = v.replace(/[₦$€£,\s]|NGN/gi, "");
  if (!s) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

const list = (v: string) =>
  v
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

/** Reads a CSV file into items, with a list of problems per row. */
export function readItemsCsv(text: string): {
  rows: CsvRow[];
  missingColumns: string[];
} {
  const table = parseCsv(text);
  if (table.length === 0)
    return { rows: [], missingColumns: ["title", "price"] };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const at = (name: string) => header.indexOf(name);
  const missingColumns = ["title", "price"].filter((c) => at(c) < 0);
  if (missingColumns.length) return { rows: [], missingColumns };

  const rows = table.slice(1).map((cells, i): CsvRow => {
    const get = (name: string) =>
      (at(name) >= 0 ? (cells[at(name)] ?? "") : "").trim();
    const errors: string[] = [];
    const title = get("title");
    const price = parseAmount(get("price"));
    const moqRaw = get("moq");
    const moq = moqRaw ? parseAmount(moqRaw) : 1;
    if (!title) errors.push("No title");
    if (title.length > 120) errors.push("Title is over 120 characters");
    if (!get("price")) errors.push("No price");
    else if (!Number.isFinite(price) || price < 0)
      errors.push("Price isn't a number");
    if (!Number.isFinite(moq) || moq < 1)
      errors.push("Minimum order isn't a whole number");
    const item: CsvItem = {
      title,
      category: get("category"),
      price: Number.isFinite(price) ? price : 0,
      moq: Number.isFinite(moq) && moq >= 1 ? moq : 1,
      unit: get("unit") || "piece",
      description: get("description").slice(0, 600),
      tags: list(get("tags")).slice(0, 12),
      images: list(get("images")).slice(0, 20),
      featured: truthy(get("featured"), false),
      visible: truthy(get("visible"), true),
      slug: get("slug"),
    };
    return { line: i + 2, item: errors.length ? null : item, errors };
  });
  return { rows, missingColumns: [] };
}

const quote = (v: string) =>
  /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

/** Items as a CSV file people can edit and import again. */
export function writeItemsCsv(items: CsvItem[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const it of items) {
    lines.push(
      [
        it.title,
        it.category,
        String(it.price),
        String(it.moq),
        it.unit,
        it.description,
        it.tags.join("|"),
        it.images.join("|"),
        it.featured ? "yes" : "no",
        it.visible ? "yes" : "no",
        it.slug,
      ]
        .map(quote)
        .join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}
