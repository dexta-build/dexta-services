"use client";

import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/admin/kit/layout";
import { Button } from "@/components/site/button";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertTriangle />}
      title="Something went wrong"
      description={
        error.message === "Forbidden" ? (
          "You don't have access to do that."
        ) : (
          <>
            This page couldn&apos;t load. Try again, and if it keeps happening
            let an Admin know.
            {process.env.NODE_ENV === "development" && error.message && (
              <span className="bg-coral-soft text-coral-deep mt-3 block rounded-[8px] px-3 py-2 text-left font-mono text-xs break-words">
                {error.message}
              </span>
            )}
          </>
        )
      }
      action={
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
      }
      className="bg-white"
    />
  );
}
