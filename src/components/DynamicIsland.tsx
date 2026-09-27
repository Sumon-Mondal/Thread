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

  const isLive = playing || mode === "live";
  const lastLine = transcript && transcript.length > 0 ? transcript[transcript.length - 1] : null;
  const gistText = moment
    ? moment.takeaway
    : lastLine
      ? lastLine.text
      : isLive
        ? "AI listening to meeting conversation..."
        : "Meeting standby";

  const gistSpeaker = moment?.speaker || lastLine?.speaker || activeSpeaker || "Meeting";
  const gistTime = moment ? formatClock(moment.timeSec) : formatClock(elapsed);

  return (
    <div className="pointer-events-none fixed left-1/2 top-[4.5rem] z-50 -translate-x-1/2">
      <div
        className={cn(
          "pointer-events-auto overflow-hidden border bg-[#05070a]/95 shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          expanded
            ? "w-[440px] rounded-2xl border-cyan-500/40 ring-1 ring-cyan-500/20"
            : "w-auto max-w-[90vw] rounded-full border-white/15 hover:border-cyan-500/40",
        )}
      >
        {/* Collapsed pill */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-2.5 px-4 py-2 text-left"
          title="Click to expand Meeting Intelligence"
        >
          <span className={cn("size-2 shrink-0 rounded-full", isLive ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" : "bg-muted-foreground/50")} />
          <span className="shrink-0 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-[10px] font-black uppercase tracking-wider text-transparent">
            THREAD AI
          </span>
          <span className="shrink-0 text-white/30">•</span>
          <span className="shrink-0 font-bold text-xs text-white">{gistSpeaker}</span>
          {moment && <MomentBadge type={moment.type} />}
          <span className="max-w-[240px] truncate text-xs font-medium text-white/90">
            {gistText}
          </span>
          <ChevronRight
            className={cn("size-3.5 shrink-0 text-white/50 transition-transform duration-300 ml-auto", expanded && "rotate-90")}
          />
        </button>

        {/* Expanded card */}
        {expanded && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 ring-1 ring-white/20 text-[11px] font-black text-white">
                  {gistSpeaker.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">{gistSpeaker}</span>
                    <span className="text-[10px] text-white/40">·</span>
                    <span className="font-mono text-[10px] text-cyan-400 font-semibold">{gistTime}</span>
                  </div>
                  <span className="text-[10px] text-white/50">Live Executive Intelligence</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {moment && <MomentBadge type={moment.type} />}
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
            </div>

            {/* Gist Intelligence Card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-inner">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="size-3 text-cyan-400" />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-[9.5px] font-black uppercase tracking-wider text-transparent">
                  Key Meeting Gist
                </span>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-white">
                "{gistText}"
              </p>
            </div>

            {state ? (
              <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-center text-xs font-semibold text-emerald-400">
                {state === "approved" ? "✓ Sent to agent — action queued and executing" : "⏰ Reminder saved for post-meeting review"}
              </p>
            ) : (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (moment) setDecision((d) => ({ ...d, [moment.id]: "approved" }));
                    toast.success("Meeting Gist approved for Agent action");
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 px-3 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] transition hover:opacity-95 active:scale-[0.98]"
                >
                  <Check className="size-3.5 stroke-[2.5]" /> Approve Action
                </button>
                <button
                  onClick={() => {
                    if (moment) setDecision((d) => ({ ...d, [moment.id]: "snoozed" }));
                    toast.info("Reminder set");
                  }}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <Clock className="size-3.5" /> Remind
                </button>
                <Link
                  to="/post-meeting"
                  className="flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
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
