"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AlertDialog } from "radix-ui";
import { Toaster as Sonner } from "sonner";
import {
  AlertTriangle,
  CircleCheck,
  Info,
  Loader2,
  OctagonX,
} from "lucide-react";
import { Button } from "@/components/site/button";

/** Light, brand-styled toasts for the admin. Use `toast` from "sonner". */
export function AdminToaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      closeButton
      icons={{
        success: <CircleCheck className="text-mint-deep size-4" />,
        info: <Info className="text-royal size-4" />,
        warning: <AlertTriangle className="text-gold-deep size-4" />,
        error: <OctagonX className="size-4 text-[#c2410c]" />,
        loading: <Loader2 className="text-royal size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!font-[family-name:var(--font-mont)] !rounded-[10px] !border-black/[0.08] !bg-white !text-charcoal !shadow-[0_18px_40px_-18px_rgb(0_8_107/0.35)]",
          title: "!font-bold",
          description: "!text-grey-text",
          actionButton: "!bg-royal !text-white !rounded-full !font-bold",
        },
      }}
    />
  );
}

type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for deletes and other destructive actions. */
  danger?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * `const confirm = useConfirm(); if (await confirm({ title, danger: true })) …`
 * Accessible (focus trapped, Esc cancels) and styled like the site.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root
        open={!!options}
        onOpenChange={(open) => !open && close(false)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[80] bg-royal/40 backdrop-blur-[2px]" />
          <AlertDialog.Content className="dx-site data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-[81] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-white p-6 shadow-[0_30px_80px_-20px_rgb(0_8_107/0.45)] md:p-7">
            <AlertDialog.Title className="text-xl font-bold tracking-[-0.01em]">
              {options?.title}
            </AlertDialog.Title>
            {options?.description ? (
              <AlertDialog.Description className="text-surface-muted mt-2 text-sm leading-relaxed">
                {options.description}
              </AlertDialog.Description>
            ) : (
              <AlertDialog.Description className="sr-only">
                Confirm or cancel this action.
              </AlertDialog.Description>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel asChild>
                <Button variant="subtle" size="sm" onClick={() => close(false)}>
                  {options?.cancelLabel ?? "Cancel"}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant={options?.danger ? "danger" : "primary"}
                  size="sm"
                  onClick={() => close(true)}
                >
                  {options?.confirmLabel ??
                    (options?.danger ? "Delete" : "Confirm")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (confirm) return confirm;
  // Outside the provider (e.g. a legacy page): fall back to the browser dialog.
  return async ({ title, description }) =>
    window.confirm(
      typeof description === "string" ? `${title}\n\n${description}` : title,
    );
}
