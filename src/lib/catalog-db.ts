import { createClient } from "@/lib/supabase/client";
import { getMerchantId } from "@/lib/supabase/merchant";
import { allowDemoSeed } from "@/lib/demo-seed";
import type { Product, ProductInput } from "@/types/catalog";

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    price: Number(row.price),
    description: String(row.description ?? ""),
    image_url: String(row.image_url ?? ""),
    stock_status: row.stock_status as Product["stock_status"],
    category: String(row.category ?? ""),
    created_at: String(row.created_at),
  };
}

export async function listProducts(): Promise<Product[]> {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const products = (data ?? []).map(mapProduct);
  if (products.length > 0 || !allowDemoSeed()) return products;

  await importProducts([
    {
      name: "Black Abaya",
      price: 4500,
      description: "Premium chiffon M–XL",
      image_url: "",
      stock_status: "in_stock",
      category: "Abayas",
    },
    {
      name: "Chicken Biryani",
      price: 650,
      description: "Single serving",
      image_url: "",
      stock_status: "in_stock",
      category: "Mains",
    },
    {
      name: "Consultation",
      price: 2000,
      description: "15 min follow-up",
      image_url: "",
      stock_status: "low",
      category: "Services",
    },
  ]);

  const { data: seeded, error: seedErr } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });
  if (seedErr) throw new Error(seedErr.message);
  return (seeded ?? []).map(mapProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const { data, error } = await supabase
    .from("products")
    .insert({
      merchant_id: merchantId,
      name: input.name,
      price: input.price,
      description: input.description || null,
      image_url: input.image_url || null,
      stock_status: input.stock_status,
      category: input.category || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapProduct(data);
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<Product> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      price: input.price,
      description: input.description || null,
      image_url: input.image_url || null,
      stock_status: input.stock_status,
      category: input.category || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapProduct(data);
}

export async function deleteProduct(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function importProducts(inputs: ProductInput[]): Promise<number> {
  if (!inputs.length) return 0;
  const supabase = createClient();
  const merchantId = await getMerchantId();
  const rows = inputs.map((input) => ({
    merchant_id: merchantId,
    name: input.name,
    price: input.price,
    description: input.description || null,
    image_url: input.image_url || null,
    stock_status: input.stock_status,
    category: input.category || null,
  }));
  const { data, error } = await supabase.from("products").insert(rows).select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
