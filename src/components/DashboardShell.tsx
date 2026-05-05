import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Binary, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const DashboardShell = ({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-30">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-playful">
              <Binary className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Project Binary</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold leading-tight">{profile?.full_name || profile?.username}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{badge}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-6">{title}</h1>
        {children}
      </div>
    </div>
  );
};
