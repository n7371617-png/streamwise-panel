import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/logs")({ component: LogsPage });

function LogsPage() {
  const list = useQuery({
    queryKey: ["user_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_logs")
        .select("*, iptv_users(username)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Activity logs</h1>
        <p className="text-sm text-muted-foreground">Recent connections and actions.</p>
      </header>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">When</th>
              <th className="px-4 py-3 text-start">User</th>
              <th className="px-4 py-3 text-start">Action</th>
              <th className="px-4 py-3 text-start">IP</th>
              <th className="px-4 py-3 text-start">Agent</th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((l: any) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{l.iptv_users?.username ?? "—"}</td>
                <td className="px-4 py-3">{l.action}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.ip ?? "—"}</td>
                <td className="px-4 py-3 max-w-xs truncate text-xs text-muted-foreground">{l.user_agent ?? "—"}</td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
