"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List, Package, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProductForm } from "@/components/catalog/product-form";
import { ProductTable } from "@/components/catalog/product-table";
import { ProductGrid } from "@/components/catalog/product-grid";
import {
  createProduct,
  deleteProduct,
  importProducts,
  listProducts,
  updateProduct,
} from "@/lib/catalog-storage";
import { CSV_TEMPLATE, parseProductCsv } from "@/lib/catalog-csv";
import type { Product, ProductInput } from "@/types/catalog";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "grid";

function CatalogSkeleton({ mode }: { mode: ViewMode }) {
  if (mode === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-border p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function CatalogManager() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<ViewMode>("table");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: listProducts,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [products, query]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["catalog"] });

  const saveMutation = useMutation({
    mutationFn: async (input: ProductInput) => {
      if (editing) return updateProduct(editing.id, input);
      return createProduct(input);
    },
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteProduct(id);
    },
    onSuccess: invalidate,
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    deleteMutation.mutate(id);
  }

  async function onCsvFile(file: File) {
    setImportMsg(null);
    try {
      const text = await file.text();
      const rows = parseProductCsv(text);
      if (!rows.length) {
        setImportMsg("No valid rows found in CSV.");
        return;
      }
      const n = await importProducts(rows);
      invalidate();
      setImportMsg(`Imported ${n} product${n === 1 ? "" : "s"}.`);
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Import failed");
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dukanbot-catalog-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Products & services in PKR. The bot uses this catalog for quotes and orders.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
            CSV template
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onCsvFile(f);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </div>
      </div>

      {importMsg && (
        <p className="text-sm text-muted-foreground" role="status">
          {importMsg}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, category…"
          className="sm:max-w-xs"
        />
        <div className="flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              view === "table"
                ? "bg-muted font-medium text-foreground"
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
              view === "grid"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </button>
        </div>
      </div>

      {isLoading ? (
        <CatalogSkeleton mode={view} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length ? "No matches" : "Catalog is empty"}
          description={
            products.length
              ? "Try a different search."
              : "Add products with name, price, and stock so the bot can answer availability questions."
          }
          actionLabel={products.length ? undefined : "Add first product"}
          onAction={products.length ? undefined : openCreate}
        />
      ) : view === "table" ? (
        <ProductTable
          products={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <ProductGrid
          products={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit product" : "Add product"}
      >
        <ProductForm
          key={editing?.id ?? "new"}
          initial={editing}
          onCancel={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          onSubmit={async (data) => {
            await saveMutation.mutateAsync(data);
          }}
        />
      </Dialog>
    </div>
  );
}
