import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Lightweight gate for auth-adjacent abuse (login page can call this first). */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit({ key: `auth:${ip}`, limit: 20, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }
  return NextResponse.json({ ok: true, remaining: rl.remaining });
}
