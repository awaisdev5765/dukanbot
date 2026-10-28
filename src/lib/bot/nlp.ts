import { chat, chatJson, isLlmConfigured } from "@/lib/llm";
import type { BotConfig } from "@/types/bot";
import type { CatalogItem, OrderDraft } from "@/lib/bot/runtime-store";

export type BotIntent =
  | "greeting"
  | "price_inquiry"
  | "order"
  | "complaint"
  | "business_hours"
  | "delivery"
  | "returns"
  | "other";

export type IntentResult = {
  intent: BotIntent;
  confidence: number;
  language: "en" | "ur" | "roman_ur";
  reply?: string;
  order_fields?: Partial<OrderDraft>;
};

const SYSTEM = `You are DukanBot, an AI shop assistant for Pakistani small businesses.
You understand and reply fluently in English, Urdu script, and Roman Urdu — match the customer's language and style.
Be concise, warm, and practical. Prices are in PKR. Payments: COD, JazzCash, Easypaisa.
Never invent products not in the catalog. If unsure, say so briefly.`;

function fallbackIntent(text: string): IntentResult {
  const t = text.toLowerCase();
  let intent: BotIntent = "other";
  let confidence = 0.45;

  if (/assalam|salam|hello|hi\b|hey/.test(t)) {
    intent = "greeting";
    confidence = 0.9;
  } else if (/price|kitn|cost|rs\.?|rupee|rate/.test(t)) {
    intent = "price_inquiry";
    confidence = 0.75;
  } else if (/order|mangwa|book|buy|purchase|cod|jazzcash|easypaisa/.test(t)) {
    intent = "order";
    confidence = 0.8;
  } else if (/complain|problem|late|wrong|refund|issue/.test(t)) {
    intent = "complaint";
    confidence = 0.7;
  } else if (/hour|open|band|time|kab tak/.test(t)) {
    intent = "business_hours";
    confidence = 0.85;
  } else if (/deliver|charge|shipping/.test(t)) {
    intent = "delivery";
    confidence = 0.85;
  } else if (/return|exchange|wapis/.test(t)) {
    intent = "returns";
    confidence = 0.85;
  }

  return { intent, confidence, language: /[؀-ۿ]/.test(text) ? "ur" : /hai|kya|kitne|please/.test(t) ? "roman_ur" : "en" };
}

export async function detectIntent(params: {
  text: string;
  config: BotConfig;
  catalog: CatalogItem[];
  history: { role: string; content: string }[];
  draft: OrderDraft;
  collectingOrder: boolean;
}): Promise<IntentResult> {
  if (!isLlmConfigured()) {
    return fallbackIntent(params.text);
  }

  try {
    return await chatJson<IntentResult>(
      [
        {
          role: "system",
          content: `${SYSTEM}

Return ONLY JSON:
{
  "intent": "greeting"|"price_inquiry"|"order"|"complaint"|"business_hours"|"delivery"|"returns"|"other",
  "confidence": 0-1,
  "language": "en"|"ur"|"roman_ur",
  "reply": "optional short reply if you can answer fully now",
  "order_fields": { "item"?, "quantity"?, "variant"?, "customer_name"?, "address"?, "payment_method"?: "cod"|"jazzcash"|"easypaisa" }
}

Catalog: ${JSON.stringify(params.catalog)}
FAQs: ${JSON.stringify(params.config.faqs)}
Welcome: ${params.config.welcome_message}
Business: ${params.config.business_name}
Collecting order: ${params.collectingOrder}
Current draft: ${JSON.stringify(params.draft)}
Languages enabled: ${params.config.languages.join(", ")}`,
        },
        ...params.history.slice(-8).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: params.text },
      ],
      { maxTokens: 400 }
    );
  } catch {
    return fallbackIntent(params.text);
  }
}

export async function generateReply(params: {
  text: string;
  config: BotConfig;
  catalog: CatalogItem[];
  intent: BotIntent;
  draft: OrderDraft;
}): Promise<string> {
  const faqHit = params.config.faqs.find((f) => {
    const q = f.question.toLowerCase();
    if (params.intent === "business_hours") return q.includes("hour");
    if (params.intent === "delivery") return q.includes("delivery");
    if (params.intent === "returns") return q.includes("return");
    return false;
  });

  if (faqHit) return faqHit.answer;

  if (params.intent === "greeting") {
    return params.config.welcome_message;
  }

  if (!isLlmConfigured()) {
    if (params.intent === "price_inquiry") {
      const list = params.catalog
        .slice(0, 5)
        .map((p) => `${p.name}: Rs. ${p.price}`)
        .join("\n");
      return list
        ? `Yeh hamari popular items hain:\n${list}\nKis cheez ka order karna hai?`
        : "Catalog abhi empty hai — shop se confirm karein.";
    }
    if (params.intent === "order") {
      if (!params.draft.item) return "Zaroor! Kaunsi item aur kitni quantity?";
      if (!params.draft.customer_name) return "Apna name bata dein please.";
      if (!params.draft.address) return "Delivery address share karein.";
      if (!params.draft.payment_method)
        return "Payment: COD, JazzCash, ya Easypaisa?";
      return "Order details mil gaye — confirm kar raha hoon.";
    }
    if (params.intent === "complaint") {
      return "Maaf kijiye — main detail note kar raha hoon. Shop owner ko bhi notify karunga.";
    }
    return "Samajh gaya. Thora aur detail dein taake main help kar sakoon.";
  }

  return chat(
    [
      {
        role: "system",
        content: `${SYSTEM}
Business: ${params.config.business_name}
Catalog: ${JSON.stringify(params.catalog)}
FAQs: ${JSON.stringify(params.config.faqs)}
Intent: ${params.intent}
Order draft: ${JSON.stringify(params.draft)}
Reply in the customer's language. Keep under 3 short sentences.`,
      },
      { role: "user", content: params.text },
    ],
    { maxTokens: 220 }
  );
}
