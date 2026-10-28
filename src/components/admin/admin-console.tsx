"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AdminPayload = {
  merchants: {
    id: string;
    business_name: string;
    plan: string;
    whatsapp_number: string | null;
    created_at: string;
    onboarding_completed: boolean | null;
  }[];
  failedSends: {
    id: string;
    merchant_id: string | null;
    to_phone: string | null;
    body_preview: string | null;
    error: unknown;
    created_at: string;
    skipped: boolean;
  }[];
};

export function AdminConsole() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const res = await fetch("/api/admin");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      return body as AdminPayload;
    },
    retry: false,
  });

  const impersonate = useMutation({
    mutationFn: async (merchantId: string) => {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
  });

  const clearImpersonate = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin", { method: "DELETE" });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      window.location.href = "/dashboard";
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Admin is for DukanBot staff only
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Shop owners use <strong>Home → Orders → Chats → Products</strong>. This
          page is hidden from normal use — you only need it if you run the
          platform.
        </p>
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-2">
          <p className="font-medium">To enable for yourself</p>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
            <li>
              In <code className="text-foreground">.env.local</code> add:
              <pre className="mt-1 overflow-x-auto rounded bg-background p-2 text-xs">
                ADMIN_EMAILS=your@email.com
              </pre>
            </li>
            <li>
              Or in Supabase SQL:{" "}
              <code className="text-foreground text-xs">
                update merchants set is_platform_admin = true where user_id =
                &apos;…&apos;;
              </code>
            </li>
            <li>
              Restart <code className="text-foreground">npm run dev</code>
            </li>
          </ol>
        </div>
        <Button asChild>
          <Link href="/dashboard">Back to my shop desk</Link>
        </Button>
      </div>
    );
  }

  const merchants = data.merchants;
  const failedSends = data.failedSends;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Platform admin</h2>
          <p className="text-sm text-muted-foreground">
            Merchants and failed WhatsApp sends.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => clearImpersonate.mutate()}
        >
          Clear impersonation
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">
          Merchants ({merchants.length})
        </h3>
        {merchants.length === 0 ? (
          <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No merchants yet. Sign up a shop account first.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {merchants.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {m.business_name || "Unnamed shop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.whatsapp_number || "No WA"} · {m.plan} ·{" "}
                    {new Date(m.created_at).toLocaleDateString("en-PK")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-border bg-muted/50 capitalize">
                    {m.onboarding_completed ? "onboarded" : "setup"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => impersonate.mutate(m.id)}
                  >
                    View as shop
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Failed WhatsApp sends</h3>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {failedSends.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              No failed sends logged.
            </li>
          )}
          {failedSends.map((f) => (
            <li key={f.id} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{f.to_phone || "unknown"}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleString("en-PK")}
                  {f.skipped ? " · skipped" : ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{f.body_preview}</p>
              <pre className="overflow-x-auto rounded bg-muted/50 p-2 text-[11px]">
                {JSON.stringify(f.error, null, 0)}
              </pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
