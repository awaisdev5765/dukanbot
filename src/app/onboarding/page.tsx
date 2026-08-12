import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Step 1 of 3</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Connect WhatsApp
        </h1>
        <p className="text-muted-foreground">
          Full Meta Embedded Signup lands in a later phase. For now, continue to
          the dashboard — you can paste API credentials under Settings later.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Onboarding wizard (category, hours, delivery areas) will expand in
          Phase 2–3. Schema and auth are ready.
        </p>
        <Button asChild className="w-full">
          <Link href="/dashboard">Continue to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
