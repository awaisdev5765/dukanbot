export type PaymentMethod = "cod" | "jazzcash" | "easypaisa";
export type OrderStatus =
  | "new"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "cancelled";
export type Courier = "leopards" | "tcs" | null;

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
};

export type ChatMessage = {
  id: string;
  from: "customer" | "bot" | "merchant";
  text: string;
  at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  courier: Courier;
  tracking_id: string;
  messages: ChatMessage[];
  created_at: string;
};

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "dispatched",
  "delivered",
  "cancelled",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "COD",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
};
