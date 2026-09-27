import { useState } from "react";
import { CalendarPlus, CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

function localInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Moves the current live meeting into Google Calendar with a Zoom link. */
export function AddToCalendar() {
  const { scenario } = useDemo();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ link: string | null } | null>(null);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState(45);
  const [zoom, setZoom] = useState("");
  const [attendees, setAttendees] = useState("");

  function openPanel() {
    const t = new Date(Date.now() + 24 * 3600e3);
    t.setMinutes(0, 0, 0);
    setTitle(`Follow-up: ${scenario.meetingTitle}`);
    setStart(localInput(t));
    setZoom("");
    setDone(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const emails = attendees.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          start: new Date(start).toISOString(),
          durationMin: duration,
          ...(zoom.trim() ? { zoomUrl: zoom.trim() } : {}),
          notes: `Scheduled from Thread during "${scenario.meetingTitle}" (${scenario.platform}).`,
          ...(emails.length ? { attendees: emails } : {}),
        }),
      });
      const data = (await res.json()) as { htmlLink?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not add to Google Calendar");
      setDone({ link: data.htmlLink ?? null });
      toast.success("Added to Google Calendar", { description: title });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add to Google Calendar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={openPanel} className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary/20">
        <CalendarPlus className="size-3.5 text-primary" /> Add to Calendar
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-popover p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Google Calendar · Meet or Zoom</p>
            <button aria-label="Close" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
          {done ? (
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="size-4" /> Added to your Google Calendar</p>
              <p className="text-xs text-muted-foreground">{title} · {new Date(start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {zoom.trim() ? "Zoom link included." : "Google Meet link created."}</p>
              {done.link && (
                <a href={done.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground">
                  Open in Calendar <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {[
                ["Title", <input key="t" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm" />],
                ["Starts", <input key="s" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm" />],
                ["Duration", (
                  <select key="d" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm">
                    {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                )],
                ["Zoom link (optional)", <input key="z" value={zoom} placeholder="Leave blank for a real Google Meet link" onChange={(e) => setZoom(e.target.value)} className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-1.5 font-mono text-[11px]" />],
                ["Invite (emails, optional)", <input key="a" value={attendees} placeholder="name@example.com" onChange={(e) => setAttendees(e.target.value)} className="w-full rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm" />],
              ].map(([label, el]) => (
                <label key={label as string} className="block space-y-1"><span className="text-muted-foreground">{label}</span>{el}</label>
              ))}
              <p className="text-[10px] text-muted-foreground">Leave Zoom blank and Google creates a real Meet link automatically.</p>
              <button onClick={() => void save()} disabled={busy || !title.trim() || !start} className={cn("flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50")}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CalendarPlus className="size-3.5" />} Add to Google Calendar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
