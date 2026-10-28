import { NextRequest, NextResponse } from "next/server";
import {
  extractWaError,
  sendWhatsAppHelloWorld,
  sendWhatsAppText,
} from "@/lib/whatsapp/send";
import {
  ensureWhatsAppSecrets,
  getWhatsAppSecrets,
  isWhatsAppReady,
} from "@/lib/whatsapp/secrets";

/** Diagnose token + send hello_world template (reliable first message) */
export async function POST(request: NextRequest) {
  await ensureWhatsAppSecrets();
  if (!isWhatsAppReady()) {
    return NextResponse.json(
      {
        ok: false,
        step: "config",
        error:
          "Token or Phone Number ID missing. Paste them in Settings and click Apply.",
      },
      { status: 400 }
    );
  }

  const { token, phoneNumberId } = getWhatsAppSecrets();
  const body = await request.json().catch(() => ({}));
  const to = body?.to ? String(body.to).replace(/\D/g, "") : "";
  const mode = body?.mode === "text" ? "text" : "template";

  const probe = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const probeData = await probe.json().catch(() => ({}));

  if (!probe.ok) {
    const msg = probeData?.error?.message || "Token check failed";
    const expired =
      String(msg).toLowerCase().includes("expired") ||
      probeData?.error?.code === 190;
    return NextResponse.json({
      ok: false,
      step: "token",
      expired,
      error: msg,
      hint: expired
        ? "Generate a new token in Meta → WhatsApp → API Setup, then Apply again."
        : "Confirm Phone Number ID matches this app.",
      raw: probeData,
    });
  }

  if (!to) {
    return NextResponse.json({
      ok: true,
      step: "token",
      phone: probeData,
      message:
        "Token is valid. Next: add your number in Meta allowlist, then Send test message.",
    });
  }

  const sent =
    mode === "text"
      ? await sendWhatsAppText(
          to,
          body?.text || "DukanBot test ✓ — WhatsApp API is working."
        )
      : await sendWhatsAppHelloWorld(to);

  if (!sent.ok) {
    const errMsg = extractWaError("error" in sent ? sent.error : sent);
    const notAllowed =
      /not in|allowed list|recipient|131030/i.test(errMsg) ||
      (sent as { error?: { error?: { code?: number } } }).error?.error?.code ===
        131030;

    return NextResponse.json({
      ok: false,
      step: "send",
      error: errMsg,
      hint: notAllowed
        ? `Add ${to} in Meta Developer → WhatsApp → API Setup → “To” → Manage phone number list. Open the WhatsApp invite on that phone and Accept. Then retry.`
        : "If this is the first message ever, use the template send (default). Free text only works after the user messages you first.",
      raw: "error" in sent ? sent.error : sent,
      phone: probeData,
    });
  }

  const wamid =
    (sent.data as { messages?: { id?: string }[] })?.messages?.[0]?.id || "";

  return NextResponse.json({
    ok: true,
    step: "send",
    mode,
    phone: probeData,
    wamid,
    sent: sent.data,
    message:
      mode === "template"
        ? `Template hello_world queued to ${to}. Check WhatsApp for “Hello World” from the test business number. If nothing arrives in 1–2 min, that number is not on Meta’s allowlist / invite not accepted.`
        : `Text queued to ${to}.`,
  });
}
