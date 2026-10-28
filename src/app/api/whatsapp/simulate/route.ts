import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/bot/handler";
import { isLlmConfigured } from "@/lib/llm";
import { isWhatsAppConfigured } from "@/lib/whatsapp/send";
import {
  listServerConversations,
  listServerOrders,
} from "@/lib/bot/runtime-store";

/** Local/dev simulator — no Meta required */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = String(body?.phone || "923000000000");
  const name = body?.name ? String(body.name) : "Test Customer";
  const text = String(body?.text || "").trim();

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const result = await handleIncomingMessage({ phone, name, text });

  return NextResponse.json({
    ...result,
    meta: {
      llm: isLlmConfigured(),
      whatsapp: isWhatsAppConfigured(),
    },
    conversation: listServerConversations().find(
      (c) => c.id === result.conversationId
    ),
    recentOrders: listServerOrders().slice(0, 5),
  });
}

export async function GET() {
  return NextResponse.json({
    conversations: listServerConversations(),
    orders: listServerOrders(),
    meta: {
      llm: isLlmConfigured(),
      whatsapp: isWhatsAppConfigured(),
    },
  });
}
