import type { MomentType } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const MOMENT_STYLES: Record<MomentType, { label: string; classes: string; dot: string; border: string }> = {
  OPPORTUNITY: { label: "Opportunity", classes: "bg-blue-500/15 text-blue-400 ring-blue-500/30", dot: "bg-blue-400", border: "border-blue-500" },
  RESOURCE: { label: "Resource", classes: "bg-teal-500/15 text-teal-400 ring-teal-500/30", dot: "bg-teal-400", border: "border-teal-500" },
  DEADLINE: { label: "Deadline", classes: "bg-red-500/15 text-red-400 ring-red-500/30", dot: "bg-red-400", border: "border-red-500" },
  REQUIREMENT: { label: "Requirement", classes: "bg-violet-500/15 text-violet-400 ring-violet-500/30", dot: "bg-violet-400", border: "border-violet-500" },
  EVENT: { label: "Event", classes: "bg-amber-500/15 text-amber-400 ring-amber-500/30", dot: "bg-amber-400", border: "border-amber-500" },
  ACTION: { label: "Action", classes: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30", dot: "bg-emerald-400", border: "border-emerald-500" },
  DECISION: { label: "Decision", classes: "bg-pink-500/15 text-pink-400 ring-pink-500/30", dot: "bg-pink-400", border: "border-pink-500" },
};

export function MomentBadge({ type, className }: { type: MomentType; className?: string }) {
  const s = MOMENT_STYLES[type];
  return (
    <span className={cn("meta-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1", s.classes, className)}>
      <span className={cn("size-1 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
