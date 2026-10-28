"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  inviteTeamMember,
  loadSettings,
  removeTeamMember,
  saveSettings,
} from "@/lib/settings-storage";
import type { PlanId, SettingsState } from "@/types/settings";
import { PLANS } from "@/types/settings";
import { cn } from "@/lib/utils";

type WaStatus = {
  configured: boolean;
};

export function SettingsManager() {
  const qc = useQueryClient();
  const { data: saved, isLoading } = useQuery({
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

  const [draft, setDraft] = useState<SettingsState | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (saved) setDraft(saved);
  }, [saved]);

  const saveMutation = useMutation({
    mutationFn: async (state: SettingsState) => saveSettings(state),
    onSuccess: (s) => {
      qc.setQueryData(["settings"], s);
      setFlash("Settings saved");
      setTimeout(() => setFlash(null), 1600);
    },
  });

  if (isLoading || !draft) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  function patch(partial: Partial<SettingsState>) {
    setDraft((d) => (d ? { ...d, ...partial } : d));
  }

  async function addInvite() {
    if (!draft) return;
    const email = inviteEmail.trim();
    if (!email) return;
    try {
      const { member, inviteUrl } = await inviteTeamMember(email, "staff");
      setInviteLink(inviteUrl);
      patch({
        team: [
          ...draft.team,
          {
            id: member.id,
            email: member.email,
            role: member.role,
            status: member.status,
          },
        ],
      });
      setInviteEmail("");
      setFlash("Invite created — copy the link below");
      setTimeout(() => setFlash(null), 2500);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Invite failed");
      setTimeout(() => setFlash(null), 2500);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Plan, team invites, and notification preferences.
        </p>
        <div className="flex items-center gap-2">
          {flash && (
            <span className="text-sm text-primary" role="status">
              {flash}
            </span>
          )}
          <Button
            type="button"
            onClick={() => saveMutation.mutate(draft)}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Subscription</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            PKR monthly plans. Billing is manual for now.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((plan) => {
            const active = draft.plan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => patch({ plan: plan.id as PlanId })}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "border-primary bg-accent/50"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{plan.name}</p>
                  {active && (
                    <Badge className="border-transparent bg-primary/15 text-primary">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  Rs. {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">WhatsApp</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your shop number with a plain-language guide.
            </p>
          </div>
          <Badge
            className={cn(
              wa?.configured
                ? "border-transparent bg-success/15 text-success"
                : "border-transparent bg-warning/15 text-warning"
            )}
          >
            {wa?.configured ? "Connected" : "Not connected"}
          </Badge>
        </div>
        <Button asChild>
          <Link href="/dashboard/connect-whatsapp">
            Open WhatsApp connect guide
          </Link>
        </Button>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite staff with a link.
          </p>
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {draft.team.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{m.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {m.role} · {m.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-border bg-muted/50 text-muted-foreground capitalize">
                  {m.status}
                </Badge>
                {m.id !== "owner" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await removeTeamMember(m.id);
                        patch({
                          team: draft.team.filter((t) => t.id !== m.id),
                        });
                      } catch (err) {
                        setFlash(
                          err instanceof Error ? err.message : "Remove failed"
                        );
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@shop.pk"
            type="email"
          />
          <Button type="button" variant="outline" onClick={addInvite}>
            <Plus className="h-4 w-4" />
            Invite
          </Button>
        </div>
        {inviteLink && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs break-all">
            Invite link:{" "}
            <button
              type="button"
              className="text-primary underline"
              onClick={() => navigator.clipboard.writeText(inviteLink)}
            >
              {inviteLink}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Alerts on new orders and escalations.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notify-email">Alert email</Label>
            <Input
              id="notify-email"
              type="email"
              value={draft.notify_email || ""}
              onChange={(e) => patch({ notify_email: e.target.value })}
              placeholder="owner@shop.pk"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notify-wa">Alert WhatsApp number</Label>
            <Input
              id="notify-wa"
              value={draft.notify_whatsapp_number || ""}
              onChange={(e) =>
                patch({ notify_whatsapp_number: e.target.value })
              }
              placeholder="923001234567"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["new_order", "New order alerts"],
              ["escalation", "Bot escalation alerts"],
              ["daily_summary", "Daily summary (manual for now)"],
              ["email", "Email channel"],
              ["whatsapp", "WhatsApp channel"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={draft.notifications[key]}
                onChange={(e) =>
                  patch({
                    notifications: {
                      ...draft.notifications,
                      [key]: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
