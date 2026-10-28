import type { StockStatus } from "@/types/catalog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low: "Low stock",
  out_of_stock: "Out of stock",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <Badge
      className={cn(
        status === "in_stock" &&
          "border-transparent bg-success/15 text-success",
        status === "low" && "border-transparent bg-warning/15 text-warning",
        status === "out_of_stock" &&
          "border-transparent bg-muted text-muted-foreground"
      )}
    >
      {LABELS[status]}
    </Badge>
  );
}

export function formatPkr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}
