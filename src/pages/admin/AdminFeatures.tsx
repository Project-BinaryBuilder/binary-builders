import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Flag { key: string; enabled: boolean; }

const labels: Record<string, { title: string; desc: string }> = {
  notices: { title: "Notices", desc: "Public Notices page and announcements." },
  events: { title: "Events", desc: "Public Events page and calendar." },
  content_library: { title: "Content Library", desc: "Class-wise PDF packages for students and teachers." },
  examinations: { title: "Examinations", desc: "MCQ exam module." },
};

const AdminFeatures = () => {
  const [flags, setFlags] = useState<Flag[]>([]);
  const load = () => supabase.from("feature_flags").select("*").order("key").then(({ data }) => setFlags((data ?? []) as Flag[]));
  useEffect(() => { load(); }, []);

  const toggle = async (key: string, enabled: boolean) => {
    setFlags((f) => f.map((x) => (x.key === key ? { ...x, enabled } : x)));
    const { error } = await supabase.from("feature_flags").update({ enabled, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) { toast.error(error.message); load(); } else toast.success(`${labels[key]?.title ?? key}: ${enabled ? "enabled" : "disabled"}`);
  };

  return (
    <AdminLayout title="Feature Toggles">
      <p className="text-muted-foreground mb-6">Enable or disable platform modules system-wide.</p>
      <div className="space-y-3">
        {flags.map((f) => {
          const meta = labels[f.key] ?? { title: f.key, desc: "" };
          return (
            <div key={f.key} className="p-5 rounded-3xl bg-card border border-border/60 flex justify-between items-center gap-4">
              <div>
                <h3 className="font-bold">{meta.title}</h3>
                <p className="text-sm text-muted-foreground">{meta.desc}</p>
              </div>
              <Switch checked={f.enabled} onCheckedChange={(v) => toggle(f.key, v)} />
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminFeatures;
