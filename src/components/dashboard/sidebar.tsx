"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV } from "@/lib/nav";
import { Button } from "@/components/ui/button";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  shopName?: string;
  plan?: string;
};

export function DashboardSidebar({
  open = false,
  onClose,
  shopName = "Your dukan",
  plan = "starter",
}: SidebarProps) {
  const pathname = usePathname();

  const nav = (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex h-[4.25rem] items-center justify-between gap-3 border-b border-sidebar-border px-4">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent">
            <Store className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[-0.02em]">
              DukanBot
            </p>
            <p className="truncate text-[11px] text-sidebar-muted">
              {shopName}
            </p>
          </div>
        </Link>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
          Your shop
        </p>
        {DASHBOARD_NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[13px] transition-colors",
                active
                  ? "bg-white/8 font-medium text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full",
                  active ? "bg-sidebar-accent" : "opacity-0"
                )}
              />
              <Icon
                className={cn(
                  "h-[17px] w-[17px] shrink-0",
                  active ? "text-sidebar-accent" : "opacity-80"
                )}
                strokeWidth={1.75}
              />
              <span className="min-w-0">
                <span className="block">{item.label}</span>
                <span className="block text-[10px] text-sidebar-muted opacity-80">
                  {item.hint}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] text-sidebar-muted">
          Customer WhatsApps you → bot takes the order → you confirm here.
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-wider text-sidebar-muted">
          Plan · {plan}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sidebar-grain hidden w-[16rem] shrink-0 lg:flex lg:flex-col">
        {nav}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-foreground/40 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
          aria-hidden
        />
        <aside
          className={cn(
            "sidebar-grain absolute inset-y-0 left-0 flex w-[17rem] max-w-[86vw] flex-col transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
