import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2, Play, Video, Plus, Check, RefreshCw, X, Zap, Bot } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo-store";
import type { CalEvent } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const PLATFORM_STYLE: Record<string, string> = {
  Zoom: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  "Google Meet": "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  "Microsoft Teams": "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  Calendar: "bg-secondary text-muted-foreground ring-border",
};

export function CalendarPanel({ onOpenConnectModal }: { onOpenConnectModal?: () => void }) {
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "online">("all");
  const [accountEmail, setAccountEmail] = useState<string>("sumonmondal@gmail.com");
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingMeeting, setUpcomingMeeting] = useState<{
    id: string;
    title: string;
    start: string;
    platform: string;
    joinUrl: string;
    minutesUntilStart: number;
  } | null>(null);
  const [isVmRunning, setIsVmRunning] = useState(false);

  // Add Event Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() => {
    const d = new Date(Date.now() + 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [newDuration, setNewDuration] = useState("30");
  const [newPlatform, setNewPlatform] = useState<"Google Meet" | "Zoom">("Google Meet");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGCalUrl, setCreatedGCalUrl] = useState<string | null>(null);

  const { setMode, play, reset } = useDemo();

  const loadEvents = async () => {
    setIsRefreshing(true);
    try {
      const r = await fetch("/api/calendar");
      const d = (await r.json()) as {
        connected?: boolean;
        accountEmail?: string;
        events?: CalEvent[];
        error?: string;
      };
      if (!r.ok) throw new Error(d.error ?? "Couldn't load calendar");
      setIsConnected(d.connected ?? true);
      if (d.accountEmail) setAccountEmail(d.accountEmail);
      setEvents(d.events ?? []);
      setError("");

      // Also check VM bot status and upcoming meeting
      try {
        const vmRes = await fetch("/api/vm-bot");
        if (vmRes.ok) {
          const vmData = await vmRes.json();
          setIsVmRunning(vmData.status === "connected");
          if (vmData.upcomingMeeting) {
            setUpcomingMeeting(vmData.upcomingMeeting);
          }
        }
      } catch {}
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't load calendar");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleJoinOnBehalf = async (url: string, title?: string) => {
    toast.loading("Dispatching Thread VM Bot to call…", { id: "vm-join" });
    try {
      const res = await fetch("/api/vm-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join_upcoming", meetingUrl: url, title }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsVmRunning(true);
        toast.success(`VM Bot joined '${title || "meeting"}' on your behalf (sumonmondal@gmail.com)!`, { id: "vm-join" });
      } else {
        toast.error(data.error || "Failed to join via VM Bot", { id: "vm-join" });
      }
    } catch {
      toast.error("Failed to reach VM Bot", { id: "vm-join" });
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    setCreatedGCalUrl(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          start: new Date(newDate).toISOString(),
          durationMin: parseInt(newDuration, 10) || 30,
          zoomUrl: newPlatform === "Zoom" ? "https://zoom.us/j/98765432100" : undefined,
          notes: newNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.googleCalendarWebUrl) {
          setCreatedGCalUrl(data.googleCalendarWebUrl);
        }
        await loadEvents();
        setNewTitle("");
        setNewNotes("");
      } else {
        setError(data.error || "Failed to create event");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const list = (events ?? []).filter((e) => filter === "all" || e.joinUrl);

  return (
    <aside className="glass-panel h-fit rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-cyan-400" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Google Calendar</h2>
            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
              {accountEmail ? accountEmail : "No account connected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void loadEvents()}
            disabled={isRefreshing}
            className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition"
            title="Refresh events"
          >
            <RefreshCw className={cn("size-3", isRefreshing && "animate-spin text-cyan-400")} />
          </button>
          <span className="meta-chip rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
            {isConnected ? "Live sync" : "Standby"}
          </span>
        </div>
      </div>

      {/* Account Info Pill */}
      {isConnected && (
        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-background/50 px-2.5 py-1.5 text-[11px] ring-1 ring-border/60">
          <span className="flex items-center gap-1.5 text-foreground/80">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[10px] text-muted-foreground">{accountEmail}</span>
          </span>
          <button
            onClick={onOpenConnectModal}
            className="text-[10px] font-medium text-cyan-400 hover:text-cyan-300 transition"
          >
            Manage
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="mt-3 flex items-center justify-between gap-1 text-xs">
        <div className="flex gap-1">
          {(["all", "online"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition",
                filter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "All events" : "Online meetings"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 ring-1 ring-cyan-500/30 hover:bg-cyan-500/25 transition"
        >
          {showAddForm ? <X className="size-3" /> : <Plus className="size-3" />}
          {showAddForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      {/* Quick Add Event Form */}
      {showAddForm && (
        <form onSubmit={handleCreateEvent} className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Add to Google Calendar</span>
            <span className="text-[10px] text-muted-foreground">Syncs to {accountEmail}</span>
          </div>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Meeting title (e.g. Q4 Product Review)…"
            className="w-full rounded-lg bg-background/80 px-2.5 py-1.5 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Start Time</label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-lg bg-background/80 px-2 py-1 text-[11px] text-foreground ring-1 ring-border outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Platform</label>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as "Google Meet" | "Zoom")}
                className="w-full rounded-lg bg-background/80 px-2 py-1 text-[11px] text-foreground ring-1 ring-border outline-none"
              >
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-50 transition"
            >
              {isSubmitting ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
              Save &amp; Sync
            </button>
          </div>

          {createdGCalUrl && (
            <div className="mt-2 rounded-lg bg-emerald-500/15 p-2 text-xs text-emerald-300 ring-1 ring-emerald-500/30 flex items-center justify-between">
              <span>Event staged to Google Calendar!</span>
              <a
                href={createdGCalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-bold underline hover:text-white"
              >
                Open in Google Calendar <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </form>
      )}

      {/* Upcoming Meeting Anticipation Banner */}
      {upcomingMeeting && (
        <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              Starts in ~{upcomingMeeting.minutesUntilStart}m
            </span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              {upcomingMeeting.platform}
            </span>
          </div>
          <p className="mt-1 font-semibold text-foreground">{upcomingMeeting.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Synchronized meeting on Cloud VM (sumonmondal@gmail.com). Join on your behalf?
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => void handleJoinOnBehalf(upcomingMeeting.joinUrl, upcomingMeeting.title)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 py-1.5 text-xs font-bold text-black hover:opacity-90 transition"
            >
              <Zap className="size-3.5 fill-black" /> {isVmRunning ? "VM Bot Active" : "Yes, Join on My Behalf"}
            </button>
            <button
              onClick={() => setUpcomingMeeting(null)}
              className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="thin-scroll mt-3 max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
        {!events && !error && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-cyan-400" /> Syncing with Google Calendar ({accountEmail})…
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {events && list.length === 0 && (
          <p className="text-xs text-muted-foreground">No upcoming {filter === "online" ? "online meetings" : "events"}.</p>
        )}
        {list.map((e) => {
          const allDay = !e.start.includes("T");
          const d = new Date(allDay ? `${e.start}T00:00:00` : e.start);
          return (
            <div key={e.id} className="rounded-xl border border-border bg-background/40 p-3 hover:border-cyan-500/30 transition">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight text-foreground">{e.title}</p>
                <span
                  className={cn(
                    "meta-chip shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                    PLATFORM_STYLE[e.platform] ?? PLATFORM_STYLE["Calendar"]
                  )}
                >
                  {e.platform}
                </span>
              </div>
              <p className="meta-chip mt-1.5 text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                {allDay ? " · all day" : ` · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`}
              </p>
              <div className="mt-2.5 flex gap-2">
                {e.joinUrl ? (
                  <>
                    <a
                      href={e.joinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/85 transition"
                    >
                      <Video className="size-3" /> Join on {e.platform}
                    </a>
                    <button
                      onClick={() => void handleJoinOnBehalf(e.joinUrl!, e.title)}
                      className="flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/25 transition"
                      title="Dispatch VM Bot to join on your behalf"
                    >
                      <Zap className="size-3" /> VM Bot
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setMode("demo");
                      reset();
                      setTimeout(play, 300);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/70 transition"
                  >
                    <Play className="size-3" /> Rehearse with Thread
                  </button>
                )}
                {e.calendarUrl && (
                  <a
                    href={e.calendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open in Google Calendar"
                    title="Open in Google Calendar"
                    className="flex items-center rounded-full border border-border px-2.5 text-muted-foreground hover:text-foreground transition hover:border-cyan-500/40"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Zoom, Google Meet and Microsoft Teams events in your Google Calendar are detected automatically.
      </p>
    </aside>
  );
}
