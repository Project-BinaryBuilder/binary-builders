import { useEffect, useState } from "react";
import { BookOpen, BarChart3, Users, FileText, Eye } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PdfViewer } from "@/components/PdfViewer";

interface Pdf { id: string; title: string; description: string | null; grade: number; file_path: string; }
interface Attempt { id: string; score: number | null; total: number | null; submitted_at: string | null; exam: { title: string; grade: number } | null; }

const TeacherDashboard = () => {
  const { profile } = useAuth();
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [viewing, setViewing] = useState<Pdf | null>(null);

  useEffect(() => {
    supabase.from("content_pdfs").select("id, title, description, grade, file_path").eq("audience", "teacher").order("grade").then(({ data }) => setPdfs((data ?? []) as Pdf[]));
    supabase.from("exam_attempts").select("id, score, total, submitted_at, exam:exams(title, grade)").not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(20).then(({ data }) => setAttempts((data ?? []) as unknown as Attempt[]));
  }, []);

  const range = profile?.class_range_min && profile?.class_range_max
    ? `Grades ${profile.class_range_min}–${profile.class_range_max}` : "Your assigned classes";

  return (
    <DashboardShell title={`Welcome, ${profile?.full_name || profile?.username || "Teacher"}`} badge="Teacher">
      <p className="text-muted-foreground mb-8">{range}</p>

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><BookOpen className="h-5 w-5" /></div>
            <h3 className="font-bold text-lg">Teacher Materials</h3>
          </div>
          {pdfs.length === 0 ? <p className="text-sm text-muted-foreground">No PDFs available for your assigned grades.</p> : (
            <div className="space-y-2">
              {pdfs.map((p) => (
                <button key={p.id} onClick={() => setViewing(p)} className="w-full text-left p-3 rounded-2xl border border-border/40 hover:bg-muted transition-colors flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.title} <span className="text-xs text-muted-foreground">· Grade {p.grade}</span></div>
                    {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-fun/10 text-fun flex items-center justify-center"><BarChart3 className="h-5 w-5" /></div>
            <h3 className="font-bold text-lg">Recent Exam Results</h3>
          </div>
          {attempts.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : (
            <div className="space-y-2 text-sm">
              {attempts.map((a) => (
                <div key={a.id} className="flex justify-between p-2 border-b border-border/40 last:border-0">
                  <span>{a.exam?.title} <span className="text-xs text-muted-foreground">Grade {a.exam?.grade}</span></span>
                  <span className="font-semibold">{a.score}/{a.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center"><Users className="h-5 w-5" /></div>
          <div><h3 className="font-bold text-lg">Your Classes</h3><p className="text-sm text-muted-foreground">{range}</p></div>
        </div>
      </div>

      <PdfViewer open={!!viewing} onOpenChange={(v) => !v && setViewing(null)} filePath={viewing?.file_path ?? null} title={viewing?.title ?? ""} />
    </DashboardShell>
  );
};

export default TeacherDashboard;
