import { createClient } from "@/lib/supabase/client";
import { getMerchantId } from "@/lib/supabase/merchant";
import { defaultBotConfig } from "@/lib/bot-defaults";
import type { BotConfig, FaqPair } from "@/types/bot";
import { DEFAULT_FAQS } from "@/types/bot";

export async function loadBotConfigFromDb(): Promise<BotConfig> {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const { data, error } = await supabase
    .from("merchants")
    .select(
      "business_name, bot_welcome_message, welcome_message, bot_languages, bot_escalation_threshold, bot_notify_whatsapp, bot_faqs"
    )
    .eq("id", merchantId)
    .maybeSingle();

  if (error || !data) return defaultBotConfig();

  const faqs = (data.bot_faqs as FaqPair[])?.length
    ? (data.bot_faqs as FaqPair[])
    : DEFAULT_FAQS.map((f) => ({ ...f }));

  return {
    business_name: String(data.business_name || "Shop"),
    welcome_message:
      String(data.bot_welcome_message || data.welcome_message || "") ||
      defaultBotConfig().welcome_message,
    languages: (data.bot_languages as BotConfig["languages"]) || [
      "en",
      "ur",
      "roman_ur",
    ],
    faqs,
    escalation_threshold: data.bot_escalation_threshold ?? 2,
    notify_whatsapp: data.bot_notify_whatsapp ?? true,
    updated_at: new Date().toISOString(),
  };
}

export async function saveBotConfigToDb(config: BotConfig): Promise<BotConfig> {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const next = { ...config, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("merchants")
    .update({
      business_name: next.business_name,
      bot_welcome_message: next.welcome_message,
      welcome_message: next.welcome_message,
      bot_languages: next.languages,
      bot_escalation_threshold: next.escalation_threshold,
      bot_notify_whatsapp: next.notify_whatsapp,
      bot_faqs: next.faqs,
    })
    .eq("id", merchantId);

  if (error) throw new Error(error.message);
  return next;
}
