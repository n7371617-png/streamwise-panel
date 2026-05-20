import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Minimal Xtream-style Player API: handles authentication and basic actions.
// Compatible with IPTV Smarters, TiviMate, OTT Navigator (read-only views).
export const Route = createFileRoute("/player_api.php")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username") ?? "";
  const password = url.searchParams.get("password") ?? "";
  const action = url.searchParams.get("action") ?? "";

  const { data: user } = await supabaseAdmin
    .from("iptv_users").select("*").eq("username", username).eq("password", password).maybeSingle();

  if (!user || user.status !== "active") {
    return Response.json({ user_info: { auth: 0, status: "Disabled" } }, { status: 401 });
  }

  const baseInfo = {
    user_info: {
      username: user.username,
      password: user.password,
      auth: 1,
      status: "Active",
      exp_date: user.expire_at ? Math.floor(new Date(user.expire_at).getTime() / 1000).toString() : null,
      is_trial: user.is_trial ? "1" : "0",
      active_cons: "0",
      max_connections: String(user.max_connections),
      created_at: Math.floor(new Date(user.created_at).getTime() / 1000).toString(),
    },
    server_info: {
      url: url.hostname, port: url.port || "443", https_port: "443",
      server_protocol: "https", timezone: "UTC", timestamp_now: Math.floor(Date.now() / 1000),
    },
  };

  if (!action) return Response.json(baseInfo);

  if (action === "get_live_categories" || action === "get_vod_categories" || action === "get_series_categories") {
    const type = action.includes("vod") ? "movie" : action.includes("series") ? "series" : "live";
    const { data } = await supabaseAdmin.from("categories").select("id,name").eq("type", type).order("sort_order");
    return Response.json((data ?? []).map((c, i) => ({ category_id: String(i + 1), category_name: c.name, parent_id: 0 })));
  }
  if (action === "get_live_streams") {
    const { data } = await supabaseAdmin.from("streams").select("*").eq("type", "live").eq("enabled", true).limit(5000);
    return Response.json((data ?? []).map((s, i) => ({
      num: i + 1, name: s.name, stream_type: "live", stream_id: i + 1,
      stream_icon: s.logo, epg_channel_id: s.epg_id, added: "", category_id: "0",
      custom_sid: "", tv_archive: 0, direct_source: s.url, tv_archive_duration: 0,
    })));
  }
  if (action === "get_vod_streams") {
    const { data } = await supabaseAdmin.from("vod_movies").select("*").limit(5000);
    return Response.json((data ?? []).map((m, i) => ({
      num: i + 1, name: m.title, stream_type: "movie", stream_id: i + 1,
      stream_icon: m.poster, rating: m.rating, rating_5based: m.rating, added: "",
      category_id: "0", container_extension: "mp4", custom_sid: "", direct_source: m.url,
    })));
  }
  if (action === "get_series") {
    const { data } = await supabaseAdmin.from("vod_series").select("*").limit(5000);
    return Response.json((data ?? []).map((s, i) => ({
      num: i + 1, name: s.title, series_id: i + 1, cover: s.poster, plot: s.description,
      releaseDate: String(s.year ?? ""), rating: s.rating, category_id: "0",
    })));
  }
  return Response.json(baseInfo);
}
