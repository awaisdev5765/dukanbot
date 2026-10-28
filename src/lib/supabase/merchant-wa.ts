import { createClient } from "@/lib/supabase/server";
import { ensureMerchantClient } from "@/lib/supabase/merchant-server";

export async function loadMerchantWhatsApp() {
  const merchant = await ensureMerchantClient();
  return {
    id: merchant.id as string,
    whatsapp_number: String(merchant.whatsapp_number ?? ""),
    whatsapp_api_token: String(merchant.whatsapp_api_token ?? ""),
    whatsapp_phone_number_id: String(merchant.whatsapp_phone_number_id ?? ""),
    whatsapp_verify_token: String(
      merchant.whatsapp_verify_token ?? "dukanbot_verify"
    ),
    business_name: String(merchant.business_name ?? ""),
    plan: String(merchant.plan ?? "starter"),
  };
}

export async function saveMerchantWhatsApp(input: {
  whatsapp_number?: string;
  whatsapp_api_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_verify_token?: string;
}) {
  const supabase = createClient();
  const merchant = await ensureMerchantClient();

  const patch: Record<string, string | null> = {};
  if (input.whatsapp_number !== undefined) {
    patch.whatsapp_number = input.whatsapp_number || null;
  }
  if (input.whatsapp_api_token !== undefined && input.whatsapp_api_token !== "") {
    patch.whatsapp_api_token = input.whatsapp_api_token;
  }
  if (input.whatsapp_phone_number_id !== undefined) {
    patch.whatsapp_phone_number_id = input.whatsapp_phone_number_id || null;
  }
  if (input.whatsapp_verify_token !== undefined) {
    patch.whatsapp_verify_token =
      input.whatsapp_verify_token || "dukanbot_verify";
  }

  const { data, error } = await supabase
    .from("merchants")
    .update(patch)
    .eq("id", merchant.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
