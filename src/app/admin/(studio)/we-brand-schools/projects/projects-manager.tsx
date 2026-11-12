"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Eye, FolderKanban, Package, Pencil } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { StatusPill, type PillTone } from "@/components/admin/kit/layout";
import {
  exportSchoolWebsiteProject,
  type SchoolWebsiteProjectRow,
} from "../actions";
import { formatDateTime } from "../_components/form";

type Row = SchoolWebsiteProjectRow;

export const PROJECT_STATUS: Record<
  Row["status"],
  { label: string; tone: PillTone }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "brand" },
  READY_FOR_EXPORT: { label: "Ready to export", tone: "warning" },
  EXPORTED: { label: "Exported", tone: "success" },
  LIVE: { label: "Live", tone: "royal" },
};

const editorHref = (id: string) =>
  `/admin/we-brand-schools/projects/${id}/editor`;
const previewHref = (p: Row) =>
  `/admin/we-brand-schools/projects/${p.id}/preview/${p.previewPageSlug}`;

export function ProjectsManager({ projects }: { projects: Row[] }) {
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);

  const exportZip = async (p: Row) => {
    setExporting(p.id);
    const id = toast.loading(`Building ${p.schoolName}'s files…`);
    const result = await exportSchoolWebsiteProject(p.id, p.applicationId);
    setExporting(null);
    if (!result.success) return void toast.error(result.message, { id });
    toast.success(result.message, { id });
    router.refresh();
  };

  const columns: Column<Row>[] = [
    {
      key: "school",
      header: "School",
      primary: true,
      sortValue: (p) => p.schoolName.toLowerCase(),
      cell: (p) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{p.schoolName}</span>
          <span className="text-surface-muted truncate text-xs">
            {p.templateName}
          </span>
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact email",
      hideBelow: "xl",
      cell: (p) => (
        <span className="text-surface-muted text-sm">
          {p.contactEmail ?? "Not given"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => Object.keys(PROJECT_STATUS).indexOf(p.status),
      cell: (p) => (
        <StatusPill tone={PROJECT_STATUS[p.status].tone} dot>
          {PROJECT_STATUS[p.status].label}
        </StatusPill>
      ),
    },
    {
      key: "edited",
      header: "Last edited",
      sortValue: (p) => new Date(p.updatedAt),
      cell: (p) => (
        <span className="text-surface-muted text-sm whitespace-nowrap">
          {formatDateTime(p.updatedAt)}
        </span>
      ),
    },
    {
      key: "exported",
      header: "Last exported",
      hideBelow: "lg",
      sortValue: (p) => (p.lastExportedAt ? new Date(p.lastExportedAt) : null),
      cell: (p) => (
        <span className="text-surface-muted text-sm whitespace-nowrap">
          {p.lastExportedAt ? formatDateTime(p.lastExportedAt) : "Not yet"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      label="Website projects"
      rows={projects}
      columns={columns}
      getRowId={(p) => p.id}
      rowLabel={(p) => p.schoolName}
      onRowClick={(p) => router.push(editorHref(p.id))}
      searchText={(p) =>
        `${p.schoolName} ${p.templateName} ${p.templateSlug} ${p.contactEmail ?? ""}`
      }
      searchPlaceholder="Search schools or templates"
      filters={[
        {
          key: "status",
          label: "Status",
          options: (Object.keys(PROJECT_STATUS) as Row["status"][]).map(
            (s) => ({ value: s, label: PROJECT_STATUS[s].label }),
          ),
          match: (p, v) => p.status === v,
        },
      ]}
      rowActions={(p) => [
        { label: "Edit the site", icon: <Pencil />, href: editorHref(p.id) },
        {
          label: "Preview",
          icon: <Eye />,
          href: previewHref(p),
          external: true,
        },
        "separator",
        {
          label: exporting === p.id ? "Exporting…" : "Export as a zip",
          icon: <Package />,
          onSelect: () => void exportZip(p),
          disabled: exporting === p.id,
        },
        {
          label: "Download the zip",
          icon: <Download />,
          href: p.exportZipUrl ?? undefined,
          external: true,
          hidden: !p.exportZipUrl,
        },
      ]}
      empty={{
        icon: <FolderKanban />,
        title: "No website projects yet",
        description:
          "Start one from an application: it copies the chosen template so you can fill in the school's details.",
      }}
    />
  );
}
