"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import type { AdminMember } from "@/lib/team/admin";
import { profileSections } from "@/lib/team/fields";
import { RESERVED_ADDRESSES } from "@/lib/team/addresses";
import { stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { EmptyState, StatusPill } from "@/components/admin/kit/layout";
import { SortableList } from "@/components/admin/kit/sortable-list";
import { RowActions } from "@/components/admin/kit/row-actions";
import { useConfirm } from "@/components/admin/kit/feedback";
import { deleteMember, reorderMembers, setMemberVisible } from "./actions";

type Result = { success: boolean; message?: string };

export function TeamManager({ team }: { team: AdminMember[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [items, setItems] = useState(team);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setItems(team), [team]);

  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });

  const add = (
    <Button size="sm" href="/admin/team/new">
      <Plus aria-hidden className="size-4" /> Add a person
    </Button>
  );

  if (items.length === 0)
    return (
      <EmptyState
        icon={<UserRound />}
        title="No one on the team yet"
        description="Add people to show them on the About page, each with their own portfolio."
        action={add}
      />
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">{add}</div>
      <SortableList
        label="Team order"
        items={items}
        getId={(m) => m.id}
        onReorder={(next) => {
          setItems(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(async () => {
            const res = await reorderMembers(next.map((m) => m.id));
            if (!res.success) toast.error(res.message);
            else toast.success("Order saved");
          }, 700);
        }}
        renderItem={(m) => {
          const sections = profileSections(m.form);
          const done = sections.filter(([, ok]) => ok).length;
          const slug = m.form.slug;
          return (
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/team/${m.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 outline-none focus-visible:underline"
              >
                {m.form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- previews from any host
                  <img
                    src={stock(m.form.photo, 96, 120)}
                    alt=""
                    className="bg-canvas h-14 w-11 shrink-0 rounded-[8px] object-cover"
                  />
                ) : (
                  <span
                    data-surface={m.form.color || "ice"}
                    className="bg-surface text-surface-fg inline-flex h-14 w-11 shrink-0 items-center justify-center rounded-[8px] text-sm font-bold"
                  >
                    {m.form.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{m.form.name}</span>
                    {!m.form.isVisible && <StatusPill>Hidden</StatusPill>}
                    {RESERVED_ADDRESSES.has(m.form.slug) && (
                      <StatusPill tone="danger">
                        /{m.form.slug} is now a page of the site: change the
                        address
                      </StatusPill>
                    )}
                    {m.form.availability && (
                      <StatusPill tone="success">
                        {m.form.availability}
                      </StatusPill>
                    )}
                  </span>
                  <span className="text-surface-muted truncate text-xs">
                    {m.form.role} · /{m.form.slug} · profile {done}/
                    {sections.length} sections
                    {done < sections.length &&
                      ` (missing ${sections
                        .filter(([, ok]) => !ok)
                        .map(([n]) => n.toLowerCase())
                        .slice(0, 3)
                        .join(", ")}${sections.length - done > 3 ? "…" : ""})`}
                  </span>
                </span>
              </Link>
              <Button
                href={`/admin/team/${m.id}`}
                size="sm"
                variant="subtle"
                className="hidden sm:inline-flex"
              >
                Edit profile
              </Button>
              <RowActions
                label={`Actions for ${m.form.name}`}
                title={m.form.name}
                actions={[
                  {
                    label: "Edit profile",
                    icon: <Pencil />,
                    href: `/admin/team/${m.id}`,
                  },
                  {
                    label: "View profile",
                    icon: <ExternalLink />,
                    href: `/${slug}`,
                    external: true,
                    hidden: !m.form.isVisible,
                  },
                  {
                    label: m.form.isVisible ? "Hide" : "Show",
                    icon: m.form.isVisible ? <EyeOff /> : <Eye />,
                    onSelect: () =>
                      run(
                        () => setMemberVisible(m.id, !m.form.isVisible),
                        m.form.isVisible ? "Hidden" : "Shown",
                      ),
                  },
                  "separator",
                  {
                    label: "Remove",
                    icon: <Trash2 />,
                    danger: true,
                    onSelect: async () => {
                      const ok = await confirm({
                        title: `Remove ${m.form.name}?`,
                        description: `Their profile is deleted.${m.postCount ? ` Their ${m.postCount} article${m.postCount === 1 ? " stays" : "s stay"}, without an author.` : ""} To keep it, hide them instead.`,
                        confirmLabel: "Remove",
                        danger: true,
                      });
                      if (ok) run(() => deleteMember(m.id), "Removed");
                    },
                  },
                ]}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
