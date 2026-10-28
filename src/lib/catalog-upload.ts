import { createClient } from "@/lib/supabase/client";
import { getMerchantId } from "@/lib/supabase/merchant";

const BUCKET = "product-images";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Use JPG, PNG, WebP, or GIF");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 3 MB");
  }

  const supabase = createClient();
  const merchantId = await getMerchantId();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${merchantId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
