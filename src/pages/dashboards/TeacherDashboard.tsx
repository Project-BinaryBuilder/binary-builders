import { BookOpen, BarChart3, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";

const TeacherDashboard = () => {
  const { profile } = useAuth();
  const range =
    profile?.class_range_min && profile?.class_range_max
      ? `Grades ${profile.class_range_min}–${profile.class_range_max}`
      : "Your assigned classes";

  return (
    <DashboardShell title={`Welcome, ${profile?.full_name || profile?.username || "Teacher"}`} badge="Teacher">
      <p className="text-muted-foreground mb-8">{range}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Teacher Materials</h3>
          <p className="text-sm text-muted-foreground">Lesson PDFs and resources for your classes will appear here.</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-fun/10 text-fun flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Exam Results</h3>
          <p className="text-sm text-muted-foreground">Results from your students once exams are conducted.</p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Your Classes</h3>
          <p className="text-sm text-muted-foreground">{range}</p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default TeacherDashboard;
