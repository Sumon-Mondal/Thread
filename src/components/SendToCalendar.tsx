import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Check, Loader2 } from "lucide-react";

/** Creates a real Google Calendar event (defaults: tomorrow 9:00 local, 30 min). */
export function SendToCalendar({ title, notes, start: startIso, durationMin, label, prefix = "Action: " }: { title: string; notes?: string; start?: string; durationMin?: number; label?: string; prefix?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [link, setLink] = useState<string | null>(null);
  async function go() {
    setState("busy");
    let start = startIso ? new Date(startIso) : new Date(NaN);
    if (isNaN(start.getTime())) {
      start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);
    }
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${prefix}${title}`.slice(0, 200), start: start.toISOString(), durationMin: Math.min(600, Math.max(5, Math.round(durationMin ?? 30))), notes: notes ?? "Action item from a Thread meeting" }),
      });
      const data = (await res.json()) as { error?: string; htmlLink?: string | null };
      if (!res.ok) throw new Error(data.error ?? "Calendar error");
      setLink(data.htmlLink ?? null);
      setState("done");
      toast.success("Added to your Google Calendar (tomorrow 9:00)");
    } catch (e) {
      setState("idle");
      toast.error(e instanceof Error ? e.message : "Calendar error");
    }
  }
  if (state === "done")
    return (
      <a href={link ?? "https://calendar.google.com"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-400">
        <Check className="size-3" /> In Google Calendar
      </a>
    );
  return (
    <button onClick={go} disabled={state === "busy"} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] ring-1 ring-border hover:bg-secondary/70">
      {state === "busy" ? <Loader2 className="size-3 animate-spin" /> : <CalendarPlus className="size-3" />} Send to Google Calendar
    </button>
  );
}
