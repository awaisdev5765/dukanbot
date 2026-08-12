import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPlaceholder() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Phase 1 complete</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard shell</h1>
        <p className="text-muted-foreground">
          Sidebar, topbar, and dark mode arrive in Phase 3. Auth + schema are
          wired — say &quot;continue&quot; for Phase 2 (landing page).
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </div>
  );
}
