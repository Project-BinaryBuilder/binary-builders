import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";

interface Evt { id: string; title: string; description: string | null; event_date: string | null; }

const AdminEvents = () => {
  const [items, setItems] = useState<Evt[]>([]);
  const [editing, setEditing] = useState<Evt | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => supabase.from("events").select("*").order("event_date", { ascending: true }).then(({ data }) => setItems(data ?? []));
  useEffect(() => { load(); }, []);

  const open = (e?: Evt) => {
    setEditing(e ?? null);
    setTitle(e?.title ?? "");
    setDescription(e?.description ?? "");
    setEventDate(e?.event_date ? e.event_date.slice(0, 16) : "");
    setShowForm(true);
  };
  const reset = () => { setShowForm(false); setEditing(null); setTitle(""); setDescription(""); setEventDate(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error("Title required");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { title, description: description || null, event_date: eventDate ? new Date(eventDate).toISOString() : null };
    const { error } = editing
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert({ ...payload, created_by: user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Created");
    reset(); load();
  };

  const remove = async (ev: Evt) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <AdminLayout title="Events">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Schedule school events shown on the public Events page.</p>
        {!showForm && <Button onClick={() => open()} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> New event</Button>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-3xl bg-card border border-border/60 p-6 mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">{editing ? "Edit event" : "New event"}</h2>
            <Button type="button" size="icon" variant="ghost" onClick={reset}><X className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Date & time</Label><Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></div>
          <Button type="submit" disabled={busy} className="rounded-full">{busy ? "Saving…" : editing ? "Save changes" : "Create event"}</Button>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border/60 p-12 text-center text-muted-foreground">No events scheduled.</div>
        ) : items.map((ev) => (
          <article key={ev.id} className="p-5 rounded-3xl bg-card border border-border/60 shadow-soft flex justify-between gap-4">
            <div>
              {ev.event_date && <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{new Date(ev.event_date).toLocaleString()}</div>}
              <h2 className="text-xl font-bold mb-1">{ev.title}</h2>
              {ev.description && <p className="text-foreground/80 text-sm">{ev.description}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button size="icon" variant="ghost" onClick={() => open(ev)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(ev)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
