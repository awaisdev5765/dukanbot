"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockBadge, formatPkr } from "@/components/catalog/stock-badge";
import type { Product } from "@/types/catalog";

type Props = {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
};

export function ProductGrid({ products, onEdit, onDelete }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => (
        <article
          key={p.id}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-150 hover:border-primary/30"
        >
          <div className="aspect-[4/3] bg-muted">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image_url}
                alt={p.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium leading-snug">{p.name}</h3>
                <StockBadge status={p.stock_status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {p.category || "Uncategorized"}
              </p>
            </div>
            <p className="text-lg font-semibold tracking-tight">
              {formatPkr(p.price)}
            </p>
            {p.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {p.description}
              </p>
            )}
            <div className="mt-auto flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(p)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(p.id)}
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
