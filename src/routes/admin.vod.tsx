import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Star, Upload, Film, Tv } from "lucide-react";

export const Route = createFileRoute("/admin/vod")({ component: VodPage });

function VodPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">VOD Library</h1>
        <p className="text-sm text-muted-foreground">Movies and TV series management.</p>
      </header>
      <Tabs defaultValue="movies">
        <TabsList>
          <TabsTrigger value="movies"><Film className="size-4 me-1" />Movies</TabsTrigger>
          <TabsTrigger value="series"><Tv className="size-4 me-1" />Series</TabsTrigger>
        </TabsList>
        <TabsContent value="movies" className="mt-6"><MoviesGrid /></TabsContent>
        <TabsContent value="series" className="mt-6"><SeriesGrid /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- MOVIES ---------------- */

function MoviesGrid() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const list = useQuery({
    queryKey: ["vod_movies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vod_movies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["vod_movies"] }); setSelected(new Set()); };

  const delOne = async (id: string) => {
    const { error } = await supabase.from("vod_movies").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); refresh(); }
  };
  const delSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} movie(s)?`)) return;
    const { error } = await supabase.from("vod_movies").delete().in("id", Array.from(selected));
    if (error) toast.error(error.message); else { toast.success(`Deleted ${selected.size}`); refresh(); }
  };

  const allIds = useMemo(() => (list.data ?? []).map((m: any) => m.id), [list.data]);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={allIds.length === 0}>
            {allSelected ? "Unselect all" : "Select all"}
          </Button>
          <Button variant="destructive" size="sm" onClick={delSelected} disabled={selected.size === 0}>
            <Trash2 className="size-4 me-1" />Delete selected ({selected.size})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <BulkMoviesDialog onDone={refresh} />
          <AddMovie onCreated={refresh} />
        </div>
      </div>

      {list.data && list.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No movies yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(list.data ?? []).map((m: any) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="absolute start-2 top-2 z-10">
                <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggleOne(m.id)} className="bg-background/80 backdrop-blur" />
              </div>
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
              <Button
                variant="destructive" size="sm"
                onClick={() => delOne(m.id)}
                className="w-full rounded-none"
              >
                <Trash2 className="size-3.5 me-1" />Delete
              </Button>
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
      <DialogTrigger asChild><Button><Plus className="size-4 me-1" />Add movie</Button></DialogTrigger>
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

function BulkMoviesDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const rows = text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) return { title: parts[0], url: parts[1], poster: parts[2] ?? null, year: parts[3] ? +parts[3] : null };
      return null;
    }).filter(Boolean) as any[];
    if (rows.length === 0) { toast.error("No valid lines"); return; }
    setBusy(true);
    const { error } = await supabase.from("vod_movies").insert(rows);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success(`Imported ${rows.length} movies`); setOpen(false); setText(""); onDone(); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Upload className="size-4 me-1" />Bulk import</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Bulk import movies</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>One per line — format: <code>Title,URL,Poster?,Year?</code></Label>
          <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"The Matrix,https://example.com/matrix.mp4,https://img/poster.jpg,1999\nInception,https://example.com/inception.mkv"} />
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy || !text.trim()}>{busy ? "…" : "Import"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- SERIES ---------------- */

function SeriesGrid() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<any | null>(null);

  const list = useQuery({
    queryKey: ["vod_series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vod_series").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => { qc.invalidateQueries({ queryKey: ["vod_series"] }); setSelected(new Set()); };
  const delOne = async (id: string) => {
    const { error } = await supabase.from("vod_series").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); refresh(); }
  };
  const delSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} series?`)) return;
    const { error } = await supabase.from("vod_series").delete().in("id", Array.from(selected));
    if (error) toast.error(error.message); else { toast.success(`Deleted ${selected.size}`); refresh(); }
  };

  const allIds = useMemo(() => (list.data ?? []).map((s: any) => s.id), [list.data]);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={allIds.length === 0}>
            {allSelected ? "Unselect all" : "Select all"}
          </Button>
          <Button variant="destructive" size="sm" onClick={delSelected} disabled={selected.size === 0}>
            <Trash2 className="size-4 me-1" />Delete selected ({selected.size})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <BulkSeriesDialog onDone={refresh} />
          <AddSeries onCreated={refresh} />
        </div>
      </div>

      {list.data && list.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No series yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(list.data ?? []).map((s: any) => (
            <div key={s.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="absolute start-2 top-2 z-10">
                <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} className="bg-background/80 backdrop-blur" />
              </div>
              <button onClick={() => setActive(s)} className="block w-full text-start">
                <div className="aspect-[2/3] bg-muted">
                  {s.poster ? <img src={s.poster} alt={s.title} className="size-full object-cover transition-transform group-hover:scale-105" />
                    : <div className="flex size-full items-center justify-center text-xs text-muted-foreground">No poster</div>}
                </div>
                <div className="p-2">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.year ?? ""}</div>
                </div>
              </button>
              <Button variant="destructive" size="sm" onClick={() => delOne(s.id)} className="w-full rounded-none">
                <Trash2 className="size-3.5 me-1" />Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      {active && <EpisodesDialog series={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function AddSeries({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", poster: "", description: "", year: 2024, rating: 7.5, genre: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.from("vod_series").insert(f);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Added"); setOpen(false); onCreated(); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4 me-1" />Add series</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New series</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Poster URL</Label><Input value={f.poster} onChange={(e) => setF({ ...f, poster: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Year</Label><Input type="number" value={f.year} onChange={(e) => setF({ ...f, year: +e.target.value })} /></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" value={f.rating} onChange={(e) => setF({ ...f, rating: +e.target.value })} /></div>
            <div><Label>Genre</Label><Input value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy || !f.title}>{busy ? "…" : "Create"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkSeriesDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const rows = text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 1 && parts[0]) return { title: parts[0], poster: parts[1] ?? null, year: parts[2] ? +parts[2] : null };
      return null;
    }).filter(Boolean) as any[];
    if (rows.length === 0) { toast.error("No valid lines"); return; }
    setBusy(true);
    const { error } = await supabase.from("vod_series").insert(rows);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success(`Imported ${rows.length} series`); setOpen(false); setText(""); onDone(); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Upload className="size-4 me-1" />Bulk import</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Bulk import series</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>One per line — format: <code>Title,Poster?,Year?</code></Label>
          <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"Breaking Bad,https://img/bb.jpg,2008\nThe Wire,,2002"} />
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy || !text.trim()}>{busy ? "…" : "Import"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- EPISODES ---------------- */

function EpisodesDialog({ series, onClose }: { series: any; onClose: () => void }) {
  const qc = useQueryClient();
  const eps = useQuery({
    queryKey: ["vod_episodes", series.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vod_episodes").select("*").eq("series_id", series.id).order("season").order("episode");
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["vod_episodes", series.id] });

  const [single, setSingle] = useState({ season: 1, episode: 1, title: "", url: "" });
  const [bulk, setBulk] = useState({ season: 1, text: "" });

  const addOne = async () => {
    if (!single.url) return;
    const { error } = await supabase.from("vod_episodes").insert({ ...single, series_id: series.id });
    if (error) toast.error(error.message);
    else { toast.success("Episode added"); setSingle({ ...single, episode: single.episode + 1, title: "", url: "" }); refresh(); }
  };

  const addBulk = async () => {
    const lines = bulk.text.split("\n").map((l) => l.trim()).filter(Boolean);
    const rows = lines.map((line, i) => {
      const parts = line.split(",").map((p) => p.trim());
      const url = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const title = parts.length > 1 ? parts.slice(0, -1).join(",") : `Episode ${i + 1}`;
      return { series_id: series.id, season: bulk.season, episode: i + 1, title, url };
    }).filter((r) => r.url);
    if (rows.length === 0) { toast.error("No valid lines"); return; }
    const { error } = await supabase.from("vod_episodes").insert(rows);
    if (error) toast.error(error.message);
    else { toast.success(`Imported ${rows.length} episodes`); setBulk({ ...bulk, text: "" }); refresh(); }
  };

  const delEp = async (id: string) => {
    const { error } = await supabase.from("vod_episodes").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); refresh(); }
  };

  const grouped = useMemo(() => {
    const map: Record<number, any[]> = {};
    (eps.data ?? []).forEach((e: any) => { (map[e.season] ||= []).push(e); });
    return map;
  }, [eps.data]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{series.title} — Episodes</DialogTitle></DialogHeader>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Episodes</TabsTrigger>
            <TabsTrigger value="add">Add one</TabsTrigger>
            <TabsTrigger value="bulk">Bulk import</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4 space-y-4">
            {Object.keys(grouped).length === 0 && <div className="text-sm text-muted-foreground">No episodes yet.</div>}
            {Object.entries(grouped).map(([season, items]) => (
              <div key={season}>
                <div className="mb-2 text-sm font-semibold">Season {season}</div>
                <div className="space-y-1">
                  {items.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">S{e.season}E{e.episode}</span>
                      <span className="flex-1 truncate">{e.title || "—"}</span>
                      <span className="hidden truncate text-xs text-muted-foreground sm:inline max-w-[40%]">{e.url}</span>
                      <Button variant="destructive" size="sm" onClick={() => delEp(e.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="add" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Season</Label><Input type="number" value={single.season} onChange={(e) => setSingle({ ...single, season: +e.target.value })} /></div>
              <div><Label>Episode</Label><Input type="number" value={single.episode} onChange={(e) => setSingle({ ...single, episode: +e.target.value })} /></div>
            </div>
            <div><Label>Title</Label><Input value={single.title} onChange={(e) => setSingle({ ...single, title: e.target.value })} /></div>
            <div><Label>Stream URL</Label><Input value={single.url} onChange={(e) => setSingle({ ...single, url: e.target.value })} /></div>
            <Button onClick={addOne} disabled={!single.url}><Plus className="size-4 me-1" />Add episode</Button>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 space-y-3">
            <div><Label>Season number</Label><Input type="number" value={bulk.season} onChange={(e) => setBulk({ ...bulk, season: +e.target.value })} /></div>
            <div>
              <Label>One per line — <code>Title,URL</code> or just <code>URL</code></Label>
              <Textarea rows={10} value={bulk.text} onChange={(e) => setBulk({ ...bulk, text: e.target.value })}
                placeholder={"Pilot,https://example.com/s1e1.mp4\nCat in the Bag,https://example.com/s1e2.mp4"} />
            </div>
            <Button onClick={addBulk} disabled={!bulk.text.trim()}><Upload className="size-4 me-1" />Import episodes</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
