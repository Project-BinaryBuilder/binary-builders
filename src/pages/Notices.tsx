import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Notice { id: string; title: string; body: string; created_at: string; }

const Notices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("notices").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setNotices(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <Layout>
      <div className="container max-w-3xl py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-playful">
            <Bell className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Notices</h1>
            <p className="text-muted-foreground">Important announcements from the institute.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : notices.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border/60 p-12 text-center text-muted-foreground">
            No notices yet. Check back soon!
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <article key={n.id} className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft hover:shadow-playful transition-shadow">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  {new Date(n.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </div>
                <h2 className="text-xl font-bold mb-2">{n.title}</h2>
                <p className="text-foreground/80 whitespace-pre-wrap">{n.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notices;
