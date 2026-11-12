"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/site/button";

/** Asks before closing or reloading the tab while there are unsaved changes. */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: globalThis.BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

/**
 * Appears at the bottom when a form has unsaved changes, with Discard and
 * Save. Full width on phones; a floating bar beside the menu on desktop.
 * Also warns before leaving the page.
 */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  saveLabel = "Save changes",
  message = "You have unsaved changes",
}: {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
  message?: string;
}) {
  useUnsavedChangesWarning(dirty);
  return (
    <AnimatePresence>
      {(dirty || saving) && (
        <motion.div
          role="region"
          aria-label="Unsaved changes"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 px-0 sm:bottom-5 sm:px-6 lg:left-[264px]"
        >
          <div
            data-surface="royal"
            className="bg-royal mx-auto flex max-w-[52rem] flex-col gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white shadow-[0_24px_60px_-20px_rgb(0_8_107/0.7)] sm:flex-row sm:items-center sm:rounded-full sm:py-2.5 sm:pr-2.5 sm:pl-6"
          >
            <p className="flex-1 text-sm font-bold" aria-live="polite">
              {saving ? "Saving…" : message}
            </p>
            <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
              {onDiscard && (
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={onDiscard}
                  disabled={saving}
                >
                  Discard
                </Button>
              )}
              <Button size="sm" onClick={onSave} disabled={saving}>
                {saving && (
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                )}
                {saveLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
