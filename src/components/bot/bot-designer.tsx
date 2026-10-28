"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotLivePreview } from "@/components/bot/live-preview";
import { BotSimulator } from "@/components/bot/bot-simulator";
import {
  loadBotConfig,
  removeFaq,
  saveBotConfig,
  toggleLanguage,
  upsertFaq,
} from "@/lib/bot-storage";
import { listProducts } from "@/lib/catalog-storage";
import type { BotConfig, BotLanguage, FaqPair } from "@/types/bot";
import { LANGUAGE_LABELS } from "@/types/bot";
import { cn } from "@/lib/utils";

const LANGS: BotLanguage[] = ["en", "roman_ur", "ur"];

async function syncRuntime(cfg: BotConfig) {
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
    body: JSON.stringify({ config: cfg, catalog }),
  });
}

export function BotDesigner() {
  const qc = useQueryClient();
  const { data: saved, isLoading } = useQuery({
    queryKey: ["bot-config"],
    queryFn: loadBotConfig,
  });

  const [draft, setDraft] = useState<BotConfig | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (saved) setDraft(saved);
  }, [saved]);

  const saveMutation = useMutation({
    mutationFn: async (cfg: BotConfig) => {
      const savedCfg = await saveBotConfig(cfg);
      await syncRuntime(savedCfg);
      return savedCfg;
    },
    onSuccess: (cfg) => {
      qc.setQueryData(["bot-config"], cfg);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    },
  });

  if (isLoading || !draft) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-[480px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  function patch(partial: Partial<BotConfig>) {
    setDraft((d) => (d ? { ...d, ...partial } : d));
  }

  function updateFaq(faq: FaqPair) {
    setDraft((d) => (d ? { ...d, faqs: upsertFaq(d.faqs, faq) } : d));
  }

  function addFaq() {
    const faq: FaqPair = {
      id: crypto.randomUUID(),
      question: "New question",
      answer: "Answer customers will see…",
    };
    setDraft((d) => (d ? { ...d, faqs: [...d.faqs, faq] } : d));
  }

  function deleteFaq(id: string) {
    setDraft((d) => (d ? { ...d, faqs: removeFaq(d.faqs, id) } : d));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Configure how DukanBot greets, which languages it speaks, FAQs, and when
          to escalate to you.
        </p>
        <Button
          type="button"
          onClick={() => saveMutation.mutate(draft)}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving…" : savedFlash ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Identity */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold tracking-tight">Identity</h2>
            <div className="space-y-2">
              <Label htmlFor="biz">Business name</Label>
              <Input
                id="biz"
                value={draft.business_name}
                onChange={(e) => patch({ business_name: e.target.value })}
                placeholder="Noor Boutique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcome">Welcome message</Label>
              <textarea
                id="welcome"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.welcome_message}
                onChange={(e) => patch({ welcome_message: e.target.value })}
              />
            </div>
          </section>

          {/* Languages */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Languages</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Bot matches the customer&apos;s language automatically from the ones
                you enable.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((lang) => {
                const on = draft.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() =>
                      patch({
                        languages: toggleLanguage(draft.languages, lang),
                      })
                    }
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      on
                        ? "border-primary/40 bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* FAQs */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">FAQ pairs</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hours, delivery, returns — answered instantly by the bot.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-4">
              {draft.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="space-y-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Question</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) =>
                          updateFaq({ ...faq, question: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => deleteFaq(faq.id)}
                      aria-label="Delete FAQ"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <textarea
                      rows={2}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={faq.answer}
                      onChange={(e) =>
                        updateFaq({ ...faq, answer: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Escalation */}
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Escalation
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                If the bot is unsure repeatedly, hand off to you.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">
                Unsure replies in a row before escalate
              </Label>
              <Input
                id="threshold"
                type="number"
                min={1}
                max={5}
                value={draft.escalation_threshold}
                onChange={(e) =>
                  patch({
                    escalation_threshold: Math.min(
                      5,
                      Math.max(1, Number(e.target.value) || 1)
                    ),
                  })
                }
                className="max-w-[120px]"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                checked={draft.notify_whatsapp}
                onChange={(e) => patch({ notify_whatsapp: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium">
                  Notify me on WhatsApp
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  If bot is unsure {draft.escalation_threshold}× in a row, ping
                  your merchant WhatsApp.
                </span>
              </span>
            </label>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20">
          <div>
            <p className="mb-3 text-sm font-medium">Live preview</p>
            <BotLivePreview config={draft} faqs={draft.faqs} />
          </div>
          <BotSimulator config={draft} />
        </aside>
      </div>
    </div>
  );
}
