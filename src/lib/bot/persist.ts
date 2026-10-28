import { createServiceClient } from "@/lib/supabase/service";
import { notifyMerchant } from "@/lib/notifications";
import type { ServerConversation, ServerOrder } from "@/lib/bot/runtime-store";

export async function persistConversation(
  conv: ServerConversation,
  merchantId: string
) {
  if (!merchantId) return;
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("bot_upsert_conversation", {
    p_merchant_id: merchantId,
    p_phone: conv.customer_phone,
    p_name: conv.customer_name,
    p_messages: conv.messages,
    p_status: conv.status,
    p_unread: conv.unread_count,
    p_streak: conv.low_confidence_streak,
  });
  if (error) console.error("[persist conversation]", error.message);
}

export async function notifyEscalation(
  merchantId: string,
  conv: ServerConversation
) {
  if (!merchantId) return;
  void notifyMerchant({
    merchantId,
    kind: "escalation",
    title: `Escalation · ${conv.customer_name || conv.customer_phone}`,
    body: `A customer needs you on WhatsApp (${conv.customer_phone}). Open Inbox in DukanBot.`,
  });
}

export async function persistOrder(
  order: ServerOrder,
  merchantId: string,
  conversationId?: string
) {
  if (!merchantId) return;
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("bot_insert_order", {
    p_merchant_id: merchantId,
    p_customer_name: order.customer_name,
    p_customer_phone: order.customer_phone,
    p_items: order.items,
    p_total: order.total,
    p_payment_method: order.payment_method,
    p_conversation_id: conversationId ?? null,
  });
  if (error) console.error("[persist order]", error.message);
  else {
    const items = order.items
      .map((i) => `${i.quantity}× ${i.name}`)
      .join(", ");
    void notifyMerchant({
      merchantId,
      kind: "new_order",
      title: `New order · Rs. ${order.total}`,
      body: `${order.customer_name} (${order.customer_phone})\n${items}\n${order.payment_method.toUpperCase()}`,
    });
  }
}
