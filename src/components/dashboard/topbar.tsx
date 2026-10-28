"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { cn } from "@/lib/utils";

type TopbarProps = {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  waReady?: boolean;
  initials?: string;
};

export function DashboardTopbar({
  title,
  subtitle,
  onMenuClick,
  waReady = false,
  initials = "DB",
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[4.25rem] items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[1.15rem] font-semibold tracking-[-0.02em] sm:text-xl">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span
          className={cn(
            "mr-1 hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium sm:inline-flex",
            waReady
              ? "border-success/30 bg-success/10 text-success"
              : "border-border bg-card text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              waReady ? "bg-success" : "bg-muted-foreground"
            )}
          />
          {waReady ? "WhatsApp connected" : "WhatsApp not connected"}
        </span>
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </Button>
        <ThemeToggle />
        <div
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground"
          title="Account"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
