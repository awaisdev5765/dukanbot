"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WaStatus = {
  configured: boolean;
  phoneNumberId: string;
  hasToken: boolean;
  verifyToken: string;
  whatsappNumber?: string;
  source?: string;
};

const STEPS_SIMPLE = [
  {
    title: "Aap ka WhatsApp number batao",
    ur: "Woh number jis pe customers order bhejte hain",
    en: "The Business number customers already message",
  },
  {
    title: "Hum / Meta se link karna",
    ur: "Abhi Meta Developer screen mushkil hai — neeche 2 options hain",
    en: "Meta’s developer console is hard — pick an option below",
  },
  {
    title: "Test message bhejo",
    ur: "Apne phone pe test aana chahiye",
    en: "You should get a test on your phone",
  },
];

export function WhatsAppConnectGuide() {
  const qc = useQueryClient();
  const { data: wa } = useQuery({
    queryKey: ["wa-config"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/config");
      return (await res.json()) as WaStatus;
    },
  });

  const [mode, setMode] = useState<"help" | "self" | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shopNumber, setShopNumber] = useState("");
  const [token, setToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [verifyToken, setVerifyToken] = useState("dukanbot_verify");
  const [testTo, setTestTo] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const webhookUrl = useMemo(() => {
    if (typeof window === "undefined") return "/api/whatsapp/webhook";
    return `${window.location.origin}/api/whatsapp/webhook`;
  }, []);

  const saveNumber = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: shopNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["wa-config"] });
      setFlash("Number saved. Next: choose how to connect.");
      setTimeout(() => setFlash(null), 2500);
    },
    onError: (e) => setFlash(e instanceof Error ? e.message : "Failed"),
  });

  const saveCreds = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          phoneNumberId: phoneId || undefined,
          verifyToken,
          whatsappNumber: shopNumber || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["wa-config"] });
      setToken("");
      setFlash("Connected. Send a test message below.");
      setTimeout(() => setFlash(null), 2500);
    },
    onError: (e) => setFlash(e instanceof Error ? e.message : "Failed"),
  });

  const testMutation = useMutation({
    mutationFn: async (kind: "check" | "send") => {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "send"
            ? { to: testTo, text: "DukanBot test ✓" }
            : {}
        ),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setTestOk(Boolean(data.ok));
      setTestResult(
        data.ok
          ? data.message || "OK"
          : data.error || data.detail || "Failed"
      );
    },
  });

  async function copyWebhook() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              wa?.configured
                ? "border-transparent bg-success/15 text-success"
                : "border-transparent bg-warning/15 text-warning"
            )}
          >
            {wa?.configured ? "Connected" : "Not connected yet"}
          </Badge>
        </div>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
          Connect WhatsApp
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Customers already message your shop on WhatsApp. We link that same
          number so the bot can reply for you.
        </p>
        <p className="font-urdu text-[15px] leading-relaxed text-muted-foreground" dir="auto">
          Customers pehle se aapke WhatsApp pe order bhejte hain. Hum usi number
          ko link karte hain taake bot jawab de sake.
        </p>
      </header>

      {/* Reality check */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold">Important — seedha baat</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          WhatsApp does <strong>not</strong> let apps read personal WhatsApp.
          You need a <strong>WhatsApp Business API</strong> number (Cloud API).
          Most shop owners don’t set this alone — that’s normal.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed font-urdu" dir="auto">
          Personal WhatsApp se bot nahi chalta. Business API number chahiye.
          Aksar dukaan wala khud Meta Developer nahi kholta — DukanBot team
          madad karti hai, ya phir &quot;Connect with Meta&quot; (jaldi aa raha hai).
        </p>
      </section>

      {/* Steps overview */}
      <ol className="space-y-3">
        {STEPS_SIMPLE.map((s, i) => (
          <li
            key={s.title}
            className="flex gap-3 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.en}</p>
              <p className="mt-0.5 text-sm text-muted-foreground font-urdu" dir="auto">
                {s.ur}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Step 1: number */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="font-semibold">1 · Shop WhatsApp number</h3>
        </div>
        <Label htmlFor="shop-wa">Number customers already use</Label>
        <Input
          id="shop-wa"
          value={shopNumber || wa?.whatsappNumber || ""}
          onChange={(e) => setShopNumber(e.target.value)}
          placeholder="+92 300 1234567"
        />
        <Button
          type="button"
          onClick={() => saveNumber.mutate()}
          disabled={saveNumber.isPending || !(shopNumber || wa?.whatsappNumber)}
        >
          Save number
        </Button>
      </section>

      {/* Step 2: choose path */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="font-semibold">2 · How do you want to connect?</h3>
        </div>

        <button
          type="button"
          onClick={() => setMode("help")}
          className={cn(
            "w-full rounded-xl border p-4 text-left transition-colors",
            mode === "help"
              ? "border-primary bg-accent/40"
              : "border-border hover:border-primary/40"
          )}
        >
          <p className="font-medium">A · DukanBot team se connect karo (recommended)</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You only share your Business number. We finish Meta / API setup and
            tell you when customers can message the bot.
          </p>
          <p className="mt-1 text-sm text-muted-foreground font-urdu" dir="auto">
            Bas number bhejo — baqi Meta ka kaam hum kar dete hain.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("self")}
          className={cn(
            "w-full rounded-xl border p-4 text-left transition-colors",
            mode === "self"
              ? "border-primary bg-accent/40"
              : "border-border hover:border-primary/40"
          )}
        >
          <p className="font-medium">B · Main khud Meta Developer use karunga</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only if you already have a Meta Business + WhatsApp Cloud API app.
            You’ll copy Phone Number ID + token into the form below.
          </p>
        </button>

        {mode === "help" && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-3">
            <p className="font-medium">What happens next</p>
            <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>Save your number above (step 1).</li>
              <li>
                WhatsApp us on{" "}
                <strong className="text-foreground">
                  {process.env.NEXT_PUBLIC_SUPPORT_WA || "+92 300 0000000"}
                </strong>{" "}
                with: shop name + the number to connect.
              </li>
              <li>
                We create / link Cloud API, set the webhook, and message you when
                live.
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Later: one-tap &quot;Login with Facebook / Meta&quot; (Embedded Signup)
              so shops won’t need us. Not live in this build yet.
            </p>
            <Button asChild variant="outline">
              <a
                href={`https://wa.me/${(process.env.NEXT_PUBLIC_SUPPORT_WA || "923000000000").replace(/\D/g, "")}?text=${encodeURIComponent("Assalam o alaikum — DukanBot WhatsApp connect chahiye. Shop: ")}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Message DukanBot support
              </a>
            </Button>
          </div>
        )}

        {mode === "self" && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium">Self-serve checklist (Meta)</p>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
              <li>
                Open{" "}
                <a
                  className="text-primary underline"
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noreferrer"
                >
                  developers.facebook.com/apps
                </a>{" "}
                → create app → add <strong>WhatsApp</strong> product.
              </li>
              <li>
                WhatsApp → API Setup → copy <strong>Phone number ID</strong> and
                a temporary (or System User) <strong>Access token</strong>.
              </li>
              <li>
                WhatsApp → Configuration → Callback URL ={" "}
                <code className="break-all text-foreground">{webhookUrl}</code>
                , Verify token ={" "}
                <code className="text-foreground">{verifyToken}</code>, subscribe{" "}
                <strong>messages</strong>.
              </li>
              <li>Paste values below → Save → Send test.</li>
            </ol>
            <Button type="button" variant="outline" size="sm" onClick={copyWebhook}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied webhook" : "Copy webhook URL"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Hide" : "Show"} credential form
            </Button>

            {showAdvanced && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Access token</Label>
                  <Input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={wa?.hasToken ? "•••• leave blank to keep" : "EAAG…"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone number ID</Label>
                  <Input
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                    placeholder="Digits from Meta"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Verify token</Label>
                  <Input
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    onClick={() => saveCreds.mutate()}
                    disabled={saveCreds.isPending}
                  >
                    {saveCreds.isPending ? "Saving…" : "Save & connect"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 3: test */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">3 · Test</h3>
        <p className="text-sm text-muted-foreground">
          First message to a new number often needs Meta’s{" "}
          <code>hello_world</code> template. Your personal number must Accept the
          test invite in WhatsApp.
        </p>
        <Label>Your phone (receive test)</Label>
        <Input
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
          placeholder="923001234567"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending}
            onClick={() => testMutation.mutate("check")}
          >
            Check connection
          </Button>
          <Button
            type="button"
            disabled={testMutation.isPending || !testTo.trim()}
            onClick={() => testMutation.mutate("send")}
          >
            Send test to my phone
          </Button>
        </div>
        {testResult && (
          <p
            className={cn(
              "text-sm",
              testOk ? "text-success" : "text-destructive"
            )}
          >
            {testResult}
          </p>
        )}
      </section>

      {flash && (
        <p className="text-sm text-primary" role="status">
          {flash}
        </p>
      )}
    </div>
  );
}
