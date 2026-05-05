import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Evt { id: string; title: string; description: string | null; event_date: string | null; }

const Events = () => {
  const [events, setEvents] = useState<Evt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("events").select("*").order("event_date", { ascending: true }).then(({ data }) => {
      setEvents(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <Layout>
      <div className="container max-w-3xl py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-sky flex items-center justify-center shadow-playful">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Events</h1>
            <p className="text-muted-foreground">Upcoming events and activities.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border/60 p-12 text-center text-muted-foreground">
            No events scheduled yet.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((e) => (
              <article key={e.id} className="p-6 rounded-3xl bg-card border border-border/60 shadow-soft hover:shadow-playful transition-shadow flex gap-5">
                {e.event_date && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-hero text-primary-foreground flex flex-col items-center justify-center font-bold">
                    <div className="text-xs uppercase">{new Date(e.event_date).toLocaleDateString(undefined, { month: "short" })}</div>
                    <div className="text-2xl leading-none">{new Date(e.event_date).getDate()}</div>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold mb-1">{e.title}</h2>
                  {e.description && <p className="text-foreground/80">{e.description}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Events;
