import type { Product, ProductInput } from "@/types/catalog";
import * as db from "@/lib/catalog-db";

/** @deprecated localStorage — use catalog-db */
export async function listProducts(): Promise<Product[]> {
  return db.listProducts();
}

export async function createProduct(input: ProductInput) {
  return db.createProduct(input);
}

export async function updateProduct(id: string, input: ProductInput) {
  return db.updateProduct(id, input);
}

export async function deleteProduct(id: string) {
  return db.deleteProduct(id);
}

export async function importProducts(inputs: ProductInput[]) {
  return db.importProducts(inputs);
}
