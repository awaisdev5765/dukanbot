import type { ChatMessage } from "@/types/orders";
import type { BotConfig } from "@/types/bot";
import { detectIntent, generateReply } from "@/lib/bot/nlp";
import { persistConversation, persistOrder, notifyEscalation } from "@/lib/bot/persist";
import {
  addServerOrder,
  getBotCatalog,
  getBotRuntimeConfig,
  getOrCreateConversation,
  type CatalogItem,
  type ServerConversation,
  saveConversation,
} from "@/lib/bot/runtime-store";

function pushMessage(
  conv: ServerConversation,
  from: ChatMessage["from"],
  text: string
) {
  conv.messages.push({
    id: crypto.randomUUID(),
    from,
    text,
    at: new Date().toISOString(),
  });
}

function findCatalogPrice(catalog: CatalogItem[], name: string) {
  const hit = catalog.find((p) => p.name.toLowerCase() === name.toLowerCase());
  return hit?.price ?? 0;
}

function mergeDraft(
  conv: ServerConversation,
  fields?: Partial<ServerConversation["order_draft"]>
) {
  if (!fields) return;
  conv.order_draft = { ...conv.order_draft, ...fields };
}

function draftComplete(conv: ServerConversation) {
  const d = conv.order_draft;
  return Boolean(
    d.item &&
      (d.quantity ?? 0) > 0 &&
      d.customer_name &&
      d.address &&
      d.payment_method
  );
}

function finalizeOrder(conv: ServerConversation, catalog: CatalogItem[]) {
  const d = conv.order_draft;
  const qty = d.quantity || 1;
  const price = findCatalogPrice(catalog, d.item || "");
  const order = addServerOrder({
    customer_name: d.customer_name || conv.customer_name,
    customer_phone: conv.customer_phone,
    items: [
      {
        name: d.item || "Item",
        quantity: qty,
        price,
        variant: d.variant,
      },
    ],
    total: price * qty,
    payment_method: d.payment_method || "cod",
  });
  conv.collecting_order = false;
  conv.order_draft = {};
  conv.low_confidence_streak = 0;
  return order;
}

export type HandleResult = {
  reply: string;
  escalated: boolean;
  orderId?: string;
  conversationId: string;
};

export async function handleIncomingMessage(params: {
  phone: string;
  name?: string;
  text: string;
  merchantId?: string;
  config?: BotConfig;
  catalog?: CatalogItem[];
}): Promise<HandleResult> {
  const config = params.config ?? getBotRuntimeConfig();
  const catalog = params.catalog ?? getBotCatalog();
  const merchantId = params.merchantId ?? "";
  const conv = getOrCreateConversation(params.phone, params.name);

  if (conv.status === "escalated") {
    pushMessage(conv, "customer", params.text);
    conv.unread_count += 1;
    saveConversation(conv);
    void persistConversation(conv, merchantId);
    return {
      reply: "",
      escalated: true,
      conversationId: conv.id,
    };
  }

  pushMessage(conv, "customer", params.text);

  const history = conv.messages.map((m) => ({
    role: m.from === "customer" ? "user" : "assistant",
    content: m.text,
  }));

  const intent = await detectIntent({
    text: params.text,
    config,
    catalog,
    history,
    draft: conv.order_draft,
    collectingOrder: conv.collecting_order,
  });

  mergeDraft(conv, intent.order_fields);

  if (intent.intent === "order" || conv.collecting_order) {
    conv.collecting_order = true;
    if (!conv.order_draft.quantity) conv.order_draft.quantity = 1;
  }

  const low = intent.confidence < 0.55;
  if (low) {
    conv.low_confidence_streak += 1;
  } else {
    conv.low_confidence_streak = 0;
  }

  const threshold = config.escalation_threshold || 2;
  if (conv.low_confidence_streak >= threshold) {
    conv.status = "escalated";
    conv.unread_count += 1;
    const reply =
      intent.language === "roman_ur"
        ? "Maaf kijiye, main sure nahi — aapko shop owner se connect kar raha hoon."
        : intent.language === "ur"
          ? "معذرت، میں یقین سے نہیں کہہ سکتا — آپ کو دکان والے سے جوڑ رہا ہوں۔"
          : "I'm not fully sure — connecting you with the shop owner now.";
    pushMessage(conv, "bot", reply);
    saveConversation(conv);
    void persistConversation(conv, merchantId);
    void notifyEscalation(merchantId, conv);
    return { reply, escalated: true, conversationId: conv.id };
  }

  let reply =
    intent.reply?.trim() ||
    (await generateReply({
      text: params.text,
      config,
      catalog,
      intent: intent.intent,
      draft: conv.order_draft,
    }));

  let orderId: string | undefined;

  if (conv.collecting_order && draftComplete(conv)) {
    const order = finalizeOrder(conv, catalog);
    orderId = order.id;
    reply =
      intent.language === "roman_ur"
        ? `Order confirm ✓ ${order.items[0].quantity}× ${order.items[0].name} · ${order.payment_method.toUpperCase()} · Total Rs. ${order.total}. Shukriya!`
        : `Order confirmed ✓ ${order.items[0].quantity}× ${order.items[0].name} · ${order.payment_method.toUpperCase()} · Total Rs. ${order.total}. Thank you!`;
    void persistOrder(order, merchantId, conv.id);
  } else if (conv.collecting_order && !intent.reply) {
    reply = await generateReply({
      text: params.text,
      config,
      catalog,
      intent: "order",
      draft: conv.order_draft,
    });
  }

  if (intent.intent === "greeting" && conv.messages.length <= 2) {
    reply = config.welcome_message;
  }

  pushMessage(conv, "bot", reply);
  saveConversation(conv);
  void persistConversation(conv, merchantId);

  return {
    reply,
    escalated: false,
    orderId,
    conversationId: conv.id,
  };
}
