import type { Conversation } from "@/types/conversations";
import * as db from "@/lib/conversations-db";

export async function listConversations(): Promise<Conversation[]> {
  return db.listConversations();
}

export async function getConversation(id: string) {
  return db.getConversation(id);
}

export async function markConversationRead(id: string) {
  return db.markConversationRead(id);
}

export async function setConversationStatus(
  id: string,
  status: Conversation["status"]
) {
  return db.setConversationStatus(id, status);
}

export async function sendMerchantMessage(id: string, text: string) {
  return db.sendMerchantMessage(id, text);
}
