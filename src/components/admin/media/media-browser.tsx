"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  Folder,
  FolderInput,
  FolderPlus,
  Grid2x2,
  ImageOff,
  Images,
  List,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCEPT_ALL,
  ACCEPT_BY_KIND,
  formatBytes,
  KIND_LABELS,
  type MediaAssetDTO,
  type MediaFolderDTO,
  type MediaKind,
} from "@/lib/media/shared";
import type { MediaSort } from "@/lib/media/queries";
import {
  checkLargeFileStorage,
  createFolder,
  deleteFolder,
  deleteMedia,
  getMediaFolders,
  importFromCloudinary,
  listMedia,
  moveMedia,
  renameFolder,
  setMediaAlt,
} from "@/app/admin/(studio)/media/actions";
import { timeAgo } from "@/lib/admin/format";
import { Button } from "@/components/site/button";
import { EmptyState, StatusPill } from "@/components/admin/kit/layout";
import { SelectField, TextField } from "@/components/admin/kit/fields";
import { SearchInput, SegmentedControl } from "@/components/admin/kit/inputs";
import { RowActions, type RowAction } from "@/components/admin/kit/row-actions";
import { Modal } from "@/components/admin/kit/overlays";
import { Callout, CopyButton } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import { MediaThumb } from "./media-thumb";
import { MediaDetailsPanel } from "./media-details-panel";
import { UploadTray } from "./upload-tray";
import { useMediaUpload } from "./use-media-upload";

type KindTab = "all" | "IMAGE" | "VIDEO" | "DOCUMENT" | "other";
const TAB_KINDS: Record<Exclude<KindTab, "all">, MediaKind[]> = {
  IMAGE: ["IMAGE"],
  VIDEO: ["VIDEO"],
  DOCUMENT: ["DOCUMENT"],
  other: ["AUDIO", "MODEL", "OTHER"],
};
const TAB_LABELS: Record<KindTab, string> = {
  all: "All",
  IMAGE: "Images",
  VIDEO: "Videos",
  DOCUMENT: "Documents",
  other: "Other",
};

export type LibraryData = {
  items: MediaAssetDTO[];
  nextCursor: string | null;
  folders: MediaFolderDTO[];
  counts: { total: number; unfiled: number; needsAlt: number };
};

const CORS_RULE = (origin: string) =>
  JSON.stringify(
    [
      {
        AllowedOrigins: [origin],
        AllowedMethods: ["PUT", "GET", "HEAD"],
        AllowedHeaders: ["*"],
        MaxAgeSeconds: 3600,
      },
    ],
    null,
    2,
  );

function readView(): "grid" | "list" {
  try {
    return window.localStorage.getItem("dx-media-view") === "list"
      ? "list"
      : "grid";
  } catch {
    return "grid";
  }
}

/**
 * Browse, upload and organise media. `manage` is the library page;
 * `pick` is the chooser opened from forms (select one or more files).
 */
