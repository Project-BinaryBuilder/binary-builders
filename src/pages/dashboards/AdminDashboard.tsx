import { Users, FileText, Bell, CalendarDays, GraduationCap, Settings } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

const tiles = [
  { icon: Users, title: "Manage Users", desc: "Create teachers & students, assign classes.", color: "bg-primary/10 text-primary", soon: true },
  { icon: FileText, title: "Content Library", desc: "Upload class-wise PDFs for students & teachers.", color: "bg-accent/10 text-accent", soon: true },
  { icon: GraduationCap, title: "Examinations", desc: "Start/end exams, view results & analytics.", color: "bg-fun/10 text-fun", soon: true },
  { icon: Bell, title: "Notices", desc: "Post announcements visible to everyone.", color: "bg-secondary/40 text-secondary-foreground", soon: true },
  { icon: CalendarDays, title: "Events", desc: "Schedule and manage school events.", color: "bg-success/10 text-success", soon: true },
  { icon: Settings, title: "Feature Toggles", desc: "Enable or disable platform modules.", color: "bg-muted text-muted-foreground", soon: true },
];

const AdminDashboard = () => (
  <DashboardShell title="Super Admin Console" badge="Super Admin">
    <p className="text-muted-foreground mb-8 max-w-2xl">
      Full system control — users, content, exams, notices, and feature configuration.
    </p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {tiles.map((t) => (
        <div key={t.title} className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft hover:shadow-playful hover:-translate-y-1 transition-all cursor-pointer relative">
          {t.soon && (
            <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-secondary/40 text-secondary-foreground">
              Coming next
            </span>
          )}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${t.color}`}>
            <t.icon className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.desc}</p>
        </div>
      ))}
    </div>
  </DashboardShell>
);

export default AdminDashboard;
