import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/bot/handler";
import {
  loadMerchantCatalog,
  resolveMerchantByPhoneNumberId,
} from "@/lib/bot/tenant";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendWhatsAppText } from "@/lib/whatsapp/send";
import {
  ensureWhatsAppSecrets,
  getWhatsAppSecrets,
  setWhatsAppSecrets,
} from "@/lib/whatsapp/secrets";

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit({ key: `wa-verify:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await ensureWhatsAppSecrets();
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verify = getWhatsAppSecrets().verifyToken || "dukanbot_verify";

  if (mode === "subscribe" && token === verify && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

type WaMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
};

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit({ key: `wa-hook:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: true });
  }

  try {
    const entries = body.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = String(value?.metadata?.phone_number_id || "");
        const merchant = phoneNumberId
          ? await resolveMerchantByPhoneNumberId(phoneNumberId)
          : null;

        if (merchant?.whatsapp_api_token) {
          setWhatsAppSecrets({
            token: merchant.whatsapp_api_token,
            phoneNumberId: merchant.whatsapp_phone_number_id || phoneNumberId,
            verifyToken: merchant.whatsapp_verify_token,
          });
        } else {
          await ensureWhatsAppSecrets();
        }

        const catalog = merchant
          ? await loadMerchantCatalog(merchant.id)
          : undefined;
        const contacts = value?.contacts ?? [];
        const messages: WaMessage[] = value?.messages ?? [];

        for (const msg of messages) {
          if (msg.type !== "text" || !msg.text?.body || !msg.from) continue;
          const name = contacts[0]?.profile?.name as string | undefined;
          const result = await handleIncomingMessage({
            phone: msg.from,
            name,
            text: msg.text.body,
            merchantId: merchant?.id,
            config: merchant?.config,
            catalog,
          });
          if (result.reply) {
            await sendWhatsAppText(msg.from, result.reply, {
              merchantId: merchant?.id,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[whatsapp webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
