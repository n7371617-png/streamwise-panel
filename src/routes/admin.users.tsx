import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Ban, Trash2, Power } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function rand(len: number) {
  const c = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

function UsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const list = useQuery({
    queryKey: ["iptv_users", q],
    queryFn: async () => {
      let qb = supabase.from("iptv_users").select("*").order("created_at", { ascending: false }).limit(500);
      if (q) qb = qb.ilike("username", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (form: {
      username: string; password: string; max_connections: number; days: number; is_trial: boolean;
    }) => {
      const expire = new Date(Date.now() + form.days * 86400000).toISOString();
      const { error } = await supabase.from("iptv_users").insert({
        username: form.username,
        password: form.password,
        max_connections: form.max_connections,
        is_trial: form.is_trial,
        expire_at: expire,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscriber created");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["iptv_users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "disabled" | "banned" | "expired" }) => {
      const { error } = await supabase.from("iptv_users").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["iptv_users"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("iptv_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["iptv_users"] });
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Subscribers</h1>
          <p className="text-sm text-muted-foreground">Create and manage IPTV accounts.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="ps-9 w-64" placeholder="Search by username" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" />New</Button></DialogTrigger>
            <CreateUserDialog onSubmit={(d) => create.mutate(d)} loading={create.isPending} />
          </Dialog>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">Username</th>
              <th className="px-4 py-3 text-start">Password</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-start">Connections</th>
              <th className="px-4 py-3 text-start">Expires</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((u: any) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{u.username}{u.is_trial && <Badge variant="outline" className="ms-2">trial</Badge>}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.password}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      u.status === "active" ? "border-success/40 text-success"
                      : u.status === "banned" ? "border-destructive/40 text-destructive"
                      : "border-warning/40 text-warning"
                    }
                  >{u.status}</Badge>
                </td>
                <td className="px-4 py-3">{u.max_connections}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.expire_at ? new Date(u.expire_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-end">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: u.id, status: u.status === "active" ? "disabled" : "active" })}>
                      <Power className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: u.id, status: "banned" })}>
                      <Ban className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(u.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No subscribers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUserDialog({ onSubmit, loading }: { onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({
    username: `user_${rand(6)}`,
    password: rand(10),
    max_connections: 1,
    days: 30,
    is_trial: false,
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New subscriber</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
        <div><Label>Password</Label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Connections</Label><Input type="number" min={1} value={form.max_connections} onChange={(e) => setForm({ ...form, max_connections: +e.target.value })} /></div>
          <div><Label>Duration (days)</Label><Input type="number" min={1} value={form.days} onChange={(e) => setForm({ ...form, days: +e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_trial} onChange={(e) => setForm({ ...form, is_trial: e.target.checked })} />
          Trial account
        </label>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(form)} disabled={loading}>{loading ? "Creating…" : "Create"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
