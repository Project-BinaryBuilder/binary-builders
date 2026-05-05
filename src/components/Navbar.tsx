import { Link, NavLink, useNavigate } from "react-router-dom";
import { Binary, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/notices", label: "Notices" },
  { to: "/events", label: "Events" },
  { to: "/about", label: "About" },
];

export const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboardPath = role === "super_admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-hero shadow-playful group-hover:rotate-6 transition-transform">
            <Binary className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg">Project Binary</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Build the future</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate(dashboardPath)}>
                Dashboard
              </Button>
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" className="rounded-full" onClick={() => navigate("/login")}>
              Log in
            </Button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl font-semibold ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Button variant="secondary" onClick={() => { setOpen(false); navigate(dashboardPath); }}>Dashboard</Button>
                <Button variant="ghost" onClick={async () => { await signOut(); setOpen(false); navigate("/"); }}>
                  Log out
                </Button>
              </>
            ) : (
              <Button onClick={() => { setOpen(false); navigate("/login"); }}>Log in</Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
