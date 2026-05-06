import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";

interface Notice { id: string; title: string; body: string; created_at: string; }

const AdminNotices = () => {
  const [items, setItems] = useState<Notice[]>([]);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => supabase.from("notices").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  useEffect(() => { load(); }, []);

  const open = (n?: Notice) => {
    setEditing(n ?? null);
    setTitle(n?.title ?? "");
    setBody(n?.body ?? "");
    setShowForm(true);
  };
  const reset = () => { setShowForm(false); setEditing(null); setTitle(""); setBody(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return toast.error("Title and body required");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = editing
      ? await supabase.from("notices").update({ title, body }).eq("id", editing.id)
      : await supabase.from("notices").insert({ title, body, created_by: user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Published");
    reset(); load();
  };

  const remove = async (n: Notice) => {
    if (!confirm("Delete this notice?")) return;
    const { error } = await supabase.from("notices").delete().eq("id", n.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <AdminLayout title="Notices">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Publish announcements visible on the public Notices page.</p>
        {!showForm && <Button onClick={() => open()} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> New notice</Button>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-3xl bg-card border border-border/60 p-6 mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">{editing ? "Edit notice" : "New notice"}</h2>
            <Button type="button" size="icon" variant="ghost" onClick={reset}><X className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} required /></div>
          <Button type="submit" disabled={busy} className="rounded-full">{busy ? "Saving…" : editing ? "Save changes" : "Publish notice"}</Button>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border/60 p-12 text-center text-muted-foreground">No notices yet.</div>
        ) : items.map((n) => (
          <article key={n.id} className="p-5 rounded-3xl bg-card border border-border/60 shadow-soft">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{new Date(n.created_at).toLocaleDateString()}</div>
                <h2 className="text-xl font-bold mb-1">{n.title}</h2>
                <p className="text-foreground/80 whitespace-pre-wrap text-sm">{n.body}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" onClick={() => open(n)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(n)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminNotices;
