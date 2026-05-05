import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Binary, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { adminEmail, studentEmail, teacherEmail, GRADES } from "@/lib/auth-helpers";

const Login = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // Student
  const [sGrade, setSGrade] = useState<string>("");
  const [sUser, setSUser] = useState("");
  const [sPass, setSPass] = useState("");

  // Teacher
  const [tMin, setTMin] = useState<string>("");
  const [tMax, setTMax] = useState<string>("");
  const [tUser, setTUser] = useState("");
  const [tPass, setTPass] = useState("");

  // Admin
  const [aUser, setAUser] = useState("");
  const [aPass, setAPass] = useState("");

  // Bootstrap signup (first ever user → super admin)
  const [signupMode, setSignupMode] = useState(false);
  const [suUser, setSuUser] = useState("");
  const [suFull, setSuFull] = useState("");
  const [suPass, setSuPass] = useState("");

  if (loading) return null;
  if (user && role) {
    const dest = role === "super_admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";
    return <Navigate to={dest} replace />;
  }

  const doLogin = async (email: string, password: string) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Login failed", { description: error.message });
      return;
    }
    toast.success("Welcome back!");
    navigate("/");
  };

  const handleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sGrade || !sUser || !sPass) return toast.error("Fill all fields");
    doLogin(studentEmail(sUser, parseInt(sGrade)), sPass);
  };
  const handleTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tMin || !tMax || !tUser || !tPass) return toast.error("Fill all fields");
    doLogin(teacherEmail(tUser, parseInt(tMin), parseInt(tMax)), tPass);
  };
  const handleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aUser || !aPass) return toast.error("Fill all fields");
    doLogin(adminEmail(aUser), aPass);
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suUser || !suPass || suPass.length < 8) return toast.error("Username and 8+ char password required");
    setBusy(true);
    const email = adminEmail(suUser);
    const { error } = await supabase.auth.signUp({
      email,
      password: suPass,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username: suUser, full_name: suFull, role: "super_admin" },
      },
    });
    setBusy(false);
    if (error) return toast.error("Signup failed", { description: error.message });
    toast.success("Super Admin created — logging you in…");
    await doLogin(email, suPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-hero shadow-playful mb-4 animate-pop-in">
            <Binary className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Project Binary</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your dashboard</p>
        </div>

        <div className="rounded-3xl bg-card border border-border/60 shadow-playful p-6">
          {signupMode ? (
            <form onSubmit={handleBootstrap} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-bold text-lg">Create Super Admin</h2>
                <p className="text-xs text-muted-foreground">First-time setup. The first account becomes the system owner.</p>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={suFull} onChange={(e) => setSuFull(e.target.value)} placeholder="Sabin Adhikari" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={suUser} onChange={(e) => setSuUser(e.target.value.toLowerCase().replace(/\s/g, ""))} required placeholder="sabin" />
              </div>
              <div className="space-y-2">
                <Label>Password (8+ chars)</Label>
                <Input type="password" value={suPass} onChange={(e) => setSuPass(e.target.value)} required minLength={8} />
              </div>
              <Button type="submit" className="w-full rounded-full h-11" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Super Admin
              </Button>
              <button type="button" onClick={() => setSignupMode(false)} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
                ← Back to login
              </button>
            </form>
          ) : (
            <Tabs defaultValue="student">
              <TabsList className="grid grid-cols-3 w-full rounded-full mb-4 h-11 bg-muted">
                <TabsTrigger value="student" className="rounded-full">Student</TabsTrigger>
                <TabsTrigger value="teacher" className="rounded-full">Teacher</TabsTrigger>
                <TabsTrigger value="admin" className="rounded-full">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <form onSubmit={handleStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={sGrade} onValueChange={setSGrade}>
                      <SelectTrigger><SelectValue placeholder="Select your grade" /></SelectTrigger>
                      <SelectContent>
                        {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={sUser} onChange={(e) => setSUser(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={sPass} onChange={(e) => setSPass(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Log in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="teacher">
                <form onSubmit={handleTeacher} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>From Grade</Label>
                      <Select value={tMin} onValueChange={setTMin}>
                        <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
                        <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>To Grade</Label>
                      <Select value={tMax} onValueChange={setTMax}>
                        <SelectTrigger><SelectValue placeholder="Max" /></SelectTrigger>
                        <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={tUser} onChange={(e) => setTUser(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={tPass} onChange={(e) => setTPass(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Log in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdmin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={aUser} onChange={(e) => setAUser(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={aPass} onChange={(e) => setAPass(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Log in
                  </Button>
                  <button type="button" onClick={() => setSignupMode(true)} className="text-xs text-muted-foreground hover:text-foreground w-full text-center pt-1">
                    First-time setup? Create Super Admin →
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/" className="hover:text-foreground">← Back to home</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
