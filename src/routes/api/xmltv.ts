import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/xmltv")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
    },
  },
});

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><tv></tv>", {
      status: 401,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const { data: streams } = await supabaseAdmin
    .from("streams")
    .select("name,epg_id,logo")
    .eq("enabled", true)
    .limit(10000);

  const channels = (streams ?? [])
    .filter((s) => s.epg_id)
    .map(
      (s) =>
        `  <channel id="${esc(s.epg_id!)}"><display-name>${esc(
          s.name,
        )}</display-name>${s.logo ? `<icon src="${esc(s.logo)}"/>` : ""}</channel>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv generator-info-name="IPTV Platform">\n${channels}\n</tv>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
