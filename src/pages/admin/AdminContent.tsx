import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { GRADES } from "@/lib/auth-helpers";
import { toast } from "sonner";
import { Trash2, Upload, FileText, Eye } from "lucide-react";
import { PdfViewer } from "@/components/PdfViewer";

type Audience = "student" | "teacher";
interface Pdf { id: string; audience: Audience; grade: number; title: string; description: string | null; file_path: string; created_at: string; }

const AdminContent = () => {
  const [items, setItems] = useState<Pdf[]>([]);
  const [audience, setAudience] = useState<Audience>("student");
  const [grade, setGrade] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<Pdf | null>(null);

  const load = () => supabase.from("content_pdfs").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems((data ?? []) as Pdf[]));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !grade || !title) return toast.error("Fill all fields and choose a PDF");
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${audience}/grade-${grade}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const up = await supabase.storage.from("pdfs").upload(path, file, { contentType: "application/pdf" });
      if (up.error) throw up.error;
      const { error } = await supabase.from("content_pdfs").insert({
        audience, grade: parseInt(grade), title, description: description || null, file_path: path, created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Uploaded");
      setTitle(""); setDescription(""); setFile(null); setGrade("");
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const remove = async (p: Pdf) => {
    if (!confirm("Delete this PDF?")) return;
    await supabase.storage.from("pdfs").remove([p.file_path]);
    const { error } = await supabase.from("content_pdfs").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const view = (p: Pdf) => setViewing(p);

  return (
    <AdminLayout title="Content Library">
      <p className="text-muted-foreground mb-6">Upload class-wise PDFs. Student package is visible to students of that grade; teacher package is visible to teachers covering that grade.</p>

      <form onSubmit={submit} className="rounded-3xl bg-card border border-border/60 p-6 mb-8 grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Audience</Label>
          <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="student">Student package</SelectItem><SelectItem value="teacher">Teacher package</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Grade</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
            <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        <div className="space-y-2 md:col-span-2"><Label>PDF file</Label><Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></div>
        <Button type="submit" disabled={busy} className="rounded-full md:col-span-2 md:w-fit"><Upload className="h-4 w-4 mr-2" />{busy ? "Uploading…" : "Upload PDF"}</Button>
      </form>

      <Tabs defaultValue="student">
        <TabsList className="rounded-full"><TabsTrigger value="student" className="rounded-full">Student package</TabsTrigger><TabsTrigger value="teacher" className="rounded-full">Teacher package</TabsTrigger></TabsList>
        {(["student", "teacher"] as const).map((aud) => (
          <TabsContent key={aud} value={aud} className="mt-4 space-y-3">
            {GRADES.map((g) => {
              const list = items.filter((i) => i.audience === aud && i.grade === g);
              return (
                <div key={g} className="rounded-3xl bg-card border border-border/60 p-5">
                  <div className="font-bold mb-3">Grade {g}</div>
                  {list.length === 0 ? <div className="text-sm text-muted-foreground">No PDFs.</div> : list.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-t border-border/40 first:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.title}</div>
                          {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => view(p)}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      <PdfViewer open={!!viewing} onOpenChange={(v) => !v && setViewing(null)} filePath={viewing?.file_path ?? null} title={viewing?.title ?? ""} />
    </AdminLayout>
  );
};

export default AdminContent;
