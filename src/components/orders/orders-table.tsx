"use client";

import type { Order, OrderStatus } from "@/types/orders";
import { ORDER_STATUSES, STATUS_LABELS } from "@/types/orders";
import {
  formatPkr,
  formatWhen,
  PaymentBadge,
  StatusBadge,
} from "@/components/orders/order-badges";

type Props = {
  orders: Order[];
  onOpen: (order: Order) => void;
  onStatus: (id: string, status: OrderStatus) => void;
};

export function OrdersTable({ orders, onOpen, onStatus }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Items</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Payment</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Tracking</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">When</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                onClick={() => onOpen(o)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </td>
                <td className="px-4 py-3 font-medium">{formatPkr(o.total)}</td>
                <td className="px-4 py-3">
                  <PaymentBadge method={o.payment_method} />
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={o.status}
                      onChange={(e) =>
                        onStatus(o.id, e.target.value as OrderStatus)
                      }
                      aria-label={`Status for ${o.customer_name}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.tracking_id || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatWhen(o.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
