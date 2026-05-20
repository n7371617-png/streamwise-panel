import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Users, Wifi, CreditCard, Activity, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/admin/")({ component: DashboardPage });

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "primary",
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "accent" | "success" | "warning";
}) {
  const color =
    accent === "success" ? "bg-success/15 text-success"
    : accent === "warning" ? "bg-warning/15 text-warning"
    : accent === "accent" ? "bg-accent/15 text-accent"
    : "bg-primary/15 text-primary";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex size-10 items-center justify-center rounded-lg ${color}`}><Icon className="size-5" /></div>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function DashboardPage() {
  const { t } = useI18n();
  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [users, active, online, resellers] = await Promise.all([
        supabase.from("iptv_users").select("id", { count: "exact", head: true }),
        supabase.from("iptv_users").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("online_sessions").select("id", { count: "exact", head: true }),
        supabase.from("resellers").select("credits, total_sales"),
      ]);
      const credits = (resellers.data ?? []).reduce((s, r: any) => s + (r.credits ?? 0), 0);
      const sales = (resellers.data ?? []).reduce((s, r: any) => s + (r.total_sales ?? 0), 0);
      return {
        users: users.count ?? 0,
        active: active.count ?? 0,
        online: online.count ?? 0,
        credits,
        sales,
      };
    },
  });

  const trend = Array.from({ length: 14 }, (_, i) => ({
    d: `D${i + 1}`,
    users: Math.round(20 + Math.sin(i / 2) * 10 + i * 2),
    online: Math.round(5 + Math.cos(i / 2) * 4 + i),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">{t("welcome")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
          <ShieldCheck className="size-4 text-success" /> {t("serverStatus")}: <span className="text-success">{t("healthy")}</span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t("totalUsers")} value={stats.data?.users ?? 0} />
        <StatCard icon={Activity} label={t("active")} value={stats.data?.active ?? 0} accent="success" />
        <StatCard icon={Wifi} label={t("online")} value={stats.data?.online ?? 0} accent="accent" />
        <StatCard icon={CreditCard} label={t("revenue")} value={stats.data?.sales ?? 0} hint={`Credits: ${stats.data?.credits ?? 0}`} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Subscribers — last 14 days</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="users" stroke="var(--color-primary)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Online concurrency</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="online" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
