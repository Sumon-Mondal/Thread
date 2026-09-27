import { formatClock, type Moment } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { MomentBadge } from "./MomentBadge";
import { cn } from "@/lib/utils";

/**
 * Live Status panel for the web cockpit. Also reused by the hidden
 * iOS preview pages (/ios-preview, /lockscreen) kept for the future mobile app.
 */
export function LiveActivityWidget({ compact = false }: { compact?: boolean }) {
  const { elapsed, moments, actions, latestMoment, activeSpeaker, playing, mode, scenario } = useDemo();
  const live = playing || mode === "live";
  const executed = actions.filter((a) => a.status === "executed").length;
  const resource = moments.find((m) => m.type === "RESOURCE");

  return (
    <div
      className={cn(
        "glass-panel overflow-hidden rounded-2xl",
        compact ? "text-xs" : "text-sm",
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-1.5">
          <span className={cn("relative size-1.5 rounded-full", live ? "bg-red-500 live-dot" : "bg-white/30")} />
          <span className="meta-chip text-red-400">Live Status</span>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-white/60">{formatClock(elapsed)}</span>
      </div>

      {/* Meeting title */}
      <p className="truncate px-4 pt-1 text-[13px] font-semibold text-white/90">{scenario.meetingTitle}</p>

      {/* Speaker + badge */}
      <div className="flex items-center gap-2 px-4 pt-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-blue-500/25 text-[10px] font-bold text-blue-300">
          {activeSpeaker.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <span className="text-xs font-medium text-white/80">{activeSpeaker}</span>
        {latestMoment && <MomentBadge type={latestMoment.type} className="ml-auto" />}
      </div>

      {/* Semantic summary */}
      <p className="px-4 pt-2 text-xs leading-relaxed text-white/65">
        {latestMoment
          ? latestMoment.takeaway
          : live
            ? "Listening — Thread will surface important moments here as they happen."
            : "Connecting to the meeting…"}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-white/8 px-4 py-2.5">
        <span className="text-[11px] text-white/50">
          {resource ? "🔗 Link captured ✓" : "🔗 Watching for links…"}
        </span>
        <span className="font-mono text-[10px] text-white/50">
          {moments.length} moments · {executed} actions
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 px-4 pb-3.5">
        <button className="flex-1 rounded-full bg-white/10 py-1.5 text-[11px] font-semibold text-white/85 transition hover:bg-white/15">
          Save
        </button>
        <button className="flex-1 rounded-full bg-blue-500/80 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-500">
          Apply / Remind Me
        </button>
      </div>
    </div>
  );
}
