import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CalendarClock, FileText, Mic, Sparkles as _unused, Zap, Trash2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_PREFS, PLATFORMS, REMINDER_CHOICES, fmtOffset, loadNotifs, loadPrefs, meetingPref, onNotifsChanged, pushNotif, saveNotifs, savePrefs, type Notif, type NotifPrefs } from "@/lib/notifications";
import { PAST_MEETINGS } from "@/lib/past-meetings";
import { cn } from "@/lib/utils";

void _unused;

const MEETING_ROWS = [{ id: "live", title: "Live meetings (recorded by Thread)", platform: "Any platform" }, ...PAST_MEETINGS.map((m) => ({ id: m.id, title: m.title, platform: m.platform }))];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Thread" },
      { name: "description", content: "Meeting reminders and alerts when recordings and transcripts are ready. Choose what Thread tells you." },
      { property: "og:title", content: "Notifications — Thread" },
      { property: "og:description", content: "Meeting reminders and alerts when recordings and transcripts are ready." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

const ICON = { reminder: CalendarClock, recording: Mic, transcript: FileText, moment: Zap } as const;

function Row({ title, desc, checked, onChange, children }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
        {children}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    setPrefs(loadPrefs());
    setItems(loadNotifs());
    return onNotifsChanged(() => setItems(loadNotifs()));
  }, []);

  const update = (p: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...p };
    setPrefs(next);
    savePrefs(next);
  };

  async function toggleBrowser(v: boolean) {
    if (v && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast.error("Browser notifications were blocked"); return; }
    }
    update({ browserPush: v });
  }

  const unread = items.filter((i) => !i.read).length;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-10">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Bell className="size-5 text-primary" /> Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose what Thread tells you about — and see everything it has sent.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="glass-panel p-5">
          <h2 className="meta-chip text-muted-foreground">Preferences</h2>
          <Row title="Meeting reminders" desc="From your connected Google Calendar, with a join link." checked={prefs.reminders} onChange={(v) => update({ reminders: v })}>
            <div className={cn("mt-3 space-y-3", !prefs.reminders && "pointer-events-none opacity-40")}>
              <div>
                <p className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Remind me before</p>
                <div className="flex flex-wrap gap-1.5">
                  {REMINDER_CHOICES.map((m) => {
                    const on = prefs.reminderOffsets.includes(m);
                    return (
                      <button key={m} aria-pressed={on} onClick={() => update({ reminderOffsets: on ? prefs.reminderOffsets.filter((x) => x !== m) : [...prefs.reminderOffsets, m].sort((a, b) => a - b) })}
                        className={cn("rounded-full border px-2.5 py-1 text-xs transition", on ? "border-primary/50 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:border-primary/30")}>
                        {fmtOffset(m)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">For meetings on</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((pl) => {
                    const on = prefs.platforms[pl] !== false;
                    return (
                      <button key={pl} aria-pressed={on} onClick={() => update({ platforms: { ...prefs.platforms, [pl]: !on } })}
                        className={cn("rounded-full border px-2.5 py-1 text-xs transition", on ? "border-primary/50 bg-primary/15 text-foreground" : "border-border text-muted-foreground line-through hover:border-primary/30")}>
                        {pl}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={prefs.quietHours.on} onCheckedChange={(v) => update({ quietHours: { ...prefs.quietHours, on: v } })} aria-label="Quiet hours" />
                Quiet hours from
                <select value={prefs.quietHours.start} onChange={(e) => update({ quietHours: { ...prefs.quietHours, start: Number(e.target.value) } })} className="rounded-md border border-border bg-background/60 px-2 py-1 text-foreground">
                  {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                </select>
                to
                <select value={prefs.quietHours.end} onChange={(e) => update({ quietHours: { ...prefs.quietHours, end: Number(e.target.value) } })} className="rounded-md border border-border bg-background/60 px-2 py-1 text-foreground">
                  {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                </select>
              </label>
            </div>
          </Row>
          <Row title="Recording ready" desc="When a meeting recording finishes saving." checked={prefs.recordingReady} onChange={(v) => update({ recordingReady: v })} />
          <Row title="Transcript ready" desc="When the full transcript is ready to read or analyze." checked={prefs.transcriptReady} onChange={(v) => update({ transcriptReady: v })} />
          <div className="border-b border-border py-4">
            <p className="text-sm font-medium">Choose which meetings notify you</p>
            <p className="text-xs text-muted-foreground">Per meeting: recording and transcript alerts.</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-background/40 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Meeting</span><span className="w-16 text-center">Recording</span><span className="w-16 text-center">Transcript</span>
              </div>
              {MEETING_ROWS.map((m) => {
                const mp = meetingPref(prefs, m.id);
                const set = (k: "recording" | "transcript", v: boolean) => update({ perMeeting: { ...prefs.perMeeting, [m.id]: { ...mp, [k]: v } } });
                return (
                  <div key={m.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-border px-3 py-2.5">
                    <div className="min-w-0"><p className="truncate text-sm">{m.title}</p><p className="text-[11px] text-muted-foreground">{m.platform}</p></div>
                    <div className="flex w-16 justify-center"><Switch checked={mp.recording && prefs.recordingReady} disabled={!prefs.recordingReady} onCheckedChange={(v) => set("recording", v)} aria-label={`${m.title} recording`} /></div>
                    <div className="flex w-16 justify-center"><Switch checked={mp.transcript && prefs.transcriptReady} disabled={!prefs.transcriptReady} onCheckedChange={(v) => set("transcript", v)} aria-label={`${m.title} transcript`} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <Row title="Live moments" desc="Deadlines, links and action items detected during a meeting." checked={prefs.moments} onChange={(v) => update({ moments: v })} />
          <Row title="Browser notifications" desc="Also show alerts outside this tab." checked={prefs.browserPush} onChange={(v) => void toggleBrowser(v)} />
          <button
            onClick={() => { pushNotif({ id: `test-${Date.now()}`, kind: "reminder", title: "Test reminder", body: "This is how meeting reminders look." }); toast("Test reminder", { description: "This is how meeting reminders look." }); }}
            className="mt-3 rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            Send a test notification
          </button>
        </section>

        <section className="glass-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="meta-chip text-muted-foreground">Inbox · {unread} unread</h2>
            <div className="flex gap-2">
              <button onClick={() => saveNotifs(items.map((i) => ({ ...i, read: true })))} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><CheckCheck className="size-3.5" /> Mark all read</button>
              <button onClick={() => saveNotifs([])} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Trash2 className="size-3.5" /> Clear</button>
            </div>
          </div>
          <div className="thin-scroll mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet. Play the demo to the end to get "Recording ready" and "Transcript ready".</p>}
            {items.map((n) => {
              const Icon = ICON[n.kind];
              const Wrap = n.href ? "a" : "div";
              return (
                <Wrap
                  key={n.id}
                  {...(n.href ? { href: n.href, ...(n.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {}) } : {})}
                  onClick={() => saveNotifs(items.map((i) => (i.id === n.id ? { ...i, read: true } : i)))}
                  className={cn("flex gap-3 rounded-xl border p-3 transition hover:border-primary/40", n.read ? "border-border bg-background/30" : "border-primary/30 bg-primary/5")}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(n.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                </Wrap>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
