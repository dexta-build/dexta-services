"use client";

import { Accordion as A } from "radix-ui";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionEntry = {
  id: string;
  question: React.ReactNode;
  answer: React.ReactNode;
};

/** Question-and-answer list: rows with a "+" that turns into an "x". */
export function Accordion({
  items,
  className,
}: {
  items: AccordionEntry[];
  className?: string;
}) {
  return (
    <A.Root type="single" collapsible className={cn("w-full", className)}>
      {items.map((item) => (
        <A.Item
          key={item.id}
          value={item.id}
          className="border-surface-rule border-b"
        >
          <A.Header>
            <A.Trigger className="group/acc flex w-full items-center justify-between gap-6 py-5 text-left text-base font-bold md:text-[1.0625rem]">
              {item.question}
              <Plus
                aria-hidden
                className="size-5 shrink-0 transition-transform duration-300 ease-(--ease-out-expo) group-data-[state=open]/acc:rotate-45"
              />
            </A.Trigger>
          </A.Header>
          <A.Content className="text-surface-muted data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
            <div className="pb-6 leading-relaxed">{item.answer}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
