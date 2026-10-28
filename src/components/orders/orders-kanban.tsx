"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/types/orders";
import { ORDER_STATUSES, STATUS_LABELS } from "@/types/orders";
import { formatPkr, PaymentBadge } from "@/components/orders/order-badges";
import { cn } from "@/lib/utils";

type Props = {
  orders: Order[];
  onOpen: (order: Order) => void;
  onStatus: (id: string, status: OrderStatus) => void;
};

export function OrdersKanban({ orders, onOpen, onStatus }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);

  const columns: OrderStatus[] = [
    "new",
    "confirmed",
    "dispatched",
    "delivered",
    "cancelled",
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((status) => {
        const col = orders.filter((o) => o.status === status);
        return (
          <div
            key={status}
            className="flex w-64 shrink-0 flex-col rounded-xl border border-border bg-muted/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragging) onStatus(dragging, status);
              setDragging(null);
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-medium">{STATUS_LABELS[status]}</p>
              <span className="text-xs text-muted-foreground">{col.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2 min-h-[160px]">
              {col.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  draggable
                  onDragStart={() => setDragging(o.id)}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => onOpen(o)}
                  className={cn(
                    "rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40",
                    dragging === o.id && "opacity-60"
                  )}
                >
                  <p className="font-medium text-sm">{o.customer_name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{formatPkr(o.total)}</span>
                    <PaymentBadge method={o.payment_method} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
