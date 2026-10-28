"use client";

import { useEffect, useMemo, useState } from "react";
import type { BotConfig, FaqPair } from "@/types/bot";
import { LANGUAGE_LABELS } from "@/types/bot";
import { cn } from "@/lib/utils";

type PreviewMsg = { from: "customer" | "bot"; text: string };

function buildPreviewScript(config: BotConfig): PreviewMsg[] {
  const langs = config.languages
    .map((l) => LANGUAGE_LABELS[l])
    .join(" · ");
  const hours =
    config.faqs.find((f) =>
      f.question.toLowerCase().includes("hour")
    )?.answer ?? "Please check our business hours.";
  const delivery =
    config.faqs.find((f) =>
      f.question.toLowerCase().includes("delivery")
    )?.answer ?? "Delivery charges depend on your area.";

  const customerLang = config.languages.includes("roman_ur")
    ? "roman"
    : config.languages.includes("ur")
      ? "ur"
      : "en";

  const askHours =
    customerLang === "roman"
      ? "Kitne baje tak open ho?"
      : customerLang === "ur"
        ? "آپ کب تک کھلے رہتے ہیں؟"
        : "What are your business hours?";

  const askDelivery =
    customerLang === "roman"
      ? "Delivery charges kitne hain?"
      : customerLang === "ur"
        ? "ڈیلیوری چارجز کیا ہیں؟"
        : "How much is delivery?";

  const unsure =
    customerLang === "roman"
      ? "Woh wala blue wala cheez jo kal dikhaya tha… samajh nahi aa raha"
      : "That blue thing from yesterday… not sure how to describe it";

  const escalate =
    config.notify_whatsapp && config.escalation_threshold <= 2
      ? `I'm not fully sure — connecting you with ${config.business_name} (after ${config.escalation_threshold} unclear replies).`
      : "Let me check with the shop and get back to you.";

  return [
    { from: "bot", text: config.welcome_message || "Hello! How can I help?" },
    { from: "customer", text: askHours },
    { from: "bot", text: hours },
    { from: "customer", text: askDelivery },
    { from: "bot", text: delivery },
    {
      from: "bot",
      text: `I can chat in: ${langs || "English"}`,
    },
    { from: "customer", text: unsure },
    { from: "bot", text: escalate },
  ];
}

export function BotLivePreview({
  config,
  faqs,
}: {
  config: BotConfig;
  faqs: FaqPair[];
}) {
  const script = useMemo(
    () => buildPreviewScript({ ...config, faqs }),
    [config, faqs]
  );
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    setVisible(1);
  }, [script]);

  useEffect(() => {
    if (visible >= script.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 700);
    return () => clearTimeout(t);
  }, [visible, script.length]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#e5ddd5] dark:bg-[#0b141a]">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white dark:bg-[#1f2c34]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
          {(config.business_name || "DB").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {config.business_name || "Your shop"}
          </p>
          <p className="text-[11px] text-white/70">online · DukanBot preview</p>
        </div>
      </div>

      <div className="min-h-[420px] space-y-2 px-3 py-4">
        {script.slice(0, visible).map((m, i) => (
          <div
            key={`${i}-${m.text.slice(0, 12)}`}
            className={cn(
              "landing-fade-up max-w-[88%] rounded-lg px-3 py-2 text-[13px] leading-snug shadow-sm",
              m.from === "bot"
                ? "ml-auto rounded-tr-sm bg-[#dcf8c6] text-[#111] dark:bg-[#005c4b] dark:text-white"
                : "mr-auto rounded-tl-sm bg-white text-[#111] dark:bg-[#1f2c34] dark:text-[#e9edef]"
            )}
          >
            {m.text}
            <span className="mt-1 block text-right text-[10px] opacity-50">
              Preview{m.from === "bot" ? " ✓✓" : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-black/5 bg-card/80 px-3 py-2 text-center text-[11px] text-muted-foreground dark:border-white/10">
        Live preview · updates as you edit
      </div>
    </div>
  );
}
