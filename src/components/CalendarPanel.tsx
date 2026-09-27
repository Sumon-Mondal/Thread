import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2, Play, Video } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import type { CalEvent } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const PLATFORM_STYLE: Record<string, string> = {
  Zoom: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  "Google Meet": "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  "Microsoft Teams": "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  Calendar: "bg-secondary text-muted-foreground ring-border",
};

export function CalendarPanel() {
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "online">("all");
  const { setMode, play, reset } = useDemo();

  useEffect(() => {
    fetch("/api/calendar")
      .then(async (r) => {
        const d = (await r.json()) as { events?: CalEvent[]; error?: string };
        if (!r.ok) throw new Error(d.error ?? "Couldn't load calendar");
        setEvents(d.events ?? []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't load calendar"));
  }, []);

  const list = (events ?? []).filter((e) => filter === "all" || e.joinUrl);

  return (
    <aside className="glass-panel h-fit rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Upcoming · Google Calendar</h2>
        </div>
        <span className="meta-chip rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400 ring-1 ring-emerald-500/30">Live sync</span>
      </div>
      <div className="mt-3 flex gap-1 text-xs">
        {(["all", "online"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-2.5 py-1", filter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>
            {f === "all" ? "All events" : "Online meetings"}
          </button>
        ))}
      </div>
      <div className="thin-scroll mt-3 max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
        {!events && !error && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Syncing your calendar…</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {events && list.length === 0 && <p className="text-xs text-muted-foreground">No upcoming {filter === "online" ? "online meetings" : "events"}.</p>}
        {list.map((e) => {
          const allDay = !e.start.includes("T");
          const d = new Date(allDay ? `${e.start}T00:00:00` : e.start);
          return (
            <div key={e.id} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{e.title}</p>
                <span className={cn("meta-chip shrink-0 rounded-full px-2 py-0.5 ring-1", PLATFORM_STYLE[e.platform] ?? PLATFORM_STYLE["Calendar"])}>{e.platform}</span>
              </div>
              <p className="meta-chip mt-1.5 text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                {allDay ? " · all day" : ` · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
              </p>
              <div className="mt-2.5 flex gap-2">
                {e.joinUrl ? (
                  <a href={e.joinUrl} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/85">
                    <Video className="size-3" /> Join on {e.platform}
                  </a>
                ) : (
                  <button onClick={() => { setMode("demo"); reset(); setTimeout(play, 300); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/70">
                    <Play className="size-3" /> Rehearse with Thread
                  </button>
                )}
                {e.calendarUrl && (
                  <a href={e.calendarUrl} target="_blank" rel="noreferrer" aria-label="Open in Google Calendar" className="flex items-center rounded-full border border-border px-2.5 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Zoom, Meet and Teams links inside your calendar events are detected automatically.</p>
    </aside>
  );
}
