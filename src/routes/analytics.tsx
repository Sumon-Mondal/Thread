import { createFileRoute } from "@tanstack/react-router";
import { MOMENT_STYLES } from "@/components/MomentBadge";
import { formatClock, type MomentType } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Thread" },
      { name: "description", content: "Meeting analytics: moments over time, speaker talk share, and action completion — powered by time-series aggregates." },
      { property: "og:title", content: "Analytics — Thread" },
      { property: "og:description", content: "Meeting analytics: moments over time, speaker talk share, and action completion — powered by time-series aggregates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { moments, actions, transcript, elapsed } = useDemo();

  // Moments per 30s bucket
  const buckets = [0, 30, 60, 90, 120].map((start) => ({
    label: `${formatClock(start)}`,
    count: moments.filter((m) => m.timeSec >= start && m.timeSec < start + 30).length,
  }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  // Speaker talk share (by transcript line count)
  const speakerCounts = new Map<string, number>();
  for (const l of transcript) speakerCounts.set(l.speaker, (speakerCounts.get(l.speaker) ?? 0) + 1);
  const totalLines = Math.max(1, transcript.length);
  const speakers = [...speakerCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Type breakdown
  const types = Object.keys(MOMENT_STYLES) as MomentType[];
  const typeCounts = types.map((t) => ({ type: t, count: moments.filter((m) => m.type === t).length })).filter((x) => x.count > 0);

  const executed = actions.filter((a) => a.status === "executed").length;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-10 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Analytics</h1>
          <p className="meta-chip mt-1 text-muted-foreground">Tiger Data · continuous aggregates · 1s refresh</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { n: formatClock(elapsed), l: "Duration" },
          { n: moments.length, l: "Moments" },
          { n: transcript.length, l: "Segments" },
          { n: `${actions.length ? Math.round((executed / actions.length) * 100) : 0}%`, l: "Actions Done" },
        ].map((s) => (
          <div key={s.l} className="glass-panel p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{s.n}</p>
            <p className="meta-chip mt-1 text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Moments over time */}
        <div className="glass-panel p-5">
          <p className="meta-chip text-muted-foreground">Moments over time</p>
          <div className="mt-4 flex h-36 items-end gap-3">
            {buckets.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">{b.count || ""}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all duration-500"
                  style={{ height: `${(b.count / maxBucket) * 100}%`, minHeight: b.count ? 8 : 2 }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Speaker share */}
        <div className="glass-panel p-5">
          <p className="meta-chip text-muted-foreground">Speaker talk share</p>
          <div className="mt-4 space-y-3">
            {speakers.length === 0 && <p className="text-xs text-muted-foreground">No data yet — play the demo.</p>}
            {speakers.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{name}</span>
                  <span className="font-mono text-muted-foreground">{Math.round((count / totalLines) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(count / totalLines) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Moment type breakdown */}
        <div className="glass-panel p-5 lg:col-span-2">
          <p className="meta-chip text-muted-foreground">Moment taxonomy</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {typeCounts.length === 0 && <p className="text-xs text-muted-foreground">No moments yet.</p>}
            {typeCounts.map(({ type, count }) => {
              const s = MOMENT_STYLES[type];
              return (
                <span key={type} className={cn("meta-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1", s.classes)}>
                  <span className={cn("size-1.5 rounded-full", s.dot)} />
                  {s.label} · {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
