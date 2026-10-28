export type StockStatus = "in_stock" | "low" | "out_of_stock";

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  stock_status: StockStatus;
  category: string;
  created_at: string;
};

export type ProductInput = Omit<Product, "id" | "created_at">;
