import { createClient } from "@/lib/supabase/client";
import { getMerchantId } from "@/lib/supabase/merchant";
import type { Conversation } from "@/types/conversations";
import type { ChatMessage } from "@/types/orders";

function mapConv(row: Record<string, unknown>): Conversation {
  return {
    id: String(row.id),
    customer_name: String(row.customer_name ?? row.customer_phone),
    customer_phone: String(row.customer_phone),
    messages: (row.messages as ChatMessage[]) ?? [],
    status: row.status as Conversation["status"],
    unread_count: Number(row.unread_count ?? 0),
    updated_at: String(row.updated_at ?? row.created_at),
    created_at: String(row.created_at),
  };
}

export async function listConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapConv);
}

export async function getConversation(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapConv(data) : undefined;
}

export async function markConversationRead(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapConv(data);
}

export async function setConversationStatus(
  id: string,
  status: Conversation["status"]
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapConv(data);
}

export async function sendMerchantMessage(id: string, text: string) {
  const supabase = createClient();
  const current = await getConversation(id);
  if (!current) throw new Error("Not found");
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    from: "merchant",
    text: text.trim(),
    at: new Date().toISOString(),
  };
  const messages = [...current.messages, msg];
  const { data, error } = await supabase
    .from("conversations")
    .update({
      messages,
      status: "escalated",
      unread_count: 0,
      updated_at: msg.at,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapConv(data);
}

export async function seedDemoConversationsIfEmpty() {
  const { allowDemoSeed } = await import("@/lib/demo-seed");
  if (!allowDemoSeed()) return listConversations();

  const existing = await listConversations();
  if (existing.length > 0) return existing;

  const supabase = createClient();
  const merchantId = await getMerchantId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("conversations").insert([
    {
      merchant_id: merchantId,
      customer_name: "Imran Qureshi",
      customer_phone: "+923218887766",
      status: "escalated",
      unread_count: 2,
      messages: [
        {
          id: "1",
          from: "customer",
          text: "Mera parcel kab aayega?",
          at: now,
        },
        {
          id: "2",
          from: "bot",
          text: "Maaf kijiye — tracking check kar raha hoon.",
          at: now,
        },
        {
          id: "3",
          from: "customer",
          text: "Koi human se baat karni hai.",
          at: now,
        },
      ],
      updated_at: now,
    },
    {
      merchant_id: merchantId,
      customer_name: "Nadia Sheikh",
      customer_phone: "+923334445555",
      status: "bot_handling",
      unread_count: 0,
      messages: [
        {
          id: "1",
          from: "customer",
          text: "Delivery charges Gulberg ke liye?",
          at: now,
        },
        {
          id: "2",
          from: "bot",
          text: "Gulberg delivery Rs. 200. Order Rs. 2,000+ pe free.",
          at: now,
        },
      ],
      updated_at: now,
    },
  ]);
  if (error) throw new Error(error.message);
  return listConversations();
}
