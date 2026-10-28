import { createClient } from "@/lib/supabase/client";
import { getMerchantId, getSessionUser } from "@/lib/supabase/merchant";
import type { NotificationPrefs, PlanId, TeamMember } from "@/types/settings";
import { defaultSettings } from "@/lib/settings-storage";

export async function loadSettingsFromDb() {
  const supabase = createClient();
  const user = await getSessionUser();
  const merchantId = await getMerchantId();
  const { data: merchant } = await supabase
    .from("merchants")
    .select(
      "plan, whatsapp_number, whatsapp_phone_number_id, notification_prefs, notify_email, notify_whatsapp_number, business_name"
    )
    .eq("id", merchantId)
    .maybeSingle();

  const { data: teamRows } = await supabase
    .from("team_members")
    .select("id, email, role, status")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: true });

  const base = defaultSettings();
  const ownerEmail = user?.email || "you@shop.pk";
  const team: TeamMember[] = [
    {
      id: "owner",
      email: ownerEmail,
      role: "owner",
      status: "active",
    },
    ...((teamRows ?? []) as TeamMember[]).filter(
      (t) => t.email.toLowerCase() !== ownerEmail.toLowerCase()
    ),
  ];

  return {
    ...base,
    plan: (merchant?.plan as PlanId) || base.plan,
    whatsapp_number: String(merchant?.whatsapp_number ?? ""),
    whatsapp_phone_number_id: String(merchant?.whatsapp_phone_number_id ?? ""),
    notifications: {
      ...base.notifications,
      ...((merchant?.notification_prefs as NotificationPrefs) || {}),
    },
    notify_email: String(merchant?.notify_email ?? user?.email ?? ""),
    notify_whatsapp_number: String(
      merchant?.notify_whatsapp_number ?? merchant?.whatsapp_number ?? ""
    ),
    business_name: String(merchant?.business_name ?? "Shop"),
    team,
    updated_at: new Date().toISOString(),
  };
}

export async function saveSettingsToDb(input: {
  plan?: PlanId;
  whatsapp_number?: string;
  notifications?: NotificationPrefs;
  notify_email?: string;
  notify_whatsapp_number?: string;
}) {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const patch: Record<string, unknown> = {};
  if (input.plan) patch.plan = input.plan;
  if (input.whatsapp_number !== undefined)
    patch.whatsapp_number = input.whatsapp_number || null;
  if (input.notifications) patch.notification_prefs = input.notifications;
  if (input.notify_email !== undefined)
    patch.notify_email = input.notify_email || null;
  if (input.notify_whatsapp_number !== undefined)
    patch.notify_whatsapp_number = input.notify_whatsapp_number || null;

  const { error } = await supabase
    .from("merchants")
    .update(patch)
    .eq("id", merchantId);
  if (error) throw new Error(error.message);
  return loadSettingsFromDb();
}

export async function inviteTeamMember(email: string, role: "admin" | "staff" = "staff") {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const user = await getSessionUser();
  const token = crypto.randomUUID().replace(/-/g, "");

  const { data, error } = await supabase
    .from("team_members")
    .insert({
      merchant_id: merchantId,
      email: email.trim().toLowerCase(),
      role,
      status: "pending",
      invite_token: token,
      invited_by: user?.id ?? null,
    })
    .select("id, email, role, status, invite_token")
    .single();

  if (error) throw new Error(error.message);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return {
    member: data as TeamMember & { invite_token?: string },
    inviteUrl: `${origin}/invite/${token}`,
  };
}

export async function removeTeamMember(id: string) {
  if (id === "owner") throw new Error("Cannot remove owner");
  const supabase = createClient();
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
