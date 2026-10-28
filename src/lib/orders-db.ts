import { createClient } from "@/lib/supabase/client";
import { getMerchantId } from "@/lib/supabase/merchant";
import type { ChatMessage, Order, OrderStatus } from "@/types/orders";

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    customer_name: String(row.customer_name ?? ""),
    customer_phone: String(row.customer_phone),
    items: (row.items as Order["items"]) ?? [],
    total: Number(row.total),
    payment_method: row.payment_method as Order["payment_method"],
    status: row.status as OrderStatus,
    courier: (row.courier as Order["courier"]) ?? null,
    tracking_id: String(row.tracking_id ?? ""),
    messages: [],
    created_at: String(row.created_at),
  };
}

async function loadMessagesForOrder(
  conversationId: string | null
): Promise<ChatMessage[]> {
  if (!conversationId) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("conversations")
    .select("messages")
    .eq("id", conversationId)
    .maybeSingle();
  return (data?.messages as ChatMessage[]) ?? [];
}

export async function listOrders(): Promise<Order[]> {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const orders = await Promise.all(
    (data ?? []).map(async (row) => {
      const order = mapOrder(row);
      order.messages = await loadMessagesForOrder(
        (row.conversation_id as string) || null
      );
      return order;
    })
  );
  return orders;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const order = mapOrder(data);
  order.messages = await loadMessagesForOrder(
    (data.conversation_id as string) || null
  );
  return order;
}

export async function updateOrderMeta(
  id: string,
  patch: Partial<Pick<Order, "courier" | "tracking_id" | "status">>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.courier !== undefined ? { courier: patch.courier } : {}),
      ...(patch.tracking_id !== undefined
        ? { tracking_id: patch.tracking_id || null }
        : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const order = mapOrder(data);
  order.messages = await loadMessagesForOrder(
    (data.conversation_id as string) || null
  );
  return order;
}

export async function seedDemoOrdersIfEmpty() {
  const { allowDemoSeed } = await import("@/lib/demo-seed");
  if (!allowDemoSeed()) return listOrders();

  const existing = await listOrders();
  if (existing.length > 0) return existing;

  const supabase = createClient();
  const merchantId = await getMerchantId();

  const samples = [
    {
      customer_name: "Ayesha Khan",
      customer_phone: "+923001112233",
      items: [{ name: "Black Abaya", quantity: 1, price: 4500, variant: "M" }],
      total: 4500,
      payment_method: "cod",
      status: "new",
    },
    {
      customer_name: "Bilal Ahmed",
      customer_phone: "+923214445566",
      items: [
        { name: "Chicken Biryani", quantity: 2, price: 650 },
        { name: "Raita", quantity: 2, price: 100 },
      ],
      total: 1500,
      payment_method: "jazzcash",
      status: "confirmed",
    },
  ];

  const { error } = await supabase.from("orders").insert(
    samples.map((s) => ({ ...s, merchant_id: merchantId }))
  );
  if (error) throw new Error(error.message);
  return listOrders();
}
