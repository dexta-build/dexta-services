"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useFormStatus } from "react-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Loader2 } from "lucide-react";
import { submitContactForm } from "@/app/actions";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";
import { Button } from "./button";

export type ContactFormLabels = {
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submit: string;
  sending: string;
};

const DEFAULT_LABELS: ContactFormLabels = {
  nameLabel: "Name",
  emailLabel: "Email",
  messageLabel: "Message",
  submit: "Send message",
  sending: "Sending…",
};

type State = {
  message: string;
  success?: boolean;
  errors?: Record<string, string[]>;
};

const field =
  "border-charcoal/[0.18] bg-canvas text-charcoal focus:border-brand min-h-12 w-full rounded-[8px] border px-4 py-3 text-base outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#737773] focus:bg-white focus:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]";

function Submit({ labels }: { labels: ContactFormLabels }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      block="mobile"
      arrow={!pending}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {pending ? labels.sending : labels.submit}
    </Button>
  );
}

function Form({ labels }: { labels: ContactFormLabels }) {
  const [state, formAction] = useActionState(submitContactForm, {
    message: "",
  }) as unknown as [State, (payload: FormData) => void];
  const formRef = useRef<React.ComponentRef<"form">>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    if (state?.success === true || state?.message?.includes("successfully"))
      formRef.current?.reset();
  }, [state?.success, state?.message]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<React.ComponentRef<"form">>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      if (executeRecaptcha) {
        try {
          const token = await executeRecaptcha("contact");
          if (token) formData.set("recaptchaToken", token);
        } catch (err) {
          console.warn("[reCAPTCHA] Failed to execute recaptcha:", err);
        }
      }
      startTransition(() => formAction(formData));
    },
    [executeRecaptcha, formAction],
  );

  const isError = state?.success === false || Boolean(state?.errors);
  const error = (k: string) =>
    state?.errors?.[k] ? (
      <p role="alert" className="mt-2 text-xs font-bold text-[#c2410c]">
        {state.errors[k].join(", ")}
      </p>
    ) : null;

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-[0_30px_60px_-34px_rgb(0_8_107/0.4)] ring-1 ring-black/5 sm:p-8">
      <form ref={formRef} onSubmit={onSubmit} className="relative space-y-6">
        {/* Honeypot: invisible to people, filled in by bots */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 -left-[9999px] h-0 w-0 overflow-hidden opacity-0 select-none"
        >
          <label htmlFor="company_title">Leave this field blank</label>
          <input
            type="text"
            id="company_title"
            name="company_title"
            tabIndex={-1}
            autoComplete="off"
          />
          <input type="hidden" name="_form_ts" defaultValue={Date.now()} />
        </div>

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-bold">
            {labels.nameLabel}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            className={field}
            required
          />
          {error("name")}
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold">
            {labels.emailLabel}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            className={field}
            required
          />
          {error("email")}
        </div>
        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-bold">
            {labels.messageLabel}
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className={field}
            required
          />
          {error("message")}
        </div>
        <div className="pt-2">
          <Submit labels={labels} />
        </div>
        {state?.message && (
          <p
            role="status"
            className={
              isError
                ? "text-sm font-bold text-[#c2410c]"
                : "text-mint-deep text-sm font-bold"
            }
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}

/** The contact form for the contact page (sends to the admin inbox). */
export function ContactFormEmbed({
  labels = DEFAULT_LABELS,
}: {
  labels?: ContactFormLabels;
}) {
  return (
    <RecaptchaProvider>
      <Form labels={labels} />
    </RecaptchaProvider>
  );
}
