"use client";

import { useFormStatus } from "react-dom";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { submitContactForm } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";
import { motion } from "framer-motion";
import { ArrowRight, Loader } from "lucide-react";

const initialState = {
  message: "",
};

function SubmitButton({ light = false }: { light?: boolean }) {
  const { pending } = useFormStatus();

  if (light) {
    return (
      <Button
        type="submit"
        aria-disabled={pending}
        disabled={pending}
        className="h-12 rounded-full bg-[var(--dexta)] px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Message
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="h-11 sm:h-12 md:h-14 px-6 sm:px-8 rounded-none border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono tracking-widest backdrop-blur-sm transition-all duration-300 group text-sm sm:text-base"
    >
      {pending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          SENDING...
        </>
      ) : (
        <>
          SUBMIT
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </Button>
  );
}

// Shared form card — dark (home page) or light (contact page)
function ContactFormCard({ light = false }: { light?: boolean }) {
  const [state, formAction] = useActionState(
    submitContactForm,
    initialState,
  ) as unknown as [
    typeof initialState & {
      success?: boolean;
      errors?: Record<string, string[]>;
    },
    (payload: FormData) => void,
  ];
  const formRef = useRef<HTMLFormElement>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    if (
      state?.success === true ||
      (state?.message && state.message.includes("successfully"))
    ) {
      formRef.current?.reset();
    }
  }, [state?.success, state?.message]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      if (executeRecaptcha) {
        try {
          const token = await executeRecaptcha("contact");
          if (token) {
            formData.set("recaptchaToken", token);
          }
        } catch (err) {
          console.warn("[reCAPTCHA] Failed to execute recaptcha:", err);
        }
      }

      startTransition(() => {
        formAction(formData);
      });
    },
    [executeRecaptcha, formAction],
  );

  const isError = state?.success === false || Boolean(state?.errors);

  const inputClass = light ? "form-input-light" : "form-input";
  const labelClass = light
    ? "block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--dexta-primary)] mb-2"
    : "block text-xs font-mono tracking-wider text-gray-400 mb-2";
  const errorClass = light
    ? "text-red-500 text-xs mt-2"
    : "text-red-400 text-xs mt-2";

  return (
    <>
      <div
        className={
          light
            ? "rounded-[30px] border border-[var(--dexta-primary)] bg-white p-6 sm:p-8"
            : "relative border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-sm"
        }
      >
        {!light && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent" />
        )}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative z-10 space-y-6"
        >
          {/* Honeypot field for bot trapping (invisible to real users) */}
          <div
            className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0 pointer-events-none select-none"
            aria-hidden="true"
            tabIndex={-1}
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
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={inputClass}
              required
            />
            {state?.errors?.name && (
              <p className={errorClass}>{state.errors.name.join(", ")}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={inputClass}
              required
            />
            {state?.errors?.email && (
              <p className={errorClass}>{state.errors.email.join(", ")}</p>
            )}
          </div>
          <div>
            <label htmlFor="message" className={labelClass}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className={inputClass}
              required
            />
            {state?.errors?.message && (
              <p className={errorClass}>{state.errors.message.join(", ")}</p>
            )}
          </div>
          <div className="pt-2">
            <SubmitButton light={light} />
          </div>
          {state?.message && (
            <p
              className={`text-sm ${
                isError
                  ? light
                    ? "text-red-500 font-medium"
                    : "text-red-400 font-medium"
                  : light
                    ? "text-green-600 font-medium"
                    : "text-green-400 font-medium"
              }`}
            >
              {state.message}
            </p>
          )}
        </form>
      </div>
      <style jsx global>{`
        /* Dark variant — used on home page */
        .form-input {
          width: 100%;
          padding: 0.65rem 0.875rem;
          border-radius: 0;
          border: 1px dotted var(--dexta);
          background-color: transparent;
          color: white;
          font-family: var(--font-sans);
          font-size: 0.9375rem;
          transition:
            border-color 0.3s,
            box-shadow 0.3s;
          min-height: 2.75rem;
        }
        .form-input:focus {
          outline: none;
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.1);
        }

        /* Light variant — used on contact page */
        .form-input-light {
          width: 100%;
          padding: 0.7rem 1rem;
          border-radius: 12px;
          border: 1.5px solid var(--dexta-primary);
          background-color: #ffffff;
          color: var(--dexta-secondary);
          font-family: var(--font-sans);
          font-size: 0.9375rem;
          transition:
            border-color 0.25s,
            box-shadow 0.25s;
          min-height: 2.75rem;
        }
        .form-input-light::placeholder {
          color: #9baacf;
        }
        .form-input-light:focus {
          outline: none;
          border-color: var(--dexta);
          box-shadow: 0 0 0 3px rgba(0, 171, 255, 0.15);
        }
      `}</style>
    </>
  );
}

// Used on the home page — card inside a standalone dark section with heading
function ContactFormSection() {
  return (
    <section className="bg-black text-white py-16 sm:py-20 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-3xl text-center mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Contact Us
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-400">
            Have a project in mind or just want to say hello? Drop us a line.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto mt-12 sm:mt-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <ContactFormCard light={false} />
        </motion.div>
      </div>
    </section>
  );
}

// For home page — full standalone section
export function ContactForm() {
  return (
    <RecaptchaProvider>
      <ContactFormSection />
    </RecaptchaProvider>
  );
}

// For embedding inside the contact page layout (light theme, no section wrapper)
export function ContactFormEmbed() {
  return (
    <RecaptchaProvider>
      <ContactFormCard light={true} />
    </RecaptchaProvider>
  );
}
