"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppThread } from "@/components/orders/whatsapp-thread";
import {
  formatPkr,
  formatWhen,
  PaymentBadge,
  StatusBadge,
} from "@/components/orders/order-badges";
import type { Courier, Order, OrderStatus } from "@/types/orders";
import { ORDER_STATUSES, STATUS_LABELS } from "@/types/orders";

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    patch: Partial<Pick<Order, "status" | "courier" | "tracking_id">>
  ) => void;
};

export function OrderDetailDrawer({ order, open, onClose, onUpdate }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {order.customer_name || "Customer"}
            </h2>
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <StatusBadge status={order.status} />
              <PaymentBadge method={order.payment_method} />
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Items
            </p>
            <ul className="space-y-2 rounded-xl border border-border p-3 text-sm">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {item.quantity}× {item.name}
                    {item.variant ? ` (${item.variant})` : ""}
                  </span>
                  <span className="font-medium">
                    {formatPkr(item.price * item.quantity)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatPkr(order.total)}</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Placed {formatWhen(order.created_at)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={order.status}
                onChange={(e) =>
                  onUpdate(order.id, { status: e.target.value as OrderStatus })
                }
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="courier">Courier</Label>
              <select
                id="courier"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={order.courier ?? ""}
                onChange={(e) =>
                  onUpdate(order.id, {
                    courier: (e.target.value || null) as Courier,
                  })
                }
              >
                <option value="">Not assigned</option>
                <option value="leopards">Leopards</option>
                <option value="tcs">TCS</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking ID</Label>
            <Input
              id="tracking"
              value={order.tracking_id}
              onChange={(e) =>
                onUpdate(order.id, { tracking_id: e.target.value })
              }
              placeholder="e.g. LEO-10293"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              WhatsApp conversation
            </p>
            <WhatsAppThread messages={order.messages} />
          </div>
        </div>
      </aside>
    </div>
  );
}
