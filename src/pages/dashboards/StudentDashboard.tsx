import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Pencil, Sparkles, FileText, Eye } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/PdfViewer";

interface Pdf { id: string; title: string; description: string | null; file_path: string; }
interface Exam { id: string; title: string; description: string | null; }

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [viewing, setViewing] = useState<Pdf | null>(null);

  useEffect(() => {
    supabase.from("content_pdfs").select("id, title, description, file_path").eq("audience", "student").then(({ data }) => setPdfs((data ?? []) as Pdf[]));
    supabase.from("exams").select("id, title, description").eq("is_active", true).then(({ data }) => setExams((data ?? []) as Exam[]));
  }, []);

  return (
    <DashboardShell title={`Hi, ${profile?.full_name || profile?.username || "Student"}! 👋`} badge="Student">
      <p className="text-muted-foreground mb-8">{profile?.class_grade ? `Grade ${profile.class_grade}` : "Your class"} · Let's build something today.</p>

      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        <div className="p-6 rounded-3xl bg-gradient-hero text-primary-foreground shadow-playful">
          <Sparkles className="h-7 w-7 mb-3" />
          <h3 className="font-bold text-xl mb-1">Today's Goal</h3>
          <p className="text-sm opacity-90">Errors are clues, not failures. Keep building.</p>
        </div>
        <div className="lg:col-span-2 p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-fun/10 text-fun flex items-center justify-center"><Pencil className="h-5 w-5" /></div>
            <h3 className="font-bold text-lg">Active Exams</h3>
          </div>
          {exams.length === 0 ? <p className="text-sm text-muted-foreground">No exams open right now.</p> : (
            <div className="space-y-2">
              {exams.map((e) => (
                <Link key={e.id} to={`/student/exam/${e.id}`} className="flex justify-between items-center p-3 rounded-2xl hover:bg-muted transition-colors">
                  <div><div className="font-semibold">{e.title}</div>{e.description && <div className="text-xs text-muted-foreground">{e.description}</div>}</div>
                  <Button size="sm" className="rounded-full">Start</Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center"><BookOpen className="h-5 w-5" /></div>
          <h3 className="font-bold text-lg">My Materials</h3>
        </div>
        {pdfs.length === 0 ? <p className="text-sm text-muted-foreground">No PDFs yet for your grade.</p> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {pdfs.map((p) => (
              <button key={p.id} onClick={() => setViewing(p)} className="text-left p-4 rounded-2xl border border-border/60 hover:bg-muted transition-colors flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{p.title}</div>
                  {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
                </div>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      <PdfViewer open={!!viewing} onOpenChange={(v) => !v && setViewing(null)} filePath={viewing?.file_path ?? null} title={viewing?.title ?? ""} />
    </DashboardShell>
  );
};

export default StudentDashboard;
