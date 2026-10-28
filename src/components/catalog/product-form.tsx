"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadProductImage } from "@/lib/catalog-upload";
import type { Product, ProductInput, StockStatus } from "@/types/catalog";

const empty: ProductInput = {
  name: "",
  price: 0,
  description: "",
  image_url: "",
  stock_status: "in_stock",
  category: "",
};

type Props = {
  initial?: Product | null;
  onSubmit: (data: ProductInput) => Promise<void> | void;
  onCancel: () => void;
};

export function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ProductInput>(
    initial
      ? {
          name: initial.name,
          price: initial.price,
          description: initial.description,
          image_url: initial.image_url,
          stock_status: initial.stock_status,
          category: initial.category,
        }
      : empty
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (form.price < 0) {
      setError("Price must be 0 or more");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file);
      set("image_url", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Black Abaya"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (PKR)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={1}
            value={form.price || ""}
            onChange={(e) => set("price", Number(e.target.value) || 0)}
            placeholder="4500"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Abayas"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stock">Stock status</Label>
        <select
          id="stock"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={form.stock_status}
          onChange={(e) => set("stock_status", e.target.value as StockStatus)}
        >
          <option value="in_stock">In stock</option>
          <option value="low">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <textarea
          id="desc"
          rows={3}
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Premium chiffon, sizes M–XL"
        />
      </div>
      <div className="space-y-2">
        <Label>Product image</Label>
        {form.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.image_url}
            alt=""
            className="h-24 w-24 rounded-lg object-cover border border-border"
          />
        ) : null}
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFile}
          disabled={uploading}
        />
        <Input
          id="image"
          value={form.image_url}
          onChange={(e) => set("image_url", e.target.value)}
          placeholder="Or paste image URL"
        />
        <p className="text-xs text-muted-foreground">
          {uploading
            ? "Uploading…"
            : "Upload to Supabase Storage (max 3 MB) or paste a URL."}
        </p>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving…" : initial ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}
