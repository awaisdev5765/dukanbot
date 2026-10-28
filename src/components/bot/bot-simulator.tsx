"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppThread } from "@/components/orders/whatsapp-thread";
import type { ChatMessage } from "@/types/orders";
import type { BotConfig } from "@/types/bot";
import { listProducts } from "@/lib/catalog-storage";

type Props = {
  config: BotConfig;
};

export function BotSimulator({ config }: Props) {
  const [phone] = useState("923001112233");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState<string | null>(null);

  async function syncRuntime() {
    const products = await listProducts().catch(() => []);
    const catalog = products.map((p) => ({
      name: p.name,
      price: p.price,
      description: p.description,
      stock_status: p.stock_status,
      category: p.category,
    }));
    await fetch("/api/bot/runtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, catalog }),
    });
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setText("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      from: "customer",
      text: trimmed,
      at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);

    try {
      await syncRuntime();
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: "Test Customer",
          text: trimmed,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            from: "bot",
            text: data.reply,
            at: new Date().toISOString(),
          },
        ]);
      }
      setMeta(
        `LLM ${data.meta?.llm ? "on" : "off (rules)"} · WA ${
          data.meta?.whatsapp ? "on" : "off"
        }${data.escalated ? " · escalated" : ""}${
          data.orderId ? ` · order ${data.orderId.slice(0, 8)}` : ""
        }`
      );
    } catch {
      setMeta("Simulate request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">Test bot</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Hits the same handler as the WhatsApp webhook (no Meta needed).
          Add OPENAI_API_KEY for gpt-4o-mini; without it, rule-based fallback runs.
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg bg-[#e5ddd5] p-2 dark:bg-[#0b141a]">
        {messages.length ? (
          <WhatsAppThread
            messages={messages}
            className="rounded-none bg-transparent p-0 dark:bg-transparent"
          />
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Try: “Black abaya price?” or “Order 1 biryani COD”
          </p>
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a customer message…"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !text.trim()}>
          {busy ? "…" : "Send"}
        </Button>
      </form>
      {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
    </div>
  );
}
