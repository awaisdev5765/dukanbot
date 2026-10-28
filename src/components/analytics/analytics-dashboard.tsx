"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { computeAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function formatPkr(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/30">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 sm:p-6",
        className
      )}
    >
      <h3 className="mb-4 text-base font-semibold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function AnalyticsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: computeAnalytics,
  });

  if (isLoading || !data) return <Skeleton />;

  const empty =
    data.ordersThisMonth === 0 &&
    data.funnel.messages === 0 &&
    data.topProducts.length === 0;

  if (empty) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics yet"
        description="Once messages and orders flow, you’ll see trends, top products, and bot performance here."
        actionLabel="View orders"
        actionHref="/dashboard/orders"
      />
    );
  }

  const funnelMax = Math.max(
    data.funnel.messages,
    data.funnel.orders,
    data.funnel.delivered,
    1
  );

  const funnelSteps = [
    { label: "Messages received", value: data.funnel.messages },
    { label: "Orders placed", value: data.funnel.orders },
    { label: "Orders delivered", value: data.funnel.delivered },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <p className="text-muted-foreground">
        Performance this month — from WhatsApp messages to delivered orders.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Orders this month"
          value={String(data.ordersThisMonth)}
          hint="Excluding cancelled"
        />
        <MetricCard
          label="Revenue"
          value={formatPkr(data.revenuePkr)}
          hint="Confirmed month totals"
        />
        <MetricCard
          label="Response rate"
          value={`${data.responseRate}%`}
          hint="Bot replies vs customer msgs"
        />
        <MetricCard
          label="Avg response time"
          value={`${data.avgResponseSeconds}s`}
          hint="Customer → bot"
        />
        <MetricCard
          label="Bot resolution"
          value={`${data.botResolutionRate}%`}
          hint="No human takeover needed"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <ChartCard title="Orders over time" className="lg:col-span-3">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.ordersOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top products" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar
                  dataKey="qty"
                  fill="hsl(var(--primary))"
                  radius={[0, 6, 6, 0]}
                  name="Sold"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Conversion funnel">
        <div className="space-y-4">
          {funnelSteps.map((step, i) => {
            const width = Math.max(8, Math.round((step.value / funnelMax) * 100));
            return (
              <div key={step.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {i + 1}. {step.label}
                  </span>
                  <span className="font-semibold">{step.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}
