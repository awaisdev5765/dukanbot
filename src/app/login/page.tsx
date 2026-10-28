"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const isDemo =
  process.env.NEXT_PUBLIC_DEMO_SEED === "true" ||
  process.env.NODE_ENV !== "production";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(isDemo ? "awais@gmail.com" : "");
  const [password, setPassword] = useState(isDemo ? "admin@123" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const gate = await fetch("/api/auth/gate", { method: "POST" });
    if (gate.status === 429) {
      setLoading(false);
      setError("Too many attempts. Try again in a few minutes.");
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="sidebar-grain relative hidden flex-col justify-between p-10 text-sidebar-foreground lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent">
            <Store className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">
            DukanBot
          </span>
        </Link>
        <div className="max-w-md space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
            Merchant desk
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] leading-[1.1]">
            Orders on WhatsApp, without living on your phone.
          </h1>
          <p className="text-[15px] leading-relaxed text-sidebar-muted">
            Catalog, inbox, and COD flows in one calm workspace — built for
            Pakistani shops.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">
          © {new Date().getFullYear()} DukanBot
        </p>
      </aside>

      <main className="dash-canvas flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] space-y-8">
          <div className="space-y-2 lg:hidden">
            <Link href="/" className="text-lg font-semibold tracking-[-0.02em]">
              Dukan<span className="text-primary">Bot</span>
            </Link>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Use your merchant email to open the desk.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
            <p className="text-muted-foreground">
              New shop?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