export function MediaBrowser({
  mode,
  initial,
  kinds,
  multiple = false,
  canManage,
  canImport = false,
  onPick,
  onCancel,
}: {
  mode: "manage" | "pick";
  initial?: LibraryData;
  /** Only show (and accept uploads of) these kinds. */
  kinds?: MediaKind[];
  multiple?: boolean;
  canManage: boolean;
  canImport?: boolean;
  onPick?: (assets: MediaAssetDTO[]) => void;
  onCancel?: () => void;
}) {
  const confirm = useConfirm();
  const picking = mode === "pick";
  const tabs = useMemo(() => {
    const all: KindTab[] = ["all", "IMAGE", "VIDEO", "DOCUMENT", "other"];
    if (!kinds?.length) return all;
    const allowed = all.filter(
      (t) => t !== "all" && TAB_KINDS[t].some((k) => kinds.includes(k)),
    );
    return allowed.length > 1 ? (["all", ...allowed] as KindTab[]) : allowed;
  }, [kinds]);

  const [items, setItems] = useState<MediaAssetDTO[]>(initial?.items ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initial?.nextCursor ?? null,
  );
  const [folders, setFolders] = useState<MediaFolderDTO[]>(
    initial?.folders ?? [],
  );
  const [counts, setCounts] = useState(
    initial?.counts ?? { total: 0, unfiled: 0, needsAlt: 0 },
  );
  const [loaded, setLoaded] = useState(!!initial);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState<KindTab>(tabs[0]);
  const [folderId, setFolderId] = useState("");
  const [needsAlt, setNeedsAlt] = useState(false);
  const [sort, setSort] = useState<MediaSort>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [selected, setSelected] = useState<Map<string, MediaAssetDTO>>(
    new Map(),
  );
  const [details, setDetails] = useState<MediaAssetDTO | null>(null);
  const [folderDialog, setFolderDialog] = useState<{
    id?: string;
    name: string;
  } | null>(null);
  const [moveIds, setMoveIds] = useState<string[] | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [dragging, setDragging] = useState(false);
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  const [loading, startLoading] = useTransition();
  const [busy, startBusy] = useTransition();
  const inputRef = useRef<React.ComponentRef<"input">>(null);
  const skipFirst = useRef(!!initial);
  const foldersLoaded = useRef(!!initial);

  // Remember grid/list per browser.
  useEffect(() => {
    const v = readView();
    if (v !== "grid") setView(v);
  }, []);
  const changeView = (v: "grid" | "list") => {
    setView(v);
    try {
      window.localStorage.setItem("dx-media-view", v);
    } catch {
      // Storage blocked: just don't remember.
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const activeKinds = useMemo<MediaKind[] | undefined>(() => {
    const fromTab = tab === "all" ? undefined : TAB_KINDS[tab];
    if (!kinds?.length) return fromTab;
    return (fromTab ?? kinds).filter((k) => kinds.includes(k));
  }, [tab, kinds]);

  const filters = useMemo(
    () => ({
      q: debounced || undefined,
      kinds: activeKinds,
      folderId: folderId || undefined,
      needsAlt,
      sort,
    }),
    [debounced, activeKinds, folderId, needsAlt, sort],
  );

  const refreshFolders = useCallback(async () => {
    const res = await getMediaFolders();
    if (res.success) {
      setFolders(res.folders);
      setCounts(res.counts);
    }
  }, []);

  // Load the first page whenever the filters change.
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    startLoading(async () => {
      const needFolders = !foldersLoaded.current;
      foldersLoaded.current = true;
      const [res] = await Promise.all([
        listMedia(filters),
        needFolders ? refreshFolders() : null,
      ]);
      if (!res.success) {
        setLoadError(res.message);
        setLoaded(true);
        return;
      }
      setLoadError(null);
      setItems(res.items);
      setNextCursor(res.nextCursor);
      setLoaded(true);
    });
  }, [filters, refreshFolders]);

  const loadMore = () => {
    if (!nextCursor) return;
    startLoading(async () => {
      const res = await listMedia({ ...filters, cursor: nextCursor });
      if (!res.success) return;
      setItems((prev) => [
        ...prev,
        ...res.items.filter((n) => !prev.some((p) => p.id === n.id)),
      ]);
      setNextCursor(res.nextCursor);
    });
  };

  // Is R2 ready for large uploads? (Library page only.)
  useEffect(() => {
    if (picking || !canManage) return;
    void checkLargeFileStorage(window.location.origin).then((res) => {
      if (res.success) setStorageReady(res.ready);
    });
  }, [picking, canManage]);

  const uploadFolder = folderId && folderId !== "none" ? folderId : null;
  const onUploaded = useCallback(
    (asset: MediaAssetDTO) => {
      setItems((prev) => [asset, ...prev.filter((p) => p.id !== asset.id)]);
      setCounts((c) => ({
        total: c.total + 1,
        unfiled: c.unfiled + (asset.folderId ? 0 : 1),
        needsAlt: c.needsAlt + (asset.kind === "IMAGE" && !asset.alt ? 1 : 0),
      }));
      if (asset.folderId) {
        setFolders((fs) =>
          fs.map((f) =>
            f.id === asset.folderId ? { ...f, count: f.count + 1 } : f,
          ),
        );
      }
      if (picking) {
        setSelected((prev) => {
          const next = multiple
            ? new Map(prev)
            : new Map<string, MediaAssetDTO>();
          next.set(asset.id, asset);
          return next;
        });
      }
    },
    [picking, multiple],
  );
  const uploads = useMediaUpload({ folderId: uploadFolder, onUploaded });
  const storageRefused = uploads.items.some(
    (it) =>
      it.status === "error" &&
      it.error?.startsWith("Large-file storage refused"),
  );

  const accept = kinds?.length
    ? kinds
        .map((k) => ACCEPT_BY_KIND[k])
        .filter(Boolean)
        .join(",")
    : ACCEPT_ALL;

  const takeFiles = (list: globalThis.FileList | null) => {
    if (!list?.length) return;
    let files = Array.from(list);
    if (picking && !multiple) files = files.slice(0, 1);
    uploads.add(files);
  };

  /* Selection */
  const toggle = (asset: MediaAssetDTO) =>
    setSelected((prev) => {
      const next =
        picking && !multiple ? new Map<string, MediaAssetDTO>() : new Map(prev);
      if (prev.has(asset.id)) next.delete(asset.id);
      else next.set(asset.id, asset);
      return next;
    });
  const clearSelection = () => setSelected(new Map());
  const selecting = selected.size > 0;

  /* Actions */
  const removeFromList = (ids: string[]) => {
    setItems((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelected((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    void refreshFolders();
  };

  const remove = async (assets: MediaAssetDTO[]) => {
    const one = assets.length === 1;
    const ok = await confirm({
      title: one
        ? `Delete ${assets[0].fileName}?`
        : `Delete ${assets.length} files?`,
      description:
        "They'll be removed from storage for good. This can't be undone.",
      danger: true,
    });
    if (!ok) return;
    const ids = assets.map((a) => a.id);
    startBusy(async () => {
      let res = await deleteMedia(ids);
      if (!res.success && "inUse" in res) {
        const lines = res.inUse
          .map(
            (f) => `${f.fileName}: ${f.usage.map((u) => u.label).join(", ")}`,
          )
          .join("\n");
        const force = await confirm({
          title: res.message,
          description: (
            <>
              Deleting will leave a gap where it appears:
              <span className="mt-2 block text-xs leading-relaxed whitespace-pre-line">
                {lines}
              </span>
            </>
          ),
          confirmLabel: "Delete anyway",
          cancelLabel: "Keep",
          danger: true,
        });
        if (!force) return;
        res = await deleteMedia(ids, true);
      }
      if (!res.success) {
        toast.error(res.message);
        void refreshFolders();
        return;
      }
      toast.success(one ? "File deleted" : `${res.deleted} files deleted`);
      if (details && ids.includes(details.id)) setDetails(null);
      removeFromList(ids);
    });
  };

  const doMove = () => {
    if (!moveIds) return;
    const target = moveTo || null;
    startBusy(async () => {
      const res = await moveMedia(moveIds, target);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(
        `Moved to ${folders.find((f) => f.id === target)?.name ?? "Unfiled"}`,
      );
      setItems((prev) =>
        prev
          .map((p) => (moveIds.includes(p.id) ? { ...p, folderId: target } : p))
          .filter(
            (p) =>
              !folderId ||
              (folderId === "none" ? !p.folderId : p.folderId === folderId),
          ),
      );
      setMoveIds(null);
      clearSelection();
      void refreshFolders();
    });
  };

  const saveFolder = () => {
    if (!folderDialog) return;
    startBusy(async () => {
      const res = folderDialog.id
        ? await renameFolder(folderDialog.id, folderDialog.name)
        : await createFolder(folderDialog.name);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(folderDialog.id ? "Folder renamed" : "Folder created");
      setFolderDialog(null);
      await refreshFolders();
    });
  };

  const removeFolder = async (f: MediaFolderDTO) => {
    const ok = await confirm({
      title: `Delete the folder ${f.name}?`,
      description: `The ${f.count} file${f.count === 1 ? "" : "s"} in it stay in the library, as Unfiled.`,
      confirmLabel: "Delete folder",
      danger: true,
    });
    if (!ok) return;
    startBusy(async () => {
      const res = await deleteFolder(f.id);
      if (!res.success) return void toast.error(res.message);
      if (folderId === f.id) setFolderId("");
      toast.success("Folder deleted");
      await refreshFolders();
    });
  };

  const runImport = async () => {
    const ok = await confirm({
      title: "Import the files this site uses?",
      description:
        "Finds the Cloudinary images and videos that this website's pages already use and adds them to the library, so you can find, describe and reuse them. Files from other projects on the same Cloudinary account are left out. Nothing on the site changes.",
      confirmLabel: "Import",
    });
    if (!ok) return;
    const id = toast.loading("Finding the files this site uses…");
    startBusy(async () => {
      const res = await importFromCloudinary();
      toast.dismiss(id);
      if (!res.success) return void toast.error(res.message);
      const parts = [
        res.added
          ? `Added ${res.added} file${res.added === 1 ? "" : "s"} this site uses`
          : "No new files to add",
        res.skipped ? `${res.skipped} already in the library` : null,
        res.missing
          ? `${res.missing} referenced by the site but not found on Cloudinary`
          : null,
      ].filter(Boolean);
      toast.success(parts.join(". ") + ".", { duration: 8000 });
      setQuery("");
      setFolderId("");
      setTab(tabs[0]);
      const list = await listMedia({ sort });
      if (list.success) {
        setItems(list.items);
        setNextCursor(list.nextCursor);
      }
      await refreshFolders();
    });
  };

  const assetActions = (a: MediaAssetDTO): RowAction[] => [
    {
      label: canManage ? "Edit details" : "View details",
      icon: <Pencil />,
      onSelect: () => setDetails(a),
    },
    {
      label: "Copy link",
      icon: <Copy />,
      onSelect: () =>
        void navigator.clipboard.writeText(a.url).then(
          () => toast.success("Link copied"),
          () => toast.error("Couldn't copy"),
        ),
    },
    { label: "Open original", icon: <Download />, href: a.url, external: true },
    {
      label: "Move to folder",
      icon: <FolderInput />,
      hidden: !canManage,
      onSelect: () => {
        setMoveTo(a.folderId ?? "");
        setMoveIds([a.id]);
      },
    },
    "separator",
    {
      label: "Delete",
      icon: <Trash2 />,
      danger: true,
      hidden: !canManage,
      onSelect: () => void remove([a]),
    },
  ];

  const folderLabel =
    folderId === ""
      ? "All files"
      : folderId === "none"
        ? "Unfiled"
        : (folders.find((f) => f.id === folderId)?.name ?? "Folder");
  const filtered = !!(
    debounced ||
    folderId ||
    needsAlt ||
    (tab !== "all" && tabs.length > 1)
  );

  /* Single selected image without alt text, in the picker. */
  const single =
    picking && selected.size === 1 ? [...selected.values()][0] : null;

  return (
    <div
      className={cn("relative flex min-w-0 gap-8", picking && "flex-col gap-4")}
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes("Files")) setDragging(true);
      }}
    >
      {/* Folders (library page, large screens) */}
      {!picking && (
        <aside aria-label="Folders" className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-0.5">
            <FolderButton
              active={folderId === "" && !needsAlt}
              onClick={() => {
                setFolderId("");
                setNeedsAlt(false);
              }}
              icon={<Images />}
              label="All files"
              count={counts.total}
            />
            <FolderButton
              active={folderId === "none"}
              onClick={() => {
                setFolderId("none");
                setNeedsAlt(false);
              }}
              icon={<Folder />}
              label="Unfiled"
              count={counts.unfiled}
            />
            {counts.needsAlt > 0 && (
              <FolderButton
                active={needsAlt}
                onClick={() => {
                  setNeedsAlt(true);
                  setFolderId("");
                  setTab("all");
                }}
                icon={<ImageOff />}
                label="Needs alt text"
                count={counts.needsAlt}
                tone="warning"
              />
            )}
            <div className="mt-5 mb-1 flex items-center justify-between px-3">
              <p className="text-surface-muted text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
                Folders
              </p>
              {canManage && (
                <button
                  type="button"
                  aria-label="New folder"
                  onClick={() => setFolderDialog({ name: "" })}
                  className="text-royal hover:bg-ice -mr-1.5 inline-flex size-7 items-center justify-center rounded-full"
                >
                  <FolderPlus aria-hidden className="size-4" />
                </button>
              )}
            </div>
            {folders.length === 0 && (
              <p className="text-surface-muted px-3 py-1 text-xs">
                No folders yet.
              </p>
            )}
            {folders.map((f) => (
              <div key={f.id} className="group/folder flex items-center">
                <FolderButton
                  active={folderId === f.id}
                  onClick={() => {
                    setFolderId(f.id);
                    setNeedsAlt(false);
                  }}
                  icon={<Folder />}
                  label={f.name}
                  count={f.count}
                />
                {canManage && (
                  <RowActions
                    label={`Actions for folder ${f.name}`}
                    title={f.name}
                    className="size-8 opacity-0 group-hover/folder:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                    actions={[
                      {
                        label: "Rename",
                        icon: <Pencil />,
                        onSelect: () =>
                          setFolderDialog({ id: f.id, name: f.name }),
                      },
                      "separator",
                      {
                        label: "Delete folder",
                        icon: <Trash2 />,
                        danger: true,
                        onSelect: () => void removeFolder(f),
                      },
                    ]}
                  />
                )}
              </div>
            ))}
          </nav>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {canManage && (storageReady === false || storageRefused) && (
          <Callout
            tone="warning"
            title="Large-file uploads need one setting in Cloudflare"
          >
            Images upload fine. Before videos, PDFs and other large files can
            upload, add this CORS rule to the R2 bucket (Cloudflare dashboard →
            R2 → your bucket → Settings → CORS policy):
            <pre className="mt-2 max-w-full overflow-x-auto rounded-[8px] bg-white/70 p-3 font-mono text-xs leading-relaxed">
              {CORS_RULE(
                typeof window === "undefined" ? "" : window.location.origin,
              )}
            </pre>
            <CopyButton
              value={CORS_RULE(
                typeof window === "undefined" ? "" : window.location.origin,
              )}
              label="Copy rule"
              className="mt-2 -ml-3"
            />
          </Callout>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search files"
              className="w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1"
            />
            {!picking && (
              <label className="relative lg:hidden">
                <span className="sr-only">Folder</span>
                <select
                  value={needsAlt ? "needs-alt" : folderId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNeedsAlt(v === "needs-alt");
                    setFolderId(v === "needs-alt" ? "" : v);
                  }}
                  className="border-charcoal/[0.14] h-10 max-w-[11rem] cursor-pointer truncate rounded-full border bg-white px-4 text-sm font-bold outline-none"
                >
                  <option value="">All files ({counts.total})</option>
                  <option value="none">Unfiled ({counts.unfiled})</option>
                  {counts.needsAlt > 0 && (
                    <option value="needs-alt">
                      Needs alt text ({counts.needsAlt})
                    </option>
                  )}
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.count})
                    </option>
                  ))}
                </select>
              </label>
            )}
            {picking && folders.length > 0 && (
              <label className="relative">
                <span className="sr-only">Folder</span>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="border-charcoal/[0.14] h-10 max-w-[11rem] cursor-pointer rounded-full border bg-white px-4 text-sm font-bold outline-none"
                >
                  <option value="">All folders</option>
                  <option value="none">Unfiled</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={() => inputRef.current?.click()}>
                <Upload aria-hidden className="size-4" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sr-only sm:hidden">Upload files</span>
              </Button>
              {!picking && canManage && (
                <RowActions
                  label="More library actions"
                  title="Library"
                  actions={[
                    {
                      label: "New folder",
                      icon: <FolderPlus />,
                      onSelect: () => setFolderDialog({ name: "" }),
                    },
                    {
                      label: "Import files this site uses",
                      icon: <UploadCloud />,
                      hidden: !canImport,
                      onSelect: () => void runImport(),
                    },
                  ]}
                />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {tabs.length > 1 ? (
              <SegmentedControl
                label="Type"
                hideLabel
                size="sm"
                value={tab}
                onChange={setTab}
                options={tabs.map((t) => ({ value: t, label: TAB_LABELS[t] }))}
              />
            ) : (
              <span className="text-surface-muted text-sm font-bold">
                {tabs[0] ? TAB_LABELS[tabs[0]] : ""}
              </span>
            )}
            <div className="flex items-center gap-2">
              <label>
                <span className="sr-only">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as MediaSort)}
                  className="border-charcoal/[0.14] h-9 cursor-pointer rounded-full border bg-white px-3 text-xs font-bold outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                  <option value="largest">Largest</option>
                </select>
              </label>
              <SegmentedControl
                label="View"
                hideLabel
                size="sm"
                value={view}
                onChange={changeView}
                options={[
                  { value: "grid", label: "Grid", icon: <Grid2x2 /> },
                  { value: "list", label: "List", icon: <List /> },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Bulk bar (library) */}
        {!picking && selecting && (
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
                onClick={clearSelection}
                className="ml-3 text-white/70 hover:text-white hover:underline"
              >
                Clear
              </button>
            </p>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={busy}
                  onClick={() => {
                    setMoveTo("");
                    setMoveIds([...selected.keys()]);
                  }}
                >
                  <FolderInput aria-hidden className="size-4" /> Move
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => void remove([...selected.values()])}
                >
                  <Trash2 aria-hidden className="size-4" /> Delete
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <p className="sr-only" aria-live="polite">
          {loading
            ? "Loading files"
            : `${items.length} files shown in ${folderLabel}`}
        </p>
        {!loaded ? (
          <GridSkeleton />
        ) : loadError && items.length === 0 ? (
          <EmptyState
            icon={<ImageOff />}
            title="Couldn't load the library"
            description={loadError}
            className="bg-white"
          />
        ) : items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={<Images />}
              title="Nothing matches"
              description="Try a different search, type or folder."
              className="bg-white"
            />
          ) : (
            <EmptyState
              icon={<UploadCloud />}
              title="No files yet"
              description="Drop files here or upload them. Images go to Cloudinary; videos and documents go to large-file storage."
              action={
                <Button size="sm" onClick={() => inputRef.current?.click()}>
                  <Upload aria-hidden className="size-4" /> Upload files
                </Button>
              }
              className="bg-white"
            />
          )
        ) : view === "grid" ? (
          <ul
            className={cn(
              "grid gap-3 transition-opacity",
              picking
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
              loading && "opacity-60",
            )}
          >
            {items.map((a) => (
              <GridCard
                key={a.id}
                asset={a}
                picking={picking}
                showCheckbox={!picking ? canManage || selecting : multiple}
                selected={selected.has(a.id)}
                anySelected={selecting}
                onOpen={() =>
                  picking ? toggle(a) : selecting ? toggle(a) : setDetails(a)
                }
                onToggle={() => toggle(a)}
                actions={picking ? undefined : assetActions(a)}
              />
            ))}
          </ul>
        ) : (
          <ul
            className={cn(
              "flex flex-col overflow-hidden rounded-[12px] bg-white ring-1 ring-black/[0.06]",
              loading && "opacity-60",
            )}
          >
            {items.map((a) => (
              <ListRow
                key={a.id}
                asset={a}
                picking={picking}
                showCheckbox={!picking ? canManage || selecting : multiple}
                folderName={
                  folders.find((f) => f.id === a.folderId)?.name ?? null
                }
                selected={selected.has(a.id)}
                onOpen={() =>
                  picking || selecting ? toggle(a) : setDetails(a)
                }
                onToggle={() => toggle(a)}
                actions={picking ? undefined : assetActions(a)}
              />
            ))}
          </ul>
        )}

        {nextCursor && (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="subtle"
              onClick={loadMore}
              disabled={loading}
            >
              {loading && (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              )}
              Load more
            </Button>
          </div>
        )}

        {/* Picker footer */}
        {picking && (
          <div className="border-surface-rule sticky bottom-0 z-10 -mx-5 mt-2 flex flex-col gap-3 border-t bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:-mx-6 md:px-6">
            {single?.kind === "IMAGE" && !single.alt && (
              <AltPrompt
                key={single.id}
                asset={single}
                onSaved={(alt) => {
                  const updated = { ...single, alt };
                  setSelected(new Map([[single.id, updated]]));
                  setItems((prev) =>
                    prev.map((p) => (p.id === single.id ? updated : p)),
                  );
                }}
              />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-surface-muted text-sm">
                {selected.size === 0
                  ? multiple
                    ? "Select one or more files"
                    : "Select a file"
                  : `${selected.size} selected`}
              </p>
              <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
                <Button size="sm" variant="subtle" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={selected.size === 0 || uploads.active}
                  onClick={() => onPick?.([...selected.values()])}
                >
                  {multiple && selected.size > 1
                    ? `Use ${selected.size} files`
                    : "Use file"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drag and drop overlay */}
      {dragging && (
        <div
          className="border-royal bg-ice/90 absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed text-center backdrop-blur-[1px]"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (
              !e.currentTarget.contains(
                e.relatedTarget as globalThis.Node | null,
              )
            )
              setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            takeFiles(e.dataTransfer.files);
          }}
        >
          <UploadCloud aria-hidden className="text-royal size-10" />
          <p className="text-royal text-lg font-bold">Drop to upload</p>
          {uploadFolder && (
            <p className="text-surface-muted text-sm">Into {folderLabel}</p>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={!picking || multiple}
        accept={accept}
        onChange={(e) => {
          takeFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {uploads.items.length > 0 && (
        <div className={cn(picking && "order-first")}>
          <UploadTray
            items={uploads.items}
            onCancel={uploads.cancel}
            onClear={uploads.clearFinished}
            inline={picking}
          />
        </div>
      )}

      {!picking && (
        <MediaDetailsPanel
          asset={details}
          folders={folders}
          canEdit={canManage}
          onClose={() => setDetails(null)}
          onSaved={(a) => {
            const movedOut =
              folderId &&
              (folderId === "none" ? !!a.folderId : a.folderId !== folderId);
            setItems((prev) =>
              movedOut
                ? prev.filter((p) => p.id !== a.id)
                : prev.map((p) => (p.id === a.id ? a : p)),
            );
            setDetails(movedOut ? null : a);
            void refreshFolders();
          }}
          onDelete={(a) => void remove([a])}
        />
      )}

      <Modal
        open={!!folderDialog}
        onOpenChange={(o) => !o && setFolderDialog(null)}
        title={folderDialog?.id ? "Rename folder" : "New folder"}
        size="sm"
        footer={
          <>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setFolderDialog(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              form="folder-form"
              disabled={busy || !folderDialog?.name.trim()}
            >
              {folderDialog?.id ? "Rename" : "Create folder"}
            </Button>
          </>
        }
      >
        <form
          id="folder-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveFolder();
          }}
        >
          <TextField
            label="Folder name"
            autoFocus
            maxLength={60}
            value={folderDialog?.name ?? ""}
            onChange={(e) =>
              setFolderDialog((d) => (d ? { ...d, name: e.target.value } : d))
            }
            placeholder="e.g. Team photos"
          />
        </form>
      </Modal>

      <Modal
        open={!!moveIds}
        onOpenChange={(o) => !o && setMoveIds(null)}
        title={
          moveIds && moveIds.length > 1
            ? `Move ${moveIds.length} files`
            : "Move file"
        }
        size="sm"
        footer={
          <>
            <Button size="sm" variant="subtle" onClick={() => setMoveIds(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={doMove} disabled={busy}>
              Move
            </Button>
          </>
        }
      >
        <SelectField
          label="Folder"
          value={moveTo}
          onChange={(e) => setMoveTo(e.target.value)}
          options={[
            { value: "", label: "Unfiled" },
            ...folders.map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
        {folders.length === 0 && (
          <p className="text-surface-muted mt-3 text-sm">
            No folders yet.{" "}
            <button
              type="button"
              className="text-royal dx-link font-bold"
              onClick={() => {
                setMoveIds(null);
                setFolderDialog({ name: "" });
              }}
            >
              Create one
            </button>
          </p>
        )}
      </Modal>
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function FolderButton({
  active,
  onClick,
  icon,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  tone?: "warning";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-[8px] px-3 text-left text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
        active ? "bg-ice text-royal font-bold" : "hover:bg-white",
        tone === "warning" && !active && "text-gold-deep",
      )}
    >
      <span aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-surface-muted text-xs tabular-nums">{count}</span>
    </button>
  );
}

function SelectBox({
  checked,
  label,
  onToggle,
  className,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <RadixCheckbox.Root
      checked={checked}
      onCheckedChange={onToggle}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
      className={cn(
        "data-[state=checked]:bg-royal data-[state=checked]:border-royal relative inline-flex size-6 items-center justify-center rounded-[6px] border-2 border-white bg-black/25 shadow outline-none before:absolute before:-inset-2 before:content-[''] focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.5)]",
        className,
      )}
    >
      <RadixCheckbox.Indicator>
        <Check aria-hidden className="size-3.5 text-white" strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

function Meta({ asset }: { asset: MediaAssetDTO }) {
  const dims =
    asset.width && asset.height ? `${asset.width}×${asset.height}` : null;
  return (
    <span className="text-surface-muted truncate text-xs">
      {[KIND_LABELS[asset.kind], dims, formatBytes(asset.bytes)]
        .filter(Boolean)
        .join(" · ")}
    </span>
  );
}

function GridCard({
  asset,
  picking,
  showCheckbox,
  selected,
  anySelected,
  onOpen,
  onToggle,
  actions,
}: {
  asset: MediaAssetDTO;
  picking: boolean;
  showCheckbox: boolean;
  selected: boolean;
  anySelected: boolean;
  onOpen: () => void;
  onToggle: () => void;
  actions?: RowAction[];
}) {
  const name = asset.title || asset.fileName;
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onOpen}
        aria-pressed={picking ? selected : undefined}
        aria-label={
          picking
            ? `${selected ? "Deselect" : "Select"} ${name}`
            : `Open ${name}`
        }
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-[12px] bg-white text-left ring-1 ring-black/[0.06] transition-shadow outline-none hover:shadow-[0_18px_40px_-24px_rgb(0_8_107/0.45)] focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.45)]",
          selected && "ring-royal ring-2",
        )}
      >
        <MediaThumb
          asset={asset}
          width={320}
          className="aspect-square w-full"
        />
        <span className="flex min-w-0 flex-col gap-0.5 px-3 py-2.5">
          <span className="truncate text-sm font-bold">{name}</span>
          <Meta asset={asset} />
        </span>
      </button>
      {asset.kind === "IMAGE" && !asset.alt && (
        <StatusPill
          tone="warning"
          className="pointer-events-none absolute bottom-[3.6rem] left-2 shadow-sm"
        >
          No alt text
        </StatusPill>
      )}
      {showCheckbox && (
        <SelectBox
          checked={selected}
          label={`Select ${name}`}
          onToggle={onToggle}
          className={cn(
            "absolute top-2.5 left-2.5 transition-opacity",
            selected || anySelected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
          )}
        />
      )}
      {picking && selected && !showCheckbox && (
        <span
          aria-hidden
          className="bg-royal absolute top-2.5 left-2.5 inline-flex size-6 items-center justify-center rounded-full text-white shadow"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
      {actions && (
        <RowActions
          label={`Actions for ${name}`}
          title={name}
          actions={actions}
          className="absolute top-2 right-2 bg-white/90 shadow-sm backdrop-blur hover:bg-white"
        />
      )}
    </li>
  );
}

function ListRow({
  asset,
  picking,
  showCheckbox,
  folderName,
  selected,
  onOpen,
  onToggle,
  actions,
}: {
  asset: MediaAssetDTO;
  picking: boolean;
  showCheckbox: boolean;
  folderName: string | null;
  selected: boolean;
  onOpen: () => void;
  onToggle: () => void;
  actions?: RowAction[];
}) {
  const name = asset.title || asset.fileName;
  return (
    <li
      className={cn(
        "border-surface-rule flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 sm:px-4",
        selected && "bg-ice",
      )}
    >
      {showCheckbox && (
        <RadixCheckbox.Root
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${name}`}
          className="data-[state=checked]:bg-royal data-[state=checked]:border-royal border-charcoal/30 relative inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border bg-white outline-none before:absolute before:-inset-2.5 before:content-['']"
        >
          <RadixCheckbox.Indicator>
            <Check aria-hidden className="size-3 text-white" strokeWidth={3} />
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>
      )}
      <button
        type="button"
        onClick={onOpen}
        aria-pressed={picking ? selected : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.45)]"
      >
        <MediaThumb
          asset={asset}
          width={64}
          className="size-12 shrink-0 rounded-[8px]"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold">{name}</span>
            {asset.kind === "IMAGE" && !asset.alt && (
              <StatusPill tone="warning" className="hidden sm:inline-flex">
                No alt
              </StatusPill>
            )}
          </span>
          <Meta asset={asset} />
        </span>
        <span className="text-surface-muted hidden w-36 truncate text-xs md:block">
          {folderName ?? "Unfiled"}
        </span>
        <span className="text-surface-muted hidden w-24 text-right text-xs lg:block">
          {timeAgo(asset.createdAt)}
        </span>
      </button>
      {picking && selected && !showCheckbox && (
        <Check
          aria-hidden
          className="text-royal size-5 shrink-0"
          strokeWidth={3}
        />
      )}
      {actions && (
        <RowActions
          label={`Actions for ${name}`}
          title={name}
          actions={actions}
        />
      )}
    </li>
  );
}

function GridSkeleton() {
  return (
    <ul
      aria-label="Loading"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-[12px] bg-white ring-1 ring-black/[0.06]"
        >
          <div className="bg-charcoal/[0.06] aspect-square animate-pulse" />
          <div className="flex flex-col gap-2 p-3">
            <div className="bg-charcoal/[0.07] h-3 w-2/3 animate-pulse rounded-full" />
            <div className="bg-charcoal/[0.05] h-2.5 w-1/2 animate-pulse rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Asks for alt text when a picked image has none. */
function AltPrompt({
  asset,
  onSaved,
}: {
  asset: MediaAssetDTO;
  onSaved: (alt: string) => void;
}) {
  const [alt, setAlt] = useState("");
  const [saving, start] = useTransition();
  return (
    <form
      className="bg-gold-soft flex flex-col gap-2 rounded-[10px] p-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!alt.trim()) return;
        start(async () => {
          const res = await setMediaAlt(asset.id, alt);
          if (!res.success) return void toast.error(res.message);
          toast.success("Alt text saved");
          onSaved(alt.trim());
        });
      }}
    >
      <TextField
        label="Describe this image (alt text)"
        value={alt}
        maxLength={300}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="e.g. Students at the 2026 school brand launch"
        fieldClassName="flex-1"
      />
      <Button
        size="sm"
        type="submit"
        variant="subtle"
        disabled={saving || !alt.trim()}
        className="sm:mb-1.5"
      >
        Save
      </Button>
    </form>
  );
}
