"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  Loader2,
  Package,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  exportSchoolWebsiteProject,
  type SchoolWebsiteProjectRow,
} from "../actions";

type ProjectsManagerProps = {
  projects: SchoolWebsiteProjectRow[];
};

function statusClassName(status: SchoolWebsiteProjectRow["status"]) {
  switch (status) {
    case "DRAFT":
      return "border-[#2a2a2a] bg-[#0d0d0d] text-[#888]";
    case "IN_PROGRESS":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";
    case "READY_FOR_EXPORT":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    case "EXPORTED":
      return "border-green-500/20 bg-green-500/10 text-green-400";
    case "LIVE":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";
    default:
      return "border-[#2a2a2a] bg-[#0d0d0d] text-[#888]";
  }
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not exported";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getProjectEditorHref(projectId: string) {
  return `/admin/we-brand-schools/projects/${projectId}/editor`;
}

function getProjectPreviewHref(project: SchoolWebsiteProjectRow) {
  return `/admin/we-brand-schools/projects/${project.id}/preview/${project.previewPageSlug}`;
}

export function ProjectsManager({ projects }: ProjectsManagerProps) {
  const router = useRouter();
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(
    null,
  );

  const exportProject = async (project: SchoolWebsiteProjectRow) => {
    const projectId = project.id;
    setExportingProjectId(projectId);
    const result = await exportSchoolWebsiteProject(
      projectId,
      project.applicationId,
    );
    setExportingProjectId(null);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#222] bg-[#111]">
      <Table>
        <TableHeader>
          <TableRow className="border-[#222] hover:bg-transparent">
            <TableHead className="text-[#888]">School Name</TableHead>
            <TableHead className="text-[#888]">Template</TableHead>
            <TableHead className="text-[#888]">Contact Email</TableHead>
            <TableHead className="text-[#888]">Project Status</TableHead>
            <TableHead className="text-[#888]">Last Edited</TableHead>
            <TableHead className="text-[#888]">Last Exported</TableHead>
            <TableHead className="text-right text-[#888]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-[#666]"
              >
                No website projects have been started yet.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow
                key={project.id}
                className="border-[#222] hover:bg-[#171717]"
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-white">
                      {project.schoolName}
                    </p>
                    <p className="mt-1 text-xs text-[#666]">
                      {project.templateSlug}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-[#b3b3b3]">
                  {project.templateName}
                </TableCell>
                <TableCell className="text-[#b3b3b3]">
                  {project.contactEmail ?? "Not provided"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusClassName(project.status)}
                  >
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#888]">
                  {formatDate(project.updatedAt)}
                </TableCell>
                <TableCell className="text-[#888]">
                  {formatDate(project.lastExportedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 border-[#222] bg-[#111] text-white"
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            href={getProjectEditorHref(project.id)}
                            className="cursor-pointer hover:bg-[#1a1a1a]"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit project
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={getProjectPreviewHref(project)}
                            target="_blank"
                            className="cursor-pointer hover:bg-[#1a1a1a]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Live preview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#222]" />
                        <DropdownMenuItem
                          onClick={() => void exportProject(project)}
                          disabled={exportingProjectId === project.id}
                          className="cursor-pointer hover:bg-[#1a1a1a]"
                        >
                          {exportingProjectId === project.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Package className="mr-2 h-4 w-4" />
                          )}
                          Export zip
                        </DropdownMenuItem>
                        {project.exportZipUrl ? (
                          <DropdownMenuItem asChild>
                            <a
                              href={project.exportZipUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="cursor-pointer text-cyan-400 hover:bg-[#1a1a1a]"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download zip
                            </a>
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
