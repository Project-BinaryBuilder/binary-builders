import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";

interface Exam { id: string; title: string; grade: number; }
interface Attempt { id: string; exam_id: string; score: number | null; total: number | null; submitted_at: string | null; }

const PASS = 0.5;
const BUCKETS = [0, 20, 40, 60, 80];
const BUCKET_KEYS = BUCKETS.map((b) => `b${b}`);
const BUCKET_LABELS: Record<string, string> = {
  b0: "0-19%", b20: "20-39%", b40: "40-59%", b60: "60-79%", b80: "80-100%",
};
const BUCKET_COLORS = ["hsl(0 75% 60%)", "hsl(25 85% 60%)", "hsl(45 90% 55%)", "hsl(150 60% 50%)", "hsl(200 75% 55%)"];

const AdminAnalytics = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    supabase.from("exams").select("id, title, grade").then(({ data }) => setExams((data ?? []) as Exam[]));
    supabase.from("exam_attempts").select("id, exam_id, score, total, submitted_at")
      .not("submitted_at", "is", null)
      .then(({ data }) => setAttempts((data ?? []) as Attempt[]));
  }, []);

  const examById = useMemo(() => new Map(exams.map((e) => [e.id, e])), [exams]);

  // Group by grade
  const byGrade = useMemo(() => {
    const map = new Map<number, Attempt[]>();
    for (const a of attempts) {
      const e = examById.get(a.exam_id);
      if (!e || a.score === null || a.total === null) continue;
      if (!map.has(e.grade)) map.set(e.grade, []);
      map.get(e.grade)!.push(a);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [attempts, examById]);

  const gradePass = useMemo(() => byGrade.map(([grade, list]) => {
    const passes = list.filter((a) => (a.score! / Math.max(a.total!, 1)) >= PASS).length;
    return {
      group: `Grade ${grade}`,
      passRate: list.length ? Math.round((passes / list.length) * 100) : 0,
      submissions: list.length,
    };
  }), [byGrade]);

  const gradeDist = useMemo(() => byGrade.map(([grade, list]) => {
    const row: Record<string, string | number> = { group: `Grade ${grade}` };
    for (const b of BUCKETS) row[`b${b}`] = 0;
    for (const a of list) {
      const p = (a.score! / Math.max(a.total!, 1)) * 100;
      const b = Math.min(80, Math.floor(p / 20) * 20);
      row[`b${b}`] = (row[`b${b}`] as number) + 1;
    }
    return row;
  }), [byGrade]);

  // Per-exam breakdown (treats each exam as a "class")
  const examPass = useMemo(() => {
    const grouped = new Map<string, Attempt[]>();
    for (const a of attempts) {
      if (a.score === null || a.total === null) continue;
      if (!grouped.has(a.exam_id)) grouped.set(a.exam_id, []);
      grouped.get(a.exam_id)!.push(a);
    }
    return Array.from(grouped.entries()).map(([eid, list]) => {
      const e = examById.get(eid);
      const passes = list.filter((a) => (a.score! / Math.max(a.total!, 1)) >= PASS).length;
      return {
        group: e ? `G${e.grade} · ${e.title}` : eid.slice(0, 6),
        grade: e?.grade ?? 0,
        passRate: Math.round((passes / list.length) * 100),
        submissions: list.length,
      };
    }).sort((a, b) => a.grade - b.grade || a.group.localeCompare(b.group));
  }, [attempts, examById]);

  const totalSubs = attempts.length;

  return (
    <AdminLayout title="Performance Analytics">
      <p className="text-sm text-muted-foreground mb-6">
        Compare pass rates and score distributions across grades and individual exams. {totalSubs} total submissions.
      </p>

      <div className="grid gap-6 mb-8">
        <div className="rounded-3xl bg-card border border-border/60 p-6">
          <h3 className="font-bold mb-1">Pass rate by grade</h3>
          <p className="text-xs text-muted-foreground mb-4">Share of submissions scoring 50% or higher</p>
          {gradePass.length === 0 ? <Empty /> : (
            <ChartContainer config={{ passRate: { label: "Pass rate %", color: "hsl(var(--primary))" } }} className="h-[280px] w-full">
              <ResponsiveContainer>
                <BarChart data={gradePass} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="passRate" fill="var(--color-passRate)" radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-3xl bg-card border border-border/60 p-6">
          <h3 className="font-bold mb-1">Score distribution by grade</h3>
          <p className="text-xs text-muted-foreground mb-4">Number of students per score band, stacked per grade</p>
          {gradeDist.length === 0 ? <Empty /> : (
            <ChartContainer
              config={Object.fromEntries(BUCKET_KEYS.map((k, i) => [k, { label: BUCKET_LABELS[k], color: BUCKET_COLORS[i] }]))}
              className="h-[320px] w-full"
            >
              <ResponsiveContainer>
                <BarChart data={gradeDist} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {BUCKET_KEYS.map((k) => (
                    <Bar key={k} dataKey={k} stackId="a" fill={`var(--color-${k})`} radius={[6, 6, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-3xl bg-card border border-border/60 p-6">
          <h3 className="font-bold mb-1">Pass rate by exam</h3>
          <p className="text-xs text-muted-foreground mb-4">Color-coded by grade for class-level comparison</p>
          {examPass.length === 0 ? <Empty /> : (
            <ChartContainer config={{ passRate: { label: "Pass rate %", color: "hsl(var(--primary))" } }} className="h-[340px] w-full">
              <ResponsiveContainer>
                <BarChart data={examPass} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="group" width={180} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="passRate" radius={[4, 12, 12, 4]}>
                    {examPass.map((row, i) => {
                      const palette = ["hsl(200 75% 55%)", "hsl(280 65% 60%)", "hsl(150 60% 50%)", "hsl(25 85% 60%)", "hsl(340 75% 60%)"];
                      return <Cell key={i} fill={palette[(row.grade - 4 + 5) % palette.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const Empty = () => <p className="text-sm text-muted-foreground">No submissions yet.</p>;

export default AdminAnalytics;
