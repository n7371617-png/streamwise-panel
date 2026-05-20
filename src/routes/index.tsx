import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tv, Shield, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, isAdmin, isReseller, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user && (isAdmin || isReseller)) nav({ to: "/admin" });
  }, [loading, user, isAdmin, isReseller, nav]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]" />
          <span className="font-semibold">IPTV Control</span>
        </div>
        <Link to="/login">
          <Button size="sm">Sign in</Button>
        </Link>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:py-32">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" /> Xtream-compatible · HTTPS on 443
        </div>
        <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
          The complete <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">IPTV platform</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Subscriptions, resellers, M3U playlists, VOD library and a full Xtream-style API — managed from a single, fast admin panel.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/login"><Button size="lg">Open Admin Panel</Button></Link>
          <Link to="/admin/api"><Button size="lg" variant="outline">API Docs</Button></Link>
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-4">
          {[
            { icon: Tv, t: "M3U & Streams", d: "Upload, parse, validate." },
            { icon: Users, t: "Subscribers", d: "Trial, paid, limits, bans." },
            { icon: Shield, t: "Resellers", d: "Credits & sales tracking." },
            { icon: Zap, t: "Xtream API", d: "Smarters, TiviMate, VLC." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-border bg-card p-5 text-left">
              <Icon className="mb-3 size-5 text-primary" />
              <div className="font-semibold">{t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
