import { defaultBotConfig } from "@/lib/bot-defaults";
import {
  loadBotConfigFromDb,
  saveBotConfigToDb,
} from "@/lib/bot-db";
import type { BotConfig, BotLanguage, FaqPair } from "@/types/bot";

export { defaultBotConfig } from "@/lib/bot-defaults";

const KEY = "dukanbot-bot-config-v1";

function cacheLocal(config: BotConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

/** Prefer Supabase; fall back to local cache / defaults. */
export async function loadBotConfig(): Promise<BotConfig> {
  try {
    const cfg = await loadBotConfigFromDb();
    cacheLocal(cfg);
    return cfg;
  } catch {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw) as BotConfig;
      } catch {
        /* ignore */
      }
    }
    return defaultBotConfig();
  }
}

export async function saveBotConfig(config: BotConfig): Promise<BotConfig> {
  const next = await saveBotConfigToDb(config);
  cacheLocal(next);
  return next;
}

export function toggleLanguage(
  languages: BotLanguage[],
  lang: BotLanguage
): BotLanguage[] {
  if (languages.includes(lang)) {
    if (languages.length === 1) return languages;
    return languages.filter((l) => l !== lang);
  }
  return [...languages, lang];
}

export function upsertFaq(faqs: FaqPair[], faq: FaqPair): FaqPair[] {
  const idx = faqs.findIndex((f) => f.id === faq.id);
  if (idx === -1) return [...faqs, faq];
  const next = [...faqs];
  next[idx] = faq;
  return next;
}

export function removeFaq(faqs: FaqPair[], id: string): FaqPair[] {
  return faqs.filter((f) => f.id !== id);
}
