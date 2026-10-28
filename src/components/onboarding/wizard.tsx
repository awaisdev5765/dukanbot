"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureMerchant } from "@/lib/supabase/merchant";
import { createProduct } from "@/lib/catalog-storage";
import { saveBotConfig } from "@/lib/bot-storage";
import { defaultBotConfig } from "@/lib/bot-defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STEPS = ["Shop", "Catalog", "WhatsApp", "Bot", "Done"] as const;

type Category = "boutique" | "restaurant" | "clinic" | "other";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<Category>("boutique");
  const [open, setOpen] = useState("10:00");
  const [close, setClose] = useState("21:00");
  const [areas, setAreas] = useState("Lahore, Karachi");

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");

  const [waNumber, setWaNumber] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [token, setToken] = useState("");

  const [welcome, setWelcome] = useState(
    "Assalam o Alaikum! Welcome — how can I help you today?"
  );

  async function saveShop() {
    setBusy(true);
    setError(null);
    try {
      const merchant = await ensureMerchant();
      const supabase = createClient();
      const { error: err } = await supabase
        .from("merchants")
        .update({
          business_name: businessName.trim() || merchant.business_name,
          category,
          business_hours: { open, close, days: ["mon", "tue", "wed", "thu", "fri", "sat"] },
          delivery_areas: areas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        })
        .eq("id", merchant.id);
      if (err) throw new Error(err.message);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save shop");
    } finally {
      setBusy(false);
    }
  }

  async function saveCatalog() {
    if (!productName.trim() || !productPrice) {
      setStep(2);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createProduct({
        name: productName.trim(),
        price: Number(productPrice) || 0,
        description: "",
        image_url: "",
        stock_status: "in_stock",
        category: "",
      });
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add product");
    } finally {
      setBusy(false);
    }
  }

  async function saveWhatsApp() {
    setBusy(true);
    setError(null);
    try {
      if (token || phoneId) {
        const res = await fetch("/api/whatsapp/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: token || undefined,
            phoneNumberId: phoneId || undefined,
            whatsappNumber: waNumber || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "WhatsApp save failed");
      } else if (waNumber) {
        const merchant = await ensureMerchant();
        const supabase = createClient();
        await supabase
          .from("merchants")
          .update({ whatsapp_number: waNumber })
          .eq("id", merchant.id);
      }
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "WhatsApp step failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveBot() {
    setBusy(true);
    setError(null);
    try {
      const cfg = defaultBotConfig();
      cfg.business_name = businessName.trim() || cfg.business_name;
      cfg.welcome_message = welcome.trim() || cfg.welcome_message;
      await saveBotConfig(cfg);
      const merchant = await ensureMerchant();
      const supabase = createClient();
      await supabase
        .from("merchants")
        .update({ onboarding_completed: true })
        .eq("id", merchant.id);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bot save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">
          Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {STEPS[step] === "Done" ? "You’re ready" : `Set up · ${STEPS[step]}`}
        </h1>
        <div className="flex gap-1.5 pt-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label>Shop name</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Noor Boutique"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                <option value="boutique">Boutique</option>
                <option value="restaurant">Restaurant</option>
                <option value="clinic">Clinic</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Opens</Label>
                <Input type="time" value={open} onChange={(e) => setOpen(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Closes</Label>
                <Input type="time" value={close} onChange={(e) => setClose(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delivery areas</Label>
              <Input
                value={areas}
                onChange={(e) => setAreas(e.target.value)}
                placeholder="Lahore, Gulberg"
              />
            </div>
            <Button className="w-full" disabled={busy} onClick={saveShop}>
              Continue
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-muted-foreground">
              Add one product so the bot has something to sell. You can skip.
            </p>
            <div className="space-y-2">
              <Label>Product name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Black Abaya"
              />
            </div>
            <div className="space-y-2">
              <Label>Price (PKR)</Label>
              <Input
                type="number"
                min={0}
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="4500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Skip
              </Button>
              <Button className="flex-1" disabled={busy} onClick={saveCatalog}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted-foreground">
              Save your shop number now. Full connect (Meta / our team) is on the
              WhatsApp page after setup.
            </p>
            <div className="space-y-2">
              <Label>WhatsApp number</Label>
              <Input
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="+92 300 1234567"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Token / Phone Number ID are optional here — use{" "}
              <strong>WhatsApp</strong> in the sidebar for the guided flow.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                Skip
              </Button>
              <Button className="flex-1" disabled={busy} onClick={saveWhatsApp}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label>Welcome message</Label>
              <textarea
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-urdu"
                dir="auto"
                value={welcome}
                onChange={(e) => setWelcome(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={busy} onClick={saveBot}>
              Finish setup
            </Button>
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-sm text-muted-foreground">
              Your desk is ready. Add more catalog items, tune FAQs, and verify
              the WhatsApp webhook when you go live.
            </p>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Open dashboard
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/bot">Edit bot</Link>
            </Button>
          </>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
