import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { GRADES } from "@/lib/auth-helpers";
import { toast } from "sonner";
import { KeyRound, Trash2, UserPlus, Pencil } from "lucide-react";

interface Row {
  id: string;
  username: string;
  full_name: string | null;
  class_grade: number | null;
  class_range_min: number | null;
  class_range_max: number | null;
  role: "super_admin" | "teacher" | "student" | null;
}

const callAdmin = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data;
};

const AdminUsers = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<Row | null>(null);
  const [editUser, setEditUser] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    setRows((profs ?? []).map((p) => ({ ...p, role: (map.get(p.id) ?? null) as Row["role"] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const students = rows.filter((r) => r.role === "student");
  const teachers = rows.filter((r) => r.role === "teacher");
  const admins = rows.filter((r) => r.role === "super_admin");

  return (
    <AdminLayout title="Manage Users">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Create accounts, assign classes, reset passwords.</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><UserPlus className="h-4 w-4 mr-2" /> Add user</Button>
          </DialogTrigger>
          <CreateUserDialog onDone={() => { setCreateOpen(false); load(); }} />
        </Dialog>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="rounded-full">
          <TabsTrigger value="students" className="rounded-full">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="teachers" className="rounded-full">Teachers ({teachers.length})</TabsTrigger>
          <TabsTrigger value="admins" className="rounded-full">Admins ({admins.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="students"><UserTable rows={students} loading={loading} kind="student" onReset={setResetUser} onEdit={setEditUser} onDelete={async (r) => { if (!confirm(`Delete ${r.username}?`)) return; try { await callAdmin({ action: "delete", user_id: r.id }); toast.success("Deleted"); load(); } catch (e) { toast.error((e as Error).message); } }} /></TabsContent>
        <TabsContent value="teachers"><UserTable rows={teachers} loading={loading} kind="teacher" onReset={setResetUser} onEdit={setEditUser} onDelete={async (r) => { if (!confirm(`Delete ${r.username}?`)) return; try { await callAdmin({ action: "delete", user_id: r.id }); toast.success("Deleted"); load(); } catch (e) { toast.error((e as Error).message); } }} /></TabsContent>
        <TabsContent value="admins"><UserTable rows={admins} loading={loading} kind="admin" onReset={setResetUser} onEdit={() => toast("Admins are not editable here.")} onDelete={() => toast("Admins cannot be removed here.")} /></TabsContent>
      </Tabs>

      {resetUser && <ResetDialog user={resetUser} onClose={() => setResetUser(null)} />}
      {editUser && <EditDialog user={editUser} onClose={() => { setEditUser(null); load(); }} />}
    </AdminLayout>
  );
};

const UserTable = ({ rows, loading, kind, onReset, onEdit, onDelete }: {
  rows: Row[]; loading: boolean; kind: "student" | "teacher" | "admin";
  onReset: (r: Row) => void; onEdit: (r: Row) => void; onDelete: (r: Row) => void;
}) => (
  <div className="mt-4 rounded-3xl border border-border/60 bg-card overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Full name</TableHead>
          <TableHead>{kind === "student" ? "Grade" : kind === "teacher" ? "Class range" : "Role"}</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (<TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>)
          : rows.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users yet.</TableCell></TableRow>)
            : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.username}</TableCell>
                <TableCell>{r.full_name ?? "—"}</TableCell>
                <TableCell>
                  {kind === "student" ? (r.class_grade ? `Grade ${r.class_grade}` : "—") :
                    kind === "teacher" ? (r.class_range_min ? `Grades ${r.class_range_min}–${r.class_range_max}` : "—") :
                      "Super Admin"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {kind !== "admin" && <Button size="sm" variant="ghost" onClick={() => onEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                  <Button size="sm" variant="ghost" onClick={() => onReset(r)}><KeyRound className="h-4 w-4" /></Button>
                  {kind !== "admin" && <Button size="sm" variant="ghost" onClick={() => onDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  </div>
);

const CreateUserDialog = ({ onDone }: { onDone: () => void }) => {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [rmin, setRmin] = useState("");
  const [rmax, setRmax] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || password.length < 8) return toast.error("Username + 8-char password required");
    setBusy(true);
    try {
      const body: Record<string, unknown> = { action: "create", role, username, full_name: fullName, password };
      if (role === "student") {
        if (!grade) throw new Error("Pick a grade");
        body.class_grade = parseInt(grade);
      } else {
        if (!rmin || !rmax) throw new Error("Pick class range");
        body.class_range_min = parseInt(rmin);
        body.class_range_max = parseInt(rmax);
      }
      await callAdmin(body);
      toast.success("User created");
      onDone();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <DialogContent className="rounded-3xl">
      <DialogHeader><DialogTitle>Add user</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={role === "student" ? "default" : "outline"} className="rounded-full" onClick={() => setRole("student")}>Student</Button>
          <Button type="button" variant={role === "teacher" ? "default" : "outline"} className="rounded-full" onClick={() => setRole("teacher")}>Teacher</Button>
        </div>
        <div className="space-y-2"><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} required /></div>
        <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Password (8+ chars)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></div>
        {role === "student" ? (
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2"><Label>From grade</Label>
              <Select value={rmin} onValueChange={setRmin}><SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>To grade</Label>
              <Select value={rmax} onValueChange={setRmax}><SelectTrigger><SelectValue placeholder="Max" /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        )}
        <DialogFooter><Button type="submit" disabled={busy} className="rounded-full">{busy ? "Creating…" : "Create user"}</Button></DialogFooter>
      </form>
    </DialogContent>
  );
};

const ResetDialog = ({ user, onClose }: { user: Row; onClose: () => void }) => {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>Reset password — {user.username}</DialogTitle></DialogHeader>
        <form onSubmit={async (e) => { e.preventDefault(); if (pw.length < 8) return toast.error("8+ chars"); setBusy(true); try { await callAdmin({ action: "reset_password", user_id: user.id, password: pw }); toast.success("Password updated"); onClose(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); } }} className="space-y-4">
          <div className="space-y-2"><Label>New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required /></div>
          <DialogFooter><Button type="submit" disabled={busy} className="rounded-full">{busy ? "Saving…" : "Update password"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EditDialog = ({ user, onClose }: { user: Row; onClose: () => void }) => {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [grade, setGrade] = useState(user.class_grade ? String(user.class_grade) : "");
  const [rmin, setRmin] = useState(user.class_range_min ? String(user.class_range_min) : "");
  const [rmax, setRmax] = useState(user.class_range_max ? String(user.class_range_max) : "");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>Edit — {user.username}</DialogTitle></DialogHeader>
        <form onSubmit={async (e) => {
          e.preventDefault(); setBusy(true);
          try {
            const body: Record<string, unknown> = { action: "update", user_id: user.id, full_name: fullName };
            if (user.role === "student") body.class_grade = parseInt(grade);
            if (user.role === "teacher") { body.class_range_min = parseInt(rmin); body.class_range_max = parseInt(rmax); }
            await callAdmin(body); toast.success("Updated"); onClose();
          } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
        }} className="space-y-4">
          <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          {user.role === "student" && (
            <div className="space-y-2"><Label>Grade</Label>
              <Select value={grade} onValueChange={setGrade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select>
            </div>
          )}
          {user.role === "teacher" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label>From</Label><Select value={rmin} onValueChange={setRmin}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>To</Label><Select value={rmax} onValueChange={setRmax}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent></Select></div>
            </div>
          )}
          <DialogFooter><Button type="submit" disabled={busy} className="rounded-full">{busy ? "Saving…" : "Save"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUsers;
