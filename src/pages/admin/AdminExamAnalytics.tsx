import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface Exam { id: string; title: string; grade: number; }
interface Attempt { id: string; score: number | null; total: number | null; submitted_at: string | null; }
interface Q { id: string; prompt: string; correct_index: number; choices: unknown; }
interface Ans { question_id: string; selected_index: number; is_correct: boolean | null; }

const AdminExamAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Ans[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("exams").select("id, title, grade").eq("id", id).maybeSingle().then(({ data }) => setExam(data as Exam | null));
    supabase.from("exam_attempts").select("*").eq("exam_id", id).not("submitted_at", "is", null).then(({ data }) => setAttempts((data ?? []) as Attempt[]));
    supabase.from("exam_questions").select("id, prompt, correct_index, choices").eq("exam_id", id).order("q_position").then(({ data }) => setQuestions((data ?? []) as Q[]));
  }, [id]);

  useEffect(() => {
    if (attempts.length === 0) { setAnswers([]); return; }
    const ids = attempts.map((a) => a.id);
    supabase.from("exam_answers").select("question_id, selected_index, is_correct").in("attempt_id", ids)
      .then(({ data }) => setAnswers((data ?? []) as Ans[]));
  }, [attempts]);

  const submitted = attempts.filter((a) => a.score !== null && a.total !== null);
  const totalAttempts = submitted.length;
  const passThreshold = 0.5;
  const passes = submitted.filter((a) => (a.score! / Math.max(a.total!, 1)) >= passThreshold).length;
  const passRate = totalAttempts ? Math.round((passes / totalAttempts) * 100) : 0;
  const avgPct = totalAttempts
    ? Math.round((submitted.reduce((s, a) => s + (a.score! / Math.max(a.total!, 1)), 0) / totalAttempts) * 100)
    : 0;

  const perQ = questions.map((q) => {
    const qa = answers.filter((a) => a.question_id === q.id);
    const correct = qa.filter((a) => a.is_correct).length;
    const pct = qa.length ? Math.round((correct / qa.length) * 100) : 0;
    return { ...q, attempts: qa.length, correct, pct };
  });

  return (
    <AdminLayout title="Exam Analytics">
      <Button asChild variant="ghost" size="sm" className="mb-4 rounded-full"><Link to="/admin/exams"><ChevronLeft className="h-4 w-4 mr-1" />Back to exams</Link></Button>
      <h2 className="text-xl font-bold mb-1">{exam?.title}</h2>
      <p className="text-sm text-muted-foreground mb-6">Grade {exam?.grade} · {totalAttempts} submissions</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Submissions" value={String(totalAttempts)} />
        <Stat label="Pass rate (≥50%)" value={`${passRate}%`} />
        <Stat label="Average score" value={`${avgPct}%`} />
      </div>

      <div className="rounded-3xl bg-card border border-border/60 p-6 mb-8">
        <h3 className="font-bold mb-4">Per-question performance</h3>
        {perQ.length === 0 ? <p className="text-sm text-muted-foreground">No questions.</p> : (
          <div className="space-y-4">
            {perQ.map((q, i) => (
              <div key={q.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="truncate pr-4"><span className="font-semibold mr-2">Q{i + 1}.</span>{q.prompt}</span>
                  <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{q.correct}/{q.attempts} · {q.pct}%</span>
                </div>
                <Progress value={q.pct} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-card border border-border/60 p-6">
        <h3 className="font-bold mb-4">Score distribution</h3>
        {totalAttempts === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[0, 20, 40, 60, 80].map((b) => {
              const n = submitted.filter((a) => {
                const p = (a.score! / Math.max(a.total!, 1)) * 100;
                return p >= b && p < b + 20;
              }).length;
              const h = Math.max(8, (n / Math.max(totalAttempts, 1)) * 120);
              return (
                <div key={b}>
                  <div className="bg-primary/15 rounded-2xl flex items-end justify-center" style={{ height: 130 }}>
                    <div className="bg-primary w-full rounded-2xl" style={{ height: h }} />
                  </div>
                  <div className="mt-1.5 text-muted-foreground">{b}-{b + 19}%</div>
                  <div className="font-semibold">{n}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-3xl bg-card border border-border/60 p-5">
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
  </div>
);

export default AdminExamAnalytics;
