import {
  DEFAULT_FAQS,
  type BotConfig,
} from "@/types/bot";

export function defaultBotConfig(): BotConfig {
  return {
    business_name: "Your shop",
    welcome_message:
      "Assalam o Alaikum! Welcome to our shop. How can I help you today?",
    languages: ["en", "ur", "roman_ur"],
    faqs: DEFAULT_FAQS.map((f) => ({ ...f })),
    escalation_threshold: 2,
    notify_whatsapp: true,
    updated_at: new Date().toISOString(),
  };
}
