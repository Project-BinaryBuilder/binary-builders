import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface Q { id: string; q_position: number; prompt: string; choices: string[]; }

const StudentExam = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [exam, setExam] = useState<{ title: string; description: string | null } | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: ex } = await supabase.from("exams").select("title, description").eq("id", id).maybeSingle();
      setExam(ex);
      const { data: done } = await supabase.rpc("has_submitted", { _exam_id: id });
      if (done) { setSubmitted(true); setLoading(false); return; }
      const { data: qs, error } = await supabase.rpc("get_exam_for_student", { _exam_id: id });
      if (error) { toast.error(error.message); nav("/student"); return; }
      setQuestions((qs ?? []).map((q: { id: string; q_position: number; prompt: string; choices: unknown }) => ({ ...q, choices: q.choices as string[] })));
      setLoading(false);
    })();
  }, [id, nav]);

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm("Some questions are unanswered. Submit anyway?")) return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("submit_exam_attempt", { _exam_id: id!, _answers: answers });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSubmitted(true);
  };

  if (loading) return <DashboardShell title="Loading exam…" badge="Student"><div /></DashboardShell>;

  if (submitted) return (
    <DashboardShell title={exam?.title ?? "Exam"} badge="Student">
      <div className="rounded-3xl bg-card border border-border/60 p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 text-success mx-auto mb-4 flex items-center justify-center"><CheckCircle2 className="h-10 w-10" /></div>
        <h2 className="text-2xl font-bold mb-2">Submitted!</h2>
        <p className="text-muted-foreground mb-6">Your responses have been recorded. Results are not shown to students.</p>
        <Button onClick={() => nav("/student")} className="rounded-full">Back to dashboard</Button>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell title={exam?.title ?? "Exam"} badge="Student">
      {exam?.description && <p className="text-muted-foreground mb-6">{exam.description}</p>}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="p-5 rounded-3xl bg-card border border-border/60 shadow-soft">
            <div className="font-semibold mb-3">{idx + 1}. {q.prompt}</div>
            <div className="grid gap-2">
              {q.choices.map((c, i) => (
                <label key={i} className={`p-3 rounded-2xl border cursor-pointer transition-colors flex items-center gap-3 ${answers[q.id] === i ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted"}`}>
                  <input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))} className="accent-primary" />
                  <span className="font-semibold text-sm w-6">{String.fromCharCode(65 + i)}.</span>
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={submit} disabled={busy || questions.length === 0} className="rounded-full" size="lg">{busy ? "Submitting…" : "Submit exam"}</Button>
      </div>
    </DashboardShell>
  );
};

export default StudentExam;
