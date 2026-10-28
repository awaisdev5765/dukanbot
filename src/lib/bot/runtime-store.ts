import type { BotConfig } from "@/types/bot";
import { defaultBotConfig } from "@/lib/bot-defaults";
import type { ChatMessage } from "@/types/orders";
import type { ConversationStatus } from "@/types/conversations";

export type CatalogItem = {
  name: string;
  price: number;
  description?: string;
  stock_status?: string;
  category?: string;
};

export type OrderDraft = {
  item?: string;
  quantity?: number;
  variant?: string;
  customer_name?: string;
  address?: string;
  payment_method?: "cod" | "jazzcash" | "easypaisa";
};

export type ServerConversation = {
  id: string;
  customer_phone: string;
  customer_name: string;
  messages: ChatMessage[];
  status: ConversationStatus;
  unread_count: number;
  low_confidence_streak: number;
  order_draft: OrderDraft;
  collecting_order: boolean;
  created_at: string;
  updated_at: string;
};

export type ServerOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: { name: string; quantity: number; price: number; variant?: string }[];
  total: number;
  payment_method: "cod" | "jazzcash" | "easypaisa";
  status: "new" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  created_at: string;
};

type BotRuntime = {
  config: BotConfig;
  catalog: CatalogItem[];
  conversations: Map<string, ServerConversation>;
  orders: ServerOrder[];
};

declare global {
  // eslint-disable-next-line no-var
  var __dukanbotRuntime: BotRuntime | undefined;
}

function runtime(): BotRuntime {
  if (!global.__dukanbotRuntime) {
    global.__dukanbotRuntime = {
      config: defaultBotConfig(),
      catalog: [
        {
          name: "Black Abaya",
          price: 4500,
          description: "Premium chiffon M–XL",
          stock_status: "in_stock",
          category: "Abayas",
        },
        {
          name: "Chicken Biryani",
          price: 650,
          description: "Single serving",
          stock_status: "in_stock",
          category: "Mains",
        },
        {
          name: "Consultation",
          price: 2000,
          description: "15 min follow-up",
          stock_status: "in_stock",
          category: "Services",
        },
      ],
      conversations: new Map(),
      orders: [],
    };
  }
  return global.__dukanbotRuntime;
}

export function getBotRuntimeConfig() {
  return runtime().config;
}

export function setBotRuntimeConfig(config: BotConfig) {
  runtime().config = config;
}

export function getBotCatalog() {
  return runtime().catalog;
}

export function setBotCatalog(catalog: CatalogItem[]) {
  runtime().catalog = catalog;
}

export function getOrCreateConversation(phone: string, name?: string) {
  const r = runtime();
  const existing = r.conversations.get(phone);
  if (existing) {
    if (name && !existing.customer_name) existing.customer_name = name;
    return existing;
  }
  const now = new Date().toISOString();
  const conv: ServerConversation = {
    id: crypto.randomUUID(),
    customer_phone: phone,
    customer_name: name || phone,
    messages: [],
    status: "bot_handling",
    unread_count: 0,
    low_confidence_streak: 0,
    order_draft: {},
    collecting_order: false,
    created_at: now,
    updated_at: now,
  };
  r.conversations.set(phone, conv);
  return conv;
}

export function saveConversation(conv: ServerConversation) {
  conv.updated_at = new Date().toISOString();
  runtime().conversations.set(conv.customer_phone, conv);
}

export function listServerConversations() {
  return Array.from(runtime().conversations.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function addServerOrder(order: Omit<ServerOrder, "id" | "created_at" | "status">) {
  const full: ServerOrder = {
    ...order,
    id: crypto.randomUUID(),
    status: "new",
    created_at: new Date().toISOString(),
  };
  runtime().orders.unshift(full);
  return full;
}

export function listServerOrders() {
  return [...runtime().orders];
}
