import { Link } from "react-router-dom";
import { Users, FileText, Bell, CalendarDays, GraduationCap, Settings } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

const tiles = [
  { to: "/admin/users", icon: Users, title: "Manage Users", desc: "Create teachers & students, assign classes, reset passwords.", color: "bg-primary/10 text-primary" },
  { to: "/admin/content", icon: FileText, title: "Content Library", desc: "Upload class-wise PDFs for students & teachers.", color: "bg-accent/10 text-accent" },
  { to: "/admin/exams", icon: GraduationCap, title: "Examinations", desc: "Create MCQs, start/end exams, view results.", color: "bg-fun/10 text-fun" },
  { to: "/admin/notices", icon: Bell, title: "Notices", desc: "Post announcements visible to everyone.", color: "bg-secondary/40 text-secondary-foreground" },
  { to: "/admin/events", icon: CalendarDays, title: "Events", desc: "Schedule and manage school events.", color: "bg-success/10 text-success" },
  { to: "/admin/features", icon: Settings, title: "Feature Toggles", desc: "Enable or disable platform modules.", color: "bg-muted text-muted-foreground" },
];

const AdminDashboard = () => (
  <AdminLayout title="Super Admin Console">
    <p className="text-muted-foreground mb-8 max-w-2xl">
      Full system control — users, content, exams, notices, events and feature configuration.
    </p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {tiles.map((t) => (
        <Link key={t.title} to={t.to} className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft hover:shadow-playful hover:-translate-y-1 transition-all block">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${t.color}`}>
            <t.icon className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.desc}</p>
        </Link>
      ))}
    </div>
  </AdminLayout>
);

export default AdminDashboard;
