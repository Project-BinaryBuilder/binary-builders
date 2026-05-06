import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { GRADES } from "@/lib/auth-helpers";
import { toast } from "sonner";
import { Plus, Trash2, Settings2, Play, Square } from "lucide-react";

interface Exam { id: string; title: string; description: string | null; grade: number; is_active: boolean; created_at: string; }

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => supabase.from("exams").select("*").order("created_at", { ascending: false }).then(({ data }) => setExams((data ?? []) as Exam[]));
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !grade) return toast.error("Title + grade required");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("exams").insert({ title, description: description || null, grade: parseInt(grade), created_by: user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Exam created");
    setTitle(""); setDescription(""); setGrade(""); setShowForm(false); load();
  };

  const toggle = async (ex: Exam) => {
    const next = !ex.is_active;
    const payload = next ? { is_active: true, started_at: new Date().toISOString(), ended_at: null } : { is_active: false, ended_at: new Date().toISOString() };
    const { error } = await supabase.from("exams").update(payload).eq("id", ex.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Exam started" : "Exam ended");
    load();
  };

  const remove = async (ex: Exam) => {
    if (!confirm("Delete this exam and its results?")) return;
    const { error } = await supabase.from("exams").delete().eq("id", ex.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <AdminLayout title="Examinations">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Create MCQ exams, start/end sessions, and view results. Students never see results after submission.</p>
        {!showForm && <Button onClick={() => setShowForm(true)} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> New exam</Button>}
      </div>

      {showForm && (
        <form onSubmit={create} className="rounded-3xl bg-card border border-border/60 p-6 mb-8 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={grade} onValueChange={setGrade}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="flex gap-2"><Button type="submit" disabled={busy} className="rounded-full">{busy ? "Saving…" : "Create exam"}</Button><Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </form>
      )}

      <div className="space-y-3">
        {exams.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border/60 p-12 text-center text-muted-foreground">No exams yet.</div>
        ) : exams.map((ex) => (
          <article key={ex.id} className="p-5 rounded-3xl bg-card border border-border/60 shadow-soft flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Grade {ex.grade}</span>
                {ex.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">LIVE</span>}
              </div>
              <h2 className="text-xl font-bold mb-1">{ex.title}</h2>
              {ex.description && <p className="text-foreground/80 text-sm">{ex.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button asChild size="sm" variant="outline" className="rounded-full"><Link to={`/admin/exams/${ex.id}`}><Settings2 className="h-4 w-4 mr-1" /> Manage</Link></Button>
              <Button size="sm" onClick={() => toggle(ex)} className="rounded-full" variant={ex.is_active ? "destructive" : "default"}>
                {ex.is_active ? <><Square className="h-4 w-4 mr-1" /> End</> : <><Play className="h-4 w-4 mr-1" /> Start</>}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(ex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminExams;
