"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/orders";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function WhatsAppThread({
  messages,
  className,
}: {
  messages: ChatMessage[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl bg-[#e5ddd5] p-3 dark:bg-[#0b141a]",
        className
      )}
    >
      {messages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No messages logged for this order.
        </p>
      ) : (
        messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-snug shadow-sm",
              m.from === "customer"
                ? "mr-auto rounded-tl-sm bg-white text-[#111] dark:bg-[#1f2c34] dark:text-[#e9edef]"
                : m.from === "merchant"
                  ? "ml-auto rounded-tr-sm bg-[#fff3c4] text-[#111] dark:bg-[#3d3a1a] dark:text-[#f5f0d0]"
                  : "ml-auto rounded-tr-sm bg-[#dcf8c6] text-[#111] dark:bg-[#005c4b] dark:text-white"
            )}
          >
            {m.from === "merchant" && (
              <span className="mb-0.5 block text-[10px] font-medium opacity-60">
                You
              </span>
            )}
            <p
              className={cn(
                "whitespace-pre-wrap break-words",
                /[\u0600-\u06FF]/.test(m.text) && "font-urdu text-[15px] leading-relaxed"
              )}
              dir="auto"
            >
              {m.text}
            </p>
            <span className="mt-1 block text-right text-[10px] opacity-50">
              {formatTime(m.at)}
              {m.from !== "customer" ? " ✓✓" : ""}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
