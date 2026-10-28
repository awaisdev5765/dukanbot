import { NextRequest, NextResponse } from "next/server";
import { isLlmConfigured } from "@/lib/llm";
import {
  loadMerchantWhatsApp,
  saveMerchantWhatsApp,
} from "@/lib/supabase/merchant-wa";
import {
  getWhatsAppSecrets,
  isWhatsAppReady,
  persistWhatsAppToEnvLocal,
  setWhatsAppSecrets,
} from "@/lib/whatsapp/secrets";

export async function GET() {
  try {
    const merchant = await loadMerchantWhatsApp();
    // Prefer DB values; fall back to env/memory
    const token = merchant.whatsapp_api_token || getWhatsAppSecrets().token;
    const phoneNumberId =
      merchant.whatsapp_phone_number_id || getWhatsAppSecrets().phoneNumberId;
    const verifyToken =
      merchant.whatsapp_verify_token ||
      getWhatsAppSecrets().verifyToken ||
      "dukanbot_verify";

    setWhatsAppSecrets({ token, phoneNumberId, verifyToken });

    return NextResponse.json({
      configured: Boolean(token && phoneNumberId),
      phoneNumberId,
      phoneNumberIdMasked: phoneNumberId
        ? `${phoneNumberId.slice(0, 4)}…${phoneNumberId.slice(-4)}`
        : "",
      hasToken: Boolean(token),
      whatsappNumber: merchant.whatsapp_number,
      verifyToken,
      businessName: merchant.business_name,
      plan: merchant.plan,
      llm: isLlmConfigured(),
      webhookPath: "/api/whatsapp/webhook",
      source: merchant.whatsapp_api_token ? "supabase" : "env",
    });
  } catch (err) {
    const s = getWhatsAppSecrets();
    return NextResponse.json({
      configured: isWhatsAppReady(),
      phoneNumberId: s.phoneNumberId,
      phoneNumberIdMasked: s.phoneNumberId
        ? `${s.phoneNumberId.slice(0, 4)}…`
        : "",
      hasToken: Boolean(s.token),
      verifyToken: s.verifyToken,
      llm: isLlmConfigured(),
      webhookPath: "/api/whatsapp/webhook",
      source: "env",
      warning:
        err instanceof Error
          ? err.message
          : "Not signed in — using .env only",
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token =
    body.token !== undefined && String(body.token).trim() !== ""
      ? String(body.token).trim()
      : undefined;
  const phoneNumberId =
    body.phoneNumberId !== undefined
      ? String(body.phoneNumberId).trim()
      : undefined;
  const verifyToken =
    body.verifyToken !== undefined
      ? String(body.verifyToken).trim()
      : undefined;
  const whatsappNumber =
    body.whatsappNumber !== undefined
      ? String(body.whatsappNumber).trim()
      : undefined;

  try {
    // Keep existing token if blank submitted
    const existing = await loadMerchantWhatsApp().catch(() => null);
    await saveMerchantWhatsApp({
      whatsapp_api_token: token,
      whatsapp_phone_number_id:
        phoneNumberId ?? existing?.whatsapp_phone_number_id,
      whatsapp_verify_token: verifyToken,
      whatsapp_number: whatsappNumber ?? existing?.whatsapp_number,
    });

    const saved = await loadMerchantWhatsApp();
    setWhatsAppSecrets({
      token: saved.whatsapp_api_token || getWhatsAppSecrets().token,
      phoneNumberId:
        saved.whatsapp_phone_number_id || getWhatsAppSecrets().phoneNumberId,
      verifyToken:
        saved.whatsapp_verify_token || getWhatsAppSecrets().verifyToken,
    });

    const envOk = persistWhatsAppToEnvLocal({
      token: saved.whatsapp_api_token || undefined,
      phoneNumberId: saved.whatsapp_phone_number_id || undefined,
      verifyToken: saved.whatsapp_verify_token || undefined,
      displayNumber: saved.whatsapp_number || undefined,
    });

    return NextResponse.json({
      ok: true,
      configured: Boolean(
        saved.whatsapp_api_token && saved.whatsapp_phone_number_id
      ),
      phoneNumberId: saved.whatsapp_phone_number_id,
      hasToken: Boolean(saved.whatsapp_api_token),
      verifyToken: saved.whatsapp_verify_token,
      whatsappNumber: saved.whatsapp_number,
      source: "supabase",
      envSynced: envOk,
      note: envOk
        ? "Saved to Supabase and .env.local — survives reload & restart."
        : "Saved to Supabase. .env.local sync failed (still OK while signed in).",
    });
  } catch (err) {
    // Fallback: memory + env only if not signed in / column missing
    const next = setWhatsAppSecrets({
      token,
      phoneNumberId,
      verifyToken,
    });
    const envOk = persistWhatsAppToEnvLocal({
      token: next.token,
      phoneNumberId: next.phoneNumberId,
      verifyToken: next.verifyToken,
      displayNumber: whatsappNumber,
    });

    return NextResponse.json({
      ok: true,
      configured: isWhatsAppReady(),
      phoneNumberId: next.phoneNumberId,
      hasToken: Boolean(next.token),
      verifyToken: next.verifyToken,
      source: "env",
      envSynced: envOk,
      warning:
        err instanceof Error
          ? `${err.message}. If column missing, run supabase/merchant_whatsapp.sql`
          : "Saved to memory/env only",
      note: envOk
        ? "Saved to .env.local. Run merchant_whatsapp.sql in Supabase for DB persistence."
        : "Could not persist fully — check you are logged in and SQL migration ran.",
    });
  }
}
