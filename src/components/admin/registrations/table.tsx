"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Check, X, Loader2, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import { DetailDialog } from "./detail-dialog";
import {
  acceptRegistration,
  declineRegistration,
  deleteRegistration,
  deleteRegistrations,
} from "@/app/admin/(dashboard)/events/actions";

interface Registration {
  id: string;
  name: string;
  email: string;
  event: string;
  status: string;
  createdAt: Date;
}

interface RegistrationsTableProps {
  registrations: Registration[];
  page: number;
  totalPages: number;
  total: number;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ACCEPTED: "bg-green-500/10 text-green-400 border-green-500/20",
  DECLINED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function RegistrationsTable({
  registrations,
  page,
  totalPages,
  total,
}: RegistrationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Registration | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [registrations]);

  const toggleSelectAll = () => {
    if (selectedIds.size === registrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(registrations.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const result = await deleteRegistrations(ids);
    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);

    if (result.success) {
      toast.success(result.message);
      setSelectedIds(new Set());
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  const handleAccept = async (id: string) => {
    setLoadingId(id);
    const result = await acceptRegistration(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setLoadingId(null);
  };

  const handleDecline = async (id: string) => {
    setLoadingId(id);
    const result = await declineRegistration(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setLoadingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteRegistration(deleteId);
    if (result.success) {
      toast.success(result.message);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
      router.refresh();
    } else {
      toast.error(result.message);
    }
    setDeleteId(null);
  };

  return (
    <>
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => setShowBulkDeleteDialog(true)}
        isDeleting={isBulkDeleting}
        itemLabel="registration"
      />

      <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#111]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#222] hover:bg-transparent">
              <TableHead scope="col" className="w-12 px-4 py-3">
                <Checkbox
                  checked={
                    registrations.length > 0 &&
                    selectedIds.size === registrations.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all registrations"
                />
              </TableHead>
              <TableHead scope="col" className="text-[#888]">
                Name
              </TableHead>
              <TableHead scope="col" className="text-[#888]">
                Email
              </TableHead>
              <TableHead scope="col" className="text-[#888]">
                Event
              </TableHead>
              <TableHead
                scope="col"
                className="hidden text-[#888] md:table-cell"
              >
                Status
              </TableHead>
              <TableHead scope="col" className="text-[#888]">
                Date
              </TableHead>
              <TableHead scope="col" className="w-20 text-right text-[#888]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-[#666]"
                >
                  No registrations found
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => {
                const isLoading = loadingId === reg.id;
                return (
                  <TableRow
                    key={reg.id}
                    className={
                      selectedIds.has(reg.id)
                        ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                        : "border-[#1a1a1a] hover:bg-[#1a1a1a]"
                    }
                  >
                    <TableCell
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(reg.id)}
                        onCheckedChange={() => toggleSelectOne(reg.id)}
                        aria-label={`Select registration for ${reg.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {reg.name}
                    </TableCell>
                    <TableCell className="text-[#a0a0a0]">
                      {reg.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-[#1a1a1a] text-[#a0a0a0]"
                      >
                        {reg.event}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={statusColors[reg.status] ?? "text-[#666]"}
                      >
                        {reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#999]">
                      {formatDate(reg.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#888] hover:bg-[#222] hover:text-white"
                            aria-label={`Actions for ${reg.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 border-[#222] bg-[#141414] text-white shadow-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => setSelected(reg)}
                            className="flex items-center gap-2 cursor-pointer text-[#ccc] hover:text-white"
                          >
                            <Eye className="h-4 w-4 text-cyan-400" />
                            <span>View Details</span>
                          </DropdownMenuItem>

                          {reg.status === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                disabled={isLoading}
                                onClick={() => void handleAccept(reg.id)}
                                className="flex items-center gap-2 cursor-pointer text-emerald-400 hover:text-emerald-300 focus:bg-emerald-950/20"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span>Accept</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={isLoading}
                                onClick={() => void handleDecline(reg.id)}
                                className="flex items-center gap-2 cursor-pointer text-amber-400 hover:text-amber-300 focus:bg-amber-950/20"
                              >
                                <X className="h-4 w-4" />
                                <span>Reject</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator className="bg-[#222]" />

                          <DropdownMenuItem
                            onClick={() => setDeleteId(reg.id)}
                            className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:bg-red-950/20 focus:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[#666]">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="border-[#2a2a2a] bg-[#0d0d0d] text-white disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="border-[#2a2a2a] bg-[#0d0d0d] text-white disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <DetailDialog registration={selected} onClose={() => setSelected(null)} />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent className="border-[#2a2a2a] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Registration
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#888]">
              This will permanently delete this registration. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete confirmation */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent className="border-[#2a2a2a] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete {selectedIds.size} registrations?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#888]">
              This will permanently delete the {selectedIds.size} selected
              registrations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isBulkDeleting}
              className="border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              disabled={isBulkDeleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
