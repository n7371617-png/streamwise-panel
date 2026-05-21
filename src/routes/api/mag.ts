import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Minimal MAG / Stalker portal endpoint at /c/portal.php?type=...&action=...
export const Route = createFileRoute("/api/mag")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const action = url.searchParams.get("action") ?? "";
  const mac = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("mac="))
    ?.slice(4);

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  if (type === "stb" && action === "handshake") {
    return json({ js: { token: "stub", random: "0" } });
  }
  if (type === "stb" && (action === "get_profile" || action === "")) {
    if (!mac) return json({ status: "ERROR" });
    return json({ js: { mac, status: 1, expire_billing_date: "" } });
  }
  if (type === "itv" && action === "get_all_channels") {
    const { data } = await supabaseAdmin
      .from("streams")
      .select("id,name,url,logo,epg_id")
      .eq("type", "live")
      .eq("enabled", true);
    return json({
      js: {
        data: (data ?? []).map((s, i) => ({
          id: String(i + 1),
          name: s.name,
          cmd: s.url,
          logo: s.logo,
          xmltv_id: s.epg_id,
          number: i + 1,
        })),
      },
    });
  }
  return json({ js: {} });
}
