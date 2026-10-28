"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DEMO = [
  { from: "customer" as const, text: "Assalam o Alaikum, black abaya available?" },
  { from: "bot" as const, text: "Walaikum Assalam! Yes — Black Abaya (M/L) Rs. 4,500. Size?" },
  { from: "customer" as const, text: "Medium, COD please. DHA Phase 5." },
  { from: "bot" as const, text: "Order locked ✓ Medium Abaya · COD · DHA-5. Tracking after dispatch." },
];

export function WhatsAppMockup({ className }: { className?: string }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= DEMO.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 400 : 900);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[1.75rem] border border-border bg-[#e5ddd5] shadow-sm dark:border-border dark:bg-[#0b141a]",
        className
      )}
      aria-hidden
    >
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white dark:bg-[#1f2c34]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
          NB
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Noor Boutique</p>
          <p className="text-[11px] text-white/70">online · DukanBot</p>
        </div>
      </div>

      <div className="space-y-2 px-3 py-4 min-h-[320px]">
        {DEMO.slice(0, visible).map((m, i) => (
          <div
            key={i}
            className={cn(
              "landing-fade-up max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-snug shadow-sm",
              m.from === "bot"
                ? "ml-auto rounded-tr-sm bg-[#dcf8c6] text-[#111] dark:bg-[#005c4b] dark:text-white"
                : "mr-auto rounded-tl-sm bg-white text-[#111] dark:bg-[#1f2c34] dark:text-[#e9edef]"
            )}
          >
            {m.text}
            <span className="mt-1 block text-right text-[10px] opacity-50">
              {m.from === "bot" ? "Just now ✓✓" : "Just now"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
