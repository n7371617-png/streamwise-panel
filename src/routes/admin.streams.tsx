import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/streams")({ component: StreamsPage });

function StreamsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const list = useQuery({
    queryKey: ["streams", q],
    queryFn: async () => {
      let qb = supabase
        .from("streams")
        .select("*, categories(name)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (q) qb = qb.ilike("name", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("streams").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["streams"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("streams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["streams"] }); },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Streams</h1>
          <p className="text-sm text-muted-foreground">All live channels parsed from your playlists.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="ps-9 w-64" placeholder="Search channel" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">Channel</th>
              <th className="px-4 py-3 text-start">Category</th>
              <th className="px-4 py-3 text-start">Type</th>
              <th className="px-4 py-3 text-start">URL</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((s: any) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {s.logo && <img src={s.logo} alt="" className="size-8 rounded object-cover" />}
                    <div>
                      <div className="font-medium">{s.name}</div>
                      {s.epg_id && <div className="text-xs text-muted-foreground">EPG: {s.epg_id}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.categories?.name ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline">{s.type}</Badge></td>
                <td className="px-4 py-3 max-w-xs truncate text-xs text-muted-foreground">{s.url}</td>
                <td className="px-4 py-3 text-end">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant={s.enabled ? "outline" : "default"}
                      onClick={() => toggle.mutate({ id: s.id, enabled: !s.enabled })}>
                      {s.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(s.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No streams yet. Import a playlist.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
