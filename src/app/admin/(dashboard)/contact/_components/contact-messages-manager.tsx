"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  Mail,
  MessageSquareText,
  Send,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import {
  deleteContactMessage,
  deleteContactMessages,
  markContactMessageRead,
  replyToContactMessage,
  type ContactMessageRow,
  type ContactMessagesPage,
} from "../actions";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPreview(message: string) {
  return message.length > 96 ? `${message.slice(0, 96)}...` : message;
}

function getDefaultReplySubject(name: string) {
  return `Re: Your message to Dexta, ${name}`;
}

function getStatusClasses(isRead: boolean) {
  return isRead
    ? "border border-[#2a2a2a] bg-transparent text-[#a0a0a0]"
    : "bg-cyan-500 text-black";
}

export function ContactMessagesManager({
  messages,
  onMessageCountsChange,
}: {
  messages: ContactMessagesPage;
  onMessageCountsChange?: (counts: {
    unreadCount: number;
    totalCount: number;
  }) => void;
}) {
  const router = useRouter();
  const [messageItems, setMessageItems] = useState<ContactMessageRow[]>(
    messages.items,
  );
  const [unreadCount, setUnreadCount] = useState(messages.unreadCount);
  const [totalCount, setTotalCount] = useState(messages.totalCount);
  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageRow | null>(null);
  const [deletingMessage, setDeletingMessage] =
    useState<ContactMessageRow | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [markingMessageId, setMarkingMessageId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === messageItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messageItems.map((m) => m.id)));
    }
  };

  const toggleSelectOne = (id: number) => {
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
    const result = await deleteContactMessages(ids);
    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    const deletedCount = ids.length;
    const deletedUnreadCount = messageItems.filter(
      (item) => ids.includes(item.id) && !item.isRead,
    ).length;

    setMessageItems((current) =>
      current.filter((item) => !ids.includes(item.id)),
    );
    setTotalCount((c) => Math.max(0, c - deletedCount));
    setUnreadCount((c) => Math.max(0, c - deletedUnreadCount));
    setSelectedIds(new Set());
    if (selectedMessage && ids.includes(selectedMessage.id)) {
      setSelectedMessage(null);
    }
    router.refresh();
  };

  useEffect(() => {
    setMessageItems(messages.items);
    setUnreadCount(messages.unreadCount);
    setTotalCount(messages.totalCount);
    setSelectedIds(new Set());
  }, [messages.items, messages.totalCount, messages.unreadCount]);

  useEffect(() => {
    onMessageCountsChange?.({
      unreadCount,
      totalCount,
    });
  }, [onMessageCountsChange, totalCount, unreadCount]);

  useEffect(() => {
    if (!selectedMessage) {
      setReplySubject("");
      setReplyBody("");
      return;
    }

    setReplySubject(getDefaultReplySubject(selectedMessage.name));
    setReplyBody("");
  }, [selectedMessage]);

  const paginationLabel = useMemo(() => {
    if (!totalCount) {
      return "No messages yet";
    }

    const start = (messages.page - 1) * messages.pageSize + 1;
    const end = Math.min(messages.page * messages.pageSize, totalCount);

    return `Showing ${start}-${end} of ${totalCount} messages`;
  }, [messages.page, messages.pageSize, totalCount]);

  const handleDelete = async () => {
    if (!deletingMessage) return;

    const wasUnread = !deletingMessage.isRead;
    const result = await deleteContactMessage(deletingMessage.id);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setDeletingMessage(null);
    if (selectedMessage?.id === deletingMessage.id) {
      setSelectedMessage(null);
    }
    setMessageItems((currentItems) =>
      currentItems.filter((item) => item.id !== deletingMessage.id),
    );
    setTotalCount((currentCount) => Math.max(0, currentCount - 1));
    if (wasUnread) {
      setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
    }
    router.refresh();
  };

  const handleReply = async () => {
    if (!selectedMessage) return;

    setIsReplying(true);
    const result = await replyToContactMessage(selectedMessage.id, {
      subject: replySubject,
      body: replyBody,
    });
    setIsReplying(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    const readAt = new Date();

    setMessageItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedMessage.id
          ? { ...item, isRead: true, readAt }
          : item,
      ),
    );
    setSelectedMessage((currentMessage) =>
      currentMessage
        ? { ...currentMessage, isRead: true, readAt }
        : currentMessage,
    );
    setUnreadCount((currentCount) =>
      selectedMessage.isRead ? currentCount : Math.max(0, currentCount - 1),
    );
    setReplyBody("");
    setReplySubject(getDefaultReplySubject(selectedMessage.name));
    router.refresh();
  };

  const handleOpenMessage = async (item: ContactMessageRow) => {
    const openedAt = item.readAt ?? new Date();
    const nextSelectedMessage = item.isRead
      ? item
      : { ...item, isRead: true, readAt: openedAt };

    setSelectedMessage(nextSelectedMessage);

    if (item.isRead || markingMessageId === item.id) {
      return;
    }

    setMarkingMessageId(item.id);
    setMessageItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, isRead: true, readAt: openedAt }
          : currentItem,
      ),
    );
    setUnreadCount((currentCount) => Math.max(0, currentCount - 1));

    const result = await markContactMessageRead(item.id);

    setMarkingMessageId(null);

    if (!result.success) {
      toast.error(result.message);
      setMessageItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? item : currentItem,
        ),
      );
      setSelectedMessage(item);
      setUnreadCount((currentCount) => currentCount + 1);
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">
              Messages Inbox
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Read every contact form submission in one place
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8d8d8d]">
              Open any message to view the sender details and full note. You can
              keep it after reading or delete it from the inbox.
            </p>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#0d0d0d] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
              Inbox status
            </p>
            <p className="mt-1 text-sm text-white">{paginationLabel}</p>
            {unreadCount ? (
              <p className="mt-2 inline-flex items-center rounded-full bg-cyan-500 px-2.5 py-1 text-[11px] font-semibold text-black">
                {unreadCount} unread
              </p>
            ) : (
              <p className="mt-2 text-xs text-[#666]">All caught up</p>
            )}
          </div>
        </div>
      </div>

      {messageItems.length ? (
        <>
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
            onDelete={() => setShowBulkDeleteDialog(true)}
            isDeleting={isBulkDeleting}
            itemLabel="message"
          />

          <div className="rounded-2xl border border-[#222] bg-[#111]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#222] hover:bg-transparent">
                  <TableHead className="w-12 px-4 py-3">
                    <Checkbox
                      checked={
                        messageItems.length > 0 &&
                        selectedIds.size === messageItems.length
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all messages"
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[#8d8d8d]">
                    Sender
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[#8d8d8d]">
                    Email
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[#8d8d8d]">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[#8d8d8d]">
                    Preview
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[#8d8d8d]">
                    Received
                  </TableHead>
                  <TableHead className="w-20 px-4 py-3 text-right text-[#8d8d8d]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messageItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={
                      selectedIds.has(item.id)
                        ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                        : item.isRead
                          ? "border-[#222] text-white hover:bg-[#0d0d0d]"
                          : "border-cyan-500/30 bg-cyan-500/5 text-white hover:bg-cyan-500/10"
                    }
                  >
                    <TableCell
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelectOne(item.id)}
                        aria-label={`Select message from ${item.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            item.isRead ? "bg-[#3a3a3a]" : "bg-cyan-400"
                          }`}
                        />
                        <div>
                          <p
                            className={
                              item.isRead
                                ? "font-medium text-white"
                                : "font-semibold text-white"
                            }
                          >
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-[#666]">
                            Message #{item.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-[#cfcfcf]">
                      {item.email}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          item.isRead,
                        )}`}
                      >
                        {item.isRead ? "Read" : "Unread"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`px-4 py-4 text-sm ${
                        item.isRead
                          ? "text-[#8d8d8d]"
                          : "font-medium text-[#e8f9ff]"
                      }`}
                    >
                      {getPreview(item.message)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-[#8d8d8d]">
                      <div>
                        <p>{formatDate(item.createdAt)}</p>
                        {!item.isRead ? (
                          <p className="mt-1 text-xs text-cyan-400">
                            New message
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#888] hover:bg-[#222] hover:text-white"
                            aria-label={`Actions for message from ${item.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 border-[#222] bg-[#141414] text-white shadow-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => void handleOpenMessage(item)}
                            className="flex items-center gap-2 cursor-pointer text-[#ccc] hover:text-white focus:bg-[#222]"
                          >
                            <Eye className="h-4 w-4 text-cyan-400" />
                            <span>View & Reply</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#222]" />
                          <DropdownMenuItem
                            onClick={() => setDeletingMessage(item)}
                            className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:bg-red-950/20 focus:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[#222] bg-[#111] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#8d8d8d]">{paginationLabel}</p>
            <div className="flex gap-2">
              {messages.page <= 1 ? (
                <Button
                  variant="outline"
                  disabled
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
                >
                  Previous
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
                >
                  <Link
                    href={`/admin/contact?section=messages&page=${messages.page - 1}`}
                  >
                    Previous
                  </Link>
                </Button>
              )}
              {messages.page >= messages.totalPages ? (
                <Button
                  variant="outline"
                  disabled
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
                >
                  Next
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
                >
                  <Link
                    href={`/admin/contact?section=messages&page=${messages.page + 1}`}
                  >
                    Next
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">
            No contact messages yet
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#8d8d8d]">
            When someone submits the public contact form, their message will
            appear here with their name, email address, and full note.
          </p>
        </div>
      )}

      <Dialog
        open={Boolean(selectedMessage)}
        onOpenChange={(open) => {
          if (!open) setSelectedMessage(null);
        }}
      >
        <DialogContent className="border-[#222] bg-[#111] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Message Details</DialogTitle>
            <DialogDescription className="text-[#8d8d8d]">
              Open the full note, then decide whether to keep it in the inbox or
              delete it.
            </DialogDescription>
          </DialogHeader>
          {selectedMessage ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                    Sender
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {selectedMessage.name}
                  </p>
                </div>
                <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                    Email
                  </p>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="mt-2 block text-sm font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                    Status
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                        selectedMessage.isRead,
                      )}`}
                    >
                      {selectedMessage.isRead ? "Read" : "Unread"}
                    </span>
                    {markingMessageId === selectedMessage.id ? (
                      <span className="text-xs text-cyan-400">Updating...</span>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#666]">
                    Received
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                  {selectedMessage.readAt ? (
                    <p className="mt-2 text-xs text-[#8d8d8d]">
                      Read on {formatDate(selectedMessage.readAt)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#666]">
                  <MessageSquareText className="h-4 w-4" />
                  Message
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#d6d6d6]">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">
                      Reply via Brevo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#8d8d8d]">
                      This sends an email directly to {selectedMessage.email}.
                      If they reply, the response goes back to the Dexta inbox.
                    </p>
                  </div>
                  <Send className="h-5 w-5 shrink-0 text-cyan-400" />
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="contact-reply-subject"
                      className="mb-1.5 block text-xs text-[#888]"
                    >
                      Subject
                    </label>
                    <Input
                      id="contact-reply-subject"
                      value={replySubject}
                      onChange={(event) => setReplySubject(event.target.value)}
                      className="border-[#2a2a2a] bg-[#111] text-white placeholder-[#444] focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      placeholder="Reply subject"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-reply-body"
                      className="mb-1.5 block text-xs text-[#888]"
                    >
                      Reply message
                    </label>
                    <Textarea
                      id="contact-reply-body"
                      rows={7}
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      className="resize-none border-[#2a2a2a] bg-[#111] text-white placeholder-[#444] focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                      placeholder="Write your reply here..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
                >
                  Keep Message
                </Button>
                <Button
                  type="button"
                  onClick={handleReply}
                  disabled={isReplying}
                  className="bg-cyan-500 text-black hover:bg-cyan-400"
                >
                  {isReplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingMessage(selectedMessage)}
                  className="border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Message
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingMessage)}
        onOpenChange={(open) => {
          if (!open) setDeletingMessage(null);
        }}
      >
        <AlertDialogContent className="border-[#222] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#8d8d8d]">
              {deletingMessage
                ? `This will permanently remove ${deletingMessage.name}'s message from the inbox.`
                : "This message will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent className="border-[#222] bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} messages?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#8d8d8d]">
              This will permanently delete the {selectedIds.size} selected
              contact messages from the inbox. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isBulkDeleting}
              className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              disabled={isBulkDeleting}
              className="bg-red-500 text-white hover:bg-red-400"
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
    </div>
  );
}
