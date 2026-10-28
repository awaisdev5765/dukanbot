import { NextRequest, NextResponse } from "next/server";
import {
  getBotCatalog,
  getBotRuntimeConfig,
  setBotCatalog,
  setBotRuntimeConfig,
  type CatalogItem,
} from "@/lib/bot/runtime-store";
import type { BotConfig } from "@/types/bot";

export async function GET() {
  return NextResponse.json({
    config: getBotRuntimeConfig(),
    catalog: getBotCatalog(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.config) {
    setBotRuntimeConfig(body.config as BotConfig);
  }
  if (Array.isArray(body.catalog)) {
    setBotCatalog(body.catalog as CatalogItem[]);
  }
  return NextResponse.json({
    ok: true,
    config: getBotRuntimeConfig(),
    catalog: getBotCatalog(),
  });
}
