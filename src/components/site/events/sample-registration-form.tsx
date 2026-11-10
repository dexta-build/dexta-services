"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../button";

const FIELDS = [
  { name: "name", label: "Full name", type: "text", placeholder: "Your name" },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
  },
  {
    name: "phone",
    label: "Phone / WhatsApp",
    type: "tel",
    placeholder: "+234…",
  },
];

/**
 * Development preview of the registration form for sample events. It
 * looks like the real one but sends nothing; real events use the form
 * built in the admin.
 */
export function SampleRegistrationForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div
        data-surface="mint"
        className="bg-surface text-surface-fg flex flex-col items-center gap-3 rounded-[10px] p-8 text-center"
      >
        <CheckCircle2 aria-hidden className="size-10" />
        <p className="text-h3">You&apos;re on the list (preview)</p>
        <p className="text-surface-muted text-sm leading-relaxed">
          This is a sample event, so nothing was sent. Real events use the
          registration form you set up in the admin.
        </p>
      </div>
    );
  }

  return (
    <form
      data-surface="white"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="bg-surface text-surface-fg flex flex-col gap-5 rounded-[10px] p-6 shadow-[0_24px_48px_-28px_rgb(0_8_107/0.35)] md:p-8"
    >
      <div>
        <p className="text-h3">Register</p>
        <p className="text-surface-muted mt-1 text-sm">
          Save your seat. Sample event: nothing is sent.
        </p>
      </div>
      {FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col gap-1.5 text-sm">
          <span className="font-bold">
            {f.label} <span className="text-coral">*</span>
          </span>
          <input
            name={f.name}
            type={f.type}
            required
            placeholder={f.placeholder}
            className="border-surface-fg/20 focus:border-brand h-12 rounded-[8px] border bg-transparent px-4 outline-none"
          />
        </label>
      ))}
      <Button type="submit" block size="lg" arrow>
        Register
      </Button>
    </form>
  );
}
