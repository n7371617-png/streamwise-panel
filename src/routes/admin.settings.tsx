import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["server_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("server_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState({ domain: "", site_name: "", http_port: 443, https_port: 443, rtmp_port: 8880 });
  useEffect(() => { if (q.data) setF(q.data as any); }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("server_settings").update(f).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["server_settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Hosting & server settings</h1>
        <p className="text-sm text-muted-foreground">Domain, ports and global branding. These power the Xtream API and portal URLs.</p>
      </header>
      <div className="grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
        <div className="md:col-span-2"><Label>Site name</Label><Input value={f.site_name} onChange={(e) => setF({ ...f, site_name: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Domain / IP</Label><Input value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder="iptv.example.com" /></div>
        <div><Label>HTTP port</Label><Input type="number" value={f.http_port} onChange={(e) => setF({ ...f, http_port: +e.target.value })} /></div>
        <div><Label>HTTPS port (default 443)</Label><Input type="number" value={f.https_port} onChange={(e) => setF({ ...f, https_port: +e.target.value })} /></div>
        <div><Label>RTMP port</Label><Input type="number" value={f.rtmp_port} onChange={(e) => setF({ ...f, rtmp_port: +e.target.value })} /></div>
        <div className="md:col-span-2 flex justify-end"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button></div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 font-semibold">Deployment</h3>
        <p className="text-sm text-muted-foreground">A production-ready <code>docker-compose.yml</code>, <code>Dockerfile</code> and <code>nginx.conf</code> are included at the repo root for VPS deployment behind HTTPS on port 443.</p>
      </div>
    </div>
  );
}
