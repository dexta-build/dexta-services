"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Loader2, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRegistrationValidator } from "@/lib/validators";

interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder: string | null;
  required: boolean;
  options: string | null;
}

interface DynamicRegistrationFormProps {
  eventSlug: string;
  fields: FormField[];
  isClosed: boolean;
  submitAction: (
    formData: Record<string, string>,
  ) => Promise<{ success: boolean; message: string }>;
}

export function DynamicRegistrationForm({
  fields,
  isClosed,
  submitAction,
}: DynamicRegistrationFormProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const schema = createRegistrationValidator(
    fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required,
    })),
  );

  const allFields = [
    {
      name: "name",
      label: "Full Name",
      type: "TEXT",
      placeholder: "Your full name",
      required: true,
      options: null,
    },
    {
      name: "email",
      label: "Email",
      type: "EMAIL",
      placeholder: "you@example.com",
      required: true,
      options: null,
    },
    ...fields,
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setServerError(null);

      const payload = { ...(data as Record<string, string>) };

      if (executeRecaptcha) {
        const token = await executeRecaptcha("event_registration");
        payload.recaptchaToken = token;
      }

      const result = await submitAction(payload);
      if (result.success) {
        setSuccess(true);
      } else {
        setServerError(result.message);
      }
    },
    [executeRecaptcha, submitAction],
  );

  if (isClosed) {
    return (
      <div className="rounded-2xl border border-[#222] bg-[#111] p-8 text-center">
        <p className="text-lg font-semibold text-white">Registration Closed</p>
        <p className="mt-2 text-sm text-[#666]">
          This event is no longer accepting registrations.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {success ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"
        >
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">
            Registration Received!
          </h3>
          <p className="mt-2 text-sm text-[#a0a0a0]">
            We&apos;ll review your registration and notify you once it&apos;s
            confirmed. Check your inbox for a confirmation email.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-[#222] bg-[#111] p-6 sm:p-8"
          noValidate
        >
          <div>
            <h2 className="text-lg font-bold text-white">Register</h2>
            <p className="mt-1 text-xs text-[#666]">Secure your spot</p>
          </div>

          {/* Honeypot & Timing Trap for bot detection */}
          <div
            className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0 pointer-events-none select-none"
            aria-hidden="true"
            tabIndex={-1}
          >
            <label htmlFor="hp_company_website">Leave this field blank</label>
            <input
              type="text"
              id="hp_company_website"
              {...register("hp_company_website")}
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="hidden"
              {...register("_form_ts")}
              defaultValue={Date.now()}
            />
          </div>

          {allFields.map((field) => {
            const error = errors[field.name];
            const errorMessage = error?.message as string | undefined;

            return (
              <div key={field.name}>
                <Label
                  htmlFor={field.name}
                  className="mb-1.5 text-xs text-[#888]"
                >
                  {field.label}
                  {field.required && <span className="text-red-400"> *</span>}
                </Label>

                {field.type === "SELECT" ? (
                  <Select onValueChange={(val) => setValue(field.name, val)}>
                    <SelectTrigger
                      id={field.name}
                      className="border-[#2a2a2a] bg-[#0d0d0d] text-white"
                      aria-label={field.label}
                    >
                      <SelectValue
                        placeholder={
                          field.placeholder || `Select ${field.label}`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border-[#2a2a2a] bg-[#111]">
                      {(() => {
                        try {
                          const opts = JSON.parse(field.options || "[]");
                          return (opts as string[]).map((opt: string) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              className="text-white focus:bg-[#1a1a1a] focus:text-white"
                            >
                              {opt}
                            </SelectItem>
                          ));
                        } catch {
                          return null;
                        }
                      })()}
                    </SelectContent>
                  </Select>
                ) : field.type === "TEXTAREA" ? (
                  <Textarea
                    id={field.name}
                    rows={3}
                    placeholder={field.placeholder || ""}
                    className="border-[#2a2a2a] bg-[#0d0d0d] text-white placeholder-[#444] focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                    {...register(field.name)}
                  />
                ) : field.type === "CHECKBOX" ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={field.name}
                      checked={watch(field.name) === true}
                      onCheckedChange={(checked) =>
                        setValue(field.name, checked === true)
                      }
                    />
                    <Label
                      htmlFor={field.name}
                      className="text-sm text-[#a0a0a0]"
                    >
                      {field.placeholder || field.label}
                    </Label>
                  </div>
                ) : (
                  <Input
                    id={field.name}
                    type={
                      field.type === "EMAIL"
                        ? "email"
                        : field.type === "URL"
                          ? "url"
                          : "text"
                    }
                    placeholder={field.placeholder || ""}
                    className="border-[#2a2a2a] bg-[#0d0d0d] text-white placeholder-[#444] focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20"
                    {...register(field.name)}
                  />
                )}

                {errorMessage && (
                  <p className="mt-1 text-xs text-red-400">{errorMessage}</p>
                )}
              </div>
            );
          })}

          {serverError && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-400">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
