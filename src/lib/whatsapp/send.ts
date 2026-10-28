import {
  ensureWhatsAppSecrets,
  getWhatsAppSecrets,
  isWhatsAppReady,
} from "@/lib/whatsapp/secrets";
import { createServiceClient } from "@/lib/supabase/service";

export function isWhatsAppConfigured() {
  return isWhatsAppReady();
}

function digits(to: string) {
  return to.replace(/\D/g, "");
}

async function logSend(params: {
  merchantId?: string;
  to: string;
  body: string;
  ok: boolean;
  skipped?: boolean;
  error?: unknown;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from("wa_send_log").insert({
      merchant_id: params.merchantId || null,
      to_phone: params.to,
      body_preview: params.body.slice(0, 160),
      ok: params.ok,
      skipped: Boolean(params.skipped),
      error: params.error ?? null,
    });
  } catch (err) {
    console.error("[wa_send_log]", err);
  }
}

export async function sendWhatsAppText(
  to: string,
  body: string,
  opts?: { merchantId?: string }
) {
  await ensureWhatsAppSecrets();
  const { token, phoneNumberId } = getWhatsAppSecrets();
  if (!token || !phoneNumberId) {
    await logSend({
      merchantId: opts?.merchantId,
      to,
      body,
      ok: false,
      skipped: true,
      error: { reason: "WhatsApp env not set" },
    });
    return {
      ok: false as const,
      skipped: true as const,
      reason: "WhatsApp env not set",
    };
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits(to),
        type: "text",
        text: { body, preview_url: false },
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    await logSend({
      merchantId: opts?.merchantId,
      to,
      body,
      ok: false,
      error: data,
    });
    return { ok: false as const, skipped: false as const, error: data };
  }
  await logSend({
    merchantId: opts?.merchantId,
    to,
    body,
    ok: true,
  });
  return { ok: true as const, data };
}

/** First-contact safe test — Meta’s default approved template */
export async function sendWhatsAppHelloWorld(to: string) {
  await ensureWhatsAppSecrets();
  const { token, phoneNumberId } = getWhatsAppSecrets();
  if (!token || !phoneNumberId) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: "WhatsApp env not set",
    };
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits(to),
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
        },
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, skipped: false as const, error: data };
  }
  return { ok: true as const, data };
}

export function extractWaError(data: unknown): string {
  const err = data as {
    error?: {
      message?: string;
      error_data?: { details?: string };
      code?: number;
    };
    reason?: string;
  };
  return (
    err?.error?.error_data?.details ||
    err?.error?.message ||
    err?.reason ||
    "Send failed"
  );
}
