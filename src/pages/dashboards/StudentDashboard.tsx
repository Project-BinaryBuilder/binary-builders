import { BookOpen, Pencil, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";

const StudentDashboard = () => {
  const { profile } = useAuth();
  return (
    <DashboardShell title={`Hi, ${profile?.full_name || profile?.username || "Student"}! 👋`} badge="Student">
      <p className="text-muted-foreground mb-8">
        {profile?.class_grade ? `Grade ${profile.class_grade}` : "Your class"} · Let's build something today.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-gradient-hero text-primary-foreground shadow-playful">
          <Sparkles className="h-7 w-7 mb-3" />
          <h3 className="font-bold text-xl mb-1">Today's Goal</h3>
          <p className="text-sm opacity-90">Errors are clues, not failures. Keep building.</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">My Materials</h3>
          <p className="text-sm text-muted-foreground">Class PDFs will appear here once added by your admin.</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-fun/10 text-fun flex items-center justify-center mb-4">
            <Pencil className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Exams</h3>
          <p className="text-sm text-muted-foreground">Exams open here when your admin starts a session.</p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StudentDashboard;
