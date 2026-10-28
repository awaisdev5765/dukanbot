"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I need a WhatsApp Business API account?",
    a: "Yes — Meta WhatsApp Business Cloud API. For MVP you can paste your token in Settings; Embedded Signup comes next.",
  },
  {
    q: "Does the bot speak Roman Urdu?",
    a: "Yes. It matches the customer’s language — English, Urdu script, or Roman Urdu — automatically.",
  },
  {
    q: "Which payments are supported?",
    a: "Cash on delivery, JazzCash, and Easypaisa confirmation flows are built into the order capture.",
  },
  {
    q: "Can I take over a chat?",
    a: "Anytime. Escalated chats land in your inbox with a “Reply as human” takeover.",
  },
  {
    q: "Is there a free trial?",
    a: "Starter includes 14 days free. No card required to explore the dashboard.",
  },
];

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-border border-y border-border">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-primary"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-base font-medium text-foreground sm:text-lg">
                {item.q}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200",
                isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <p className="overflow-hidden text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
