import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell, Check, ChevronRight, Clock, X } from "lucide-react";
import { formatClock } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { MomentBadge } from "@/components/MomentBadge";
import { cn } from "@/lib/utils";

/**
 * Dynamic Island — lives top-center under the nav. Collapses to a pill,
 * expands when a new Moment is detected or when tapped. Offers quick
 * options: Approve, Remind me, Dismiss.
 */
export function DynamicIsland() {
  const { latestMoment, elapsed, playing, mode } = useDemo();
  const [expanded, setExpanded] = useState(false);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Record<string, "approved" | "snoozed">>({});
  const lastSeen = useRef<string | null>(null);
  const live = playing || mode === "live";

  // Auto-expand + toast when a new moment lands
  useEffect(() => {
    if (!latestMoment || latestMoment.id === lastSeen.current) return;
    lastSeen.current = latestMoment.id;
    setDismissedId(null);
    setExpanded(true);
    toast(`New ${latestMoment.type.toLowerCase()} detected`, {
      description: latestMoment.takeaway,
      icon: <Bell className="size-4 text-primary" />,
    });
    const t = setTimeout(() => setExpanded(false), 9000);
    return () => clearTimeout(t);
  }, [latestMoment]);

  const moment = latestMoment && latestMoment.id !== dismissedId ? latestMoment : null;
  const state = moment ? decision[moment.id] : undefined;

  return (
    <div className="pointer-events-none fixed left-1/2 top-[4.5rem] z-50 -translate-x-1/2">
      <div
        className={cn(
          "pointer-events-auto overflow-hidden rounded-full border border-white/10 bg-black/85 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          expanded && moment ? "w-[380px] rounded-3xl" : "w-auto",
        )}
      >
        {/* Collapsed pill */}
        <button
          onClick={() => moment && setExpanded((e) => !e)}
          className="flex w-full items-center gap-2 px-4 py-2"
        >
          <span className={cn("size-2 rounded-full", live ? "bg-live live-dot" : "bg-muted-foreground/50")} />
          {moment ? (
            <>
              <MomentBadge type={moment.type} />
              <span className="max-w-[180px] truncate text-xs text-white/80">{moment.takeaway}</span>
            </>
          ) : (
            <span className="text-xs text-white/60">{live ? "Listening…" : "Thread Island"}</span>
          )}
          {moment && (
            <ChevronRight
              className={cn("size-3.5 text-white/50 transition-transform duration-300", expanded && "rotate-90")}
            />
          )}
        </button>

        {/* Expanded card */}
        {expanded && moment && (
          <div className="border-t border-white/10 px-4 pb-3 pt-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium leading-snug text-white">{moment.takeaway}</p>
                <p className="mt-1 text-xs text-white/55">
                  {moment.speaker} · {formatClock(moment.timeSec)}
                </p>
              </div>
              <button
                onClick={() => {
                  setDismissedId(moment.id);
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
                  onClick={() => setDecision((d) => ({ ...d, [moment.id]: "approved" }))}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/85"
                >
                  <Check className="size-3.5" /> Approve
                </button>
                <button
                  onClick={() => setDecision((d) => ({ ...d, [moment.id]: "snoozed" }))}
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
