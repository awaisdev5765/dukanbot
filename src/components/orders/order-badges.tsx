import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentMethod } from "@/types/orders";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/types/orders";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      className={cn(
        status === "delivered" &&
          "border-transparent bg-success/15 text-success",
        status === "new" && "border-transparent bg-primary/10 text-primary",
        (status === "confirmed" || status === "dispatched") &&
          "border-transparent bg-warning/15 text-warning",
        status === "cancelled" &&
          "border-transparent bg-destructive/10 text-destructive"
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentBadge({ method }: { method: PaymentMethod }) {
  return (
    <Badge className="border-border bg-muted/50 text-muted-foreground">
      {PAYMENT_LABELS[method]}
    </Badge>
  );
}

export function formatPkr(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
