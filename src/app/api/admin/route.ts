import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, business_name, plan, whatsapp_number, created_at, onboarding_completed")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: failed } = await supabase
    .from("wa_send_log")
    .select("id, merchant_id, to_phone, body_preview, error, created_at, skipped")
    .eq("ok", false)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    merchants: merchants ?? [],
    failedSends: failed ?? [],
  });
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const merchantId = String(body?.merchantId || "");
  if (!merchantId) {
    return NextResponse.json({ error: "merchantId required" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, merchantId });
  res.cookies.set("dukanbot_impersonate", merchantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}

export async function DELETE() {
  try {
    await requirePlatformAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dukanbot_impersonate", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
