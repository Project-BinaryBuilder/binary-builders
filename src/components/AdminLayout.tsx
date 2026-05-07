import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Binary, LogOut, Users, FileText, GraduationCap, Bell, CalendarDays, Settings, LayoutDashboard, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/content", icon: FileText, label: "Content Library" },
  { to: "/admin/exams", icon: GraduationCap, label: "Examinations" },
  { to: "/admin/notices", icon: Bell, label: "Notices" },
  { to: "/admin/events", icon: CalendarDays, label: "Events" },
  { to: "/admin/audit", icon: ScrollText, label: "Audit Log" },
  { to: "/admin/features", icon: Settings, label: "Feature Toggles" },
];

export const AdminLayout = ({ title, children }: { title: string; children: ReactNode }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-soft flex">
      <aside className="w-64 border-r border-border/60 bg-background/85 backdrop-blur p-4 hidden md:flex flex-col">
        <Link to="/" className="flex items-center gap-2 mb-6 px-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-playful">
            <Binary className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Project Binary</span>
        </Link>
        <nav className="space-y-1 flex-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground shadow-playful" : "hover:bg-muted text-foreground/80",
                )
              }
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border/60 pt-3 mt-3">
          <div className="px-2 mb-2">
            <div className="text-sm font-semibold leading-tight truncate">{profile?.full_name || profile?.username}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Super Admin</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-30">
          <div className="container h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-playful">
                <Binary className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Admin</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <nav className="container flex gap-1 overflow-x-auto pb-2">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end}
                className={({ isActive }) => cn("text-xs px-3 py-1.5 rounded-full whitespace-nowrap", isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80")}>
                {it.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <div className="container py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
};
