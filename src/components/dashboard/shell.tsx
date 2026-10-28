"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { DASHBOARD_NAV } from "@/lib/nav";
import { loadSettings } from "@/lib/settings-storage";

const SUBTITLES: Record<string, string> = {
  "/dashboard": "What to do next for your shop",
  "/dashboard/orders": "Confirm COD, mark dispatched",
  "/dashboard/conversations": "Take over when the bot is stuck",
  "/dashboard/catalog": "Prices the bot can quote",
  "/dashboard/bot": "Welcome message, FAQs, test chat",
  "/dashboard/connect-whatsapp": "Link the number customers already message",
  "/dashboard/settings": "Team, plan, alerts",
  "/dashboard/admin": "Platform staff only",
  "/dashboard/analytics": "Sales snapshot",
};

function titleForPath(pathname: string) {
  const match = [...DASHBOARD_NAV]
    .reverse()
    .find((item) =>
      item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
  if (pathname.startsWith("/dashboard/admin")) return "Admin";
  if (pathname.startsWith("/dashboard/analytics")) return "Reports";
  return match?.label ?? "Dashboard";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const title = titleForPath(pathname);
  const subtitle =
    SUBTITLES[pathname] ||
    SUBTITLES[
      Object.keys(SUBTITLES).find(
        (k) => pathname.startsWith(k) && k !== "/dashboard"
      ) || ""
    ];

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: loadSettings,
  });

  const { data: wa } = useQuery({
    queryKey: ["wa-config"],
    queryFn: async () => {
      const res = await fetch("/api/whatsapp/config");
      return (await res.json()) as { configured?: boolean };
    },
  });

  const shop = settings?.business_name || "Your shop";
  const initials = shop
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "DB";

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        shopName={shop}
        plan={settings?.plan || "starter"}
      />
      <div className="dash-canvas flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileOpen(true)}
          waReady={Boolean(wa?.configured)}
          initials={initials}
        />
        <main className="flex-1 px-3 py-4 sm:px-8 sm:py-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  );
}
