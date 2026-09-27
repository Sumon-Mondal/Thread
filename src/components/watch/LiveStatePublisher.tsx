// Publishes the live meeting snapshot for the iPhone app, widget and watch, and runs approvals sent back from them. Renders nothing.
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo-store";

export function LiveStatePublisher() {
  const demo = useDemo();
  const ref = useRef(demo);
  ref.current = demo;
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = ref.current;
      if (!s.playing && s.elapsed === 0) return;
      const m = s.moments[s.moments.length - 1];
      const headline = m
        ? m.headline ?? m.takeaway.split(/[.:;]/)[0] ?? m.takeaway
        : s.activeSpeaker ? `${s.activeSpeaker} speaking` : "Live Call";
      const shortHeadline = headline.length > 35 ? `${headline.slice(0, 32)}…` : headline;
      const status = s.playing ? "live" : s.liveMeeting?.endedAt || s.elapsed >= s.scenario.endSec ? "ended" : "paused";
      void fetch("/api/live-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingTitle: s.meetingTitle.slice(0, 200),
          playing: s.playing,
          status,
          elapsed: Math.floor(s.elapsed),
          speaker: (s.activeSpeaker || "").slice(0, 100),
          speakerRole: (s.activeSpeakerRole || "").slice(0, 100),
          platform: s.meetingPlatform.slice(0, 50),
          lastLine: (s.transcript[s.transcript.length - 1]?.text ?? "").slice(0, 500),
          shortHeadline,
          liveSummary: (m ? m.takeaway : (s.transcript[s.transcript.length - 1]?.text ?? "")).slice(0, 300),
          source: s.liveMeeting ? "extension" : "web",
          momentCount: s.moments.length,
          latestMoment: m ? { type: m.type, takeaway: m.takeaway.slice(0, 300) } : null,
          actions: s.actions.slice(0, 50).map((a) => ({
            id: a.id.slice(0, 60),
            label: a.label.slice(0, 200),
            status: a.status,
            kind: a.kind,
            detail: a.detail.slice(0, 500),
            ...(a.link ? { link: a.link.slice(0, 500) } : {}),
          })),
          transcript: s.transcript.slice(-20).map((l) => ({
            id: l.id.slice(0, 60),
            speaker: l.speaker.slice(0, 100),
            role: l.role.slice(0, 100),
            text: l.text.slice(0, 1000),
            timeSec: l.timeSec,
          })),
          moments: s.moments.slice(-20).map((x) => ({
            id: x.id.slice(0, 60),
            type: x.type,
            speaker: x.speaker.slice(0, 100),
            timeSec: x.timeSec,
            takeaway: x.takeaway.slice(0, 300),
            detail: x.detail.slice(0, 1000),
            ...(x.headline ? { headline: x.headline.slice(0, 60) } : {}),
            ...(x.link ? { link: x.link.slice(0, 500) } : {}),
          })),
        }),
      })
        .then((r) => r.json() as Promise<{ commands?: { command: string; actionId?: string }[] }>)
        .then(async (d) => {
          for (const c of d.commands ?? []) {
            if (c.command !== "approve") continue;
            const target = c.actionId ?? ref.current.actions.find((a) => a.status === "staged")?.id;
            const action = ref.current.actions.find((a) => a.id === target);
            if (!target || !action || action.status === "executed") continue;
            const result = await ref.current.approveAction(target);
            if (result.ok) toast.success(`Approved from iPhone: ${action.label}`);
            else toast.error(`iPhone approval didn't go through — ${result.error ?? "try again"}`);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
