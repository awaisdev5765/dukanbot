import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Server client for webhook persistence.
 * Prefer SUPABASE_SERVICE_ROLE_KEY; falls back to anon (RLS may block).
 */
export function createServiceClient() {
  const url = getSupabaseUrl();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || getSupabaseAnonKey();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getDefaultMerchantId() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("merchants")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id as string | undefined;
}
