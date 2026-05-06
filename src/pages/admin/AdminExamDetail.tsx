import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";

interface Exam { id: string; title: string; grade: number; is_active: boolean; }
interface Q { id: string; q_position: number; prompt: string; choices: string[]; correct_index: number; }
interface Attempt { id: string; student_id: string; score: number | null; total: number | null; submitted_at: string | null; }

const AdminExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: ex } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
    setExam(ex as Exam);
    const { data: qs } = await supabase.from("exam_questions").select("*").eq("exam_id", id).order("q_position");
    setQuestions((qs ?? []).map((q) => ({ ...q, choices: q.choices as string[] })) as Q[]);
    const { data: at } = await supabase.from("exam_attempts").select("*").eq("exam_id", id).order("submitted_at", { ascending: false });
    setAttempts((at ?? []) as Attempt[]);
    const ids = (at ?? []).map((a) => a.student_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, full_name").in("id", ids);
      setProfilesMap(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name || p.username])));
    }
  };
  useEffect(() => { load(); }, [id]);

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = choices.map((c) => c.trim()).filter(Boolean);
    if (!prompt || cleaned.length < 2) return toast.error("Prompt + 2+ choices");
    if (correct >= cleaned.length) return toast.error("Pick a valid correct choice");
    setBusy(true);
    const { error } = await supabase.from("exam_questions").insert({
      exam_id: id, q_position: questions.length, prompt, choices: cleaned, correct_index: correct,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Question added");
    setPrompt(""); setChoices(["", "", "", ""]); setCorrect(0); load();
  };

  const removeQ = async (qid: string) => {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("exam_questions").delete().eq("id", qid);
    if (error) return toast.error(error.message);
    load();
  };

  if (!exam) return <AdminLayout title="Loading…"><div /></AdminLayout>;

  return (
    <AdminLayout title={exam.title}>
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/admin/exams"><ArrowLeft className="h-4 w-4 mr-2" /> All exams</Link></Button>
      <div className="text-sm text-muted-foreground mb-8">Grade {exam.grade} · {exam.is_active ? <span className="text-success font-semibold">LIVE</span> : "not started"}</div>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Questions ({questions.length})</h2>
        <div className="space-y-3 mb-5">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-2xl bg-card border border-border/60">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="font-semibold mb-2">{idx + 1}. {q.prompt}</div>
                  <ul className="space-y-1 text-sm">
                    {q.choices.map((c, i) => (
                      <li key={i} className={i === q.correct_index ? "text-success font-semibold flex items-center gap-1" : ""}>
                        {i === q.correct_index && <Check className="h-3 w-3" />} {String.fromCharCode(65 + i)}. {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeQ(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={addQuestion} className="rounded-3xl bg-card border border-border/60 p-5 space-y-4">
          <div className="space-y-2"><Label>Prompt</Label><Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} required /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            {choices.map((c, i) => (
              <div key={i} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} />
                  Choice {String.fromCharCode(65 + i)} {correct === i && <span className="text-success text-xs">(correct)</span>}
                </Label>
                <Input value={c} onChange={(e) => setChoices((arr) => arr.map((x, j) => (i === j ? e.target.value : x)))} />
              </div>
            ))}
          </div>
          <Button type="submit" disabled={busy} className="rounded-full"><Plus className="h-4 w-4 mr-2" />{busy ? "Adding…" : "Add question"}</Button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Results ({attempts.filter((a) => a.submitted_at).length} submitted)</h2>
        <div className="rounded-3xl bg-card border border-border/60 overflow-hidden">
          {attempts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No attempts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left p-3">Student</th><th className="text-left p-3">Score</th><th className="text-left p-3">Submitted</th></tr></thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-border/40">
                    <td className="p-3 font-medium">{profilesMap[a.student_id] ?? a.student_id.slice(0, 8)}</td>
                    <td className="p-3">{a.submitted_at ? `${a.score}/${a.total}` : "in progress"}</td>
                    <td className="p-3 text-muted-foreground">{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminExamDetail;
