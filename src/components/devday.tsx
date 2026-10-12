"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Globe,
  Users,
  Code2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Terminal,
  Wifi,
  Share2,
} from "lucide-react";
import {
  registerForDevDay,
  type RegistrationFormData,
} from "@/app/(public)/devs-day/actions";
import Image from "next/image";

// ─── Form Schema (mirrors server-side, for client validation) ─────────────────

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select your role"),
  stack: z.string().max(200).optional(),
  expectation: z.string().max(500).optional(),
  profile: z
    .string()
    .url("Please enter a valid URL (include https://)")
    .optional()
    .or(z.literal("")),
  hp_website: z.string().optional(),
  _form_ts: z.union([z.number(), z.string()]).optional(),
});

type FormData = z.infer<typeof formSchema>;

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: custom,
      type: "tween" as const,
    },
  }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-2 rounded-full border border-[#333] bg-[#1a1a1a] px-4 py-2 text-sm text-[#a0a0a0]"
    >
      <Icon className="h-3.5 w-3.5 text-cyan-400" />
      {label}
    </motion.div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-[#222] bg-[#111] p-5 transition-colors hover:border-[#333]"
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[#333] bg-[#1a1a1a]">
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs leading-relaxed text-[#666]">{description}</p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DevDayPage() {
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        setSubmitResult(null);

        let recaptchaToken: string | undefined;
        if (executeRecaptcha) {
          recaptchaToken = await executeRecaptcha("devday_registration");
        }

        const result = await registerForDevDay(
          data as RegistrationFormData,
          recaptchaToken,
        );
        setSubmitResult(result);

        if (result.success) {
          reset();
        }
      } catch {
        setSubmitResult({
          success: false,
          message: "Something went wrong. Please try again.",
        });
      }
    },
    [executeRecaptcha, reset],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a]">
      {/* ── Background grid ─────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#00b2ff 1px, transparent 1px),
            linear-gradient(90deg, #00b2ff 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Glow ────────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-700/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:px-12">
        {/* ── Two-column layout ────────────────────────────────────────────────── */}
        <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-16 xl:grid-cols-[1fr_460px]">
          {/* ── LEFT — Hero Info ──────────────────────────────────────────────── */}
          <div>
            <motion.div
              custom={0.02}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-6 overflow-hidden rounded-xl border border-[#222] bg-[#111]"
            >
              <Image
                src="/images/600x300.png"
                alt="Devs Day Flyer – Online developer gathering"
                width={600}
                height={300}
                className="h-auto w-full object-cover"
                priority // because it's above the fold
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              custom={0.1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-5 font-clash text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Devs <span className="gradient-text">Day</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              custom={0.18}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-8 max-w-lg text-base leading-relaxed text-[#a0a0a0] sm:text-lg"
            >
              An online gathering for developers to share what they're building,
              swap tools and experiences, and connect with others who get it. No
              slides. No pitches. Just real developer talk.
            </motion.p>

            {/* Stat pills */}
            <div className="mb-10 flex flex-wrap gap-3">
              <StatPill
                icon={Globe}
                label="Online · Free to join"
                delay={0.22}
              />
              <StatPill icon={Calendar} label="Date TBA" delay={0.26} />
              <StatPill icon={Users} label="Open to all devs" delay={0.3} />
            </div>

            {/* Terminal block */}
            <motion.div
              custom={0.34}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-12 rounded-xl border border-[#222] bg-[#0d0d0d] p-5 font-mono"
            >
              <div className="mb-3 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-[#444]" />
                <span className="text-xs text-[#444]">what to expect</span>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { prefix: "~", text: "Developer talks & live demos" },
                  { prefix: "~", text: "Tool & tech stack breakdowns" },
                  { prefix: "~", text: "Open floor — share what you've built" },
                  {
                    prefix: "~",
                    text: "Networking with Nigerian dev community",
                  },
                  { prefix: "~", text: "Q&A and candid experience sharing" },
                ].map(({ prefix, text }, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-cyan-500">{prefix}</span>
                    <span className="text-[#a0a0a0]">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FeatureCard
                icon={Code2}
                title="Share your stack"
                description="What are you building and what's in your toolbox?"
                delay={0.38}
              />
              <FeatureCard
                icon={Share2}
                title="Real experiences"
                description="Wins, lessons, and the things you wish someone told you."
                delay={0.42}
              />
              <FeatureCard
                icon={Wifi}
                title="Online & free"
                description="Join from anywhere in Nigeria or beyond. No ticket needed."
                delay={0.46}
              />
            </div>
          </div>

          {/* ── RIGHT — Registration Form ─────────────────────────────────────── */}
          <motion.div
            custom={0.2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className="sticky top-24 rounded-2xl border border-[#2a2a2a] bg-[#111] p-6 sm:p-8">
              {/* ── Success State ──────────────────────────────────────────────── */}
              <AnimatePresence mode="wait">
                {submitResult?.success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="py-10 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                      <CheckCircle2 className="h-7 w-7 text-cyan-400" />
                    </div>
                    <h3 className="mb-2 font-clash text-xl font-bold text-white">
                      You're in!
                    </h3>
                    <p className="text-sm leading-relaxed text-[#a0a0a0]">
                      {submitResult.message}
                    </p>
                    <button
                      onClick={() => setSubmitResult(null)}
                      className="mt-6 text-xs text-[#555] underline underline-offset-2 transition-colors hover:text-[#888]"
                    >
                      Register another person
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                    noValidate
                  >
                    {/* Form header */}
                    <div className="mb-2">
                      <h2 className="font-clash text-2xl font-bold text-white">
                        Secure your spot
                      </h2>
                      <p className="mt-1 text-sm text-[#666]">
                        Takes 30 seconds. We'll send details to your inbox.
                      </p>
                    </div>

                    {/* Honeypot & Timing Trap for bot detection */}
                    <div
                      className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0 pointer-events-none select-none"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <label htmlFor="hp_website">Leave this field blank</label>
                      <input
                        type="text"
                        id="hp_website"
                        {...register("hp_website")}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                      <input
                        type="hidden"
                        {...register("_form_ts")}
                        defaultValue={Date.now()}
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#888]">
                        Full Name <span className="text-cyan-500">*</span>
                      </label>
                      <input
                        {...register("name")}
                        type="text"
                        placeholder="Ada Okonkwo"
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#888]">
                        Email Address <span className="text-cyan-500">*</span>
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="ada@example.com"
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#888]">
                        Your Role <span className="text-cyan-500">*</span>
                      </label>
                      <select
                        {...register("role")}
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 [&>option]:bg-[#1a1a1a]"
                      >
                        <option value="" disabled>
                          Select your role
                        </option>
                        <option value="Frontend Developer">
                          Frontend Developer
                        </option>
                        <option value="Backend Developer">
                          Backend Developer
                        </option>
                        <option value="Full Stack Developer">
                          Full Stack Developer
                        </option>
                        <option value="Mobile Developer">
                          Mobile Developer
                        </option>
                        <option value="DevOps / Cloud Engineer">
                          DevOps / Cloud Engineer
                        </option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="Product Manager">Product Manager</option>
                        <option value="Student / Learner">
                          Student / Learner
                        </option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.role && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.role.message}
                        </p>
                      )}
                    </div>

                    {/* Stack */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#888]">
                        Your Tech Stack{" "}
                        <span className="text-[#555]">(optional)</span>
                      </label>
                      <input
                        {...register("stack")}
                        type="text"
                        placeholder="e.g. React, Node.js, PostgreSQL..."
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>

                    {/* Expectation */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#888]">
                        What are you looking forward to?{" "}
                        <span className="text-[#555]">(optional)</span>
                      </label>
                      <textarea
                        {...register("expectation")}
                        rows={3}
                        placeholder="Learning about new tools, connecting with other devs..."
                        className="w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>

                    {/* Profile */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#888]">
                        GitHub / LinkedIn{" "}
                        <span className="text-[#555]">(optional)</span>
                      </label>
                      <input
                        {...register("profile")}
                        type="url"
                        placeholder="https://github.com/yourhandle"
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder-[#444] outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                      />
                      {errors.profile && (
                        <p className="mt-1 text-xs text-red-400">
                          {errors.profile.message}
                        </p>
                      )}
                    </div>

                    {/* Error message */}
                    {submitResult && !submitResult.success && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-400"
                      >
                        {submitResult.message}
                      </motion.p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Registering…
                        </>
                      ) : (
                        <>
                          Register for Devs Day
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-[#444]">
                      Free to attend.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
