import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, Check, ChevronRight, Clock, Sparkles, X } from "lucide-react";
import { formatClock } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { MomentBadge } from "@/components/MomentBadge";
import { cn } from "@/lib/utils";

/**
 * Dynamic Island — lives top-center under the nav. Collapses to a pill,
 * expands when a new Moment is detected or when tapped.
 * Displays the real-time meeting gist and quick executable agent actions.
 */
export function DynamicIsland() {
  const { latestMoment, elapsed, playing, mode, activeSpeaker, transcript } = useDemo();
  const [expanded, setExpanded] = useState(false);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Record<string, "approved" | "snoozed">>({});
  const lastSeen = useRef<string | null>(null);
  // Only consider meeting active if demo playback is running OR live meeting is actively connected/streaming
  const isMeetingActive = playing || (mode === "live" && ((transcript && transcript.length > 0) || Boolean(latestMoment)));

  // Auto-expand + toast when a new moment lands during an active meeting
  useEffect(() => {
    if (!isMeetingActive || !latestMoment || latestMoment.id === lastSeen.current) return;
    lastSeen.current = latestMoment.id;
    setDismissedId(null);
    setExpanded(true);
    toast(`Meeting Gist: ${latestMoment.type.toLowerCase()}`, {
      description: latestMoment.takeaway,
      icon: <Bell className="size-4 text-primary" />,
    });
    const t = setTimeout(() => setExpanded(false), 9000);
    return () => clearTimeout(t);
  }, [latestMoment, isMeetingActive]);

  const moment = latestMoment && latestMoment.id !== dismissedId ? latestMoment : null;
  const state = moment ? decision[moment.id] : undefined;

  // Real deployable behavior: DO NOT render Dynamic Island or notification when no meeting is running!
  // Only render when the meeting is actively running (demo playback or live call).
  if (!isMeetingActive) {
    return null;
  }

  const lastLine = transcript && transcript.length > 0 ? transcript[transcript.length - 1] : null;
  const gistText = moment
    ? moment.takeaway
    : lastLine
      ? lastLine.text
      : live
        ? "AI listening to meeting conversation..."
        : "Meeting standby";

  const gistSpeaker = moment?.speaker || lastLine?.speaker || activeSpeaker || "Meeting";
  const gistTime = moment ? formatClock(moment.timeSec) : formatClock(elapsed);

  return (
    <div className="pointer-events-none fixed left-1/2 top-[4.5rem] z-50 -translate-x-1/2">
      <div
        className={cn(
          "pointer-events-auto overflow-hidden rounded-full border border-white/10 bg-black/90 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          expanded ? "w-[420px] rounded-3xl" : "w-auto max-w-[90vw]",
        )}
      >
        {/* Collapsed pill */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-2 px-3.5 py-2 text-left"
          title="Click to view full Meeting Gist"
        >
          <span className={cn("size-2 shrink-0 rounded-full", live ? "bg-live live-dot" : "bg-muted-foreground/50")} />
          <span className="shrink-0 font-bold text-xs text-white">{gistSpeaker}</span>
          <span className="shrink-0 text-white/30">•</span>
          <span className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-400">
            Gist
          </span>
          {moment && <MomentBadge type={moment.type} />}
          <span className="max-w-[260px] truncate text-xs font-medium text-white/90">
            {gistText}
          </span>
          <ChevronRight
            className={cn("size-3.5 shrink-0 text-white/50 transition-transform duration-300 ml-auto", expanded && "rotate-90")}
          />
        </button>

        {/* Expanded card */}
        {expanded && (
          <div className="border-t border-white/10 px-4 pb-3.5 pt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-cyan-300">
                    <Sparkles className="size-3 text-cyan-300" />
                    LIVE MEETING GIST
                  </span>
                  {moment && <MomentBadge type={moment.type} />}
                </div>
                <p className="text-sm font-semibold leading-snug text-white">
                  "{gistText}"
                </p>
                <p className="mt-1 text-xs text-white/55">
                  {gistSpeaker} · {gistTime}
                </p>
              </div>
              <button
                onClick={() => {
                  if (moment) setDismissedId(moment.id);
                  setExpanded(false);
                }}
                className="rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {state ? (
              <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-center text-xs font-medium text-emerald-400">
                {state === "approved" ? "✓ Sent to agent — action queued" : "⏰ Reminder set for after the meeting"}
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    if (moment) setDecision((d) => ({ ...d, [moment.id]: "approved" }));
                    toast.success("Meeting Gist approved for Agent action");
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/85"
                >
                  <Check className="size-3.5" /> Approve Action
                </button>
                <button
                  onClick={() => {
                    if (moment) setDecision((d) => ({ ...d, [moment.id]: "snoozed" }));
                    toast.info("Reminder set");
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
                >
                  <Clock className="size-3.5" /> Remind me
                </button>
                <Link
                  to="/post-meeting"
                  className="flex flex-1 items-center justify-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
                >
                  Review
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
