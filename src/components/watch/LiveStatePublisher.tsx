// Publishes the live meeting snapshot for the future Apple Watch app and iPhone widget. Renders nothing.
import { useEffect, useRef } from "react";
import { useDemo } from "@/lib/demo-store";

export function LiveStatePublisher() {
  const { scenario, playing, elapsed, activeSpeaker, transcript, moments, actions, executeAction } = useDemo();
  const execRef = useRef(executeAction);
  execRef.current = executeAction;
  const ref = useRef({ scenario, playing, elapsed, activeSpeaker, transcript, moments, actions });
  ref.current = { scenario, playing, elapsed, activeSpeaker, transcript, moments, actions };
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = ref.current;
      if (!s.playing && s.elapsed === 0) return;
      const m = s.moments[s.moments.length - 1];
      void fetch("/api/live-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingTitle: s.scenario.meetingTitle.slice(0, 200),
          playing: s.playing,
          elapsed: Math.floor(s.elapsed),
          speaker: (s.activeSpeaker || "").slice(0, 100),
          lastLine: (s.transcript[s.transcript.length - 1]?.text ?? "").slice(0, 500),
          momentCount: s.moments.length,
          latestMoment: m ? { type: m.type, takeaway: m.takeaway.slice(0, 300) } : null,
          actions: s.actions.slice(0, 20).map((a) => ({ id: a.id.slice(0, 60), label: a.label.slice(0, 200), status: a.status })),
        }),
      })
        .then((r) => r.json() as Promise<{ commands?: { command: string; actionId?: string }[] }>)
        .then((d) => {
          for (const c of d.commands ?? []) {
            if (c.command !== "approve") continue;
            const target = c.actionId ?? ref.current.actions.find((a) => a.status === "staged")?.id;
            if (target) execRef.current(target);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
