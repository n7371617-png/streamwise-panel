import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/api")({ component: ApiPage });

function ApiPage() {
  const settings = useQuery({
    queryKey: ["server_settings"],
    queryFn: async () => (await supabase.from("server_settings").select("*").eq("id", 1).single()).data,
  });
  const sample = useQuery({
    queryKey: ["sample-iptv-user"],
    queryFn: async () => (await supabase.from("iptv_users").select("username,password").limit(1).maybeSingle()).data,
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your.domain";
  const base = settings.data?.domain ? `https://${settings.data.domain}` : origin;
  const u = sample.data?.username ?? "USERNAME";
  const p = sample.data?.password ?? "PASSWORD";

  const items = [
    { label: "Xtream Player API", url: `${base}/player_api.php?username=${u}&password=${p}` },
    { label: "M3U Playlist (live + VOD)", url: `${base}/get.php?username=${u}&password=${p}&type=m3u_plus&output=ts` },
    { label: "EPG (XMLTV)", url: `${base}/xmltv.php?username=${u}&password=${p}` },
    { label: "Portal URL (Stalker/MAG)", url: `${base}/c/` },
  ];

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">API & Portal endpoints</h1>
        <p className="text-sm text-muted-foreground">
          Compatible with IPTV Smarters, TiviMate, OTT Navigator, VLC and Xtream Codes-based players.
        </p>
      </header>
      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="min-w-0">
              <div className="text-sm font-medium">{it.label}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">{it.url}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => copy(it.url)}><Copy className="size-4" />Copy</Button>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <h3 className="mb-2 font-semibold text-foreground">Player config</h3>
        <ul className="list-disc space-y-1 ps-5">
          <li><b>Server URL</b>: {base}</li>
          <li><b>Username</b>: subscriber's username</li>
          <li><b>Password</b>: subscriber's password</li>
          <li>HTTPS on port <b>{settings.data?.https_port ?? 443}</b> (configurable in Settings)</li>
        </ul>
      </div>
    </div>
  );
}
