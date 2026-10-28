import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppText } from "@/lib/whatsapp/send";
import type { NotificationPrefs } from "@/types/settings";

const DEFAULT_PREFS: NotificationPrefs = {
  new_order: true,
  escalation: true,
  daily_summary: false,
  email: true,
  whatsapp: true,
};

type MerchantNotifyRow = {
  id: string;
  business_name: string;
  notify_email: string | null;
  notify_whatsapp_number: string | null;
  whatsapp_number: string | null;
  notification_prefs: NotificationPrefs | null;
};

async function loadMerchant(merchantId: string): Promise<MerchantNotifyRow | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("merchants")
    .select(
      "id, business_name, notify_email, notify_whatsapp_number, whatsapp_number, notification_prefs"
    )
    .eq("id", merchantId)
    .maybeSingle();
  return data as MerchantNotifyRow | null;
}

async function logNotif(
  merchantId: string,
  kind: string,
  channel: string,
  ok: boolean,
  error?: string,
  payload?: Record<string, unknown>
) {
  const supabase = createServiceClient();
  await supabase.from("notification_log").insert({
    merchant_id: merchantId,
    kind,
    channel,
    ok,
    error: error ?? null,
    payload: payload ?? {},
  });
}

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL || "DukanBot <onboarding@resend.dev>";
  if (!key) {
    return { ok: false as const, error: "RESEND_API_KEY not set" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false as const, error: body };
  }
  return { ok: true as const };
}

export async function notifyMerchant(params: {
  merchantId: string;
  kind: "new_order" | "escalation";
  title: string;
  body: string;
}) {
  if (!params.merchantId) return;
  const merchant = await loadMerchant(params.merchantId);
  if (!merchant) return;

  const prefs = { ...DEFAULT_PREFS, ...(merchant.notification_prefs || {}) };
  if (params.kind === "new_order" && !prefs.new_order) return;
  if (params.kind === "escalation" && !prefs.escalation) return;

  const text = `${params.title}\n\n${params.body}`;

  if (prefs.whatsapp) {
    const to =
      merchant.notify_whatsapp_number || merchant.whatsapp_number || "";
    if (to) {
      const result = await sendWhatsAppText(to, text);
      await logNotif(
        params.merchantId,
        params.kind,
        "whatsapp",
        Boolean(result.ok),
        result.ok ? undefined : JSON.stringify(result),
        { to }
      );
    }
  }

  if (prefs.email && merchant.notify_email) {
    const result = await sendEmail(
      merchant.notify_email,
      params.title,
      params.body
    );
    await logNotif(
      params.merchantId,
      params.kind,
      "email",
      result.ok,
      result.ok ? undefined : result.error,
      { to: merchant.notify_email }
    );
  }
}
