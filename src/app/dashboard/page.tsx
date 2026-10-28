"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  MessageSquare,
  Package,
  Sparkles,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listOrders } from "@/lib/orders-storage";
import { listConversations } from "@/lib/conversations-storage";
import { listProducts } from "@/lib/catalog-storage";
import { loadSettings } from "@/lib/settings-storage";
import { cn } from "@/lib/utils";

type WaStatus = { configured?: boolean };

export default function DashboardOverviewPage() {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: loadSettings,
  });
  const { data: wa } = useQuery({
    queryKey: ["wa-config"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/config");
      return (await res.json()) as WaStatus;
    },
  });

  const newOrders = orders.filter((o) => o.status === "new").length;
  const escalated = conversations.filter((c) => c.status === "escalated").length;
  const shop = settings?.business_name || "Your shop";

  const setup = [
    {
      done: products.length > 0,
      title: "Add products",
      body: "Bot can only sell what’s in Products.",
      href: "/dashboard/catalog",
      cta: "Add product",
    },
            {
              done: Boolean(wa?.configured),
              title: "Connect WhatsApp",
              body: "Guided steps — DukanBot help, or Meta (advanced).",
              href: "/dashboard/connect-whatsapp",
              cta: "Connect",
            },
    {
      done: Boolean(settings?.notifications),
      title: "Set bot welcome message",
      body: "First reply customers see when they message you.",
      href: "/dashboard/bot",
      cta: "Edit bot",
    },
  ];

  const setupDone = setup.filter((s) => s.done).length;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {shop}
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Run your WhatsApp counter
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Customers message your shop number. The bot takes the order. You confirm
          COD and dispatch from this desk.
        </p>
      </header>

      {/* How it works — one clear story */}
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-tight">How it works</h3>
        <ol className="mt-4 space-y-4">
          {[
            {
              n: "1",
              title: "Customer WhatsApps you",
              body: "They ask price, size, or place an order in Urdu / English.",
            },
            {
              n: "2",
              title: "Bot replies & captures the order",
              body: "Uses your Products list + welcome / FAQs you set.",
            },
            {
              n: "3",
              title: "You see it here",
              body: "New orders in Orders. Confused chats in Chats (take over).",
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {step.n}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Today — actionable numbers */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/orders"
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-xs font-medium">New orders</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{newOrders}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tap to confirm</p>
        </Link>
        <Link
          href="/dashboard/conversations"
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-xs font-medium">Need you</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{escalated}</p>
          <p className="mt-1 text-xs text-muted-foreground">Chats to take over</p>
        </Link>
        <Link
          href="/dashboard/catalog"
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-xs font-medium">Products</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {products.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">In your catalog</p>
        </Link>
      </section>

      {/* Setup — only if incomplete */}
      {setupDone < setup.length && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-tight">
              Finish setup ({setupDone}/{setup.length})
            </h3>
          </div>
          <ul className="space-y-2">
            {setup.map((s) => (
              <li
                key={s.title}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between",
                  s.done && "opacity-60"
                )}
              >
                <div className="flex gap-3">
                  {s.done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </div>
                {!s.done && (
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={s.href}>
                      {s.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Primary actions */}
      <section className="flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/dashboard/bot">
            <Sparkles className="h-4 w-4" />
            Test bot (no WhatsApp needed)
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href="/dashboard/connect-whatsapp">
            <Wifi className="h-4 w-4" />
            {wa?.configured ? "WhatsApp status" : "Connect WhatsApp"}
          </Link>
        </Button>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Billing is manual for now — we&apos;ll invoice you when you go live.
      </p>
    </div>
  );
}
