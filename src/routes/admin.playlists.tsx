import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/admin/playlists")({ component: PlaylistsPage });

type Parsed = { name: string; url: string; logo?: string; group?: string; tvgId?: string };

function parseM3U(text: string): Parsed[] {
  const lines = text.split(/\r?\n/);
  const out: Parsed[] = [];
  let pending: Partial<Parsed> | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF")) {
      const name = line.split(",").slice(1).join(",").trim();
      const logo = /tvg-logo="([^"]+)"/i.exec(line)?.[1];
      const group = /group-title="([^"]+)"/i.exec(line)?.[1];
      const tvgId = /tvg-id="([^"]+)"/i.exec(line)?.[1];
      pending = { name, logo, group, tvgId };
    } else if (!line.startsWith("#") && pending) {
      out.push({ ...(pending as Parsed), url: line });
      pending = null;
    }
  }
  return out;
}

function PlaylistsPage() {
  const [text, setText] = useState("");
  const [defaultGroup, setDefaultGroup] = useState("Imported");
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<Parsed[]>([]);

  const doParse = () => {
    const p = parseM3U(text);
    setParsed(p);
    toast.success(`Parsed ${p.length} channels`);
  };

  const doImport = async () => {
    if (!parsed.length) return;
    setBusy(true);
    try {
      // Build category map
      const groups = Array.from(new Set(parsed.map((p) => p.group || defaultGroup)));
      const { data: existing } = await supabase.from("categories").select("id,name").in("name", groups);
      const map = new Map<string, string>();
      (existing ?? []).forEach((c: any) => map.set(c.name, c.id));
      const missing = groups.filter((g) => !map.has(g));
      if (missing.length) {
        const { data: inserted, error } = await supabase
          .from("categories").insert(missing.map((name) => ({ name, type: "live" }))).select("id,name");
        if (error) throw error;
        (inserted ?? []).forEach((c: any) => map.set(c.name, c.id));
      }
      // Insert streams in chunks
      const rows = parsed.map((p) => ({
        name: p.name,
        url: p.url,
        logo: p.logo,
        tvg_name: p.name,
        epg_id: p.tvgId,
        type: "live" as const,
        category_id: map.get(p.group || defaultGroup),
      }));
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase.from("streams").insert(chunk);
        if (error) throw error;
      }
      toast.success(`Imported ${rows.length} streams`);
      setParsed([]); setText("");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setText(await f.text());
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Playlists</h1>
        <p className="text-sm text-muted-foreground">Upload or paste an M3U playlist. Categories are created from <code>group-title</code>.</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-64">
            <Label>Default group (fallback)</Label>
            <Input value={defaultGroup} onChange={(e) => setDefaultGroup(e.target.value)} />
          </div>
          <label className="inline-flex">
            <input type="file" accept=".m3u,.m3u8,text/plain" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            <Button variant="outline" asChild><span><Upload className="size-4" />Choose .m3u file</span></Button>
          </label>
        </div>
        <Textarea
          className="h-64 font-mono text-xs"
          placeholder="#EXTM3U..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={doParse} disabled={!text}>Parse</Button>
          <Button onClick={doImport} disabled={!parsed.length || busy}>{busy ? "Importing…" : `Import ${parsed.length} channels`}</Button>
        </div>
      </div>

      {parsed.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-4 text-sm text-muted-foreground">Preview (first 50):</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2 text-start">Name</th><th className="px-4 py-2 text-start">Group</th><th className="px-4 py-2 text-start">URL</th></tr>
            </thead>
            <tbody>
              {parsed.slice(0, 50).map((p, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.group || defaultGroup}</td>
                  <td className="px-4 py-2 truncate max-w-xs text-xs text-muted-foreground">{p.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
