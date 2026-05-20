import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/admin/resellers")({ component: ResellersPage });

function ResellersPage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["resellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resellers")
        .select("*, profiles:user_id(email, display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const adjust = useMutation({
    mutationFn: async ({ id, delta, reason }: { id: string; delta: number; reason: string }) => {
      const { data: r, error: e1 } = await supabase.from("resellers").select("credits").eq("id", id).single();
      if (e1) throw e1;
      const next = (r?.credits ?? 0) + delta;
      const { error: e2 } = await supabase.from("resellers").update({ credits: next }).eq("id", id);
      if (e2) throw e2;
      await supabase.from("credit_transactions").insert({ reseller_id: id, amount: delta, reason });
    },
    onSuccess: () => {
      toast.success("Credits updated");
      qc.invalidateQueries({ queryKey: ["resellers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resellers</h1>
          <p className="text-sm text-muted-foreground">Manage reseller credits and permissions.</p>
        </div>
        <CreateResellerButton onCreated={() => qc.invalidateQueries({ queryKey: ["resellers"] })} />
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">Reseller</th>
              <th className="px-4 py-3 text-start">Credits</th>
              <th className="px-4 py-3 text-start">Sales</th>
              <th className="px-4 py-3 text-start">Trials</th>
              <th className="px-4 py-3 text-end">Credits</th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.profiles?.display_name ?? r.profiles?.email}</div>
                  <div className="text-xs text-muted-foreground">{r.profiles?.email}</div>
                </td>
                <td className="px-4 py-3 font-semibold">{r.credits}</td>
                <td className="px-4 py-3">{r.total_sales}</td>
                <td className="px-4 py-3">
                  {r.can_create_trials ? <Badge className="bg-success/15 text-success">Allowed</Badge> : <Badge variant="outline">Disabled</Badge>}
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => adjust.mutate({ id: r.id, delta: 10, reason: "Top-up" })}><Plus className="size-4" />10</Button>
                    <Button size="sm" variant="outline" onClick={() => adjust.mutate({ id: r.id, delta: -10, reason: "Adjust" })}><Minus className="size-4" />10</Button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No resellers yet. Promote a user below.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateResellerButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState(100);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const { data: prof, error } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
      if (error) throw error;
      if (!prof) throw new Error("No user found with that email. Ask them to sign up first.");
      const { error: r1 } = await supabase.from("user_roles").insert({ user_id: prof.id, role: "reseller" });
      if (r1 && !r1.message.includes("duplicate")) throw r1;
      const { error: r2 } = await supabase.from("resellers").insert({ user_id: prof.id, credits });
      if (r2) throw r2;
      toast.success("Reseller created");
      setOpen(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" />Add reseller</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Promote user to reseller</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>User email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" /></div>
          <div><Label>Starting credits</Label><Input type="number" value={credits} onChange={(e) => setCredits(+e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading || !email}>{loading ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
