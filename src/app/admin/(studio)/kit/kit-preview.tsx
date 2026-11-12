"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Eye,
  FileText,
  Grid2x2,
  Inbox,
  List,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/site/button";
import {
  AdminCard,
  EmptyState,
  Kbd,
  StatusPill,
} from "@/components/admin/kit/layout";
import {
  CheckboxField,
  FormSection,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import {
  ColorField,
  DateTimeField,
  ListEditor,
  NumberField,
  SegmentedControl,
  SlugField,
  TagInput,
} from "@/components/admin/kit/inputs";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { RowActions, type RowAction } from "@/components/admin/kit/row-actions";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { IconButton, Modal, Tabs } from "@/components/admin/kit/overlays";
import {
  Avatar,
  Callout,
  CopyButton,
  DetailList,
  ListSkeleton,
  StatCard,
} from "@/components/admin/kit/display";
import { SaveBar } from "@/components/admin/kit/save-bar";
import { FileDropzone } from "@/components/admin/kit/dropzone";
import { useConfirm } from "@/components/admin/kit/feedback";
import { MediaField } from "@/components/admin/media/media-picker";
import type { MediaAssetDTO } from "@/lib/media/shared";

type Row = {
  id: string;
  title: string;
  status: "Published" | "Draft";
  author: string;
  updated: number;
};

const TITLES = [
  "Brand refresh",
  "School website",
  "Event recap",
  "Product launch",
  "Annual report",
];
const SAMPLE: Row[] = Array.from({ length: 26 }, (_, i) => ({
  id: String(i + 1),
  title: `${TITLES[i % 5]} ${i + 1}`,
  status: i % 3 === 0 ? "Draft" : "Published",
  author: ["Daniel Okafor", "Alison Bello", "Tolu Ade"][i % 3],
  updated: Date.UTC(2026, 10, 10) - i * 36e5 * 7,
}));

function Demo({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminCard title={title} description={description}>
      {children}
    </AdminCard>
  );
}

export function KitPreview() {
  return (
    <Tabs
      label="Kit sections"
      tabs={[
        { value: "basics", label: "Basics", content: <Basics /> },
        { value: "forms", label: "Forms", content: <Forms /> },
        { value: "lists", label: "Lists & tables", content: <Lists /> },
        { value: "overlays", label: "Overlays", content: <Overlays /> },
        { value: "display", label: "Display", content: <Display /> },
      ]}
    />
  );
}

/* ------------------------------------------------------------------------ */

function Basics() {
  const confirm = useConfirm();
  return (
    <div className="flex flex-col gap-6">
      <Demo title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
          <Button size="sm" variant="subtle">
            Subtle
          </Button>
          <Button size="sm" variant="danger">
            Delete
          </Button>
          <Button size="sm" variant="ghost">
            Ghost link
          </Button>
          <Button size="sm" arrow>
            With arrow
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-1">
          <IconButton label="Edit" icon={<Pencil />} />
          <IconButton label="Preview" icon={<Eye />} />
          <IconButton label="Duplicate" icon={<Copy />} />
          <IconButton label="Delete" icon={<Trash2 />} tone="danger" />
          <span className="text-surface-muted ml-2 text-xs">
            Icon buttons show their name on hover.
          </span>
        </div>
      </Demo>

      <Demo title="Pills and keys">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill>Neutral</StatusPill>
          <StatusPill tone="brand">Brand</StatusPill>
          <StatusPill tone="royal">Royal</StatusPill>
          <StatusPill tone="success" dot>
            Published
          </StatusPill>
          <StatusPill tone="warning" dot>
            Draft
          </StatusPill>
          <StatusPill tone="danger" dot>
            Disabled
          </StatusPill>
          <span className="ml-2 inline-flex gap-0.5">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </div>
      </Demo>

      <Demo
        title="Feedback"
        description="Toasts confirm what happened; callouts explain the page."
      >
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="subtle"
            onClick={() => toast.success("Changes saved")}
          >
            Success toast
          </Button>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => toast.error("Couldn't save. Try again.")}
          >
            Error toast
          </Button>
          <Button
            size="sm"
            variant="subtle"
            onClick={async () => {
              const ok = await confirm({
                title: "Delete this project?",
                description:
                  "It will be removed from the website straight away.",
                danger: true,
              });
              toast(ok ? "Confirmed" : "Cancelled");
            }}
          >
            Confirm dialog
          </Button>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <Callout title="This page is live">
            Changes you publish show on the website within a minute.
          </Callout>
          <Callout tone="success" title="Published" />
          <Callout
            tone="warning"
            title="Missing image"
            action={
              <Button size="sm" variant="subtle">
                Add image
              </Button>
            }
          >
            This project has no cover image, so it won&apos;t show on the Works
            page.
          </Callout>
          <Callout tone="danger" title="Couldn't load the list">
            Check your connection and refresh.
          </Callout>
        </div>
      </Demo>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function Forms() {
  const [toggle, setToggle] = useState(true);
  const [check, setCheck] = useState(false);
  const [title, setTitle] = useState("Our new brand guide");
  const [slug, setSlug] = useState("");
  const [seo, setSeo] = useState(
    "A practical guide to keeping a school's brand consistent.",
  );
  const [price, setPrice] = useState<number | null>(250000);
  const [days, setDays] = useState<number | null>(14);
  const [tags, setTags] = useState(["Figma", "Illustrator"]);
  const [features, setFeatures] = useState([
    "Logo and brand colours",
    "Social media templates",
    "Two rounds of changes",
  ]);
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">(
    "draft",
  );
  const [date, setDate] = useState<Date | null>(null);
  const [color, setColor] = useState("#000c99");
  const [baseline, setBaseline] = useState("Brand refresh");
  const [name, setName] = useState("Brand refresh");
  const [saving, setSaving] = useState(false);
  const [cover, setCover] = useState<MediaAssetDTO | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <Demo title="Text fields">
        <div className="flex flex-col gap-8">
          <FormSection
            title="Basics"
            description="Group long forms into sections like this."
          >
            <TextField
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <SlugField
              value={slug}
              onChange={setSlug}
              source={title}
              basePath="/thoughts/"
            />
            <TextField label="With an error" error="This field is required." />
            <TextField
              label="Website"
              prefix="https://"
              placeholder="example.com"
            />
          </FormSection>
          <FormSection
            title="Search preview"
            description="Counters warn when you get close to the limit."
          >
            <TextareaField
              label="Description"
              rows={3}
              maxLength={160}
              value={seo}
              onChange={(e) => setSeo(e.target.value)}
            />
            <SelectField
              label="Category"
              options={[
                { value: "brand", label: "Branding" },
                { value: "web", label: "Websites" },
              ]}
            />
          </FormSection>
          <FormSection title="Switches">
            <SwitchField
              label="Show on the homepage"
              description="Featured items appear in the homepage showcase."
              checked={toggle}
              onCheckedChange={setToggle}
            />
            <CheckboxField
              label="Open in a new tab"
              checked={check}
              onCheckedChange={setCheck}
            />
          </FormSection>
        </div>
      </Demo>

      <Demo title="Numbers, dates and choices">
        <div className="grid gap-5 md:grid-cols-2">
          <NumberField
            label="Price"
            prefix="₦"
            value={price}
            onChange={setPrice}
            min={0}
          />
          <NumberField
            label="Delivery time"
            suffix="days"
            value={days}
            onChange={setDays}
            min={1}
            max={365}
          />
          <DateTimeField label="Starts" value={date} onChange={setDate} />
          <SegmentedControl
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "scheduled", label: "Scheduled" },
            ]}
          />
        </div>
      </Demo>

      <Demo title="Lists, tags and colour">
        <div className="grid gap-8 lg:grid-cols-2">
          <ListEditor
            label="What's included"
            value={features}
            onChange={setFeatures}
            addLabel="Add a feature"
            hint="Press Enter to add the next line."
          />
          <div className="flex flex-col gap-6">
            <TagInput
              label="Tools"
              value={tags}
              onChange={setTags}
              suggestions={[
                "Figma",
                "Photoshop",
                "Illustrator",
                "After Effects",
                "Blender",
              ]}
              max={12}
            />
            <ColorField
              label="Accent colour"
              value={color}
              onChange={setColor}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="Media field"
        description="Choose from the media library or upload, without leaving the form. Used by every page editor."
      >
        <div className="max-w-xl">
          <MediaField
            label="Cover image"
            value={cover}
            onChange={setCover}
            hint="Shown at the top of the page and when the page is shared."
          />
        </div>
      </Demo>

      <Demo
        title="File upload"
        description="Checks file type and size before uploading."
      >
        <FileDropzone
          accept="image/*"
          multiple
          maxSizeMB={10}
          description="JPG, PNG or WebP, up to 10 MB each."
          onFiles={(files) =>
            toast.success(`${files.length} file(s) ready to upload`)
          }
          onReject={(msg) => toast.error(msg)}
        />
      </Demo>

      <Demo
        title="Save bar"
        description="Change the name: a bar appears at the bottom until you save or discard."
      >
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <SaveBar
          dirty={name !== baseline}
          saving={saving}
          onDiscard={() => setName(baseline)}
          onSave={() => {
            setSaving(true);
            window.setTimeout(() => {
              setBaseline(name);
              setSaving(false);
              toast.success("Saved");
            }, 900);
          }}
        />
      </Demo>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function Lists() {
  const confirm = useConfirm();
  const [items, setItems] = useState([
    "Hero",
    "What we do",
    "Works",
    "Clients",
    "Closing call to action",
  ]);
  const [view, setView] = useState<"list" | "grid">("list");

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Title",
      primary: true,
      sortValue: (r) => r.title,
      cell: (r) => <strong>{r.title}</strong>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => (
        <StatusPill tone={r.status === "Published" ? "success" : "warning"} dot>
          {r.status}
        </StatusPill>
      ),
    },
    {
      key: "author",
      header: "Author",
      hideBelow: "lg",
      sortValue: (r) => r.author,
      cell: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={r.author} size="sm" />
          <span className="truncate">{r.author}</span>
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      sortValue: (r) => r.updated,
      cell: (r) => (
        <span className="text-surface-muted text-xs whitespace-nowrap">
          {new Date(r.updated).toLocaleDateString("en-GB")}
        </span>
      ),
    },
  ];

  const actionsFor = (r: Row): RowAction[] => [
    {
      label: "Edit",
      icon: <Pencil />,
      onSelect: () => toast(`Edit ${r.title}`),
    },
    { label: "Preview on site", icon: <Eye />, href: "/", external: true },
    {
      label: "Duplicate",
      icon: <Copy />,
      onSelect: () => toast.success("Duplicated"),
    },
    {
      label: "Publish",
      icon: <FileText />,
      hidden: r.status === "Published",
      onSelect: () => toast.success(`${r.title} published`),
    },
    "separator",
    {
      label: "Delete",
      icon: <Trash2 />,
      danger: true,
      onSelect: async () => {
        if (
          await confirm({
            title: `Delete ${r.title}?`,
            description: "It will be removed from the website straight away.",
            danger: true,
          })
        )
          toast.success("Deleted");
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Demo
        title="Data table"
        description="Search, filter, sort, select rows for bulk actions, and the ⋯ menu on each row. On phones, rows become cards and the menu opens as a sheet."
      >
        <DataTable
          label="Sample items"
          rows={SAMPLE}
          columns={columns}
          getRowId={(r) => r.id}
          rowLabel={(r) => r.title}
          rowActions={actionsFor}
          onRowClick={(r) => toast(`Open ${r.title}`)}
          searchText={(r) => `${r.title} ${r.author}`}
          pageSize={8}
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "Published", label: "Published" },
                { value: "Draft", label: "Draft" },
              ],
              match: (r, v) => r.status === v,
            },
          ]}
          bulkActions={[
            {
              label: "Publish",
              onClick: (ids) => void toast.success(`Published ${ids.length}`),
            },
            {
              label: "Delete",
              danger: true,
              icon: <Trash2 aria-hidden className="size-3.5" />,
              onClick: (ids) => void toast.success(`Deleted ${ids.length}`),
            },
          ]}
          toolbar={
            <Button size="sm">
              <Plus aria-hidden className="size-4" /> Add
            </Button>
          }
        />
      </Demo>

      <Demo
        title="Cards with actions"
        description="The same ⋯ menu works on cards, e.g. media or works grids."
      >
        <div className="mb-4">
          <SegmentedControl
            label="View"
            hideLabel
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List", icon: <List /> },
              { value: "grid", label: "Grid", icon: <Grid2x2 /> },
            ]}
          />
        </div>
        <ul
          className={
            view === "grid"
              ? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-2"
          }
        >
          {SAMPLE.slice(0, 4).map((r) => (
            <li
              key={r.id}
              className={
                view === "grid"
                  ? "relative flex flex-col overflow-hidden rounded-[12px] bg-white ring-1 ring-black/[0.06]"
                  : "flex items-center gap-3 rounded-[12px] bg-white p-3 ring-1 ring-black/[0.06]"
              }
            >
              <span
                aria-hidden
                className={
                  view === "grid"
                    ? "bg-ice aspect-[4/3] w-full"
                    : "bg-ice size-12 shrink-0 rounded-[8px]"
                }
              />
              <div
                className={
                  view === "grid"
                    ? "flex items-start justify-between gap-1 p-3"
                    : "flex min-w-0 flex-1 items-center justify-between gap-2"
                }
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{r.title}</p>
                  <p className="text-surface-muted text-xs">{r.status}</p>
                </div>
                <RowActions
                  label={`Actions for ${r.title}`}
                  title={r.title}
                  actions={actionsFor(r)}
                  className="-mr-1.5"
                />
              </div>
            </li>
          ))}
        </ul>
      </Demo>

      <Demo
        title="Sortable list"
        description="Drag the handle, or use the arrows (keyboard and touch friendly)."
      >
        <SortableList
          label="Homepage sections order"
          items={items}
          getId={(i) => i}
          onReorder={setItems}
          renderItem={(i) => <span className="text-sm font-bold">{i}</span>}
        />
      </Demo>

      <Demo title="Loading and empty">
        <div className="grid gap-5 lg:grid-cols-2">
          <ListSkeleton rows={3} />
          <EmptyState
            icon={<FileText />}
            title="No articles yet"
            description="Write your first article and it will show up on the Thoughts page."
            action={<Button size="sm">Write an article</Button>}
          />
        </div>
      </Demo>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function Overlays() {
  const [panel, setPanel] = useState(false);
  const [modal, setModal] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <Demo
        title="Side panel and modal"
        description="Side panels edit one item beside its list (full screen on phones). Modals handle short tasks (a sheet from the bottom on phones)."
      >
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="subtle" onClick={() => setPanel(true)}>
            Open side panel
          </Button>
          <Button size="sm" variant="subtle" onClick={() => setModal(true)}>
            Open modal
          </Button>
        </div>
      </Demo>

      <Demo
        title="Tabs"
        description="For long editors. The tab row scrolls sideways on phones."
      >
        <Tabs
          label="Editor sections"
          tabs={[
            {
              value: "content",
              label: "Content",
              content: <p className="text-sm">Title, text and links.</p>,
            },
            {
              value: "media",
              label: "Media",
              badge: <StatusPill tone="brand">3</StatusPill>,
              content: <p className="text-sm">Cover image and gallery.</p>,
            },
            {
              value: "seo",
              label: "Search & sharing",
              content: (
                <p className="text-sm">
                  Page title, description and share image.
                </p>
              ),
            },
            {
              value: "history",
              label: "History",
              content: (
                <p className="text-sm">Earlier versions you can restore.</p>
              ),
            },
          ]}
        />
      </Demo>

      <SidePanel
        open={panel}
        onOpenChange={setPanel}
        title="Edit project"
        description="Side panels keep the list in view while you edit one item."
        footer={
          <>
            <Button size="sm" variant="subtle" onClick={() => setPanel(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setPanel(false);
                toast.success("Saved");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <TextField label="Title" defaultValue="Brand refresh" />
          <TextareaField label="Summary" rows={5} />
        </div>
      </SidePanel>

      <Modal
        open={modal}
        onOpenChange={setModal}
        title="Rename category"
        footer={
          <>
            <Button size="sm" variant="subtle" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setModal(false);
                toast.success("Renamed");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <TextField label="Name" defaultValue="Branding" />
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function Display() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Unread messages"
          value={12}
          icon={<Inbox />}
          href="/admin/inbox"
        />
        <StatCard
          label="Registrations this week"
          value={48}
          icon={<Users />}
          change={{ value: "+12%", trend: "up", note: "vs last week" }}
        />
        <StatCard
          label="Drafts"
          value={3}
          icon={<FileText />}
          change={{ value: "−2", trend: "down", note: "since Monday" }}
        />
      </div>

      <Demo title="People and details">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name="Daniel Okafor" size="lg" />
            <Avatar name="Alison Bello" />
            <Avatar name="Tolu Ade" size="sm" />
            <CopyButton
              value="https://dexta.services/daniel-azu"
              label="Copy link"
            />
          </div>
          <DetailList
            columns={3}
            items={[
              { label: "Created", value: "4 Nov 2026" },
              { label: "Last edited", value: "2 h ago" },
              { label: "Edited by", value: "Alison Bello" },
              { label: "Status", value: "Published" },
              { label: "Views", value: "1,204" },
              { label: "Address", value: "/works/brand-refresh" },
            ]}
          />
        </div>
      </Demo>
    </div>
  );
}
