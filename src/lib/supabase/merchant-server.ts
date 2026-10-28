import { createClient } from "@/lib/supabase/server";
import { getImpersonatedMerchantId } from "@/lib/supabase/impersonate";

export async function getServerUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function ensureMerchantClient() {
  const impersonateId = await getImpersonatedMerchantId();
  const supabase = createClient();

  if (impersonateId) {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", impersonateId)
      .single();
    if (!error && data) return data;
  }

  const user = await getServerUser();
  if (!user) throw new Error("Not signed in");

  const { data: existing } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: membership } = await supabase
    .from("team_members")
    .select("merchant_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membership?.merchant_id) {
    const { data: shared, error: sharedErr } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", membership.merchant_id)
      .single();
    if (sharedErr) throw new Error(sharedErr.message);
    return shared;
  }

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
