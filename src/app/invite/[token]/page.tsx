"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error" | "need-auth">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setStatus("need-auth");
        return;
      }

      const { data: invite, error } = await supabase
        .from("team_members")
        .select("id, email, merchant_id, status")
        .eq("invite_token", token)
        .maybeSingle();

      if (error || !invite) {
        setStatus("error");
        setMessage("Invite not found or expired.");
        return;
      }

      if (
        invite.email &&
        auth.user.email &&
        invite.email.toLowerCase() !== auth.user.email.toLowerCase()
      ) {
        setStatus("error");
        setMessage(
          `Sign in as ${invite.email} to accept this invite (you’re ${auth.user.email}).`
        );
        return;
      }

      const { error: updErr } = await supabase
        .from("team_members")
        .update({
          status: "active",
          user_id: auth.user.id,
          accepted_at: new Date().toISOString(),
          invite_token: null,
        })
        .eq("id", invite.id);

      if (updErr) {
        setStatus("error");
        setMessage(updErr.message);
        return;
      }

      // Drop orphan shop created by signup trigger (staff shouldn't own a blank shop)
      const { data: orphan } = await supabase
        .from("merchants")
        .select("id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (orphan?.id && orphan.id !== invite.merchant_id) {
        await supabase.from("merchants").delete().eq("id", orphan.id);
      }

      setStatus("ok");
      setTimeout(() => router.push("/dashboard"), 1200);
    })();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center">
        <Link href="/" className="text-lg font-semibold text-primary">
          DukanBot
        </Link>
        {status === "loading" && <p className="text-sm">Accepting invite…</p>}
        {status === "need-auth" && (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in (or create an account with the invited email) to join this shop.
            </p>
            <Button asChild className="w-full">
              <Link href={`/login?next=/invite/${token}`}>Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/signup?next=/invite/${token}`}>Create account</Link>
            </Button>
          </>
        )}
        {status === "ok" && (
          <p className="text-sm text-success">You’re on the team. Opening desk…</p>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">{message}</p>
        )}
      </div>
    </div>
  );
}
