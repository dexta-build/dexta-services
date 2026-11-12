"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AddressBook } from "@/lib/team/admin";
import {
  addressProblem,
  cleanAddress,
  defaultAddress,
  describeProblem,
} from "@/lib/team/addresses";
import { useConfirm } from "@/components/admin/kit/feedback";
import { removeAddressRedirect } from "./actions";

/**
 * The profile's address on the site (yoursite/daniel-azu), checked as you
 * type: not a page of the site, not someone else's. Changing a published
 * address keeps the old one working as a redirect.
 */
export function AddressField({
  memberId,
  value,
  onChange,
  name,
  savedAddress,
  book,
  host,
  error,
}: {
  memberId: string | null;
  value: string;
  onChange: (address: string) => void;
  /** The person's name, followed by a new profile's address until edited. */
  name: string;
  /** The live address before this edit (null for a new profile). */
  savedAddress: string | null;
  book: AddressBook;
  host: string;
  error?: string;
}) {
  const id = useId();
  const router = useRouter();
  const confirm = useConfirm();
  const [, start] = useTransition();
  const touched = useRef(!!savedAddress);
  const [focused, setFocused] = useState(false);

  // A new profile's address follows the name until it's edited.
  useEffect(() => {
    if (touched.current) return;
    const next = defaultAddress(name);
    if (next !== value) onChange(next);
  }, [name, value, onChange]);

  const clean = cleanAddress(value);
  const problem = addressProblem(clean, book.taken);
  const claims = !problem ? book.oldOfOthers[clean] : undefined;
  const moving = !!savedAddress && clean !== savedAddress && !problem;

  const status: { tone: "ok" | "info" | "warn" | "bad"; text: string } =
    problem && !(focused && problem.kind === "empty")
      ? { tone: "bad", text: error ?? describeProblem(problem) }
      : claims
        ? {
            tone: "warn",
            text: `This was ${claims}'s old address. Links to it will open this profile instead.`,
          }
        : moving
          ? book.redirectsReady
            ? {
                tone: "info",
                text: `When you save, /${savedAddress} will redirect here, so shared links keep working.`,
              }
            : {
                tone: "warn",
                text: `/${savedAddress} won't redirect until the database update (prisma db push) is run.`,
              }
          : savedAddress && clean === savedAddress
            ? { tone: "ok", text: "This is the current address." }
            : { tone: "ok", text: "This address is free." };

  const Icon =
    status.tone === "ok"
      ? CheckCircle2
      : status.tone === "info"
        ? Info
        : AlertTriangle;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        Profile address
      </label>
      <div
        className={cn(
          "flex h-12 min-w-0 items-center rounded-[10px] border bg-white px-3.5 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]",
          status.tone === "bad"
            ? "border-[#c2410c]"
            : "border-charcoal/15 focus-within:border-brand",
        )}
      >
        <span aria-hidden className="text-surface-muted shrink-0 text-sm">
          {host}/
        </span>
        <input
          id={id}
          value={value}
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={status.tone === "bad" || undefined}
          aria-describedby={`${id}-status`}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            touched.current = true;
            onChange(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]+/g, "-")
                .replace(/-{2,}/g, "-")
                .replace(/^-/, "")
                .slice(0, 60),
            );
          }}
          onBlur={() => {
            setFocused(false);
            if (clean !== value) onChange(clean);
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
        />
      </div>
      <p
        id={`${id}-status`}
        aria-live="polite"
        className={cn(
          "flex items-start gap-1.5 text-xs leading-relaxed",
          status.tone === "ok" && "text-mint-deep",
          status.tone === "info" && "text-royal",
          status.tone === "warn" && "text-[#9a6700]",
          status.tone === "bad" && "font-bold text-[#c2410c]",
        )}
      >
        <Icon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {status.text}
      </p>
      <p className="text-surface-muted text-xs">
        Lower-case letters, numbers and dashes. Pages of the site (about, works,
        contact…) can&apos;t be used.
      </p>

      {book.ownOld.length > 0 && memberId && (
        <div className="bg-canvas mt-2 flex flex-col gap-2 rounded-[10px] p-3">
          <p className="text-xs font-bold">Old addresses that redirect here</p>
          <ul className="flex flex-col gap-1.5">
            {book.ownOld.map((old) => (
              <li
                key={old}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <CornerDownRight
                    aria-hidden
                    className="text-surface-muted size-3.5 shrink-0"
                  />
                  <span className="truncate">/{old}</span>
                  <ArrowRight
                    aria-hidden
                    className="text-surface-muted size-3.5 shrink-0"
                  />
                  <span className="text-surface-muted truncate">
                    /{savedAddress}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Stop /${old} redirecting`}
                  title="Stop redirecting"
                  onClick={async () => {
                    const ok = await confirm({
                      title: `Stop /${old} redirecting?`,
                      description:
                        "Anyone with the old link will see “page not found”. The address becomes free for someone else.",
                      confirmLabel: "Stop redirecting",
                      danger: true,
                    });
                    if (!ok) return;
                    start(async () => {
                      const res = await removeAddressRedirect(memberId, old);
                      if (!res.success) return void toast.error(res.message);
                      toast.success(`/${old} no longer redirects`);
                      router.refresh();
                    });
                  }}
                  className="text-surface-muted inline-flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-black/[0.06] hover:text-[#c2410c]"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
