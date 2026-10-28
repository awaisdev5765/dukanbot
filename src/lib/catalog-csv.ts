import type { ProductInput, StockStatus } from "@/types/catalog";

const STOCK_MAP: Record<string, StockStatus> = {
  in_stock: "in_stock",
  instock: "in_stock",
  "in stock": "in_stock",
  low: "low",
  "low stock": "low",
  out_of_stock: "out_of_stock",
  outofstock: "out_of_stock",
  "out of stock": "out_of_stock",
};

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

/** Expected headers: name, price, description, category, stock_status, image_url */
export function parseProductCsv(text: string): ProductInput[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const idx = (key: string) => headers.indexOf(key);

  const nameI = idx("name");
  const priceI = idx("price");
  if (nameI < 0 || priceI < 0) {
    throw new Error("CSV must include name and price columns");
  }

  const descI = idx("description");
  const catI = idx("category");
  const stockI = idx("stock_status") >= 0 ? idx("stock_status") : idx("stock");
  const imgI = idx("image_url") >= 0 ? idx("image_url") : idx("image");

  const products: ProductInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const name = cells[nameI]?.trim();
    if (!name) continue;
    const price = Number(String(cells[priceI] ?? "0").replace(/[^0-9.]/g, "")) || 0;
    const stockRaw = (cells[stockI] ?? "in_stock").toLowerCase().trim();
    products.push({
      name,
      price,
      description: descI >= 0 ? cells[descI] ?? "" : "",
      category: catI >= 0 ? cells[catI] ?? "" : "",
      stock_status: STOCK_MAP[stockRaw] ?? "in_stock",
      image_url: imgI >= 0 ? cells[imgI] ?? "" : "",
    });
  }
  return products;
}

export const CSV_TEMPLATE = `name,price,description,category,stock_status,image_url
Black Abaya,4500,Premium chiffon M-XL,Abayas,in_stock,
Chicken Biryani,650,Single serving,Mains,in_stock,
Consultation,2000,15 min follow-up,Services,low,
`;
