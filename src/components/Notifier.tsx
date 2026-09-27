import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo-store";
import { fmtOffset, inQuietHours, loadPrefs, meetingPref, pushNotif, type CalEvent } from "@/lib/notifications";

/** Background watcher: meeting reminders (from Google Calendar) + recording/transcript-ready + moment alerts. */
export function Notifier() {
  const { playing, elapsed, scenario, moments } = useDemo();
  const wasPlaying = useRef(false);
  const seenMoments = useRef(new Set<string>());

  // Recording / transcript ready when a demo meeting finishes
  useEffect(() => {
    const ended = wasPlaying.current && !playing && elapsed >= scenario.endSec - 1;
    wasPlaying.current = playing;
    if (!ended) return;
    const p = loadPrefs();
    const mp = meetingPref(p, "live");
    const stamp = Date.now();
    if (p.recordingReady && mp.recording && pushNotif({ id: `rec-${stamp}`, kind: "recording", title: "Recording ready", body: `${scenario.meetingTitle} recording is saved.`, href: "/meetings" }))
      toast.success("Recording ready", { description: scenario.meetingTitle });
    setTimeout(() => {
      const q = loadPrefs();
      if (q.transcriptReady && meetingPref(q, "live").transcript && pushNotif({ id: `tr-${stamp}`, kind: "transcript", title: "Transcript ready", body: `Full transcript for ${scenario.meetingTitle} is ready.`, href: "/insights" }))
        toast.success("Transcript ready", { description: "Open it or extract AI insights" });
    }, 1500);
  }, [playing, elapsed, scenario]);

  // Moment alerts
  useEffect(() => {
    if (!loadPrefs().moments) return;
    for (const m of moments) {
      if (seenMoments.current.has(m.id)) continue;
      seenMoments.current.add(m.id);
      pushNotif({ id: `mo-${m.id}-${scenario.id}`, kind: "moment", title: `${m.type}: ${m.takeaway}`, body: m.detail.slice(0, 140), href: "/" });
    }
  }, [moments, scenario.id]);

  // Meeting reminders from the connected calendar
  useEffect(() => {
    let events: CalEvent[] = [];
    let alive = true;
    fetch("/api/calendar")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d: { events?: CalEvent[] }) => { if (alive) events = d.events ?? []; })
      .catch(() => {});
    const check = () => {
      const p = loadPrefs();
      if (!p.reminders || inQuietHours(p)) return;
      const now = Date.now();
      const offsets = p.reminderOffsets.length ? p.reminderOffsets : [p.reminderMinutes];
      for (const e of events) {
        if (!e.start.includes("T")) continue; // skip all-day
        if (p.platforms[e.platform] === false) continue;
        const mins = (new Date(e.start).getTime() - now) / 60000;
        for (const off of offsets) {
          if (mins > 0 && mins <= off && mins > off - 1.5) {
            if (pushNotif({ id: `rem-${e.id}-${off}`, kind: "reminder", title: `Starting in ${fmtOffset(Math.ceil(mins))}: ${e.title}`, body: `${e.platform}${e.joinUrl ? " · tap to join" : ""}`, ...(e.joinUrl ? { href: e.joinUrl } : {}) }))
              toast(`Meeting in ${fmtOffset(Math.ceil(mins))}`, { description: e.title });
          }
        }
      }
    };
    const id = setInterval(check, 30000);
    const first = setTimeout(check, 4000);
    return () => { alive = false; clearInterval(id); clearTimeout(first); };
  }, []);

  return null;
}
