"use client";

import { useMemo, useState } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/site/button";
import { EmptyState } from "./layout";
import { RowActions, type RowAction } from "./row-actions";
import { SearchInput } from "./inputs";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  className?: string;
  /**
   * On phones, rows become cards: the `primary` column is the card title,
   * the others are shown as label/value pairs underneath.
   */
  primary?: boolean;
  /** Leave this column out of the phone card (it's still in the table). */
  hideOnMobile?: boolean;
  /** Only show in the table from this width up (keeps tablets tidy). */
  hideBelow?: "lg" | "xl";
};

export type TableFilter<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

export type BulkAction = {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: (ids: string[]) => void | Promise<void>;
};

type Sort = { key: string; dir: "asc" | "desc" } | null;

const HIDE_BELOW = {
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

/**
 * Admin list view: search, filters, sortable columns, a "⋯" actions menu
 * per row, row selection with a bulk-actions bar, and pagination.
 *
 * Tablets and desktops get a table; phones get one card per row with the
 * same selection and "⋯" menu. Works on rows already loaded on the page
 * (admin lists are small); swap in server paging if a list grows.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  rowLabel,
  rowActions,
  searchText,
  searchPlaceholder = "Search",
  filters = [],
  bulkActions = [],
  pageSize = 20,
  onRowClick,
  empty,
  toolbar,
  label,
  initialFilters,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /** Short name for a row, used in screen reader labels ("Actions for …"). */
  rowLabel?: (row: T) => string;
  /** The "⋯" menu for each row. */
  rowActions?: (row: T) => RowAction[];
  /** Text to search on for each row. Leave out to hide the search box. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: TableFilter<T>[];
  bulkActions?: BulkAction[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  empty?: {
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    icon?: React.ReactNode;
  };
  /** Extra controls on the right of the toolbar (e.g. an "Add" button). */
  toolbar?: React.ReactNode;
  /** Accessible name for the table. */
  label: string;
  /** Filters already set when the table opens, e.g. { assigned: "me" }. */
  initialFilters?: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    initialFilters ?? {},
  );
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((row) => {
      if (q && searchText && !searchText(row).toLowerCase().includes(q))
        return false;
      return filters.every((f) => {
        const v = filterValues[f.key];
        return !v || f.match(row, v);
      });
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const get = col.sortValue;
        out = [...out].sort((a, b) => {
          const av = get(a);
          const bv = get(b);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          const cmp =
            typeof av === "string" && typeof bv === "string"
              ? av.localeCompare(bv, undefined, {
                  sensitivity: "base",
                  numeric: true,
                })
              : Number(av) - Number(bv);
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, query, searchText, filters, filterValues, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    current * pageSize,
    current * pageSize + pageSize,
  );
  const visibleIds = visible.map(getRowId);
  const selectable = bulkActions.length > 0;
  const allOnPage =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someOnPage = visibleIds.some((id) => selected.has(id));
  const hasFilters = !!query || Object.values(filterValues).some(Boolean);
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const cardFields = columns.filter((c) => c !== primary && !c.hideOnMobile);
  const sortable = columns.filter((c) => c.sortValue);
  const nameOf = (row: T) => rowLabel?.(row) ?? "this row";

  const toggleSort = (key: string) => {
    setSort((s) =>
      s?.key !== key
        ? { key, dir: "asc" }
        : s.dir === "asc"
          ? { key, dir: "desc" }
          : null,
    );
  };

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (allOnPage) next.delete(id);
        else next.add(id);
      }
      return next;
    });

  const runBulk = async (action: BulkAction) => {
    await action.onClick([...selected]);
    setSelected(new Set());
  };

  const resetPage = () => setPage(0);

  return (
    <div className="flex flex-col gap-4">
      {(searchText || filters.length > 0 || toolbar) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {searchText && (
              <SearchInput
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  resetPage();
                }}
                placeholder={searchPlaceholder}
                className="w-full md:w-72"
              />
            )}
            {filters.map((f) => (
              <FilterSelect
                key={f.key}
                filter={f}
                value={filterValues[f.key] ?? ""}
                onChange={(v) => {
                  setFilterValues((prev) => ({ ...prev, [f.key]: v }));
                  resetPage();
                }}
              />
            ))}
            {/* Phones have no column headers, so sorting lives here. */}
            {sortable.length > 0 && (
              <label className="relative md:hidden">
                <span className="sr-only">Sort by</span>
                <select
                  value={sort ? `${sort.key}:${sort.dir}` : ""}
                  onChange={(e) => {
                    const [key, dir] = e.target.value.split(":");
                    setSort(key ? { key, dir: dir as "asc" | "desc" } : null);
                  }}
                  className="border-charcoal/[0.14] h-10 cursor-pointer appearance-none rounded-full border bg-white px-4 pr-8 text-sm font-bold outline-none"
                >
                  <option value="">Sort: Default</option>
                  {sortable.flatMap((c) => [
                    <option key={`${c.key}:asc`} value={`${c.key}:asc`}>
                      Sort: {c.header} ↑
                    </option>,
                    <option key={`${c.key}:desc`} value={`${c.key}:desc`}>
                      Sort: {c.header} ↓
                    </option>,
                  ])}
                </select>
                <ArrowUpDown
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2"
                />
              </label>
            )}
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilterValues({});
                  resetPage();
                }}
                className="text-surface-muted hover:text-surface-fg inline-flex h-10 items-center gap-1 px-2 text-sm font-bold"
              >
                <X aria-hidden className="size-3.5" /> Clear
              </button>
            )}
          </div>
          {toolbar && (
            <div className="flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
              {toolbar}
            </div>
          )}
        </div>
      )}

      {selectable && selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          data-surface="royal"
          className="bg-royal sticky top-[4.5rem] z-30 flex flex-wrap items-center justify-between gap-3 rounded-[10px] px-4 py-2.5 text-white shadow-[0_18px_40px_-20px_rgb(0_8_107/0.6)]"
        >
          <p className="text-sm font-bold">
            {selected.size} selected
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-3 text-white/70 underline-offset-2 hover:text-white hover:underline"
            >
              Clear
            </button>
          </p>
          <div className="flex flex-wrap gap-2">
            {bulkActions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={a.danger ? "danger" : "subtle"}
                onClick={() => runBulk(a)}
              >
                {a.icon}
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<Search />}
            title="Nothing matches"
            description="Try a different search or clear the filters."
          />
        ) : (
          <EmptyState
            icon={empty?.icon}
            title={empty?.title ?? "Nothing here yet"}
            description={empty?.description}
            action={empty?.action}
          />
        )
      ) : (
        <>
          {/* Tablets and desktops: a table */}
          <div className="hidden overflow-x-auto rounded-[10px] bg-white ring-1 ring-black/[0.06] md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{label}</caption>
              <thead>
                <tr className="border-surface-rule border-b">
                  {selectable && (
                    <th scope="col" className="w-12 py-3 pl-4">
                      <TableCheckbox
                        label="Select all on this page"
                        checked={
                          allOnPage
                            ? true
                            : someOnPage
                              ? "indeterminate"
                              : false
                        }
                        onChange={togglePage}
                      />
                    </th>
                  )}
                  {columns.map((c) => {
                    const active = sort?.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={
                          active
                            ? sort.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        className={cn(
                          "text-surface-muted px-4 py-3 text-xs font-bold tracking-[0.04em] whitespace-nowrap uppercase",
                          c.hideBelow && HIDE_BELOW[c.hideBelow],
                          c.className,
                        )}
                      >
                        {c.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className="hover:text-surface-fg inline-flex items-center gap-1 uppercase"
                          >
                            {c.header}
                            {active ? (
                              sort.dir === "asc" ? (
                                <ArrowUp aria-hidden className="size-3.5" />
                              ) : (
                                <ArrowDown aria-hidden className="size-3.5" />
                              )
                            ) : (
                              <ArrowUpDown
                                aria-hidden
                                className="size-3.5 opacity-50"
                              />
                            )}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                  })}
                  {rowActions && (
                    <th scope="col" className="w-14 pr-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const id = getRowId(row);
                  const isSelected = selected.has(id);
                  return (
                    <tr
                      key={id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "border-surface-rule border-b transition-colors last:border-b-0",
                        onRowClick && "hover:bg-canvas cursor-pointer",
                        isSelected && "bg-ice hover:bg-ice",
                      )}
                    >
                      {selectable && (
                        <td
                          className="py-3 pl-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TableCheckbox
                            label={`Select ${nameOf(row)}`}
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                          />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "px-4 py-3 align-middle",
                            c.hideBelow && HIDE_BELOW[c.hideBelow],
                            c.className,
                          )}
                        >
                          {c.cell(row)}
                        </td>
                      ))}
                      {rowActions && (
                        <td
                          className="py-2 pr-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActions
                            label={`Actions for ${nameOf(row)}`}
                            actions={rowActions(row)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones: one card per row */}
          <div className="md:hidden">
            {selectable && (
              <div className="mb-2 flex items-center gap-2.5 px-1 text-sm font-bold">
                <TableCheckbox
                  label="Select all on this page"
                  checked={
                    allOnPage ? true : someOnPage ? "indeterminate" : false
                  }
                  onChange={togglePage}
                />
                <span aria-hidden>Select all</span>
              </div>
            )}
            <ul aria-label={label} className="flex flex-col gap-2">
              {visible.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                return (
                  <li
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "flex gap-3 rounded-[12px] bg-white p-4 ring-1 ring-black/[0.06] transition-colors",
                      onRowClick && "cursor-pointer active:bg-canvas",
                      isSelected && "bg-ice ring-royal/30",
                    )}
                  >
                    {selectable && (
                      <span
                        className="pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TableCheckbox
                          label={`Select ${nameOf(row)}`}
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                        />
                      </span>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="min-w-0 text-[0.9375rem]">
                        {primary.cell(row)}
                      </div>
                      {cardFields.length > 0 && (
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                          {cardFields.map((c) => (
                            <div
                              key={c.key}
                              className="flex min-w-0 flex-col gap-1"
                            >
                              <dt className="text-surface-muted text-[0.6875rem] font-bold tracking-[0.04em] uppercase">
                                {c.header}
                              </dt>
                              <dd className="min-w-0">{c.cell(row)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    {rowActions && (
                      <div
                        className="-mt-1.5 -mr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions
                          label={`Actions for ${nameOf(row)}`}
                          title={rowLabel?.(row)}
                          actions={rowActions(row)}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="Pages"
          className="text-surface-muted flex items-center justify-between gap-3 text-sm"
        >
          <p>
            {current * pageSize + 1}–
            {Math.min((current + 1) * pageSize, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex gap-1">
            <PageButton
              label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft aria-hidden className="size-4" />
            </PageButton>
            <PageButton
              label="Next page"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight aria-hidden className="size-4" />
            </PageButton>
          </div>
        </nav>
      )}
    </div>
  );
}

function FilterSelect<T>({
  filter,
  value,
  onChange,
}: {
  filter: TableFilter<T>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{filter.label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-full border bg-white px-4 pr-8 text-sm font-bold outline-none focus:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]",
          value ? "border-royal bg-ice text-royal" : "border-charcoal/[0.14]",
        )}
      >
        <option value="">{filter.label}: All</option>
        {filter.options.map((o) => (
          <option key={o.value} value={o.value}>
            {filter.label}: {o.label}
          </option>
        ))}
      </select>
      <ChevronRight
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 rotate-90"
      />
    </label>
  );
}

function TableCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean | "indeterminate";
  onChange: () => void;
}) {
  return (
    <RadixCheckbox.Root
      aria-label={label}
      checked={checked}
      onCheckedChange={onChange}
      className="data-[state=checked]:bg-royal data-[state=checked]:border-royal data-[state=indeterminate]:bg-royal data-[state=indeterminate]:border-royal border-charcoal/30 relative inline-flex size-5 items-center justify-center rounded-[5px] border bg-white align-middle outline-none before:absolute before:-inset-2.5 before:content-[''] focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] md:size-[18px]"
    >
      <RadixCheckbox.Indicator>
        {checked === "indeterminate" ? (
          <Minus aria-hidden className="size-3 text-white" strokeWidth={3} />
        ) : (
          <Check aria-hidden className="size-3 text-white" strokeWidth={3} />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="text-surface-fg hover:bg-ice inline-flex size-10 items-center justify-center rounded-full bg-white ring-1 ring-black/[0.08] transition-colors disabled:opacity-40 md:size-9"
    >
      {children}
    </button>
  );
}
