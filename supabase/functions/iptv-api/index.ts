// Supabase Edge Function: iptv-api
// Xtream Codes compatible endpoint (IPTV Smarters / TiviMate / OTT Navigator)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HOST_URL = SUPABASE_URL.replace(/^https?:\/\//, "");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};
const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  ...cors,
};

function serverInfo() {
  const now = Math.floor(Date.now() / 1000);
  return {
    url: HOST_URL,
    port: "443",
    https_port: "443",
    server_protocol: "https",
    rtmp_port: "8880",
    timezone: "UTC",
    timestamp_now: now,
    server_time: String(now),
    time_now: new Date().toISOString(),
  };
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(req.url);
  const username = url.searchParams.get("username") ?? "";
  const password = url.searchParams.get("password") ?? "";
  const action = url.searchParams.get("action") ?? "";

  if (!username && !password) {
    return new Response(JSON.stringify({ server_info: serverInfo() }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const { data: user } = await supabase
    .from("iptv_users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (!user || user.status !== "active") {
    return new Response(
      JSON.stringify({
        user_info: { auth: 0, status: "Disabled" },
        server_info: serverInfo(),
      }),
      { status: 401, headers: jsonHeaders },
    );
  }

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
      max_connections: String(user.max_connections ?? 1),
      allowed_output_formats: ["m3u8", "ts", "rtmp"],
    },
    server_info: serverInfo(),
  };

  if (!action) {
    return new Response(JSON.stringify(baseInfo), { headers: jsonHeaders });
  }

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
    const { data } = await supabase
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
      { headers: jsonHeaders },
    );
  }

  if (action === "get_live_streams") {
    const { data } = await supabase
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
      { headers: jsonHeaders },
    );
  }

  if (action === "get_vod_streams") {
    const { data } = await supabase.from("vod_movies").select("*").limit(5000);
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
      { headers: jsonHeaders },
    );
  }

  if (action === "get_series") {
    const { data } = await supabase.from("vod_series").select("*").limit(5000);
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
      { headers: jsonHeaders },
    );
  }

  return new Response(JSON.stringify(baseInfo), { headers: jsonHeaders });
});
