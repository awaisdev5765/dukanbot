import { createServiceClient } from "@/lib/supabase/service";
import type { BotConfig, FaqPair } from "@/types/bot";
import { DEFAULT_FAQS } from "@/types/bot";

export type ResolvedMerchant = {
  id: string;
  business_name: string;
  whatsapp_api_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_verify_token: string;
  config: BotConfig;
};

export async function resolveMerchantByPhoneNumberId(
  phoneNumberId: string
): Promise<ResolvedMerchant | null> {
  if (!phoneNumberId) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("bot_resolve_merchant", {
    p_phone_number_id: phoneNumberId,
  });
  if (error) {
    console.error("[resolve merchant]", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) return null;

  const faqs = (row.bot_faqs as FaqPair[])?.length
    ? (row.bot_faqs as FaqPair[])
    : DEFAULT_FAQS.map((f) => ({ ...f }));

  return {
    id: row.id,
    business_name: row.business_name || "Shop",
    whatsapp_api_token: row.whatsapp_api_token || "",
    whatsapp_phone_number_id: row.whatsapp_phone_number_id || phoneNumberId,
    whatsapp_verify_token: row.whatsapp_verify_token || "dukanbot_verify",
    config: {
      business_name: row.business_name || "Shop",
      welcome_message:
        row.bot_welcome_message ||
        "Assalam o Alaikum! Welcome to our shop. How can I help you today?",
      languages: (row.bot_languages as BotConfig["languages"]) || [
        "en",
        "ur",
        "roman_ur",
      ],
      faqs,
      escalation_threshold: row.bot_escalation_threshold ?? 2,
      notify_whatsapp: row.bot_notify_whatsapp ?? true,
      updated_at: new Date().toISOString(),
    },
  };
}

export async function loadMerchantCatalog(merchantId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("name, price, description, stock_status, category")
    .eq("merchant_id", merchantId)
    .neq("stock_status", "out_of_stock");
  return (data ?? []).map((p) => ({
    name: String(p.name),
    price: Number(p.price),
    description: String(p.description ?? ""),
    stock_status: String(p.stock_status ?? "in_stock"),
    category: String(p.category ?? ""),
  }));
}
