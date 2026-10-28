import { createClient } from "@/lib/supabase/client";

export async function getSessionUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

async function loadMerchantById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function ensureMerchant() {
  const supabase = createClient();
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const { data: membership } = await supabase
    .from("team_members")
    .select("merchant_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const { data: owned } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Staff: prefer the shop they were invited to
  if (membership?.merchant_id) {
    return loadMerchantById(membership.merchant_id);
  }

  if (owned) return owned;

  const { data, error } = await supabase
    .from("merchants")
    .insert({
      user_id: user.id,
      business_name:
        (user.user_metadata?.business_name as string) || "My shop",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMerchantId() {
  const merchant = await ensureMerchant();
  return merchant.id as string;
}
