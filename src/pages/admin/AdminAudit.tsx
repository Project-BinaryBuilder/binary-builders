import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Row {
  id: string; created_at: string; actor_username: string | null;
  action: string; entity: string; entity_id: string | null; summary: string | null;
}

const actionColor: Record<string, string> = {
  insert: "bg-success/15 text-success",
  update: "bg-primary/15 text-primary",
  delete: "bg-destructive/15 text-destructive",
};

const AdminAudit = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

  const filtered = rows.filter((r) => {
    const t = `${r.actor_username} ${r.entity} ${r.action} ${r.summary}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <AdminLayout title="Audit Log">
      <p className="text-muted-foreground mb-4">A trail of every Super Admin change to users, content, exams, notices, events and feature toggles.</p>
      <Input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mb-6 rounded-full" />

      <div className="rounded-3xl bg-card border border-border/60 overflow-hidden">
        {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">No entries yet.</div>}
        {filtered.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-4 border-t border-border/40 first:border-0">
            <Badge className={`rounded-full ${actionColor[r.action] ?? "bg-muted text-foreground"}`}>{r.action}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{r.entity}</span>
            <span className="flex-1 min-w-[200px]">{r.summary || "—"}</span>
            <span className="text-xs text-muted-foreground">{r.actor_username || "system"}</span>
            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminAudit;
