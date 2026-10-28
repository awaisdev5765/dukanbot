"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Columns3, List, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersKanban } from "@/components/orders/orders-kanban";
import { OrderDetailDrawer } from "@/components/orders/order-detail-drawer";
import {
  listOrders,
  updateOrderMeta,
  updateOrderStatus,
} from "@/lib/orders-storage";
import type {
  Order,
  OrderStatus,
  PaymentMethod,
} from "@/types/orders";
import { ORDER_STATUSES, PAYMENT_LABELS, STATUS_LABELS } from "@/types/orders";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "kanban";

function Skeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function OrdersManager() {
  const qc = useQueryClient();
  const [view, setView] = useState<ViewMode>("table");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [payment, setPayment] = useState<PaymentMethod | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (payment !== "all" && o.payment_method !== payment) return false;
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(o.created_at) < start) return false;
      }
      return true;
    });
  }, [orders, status, payment, fromDate]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["orders"] });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: invalidate,
  });

  const metaMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Order, "status" | "courier" | "tracking_id">>;
    }) => updateOrderMeta(id, patch),
    onSuccess: invalidate,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <p className="text-muted-foreground">
        WhatsApp orders — update status, assign Leopards/TCS, open the chat that
        created the order.
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={payment}
            onChange={(e) =>
              setPayment(e.target.value as PaymentMethod | "all")
            }
          >
            <option value="all">All payments</option>
            {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((p) => (
              <option key={p} value={p}>
                {PAYMENT_LABELS[p]}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-auto"
            aria-label="From date"
          />
        </div>

        <div className="flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              view === "table"
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
            Table
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              view === "kanban"
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("kanban")}
          >
            <Columns3 className="h-4 w-4" />
            Kanban
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders match"
          description="Try clearing filters, or wait for the bot to capture the next WhatsApp order."
        />
      ) : view === "table" ? (
        <OrdersTable
          orders={filtered}
          onOpen={(o) => setSelectedId(o.id)}
          onStatus={(id, s) => statusMutation.mutate({ id, status: s })}
        />
      ) : (
        <OrdersKanban
          orders={filtered}
          onOpen={(o) => setSelectedId(o.id)}
          onStatus={(id, s) => statusMutation.mutate({ id, status: s })}
        />
      )}

      <OrderDetailDrawer
        order={selected}
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        onUpdate={(id, patch) => metaMutation.mutate({ id, patch })}
      />
    </div>
  );
}
