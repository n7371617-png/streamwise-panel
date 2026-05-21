import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/get")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
        }),
    },
  },
});

async function handle(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username") ?? "";
  const password = url.searchParams.get("password") ?? "";

  const { data: user } = await supabaseAdmin
    .from("iptv_users")
    .select("id,status")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (!user || user.status !== "active") {
    return new Response("#EXTM3U\n# Unauthorized", {
      status: 401,
      headers: {
        "Content-Type": "audio/x-mpegurl; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const { data: streams } = await supabaseAdmin
    .from("streams")
    .select("name,url,logo,epg_id,categories(name)")
    .eq("enabled", true)
    .limit(10000);

  const lines = ["#EXTM3U"];
  for (const s of streams ?? []) {
    const group = (s as { categories?: { name?: string } }).categories?.name ?? "Live";
    const logo = s.logo ? ` tvg-logo="${s.logo}"` : "";
    const epg = s.epg_id ? ` tvg-id="${s.epg_id}"` : "";
    lines.push(`#EXTINF:-1${epg}${logo} group-title="${group}",${s.name}`);
    lines.push(s.url);
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "audio/x-mpegurl; charset=utf-8",
      "Content-Disposition": 'attachment; filename="playlist.m3u"',
      "Access-Control-Allow-Origin": "*",
    },
  });
}
