import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/player_api")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: cors() }),
    },
  },
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  } as Record<string, string>;
}

const DEFAULT_HOST = "streamwise-panel.vercel.app";
const DEFAULT_PROTOCOL = "https";

async function getHost() {
  return {
    url: DEFAULT_HOST,
    https_port: "443",
    http_port: "443",
  };
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username") ?? "";
  const password = url.searchParams.get("password") ?? "";
  const action = url.searchParams.get("action") ?? "";
  const headers = { "Content-Type": "application/json; charset=utf-8", ...cors() };

  const { data: user } = await supabaseAdmin
    .from("iptv_users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (!user || user.status !== "active") {
    return new Response(
      JSON.stringify({ user_info: { auth: 0, status: "Disabled" } }),
      { status: 401, headers },
    );
  }

  const host = await getHost(url.hostname);
  const baseInfo = {
    user_info: {
      username: user.username,
      password: user.password,
      message: "",
      auth: 1,
      status: "Active",
      exp_date: user.expire_at
        ? Math.floor(new Date(user.expire_at).getTime() / 1000).toString()
        : null,
      is_trial: user.is_trial ? "1" : "0",
      active_cons: "0",
      created_at: Math.floor(new Date(user.created_at).getTime() / 1000).toString(),
      max_connections: String(user.max_connections),
      allowed_output_formats: ["m3u8", "ts", "rtmp"],
    },
    server_info: {
      url: host.url,
      port: host.http_port,
      https_port: host.https_port,
      server_protocol: "https",
      rtmp_port: "8880",
      timezone: "UTC",
      timestamp_now: Math.floor(Date.now() / 1000),
      time_now: new Date().toISOString(),
    },
  };

  if (!action) return new Response(JSON.stringify(baseInfo), { headers });

  if (
    action === "get_live_categories" ||
    action === "get_vod_categories" ||
    action === "get_series_categories"
  ) {
    const type = action.includes("vod")
      ? "movie"
      : action.includes("series")
      ? "series"
      : "live";
    const { data } = await supabaseAdmin
      .from("categories")
      .select("id,name")
      .eq("type", type)
      .order("sort_order");
    return new Response(
      JSON.stringify(
        (data ?? []).map((c, i) => ({
          category_id: String(i + 1),
          category_name: c.name,
          parent_id: 0,
        })),
      ),
      { headers },
    );
  }

  if (action === "get_live_streams") {
    const { data } = await supabaseAdmin
      .from("streams")
      .select("*")
      .eq("type", "live")
      .eq("enabled", true)
      .limit(5000);
    return new Response(
      JSON.stringify(
        (data ?? []).map((s, i) => ({
          num: i + 1,
          name: s.name,
          stream_type: "live",
          stream_id: i + 1,
          stream_icon: s.logo,
          epg_channel_id: s.epg_id,
          added: "",
          category_id: "0",
          custom_sid: "",
          tv_archive: 0,
          direct_source: s.url,
          tv_archive_duration: 0,
        })),
      ),
      { headers },
    );
  }

  if (action === "get_vod_streams") {
    const { data } = await supabaseAdmin.from("vod_movies").select("*").limit(5000);
    return new Response(
      JSON.stringify(
        (data ?? []).map((m, i) => ({
          num: i + 1,
          name: m.title,
          stream_type: "movie",
          stream_id: i + 1,
          stream_icon: m.poster,
          rating: m.rating,
          rating_5based: m.rating,
          added: "",
          category_id: "0",
          container_extension: "mp4",
          custom_sid: "",
          direct_source: m.url,
        })),
      ),
      { headers },
    );
  }

  if (action === "get_series") {
    const { data } = await supabaseAdmin.from("vod_series").select("*").limit(5000);
    return new Response(
      JSON.stringify(
        (data ?? []).map((s, i) => ({
          num: i + 1,
          name: s.title,
          series_id: i + 1,
          cover: s.poster,
          plot: s.description,
          releaseDate: String(s.year ?? ""),
          rating: s.rating,
          category_id: "0",
        })),
      ),
      { headers },
    );
  }

  return new Response(JSON.stringify(baseInfo), { headers });
}
