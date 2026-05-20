import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ListMusic,
  Tv,
  Film,
  ScrollText,
  Settings,
  Globe,
  LogOut,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const nav = [
  { to: "/admin", icon: LayoutDashboard, key: "dashboard", exact: true },
  { to: "/admin/users", icon: Users, key: "users" },
  { to: "/admin/resellers", icon: UserCog, key: "resellers" },
  { to: "/admin/playlists", icon: ListMusic, key: "playlists" },
  { to: "/admin/streams", icon: Tv, key: "streams" },
  { to: "/admin/vod", icon: Film, key: "vod" },
  { to: "/admin/logs", icon: ScrollText, key: "logs" },
  { to: "/admin/api", icon: Globe, key: "api" },
  { to: "/admin/settings", icon: Settings, key: "settings" },
];

export function AdminShell() {
  const { t, lang, setLang } = useI18n();
  const { user, loading, isAdmin, isReseller, signOut } = useAuth();
  const nav2 = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav2({ to: "/login" });
  }, [loading, user, nav2]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin && !isReseller) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Access pending</h1>
          <p className="mt-2 text-muted-foreground">
            Your account ({user.email}) is signed in but has no admin or reseller role yet.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="size-9 rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]" />
          <div>
            <div className="font-semibold text-sidebar-foreground">{t("appName")}</div>
            <div className="text-xs text-muted-foreground">{t("adminPanel")}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
          >
            <Languages className="size-4" /> {lang === "en" ? "العربية" : "English"}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => signOut()}>
            <LogOut className="size-4" /> {t("signOut")}
          </Button>
          <div className="truncate px-2 text-xs text-muted-foreground">{user.email}</div>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
