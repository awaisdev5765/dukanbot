import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Temporary home until Phase 2 landing page */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          DukanBot · Phase 1
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          WhatsApp orders on autopilot
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Scaffold ready: Next.js 14, Tailwind, shadcn-ready UI tokens (deep
          teal), Supabase auth clients, schema SQL, and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">lib/llm.ts</code>.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Create account</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>✓ Project at <code className="text-foreground">~/dukanbot</code></li>
        <li>✓ Copy <code className="text-foreground">.env.example</code> → <code className="text-foreground">.env.local</code></li>
        <li>✓ Run <code className="text-foreground">supabase/schema.sql</code> in Supabase SQL Editor</li>
      </ul>
    </main>
  );
}
