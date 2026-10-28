import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { adminEmails } from "@/lib/admin";

/** Server-side: honor impersonation cookie for platform admins only. */
export async function getImpersonatedMerchantId(): Promise<string | null> {
  const cookieStore = cookies();
  const id = cookieStore.get("dukanbot_impersonate")?.value;
  if (!id) return null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const emails = adminEmails();
  if (emails.includes(user.email.toLowerCase())) return id;

  const { data } = await supabase
    .from("merchants")
    .select("is_platform_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.is_platform_admin ? id : null;
}
