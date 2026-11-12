"use client";

import { useId, useRef, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Check, CheckCircle2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { checkRegistration, type FormFieldDef } from "@/lib/events/fields";
import {
  REGISTRATION_FORM_LABELS,
  type RegistrationFormLabels,
} from "@/lib/site/event-labels";

type Submit = (data: Record<string, string>) => Promise<{
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}>;

const control =
  "border-surface-fg/20 focus:border-brand focus:ring-brand/15 w-full rounded-[8px] border bg-white px-4 text-[0.9375rem] outline-none transition-[border-color,box-shadow] focus:ring-4 aria-invalid:border-coral";

/**
 * The registration form on an event page, in the site's style: name and
 * email, then the event's own questions. Checks answers as people type
 * the same way the server does; keeps the bot traps of the old form.
 * `preview` (admin) shows it without sending anything.
 */
export function RegistrationForm({
  fields,
  closed = false,
  submitAction,
  labels: L = REGISTRATION_FORM_LABELS,
  preview = false,
}: {
  fields: FormFieldDef[];
  closed?: boolean;
  submitAction?: Submit;
  labels?: RegistrationFormLabels;
  preview?: boolean;
}) {
  const uid = useId();
  // Undefined when reCAPTCHA isn't set up (no provider): the form still works.
  const { executeRecaptcha } = useGoogleReCaptcha();
  const startedAt = useRef(Date.now());
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const all: FormFieldDef[] = [
    {
      name: "name",
      label: L.nameLabel,
      type: "TEXT",
      placeholder: L.namePlaceholder,
      required: true,
      options: [],
    },
    {
      name: "email",
      label: L.emailLabel,
      type: "EMAIL",
      placeholder: L.emailPlaceholder,
      required: true,
      options: [],
    },
    ...fields,
  ];

  const set = (name: string, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched[name] || errors[name]) {
      const r = checkRegistration(fields, next);
      setErrors((e) => {
        const copy = { ...e };
        if (!r.ok && r.errors[name]) copy[name] = r.errors[name];
        else delete copy[name];
        return copy;
      });
    }
  };

  if (closed)
    return (
      <div
        data-surface="ice"
        className="bg-surface text-surface-fg flex flex-col items-center gap-3 rounded-[10px] p-8 text-center"
      >
        <Lock aria-hidden className="size-8" />
        <p className="text-h3">{L.closedTitle}</p>
        <p className="text-surface-muted text-sm leading-relaxed">
          {L.closedBody}
        </p>
      </div>
    );

  if (message)
    return (
      <div
        data-surface="mint"
        role="status"
        className="bg-surface text-surface-fg flex flex-col items-center gap-3 rounded-[10px] p-8 text-center"
      >
        <CheckCircle2 aria-hidden className="size-10" />
        <p className="text-h3">{L.successTitle}</p>
        <p className="text-surface-muted text-sm leading-relaxed">{message}</p>
      </div>
    );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const r = checkRegistration(fields, values);
    if (!r.ok) {
      setErrors(r.errors);
      setTouched(Object.fromEntries(all.map((f) => [f.name, true])));
      const first = all.find((f) => r.errors[f.name]);
      if (first) document.getElementById(`${uid}-${first.name}`)?.focus();
      return;
    }
    if (preview || !submitAction) {
      setMessage(L.successBody);
      return;
    }
    setSending(true);
    try {
      const trap = (
        e.currentTarget.elements.namedItem("hp_company_website") as {
          value?: string;
        } | null
      )?.value;
      const payload: Record<string, string> = {
        ...values,
        hp_company_website: trap ?? "",
        _form_ts: String(startedAt.current),
      };
      if (executeRecaptcha)
        payload.recaptchaToken = await executeRecaptcha("event_registration");
      const res = await submitAction(payload);
      if (res.success) setMessage(L.successBody);
      else {
        setServerError(res.message);
        if (res.errors) setErrors(res.errors);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      data-surface="white"
      noValidate
      onSubmit={onSubmit}
      className="bg-surface text-surface-fg relative flex flex-col gap-5 rounded-[10px] p-6 shadow-[0_24px_48px_-28px_rgb(0_8_107/0.35)] ring-1 ring-black/[0.04] md:p-8"
    >
      <div>
        <p className="text-h3">{L.title}</p>
        {L.subtitle && (
          <p className="text-surface-muted mt-1 text-sm">{L.subtitle}</p>
        )}
      </div>

      {/* Bot trap: hidden from people, filled in by bots. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor={`${uid}-hp`}>Leave this field blank</label>
        <input
          id={`${uid}-hp`}
          name="hp_company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {all.map((f) => {
        const id = `${uid}-${f.name}`;
        const err = touched[f.name] || errors[f.name] ? errors[f.name] : "";
        const describedBy = err ? `${id}-error` : undefined;
        const common = {
          id,
          name: f.name,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": describedBy,
          "aria-required": f.required || undefined,
          onBlur: () => {
            setTouched((t) => ({ ...t, [f.name]: true }));
            const r = checkRegistration(fields, values);
            setErrors((e) => {
              const copy = { ...e };
              if (!r.ok && r.errors[f.name]) copy[f.name] = r.errors[f.name];
              else delete copy[f.name];
              return copy;
            });
          },
        };

        if (f.type === "CHECKBOX") {
          const on = values[f.name] === "yes";
          return (
            <div key={f.name} className="flex flex-col gap-1.5">
              <label
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 text-sm"
              >
                <input
                  {...common}
                  type="checkbox"
                  className="peer sr-only"
                  checked={on}
                  onChange={(e) => set(f.name, e.target.checked ? "yes" : "")}
                />
                <span
                  aria-hidden
                  className={cn(
                    "peer-focus-visible:ring-brand/30 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-4",
                    on
                      ? "bg-brand border-brand text-white"
                      : err
                        ? "border-coral"
                        : "border-surface-fg/30",
                  )}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="leading-snug">
                  {f.placeholder || f.label}
                  {f.required && <span className="text-coral"> *</span>}
                </span>
              </label>
              {err && (
                <p id={`${id}-error`} className="text-coral-deep pl-8 text-xs">
                  {err}
                </p>
              )}
            </div>
          );
        }

        return (
          <div key={f.name} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-bold">
              {f.label}
              {f.required && <span className="text-coral"> *</span>}
            </label>
            {f.type === "TEXTAREA" ? (
              <textarea
                {...common}
                rows={4}
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => set(f.name, e.target.value)}
                className={cn(control, "py-3 leading-relaxed")}
              />
            ) : f.type === "SELECT" ? (
              <span className="relative">
                <select
                  {...common}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  className={cn(
                    control,
                    "h-12 cursor-pointer appearance-none pr-10",
                    !values[f.name] && "text-surface-muted",
                  )}
                >
                  <option value="">{f.placeholder || L.choose}</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden
                  className="text-surface-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs"
                >
                  ▾
                </span>
              </span>
            ) : (
              <input
                {...common}
                type={
                  f.type === "EMAIL"
                    ? "email"
                    : f.type === "URL"
                      ? "url"
                      : "text"
                }
                inputMode={
                  f.type === "EMAIL"
                    ? "email"
                    : f.type === "URL"
                      ? "url"
                      : undefined
                }
                autoComplete={
                  f.name === "name"
                    ? "name"
                    : f.name === "email"
                      ? "email"
                      : undefined
                }
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => set(f.name, e.target.value)}
                className={cn(control, "h-12")}
              />
            )}
            {err && (
              <p id={`${id}-error`} className="text-coral-deep text-xs">
                {err}
              </p>
            )}
          </div>
        );
      })}

      {serverError && (
        <p
          role="alert"
          className="bg-coral-soft text-coral-deep rounded-[8px] px-4 py-3 text-sm"
        >
          {serverError}
        </p>
      )}

      <Button type="submit" block size="lg" arrow disabled={sending}>
        {sending ? L.submitting : L.submit}
      </Button>
      {L.privacy && (
        <p className="text-surface-muted -mt-2 text-center text-xs">
          {L.privacy}
        </p>
      )}
    </form>
  );
}
