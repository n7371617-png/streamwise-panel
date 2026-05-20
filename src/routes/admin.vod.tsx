import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/admin/vod")({ component: VodPage });

function VodPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">VOD Library</h1>
        <p className="text-sm text-muted-foreground">Movies and TV series — Netflix-style.</p>
      </header>
      <Tabs defaultValue="movies">
        <TabsList>
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
        </TabsList>
        <TabsContent value="movies" className="mt-6"><MoviesGrid /></TabsContent>
        <TabsContent value="series" className="mt-6"><SeriesGrid /></TabsContent>
      </Tabs>
    </div>
  );
}

function MoviesGrid() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["vod_movies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vod_movies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("vod_movies").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["vod_movies"] }); },
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><AddMovie onCreated={() => qc.invalidateQueries({ queryKey: ["vod_movies"] })} /></div>
      {list.data && list.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No movies yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(list.data ?? []).map((m: any) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-[2/3] bg-muted">
                {m.poster ? <img src={m.poster} alt={m.title} className="size-full object-cover transition-transform group-hover:scale-105" />
                  : <div className="flex size-full items-center justify-center text-xs text-muted-foreground">No poster</div>}
              </div>
              <div className="p-2">
                <div className="truncate text-sm font-medium">{m.title}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.year ?? ""}</span>
                  {m.rating != null && <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-warning text-warning" />{m.rating}</span>}
                </div>
              </div>
              <button onClick={() => del.mutate(m.id)} className="absolute end-2 top-2 hidden rounded-md bg-background/80 p-1 backdrop-blur group-hover:block">
                <Trash2 className="size-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddMovie({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", poster: "", url: "", year: 2024, rating: 7.5, genre: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.from("vod_movies").insert(f);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Added"); setOpen(false); onCreated(); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" />Add movie</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New movie</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Poster URL</Label><Input value={f.poster} onChange={(e) => setF({ ...f, poster: e.target.value })} /></div>
          <div><Label>Stream URL</Label><Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Year</Label><Input type="number" value={f.year} onChange={(e) => setF({ ...f, year: +e.target.value })} /></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" value={f.rating} onChange={(e) => setF({ ...f, rating: +e.target.value })} /></div>
            <div><Label>Genre</Label><Input value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy || !f.title || !f.url}>{busy ? "…" : "Create"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SeriesGrid() {
  const list = useQuery({
    queryKey: ["vod_series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vod_series").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div>
      {list.data && list.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No series yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(list.data ?? []).map((s: any) => (
            <div key={s.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-[2/3] bg-muted">
                {s.poster && <img src={s.poster} alt={s.title} className="size-full object-cover" />}
              </div>
              <div className="p-2 text-sm font-medium truncate">{s.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
