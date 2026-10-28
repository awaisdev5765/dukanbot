import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requirePlatformAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not signed in");

  const emails = adminEmails();
  if (emails.includes(user.email.toLowerCase())) {
    return { user, via: "env" as const };
  }

  const service = createServiceClient();
  const { data } = await service
    .from("merchants")
    .select("id, is_platform_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.is_platform_admin) throw new Error("Forbidden");
  return { user, via: "flag" as const };
}
