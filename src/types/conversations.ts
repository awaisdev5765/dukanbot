import type { ChatMessage } from "@/types/orders";

export type ConversationStatus = "bot_handling" | "escalated" | "resolved";

export type Conversation = {
  id: string;
  customer_name: string;
  customer_phone: string;
  messages: ChatMessage[];
  status: ConversationStatus;
  unread_count: number;
  updated_at: string;
  created_at: string;
};

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  bot_handling: "Bot",
  escalated: "Escalated",
  resolved: "Resolved",
};
