import fs from "fs";
import path from "path";
import {
  createServiceClient,
  getDefaultMerchantId,
} from "@/lib/supabase/service";

type WaSecrets = {
  token: string;
  phoneNumberId: string;
  verifyToken: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __dukanbotWaSecrets: WaSecrets | undefined;
  // eslint-disable-next-line no-var
  var __dukanbotWaHydrated: boolean | undefined;
}

function secrets(): WaSecrets {
  if (!global.__dukanbotWaSecrets) {
    global.__dukanbotWaSecrets = {
      token: process.env.WHATSAPP_TOKEN || "",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "dukanbot_verify",
    };
  }
  return global.__dukanbotWaSecrets;
}

export function getWhatsAppSecrets() {
  return { ...secrets() };
}

export function setWhatsAppSecrets(partial: Partial<WaSecrets>) {
  const s = secrets();
  if (partial.token !== undefined) s.token = partial.token;
  if (partial.phoneNumberId !== undefined) s.phoneNumberId = partial.phoneNumberId;
  if (partial.verifyToken !== undefined) s.verifyToken = partial.verifyToken;
  return getWhatsAppSecrets();
}

export function isWhatsAppReady() {
  const s = secrets();
  return Boolean(s.token && s.phoneNumberId);
}

/** Load token from merchants table into memory (for webhook / cold start). */
export async function hydrateWhatsAppSecretsFromDb() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("bot_get_whatsapp_creds");
    if (error) {
      // Fallback: direct select (works with service role)
      const merchantId = await getDefaultMerchantId();
      if (!merchantId) return getWhatsAppSecrets();
      const { data: row } = await supabase
        .from("merchants")
        .select(
          "whatsapp_api_token, whatsapp_phone_number_id, whatsapp_verify_token"
        )
        .eq("id", merchantId)
        .maybeSingle();
      if (row?.whatsapp_api_token || row?.whatsapp_phone_number_id) {
        setWhatsAppSecrets({
          token: row.whatsapp_api_token || secrets().token,
          phoneNumberId:
            row.whatsapp_phone_number_id || secrets().phoneNumberId,
          verifyToken:
            row.whatsapp_verify_token ||
            secrets().verifyToken ||
            "dukanbot_verify",
        });
        global.__dukanbotWaHydrated = true;
      }
      return getWhatsAppSecrets();
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (row?.whatsapp_api_token || row?.whatsapp_phone_number_id) {
      setWhatsAppSecrets({
        token: row.whatsapp_api_token || secrets().token,
        phoneNumberId:
          row.whatsapp_phone_number_id || secrets().phoneNumberId,
        verifyToken:
          row.whatsapp_verify_token ||
          secrets().verifyToken ||
          "dukanbot_verify",
      });
      global.__dukanbotWaHydrated = true;
    }
  } catch (err) {
    console.error("[hydrate wa]", err);
  }
  return getWhatsAppSecrets();
}

export async function ensureWhatsAppSecrets() {
  if (!isWhatsAppReady() || !global.__dukanbotWaHydrated) {
    await hydrateWhatsAppSecretsFromDb();
  }
  return getWhatsAppSecrets();
}

/** Persist into .env.local so Next restarts keep the token (local only). */
export function persistWhatsAppToEnvLocal(partial: {
  token?: string;
  phoneNumberId?: string;
  verifyToken?: string;
  displayNumber?: string;
}) {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

    const upsert = (key: string, value: string) => {
      if (!value) return;
      const line = `${key}=${value}`;
      const re = new RegExp(`^${key}=.*$`, "m");
      if (re.test(text)) text = text.replace(re, line);
      else text = `${text.trimEnd()}\n${line}\n`;
    };

    if (partial.token) upsert("WHATSAPP_TOKEN", partial.token);
    if (partial.phoneNumberId)
      upsert("WHATSAPP_PHONE_NUMBER_ID", partial.phoneNumberId);
    if (partial.verifyToken)
      upsert("WHATSAPP_VERIFY_TOKEN", partial.verifyToken);
    if (partial.displayNumber)
      upsert("WHATSAPP_TEST_NUMBER", partial.displayNumber);

    fs.writeFileSync(envPath, text, "utf8");
    return true;
  } catch (err) {
    console.error("[persist env.local]", err);
    return false;
  }
}
