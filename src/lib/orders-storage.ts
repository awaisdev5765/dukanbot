import type { Order, OrderStatus } from "@/types/orders";
import * as db from "@/lib/orders-db";

export async function listOrders(): Promise<Order[]> {
  return db.listOrders();
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return db.updateOrderStatus(id, status);
}

export async function updateOrderMeta(
  id: string,
  patch: Partial<Pick<Order, "courier" | "tracking_id" | "status">>
) {
  return db.updateOrderMeta(id, patch);
}

export async function getOrder(id: string) {
  const all = await db.listOrders();
  return all.find((o) => o.id === id);
}
