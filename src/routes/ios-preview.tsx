import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LiveActivityWidget } from "@/components/LiveActivityWidget";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ios-preview")({
  head: () => ({
    meta: [
      { title: "iOS Companion — Thread" },
      { name: "description", content: "Interactive iPhone simulator: Thread's Live Activity and Dynamic Island in minimal, compact, and expanded modes." },
      { property: "og:title", content: "iOS Companion — Thread" },
      { property: "og:description", content: "Interactive iPhone simulator: Thread's Live Activity and Dynamic Island in minimal, compact, and expanded modes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IosPreview,
});

type IslandMode = "minimal" | "compact" | "expanded";

function DynamicIsland({ mode }: { mode: IslandMode }) {
  const { moments, activeSpeaker, playing } = useDemo();
  const initial = activeSpeaker.charAt(0) || "T";
  const lastMoment = moments.length > 0 ? moments[moments.length - 1] : undefined;

  if (!playing && moments.length === 0) {
    return (
      <div className="flex h-7 w-28 items-center justify-center rounded-full bg-black transition-all" />
    );
  }

  if (mode === "minimal") {
    return (
      <div className="flex h-7 w-28 items-center justify-center rounded-full bg-black transition-all">
        <span className={cn("size-1.5 rounded-full", playing ? "bg-blue-400 live-dot" : "bg-white/30")} />
      </div>
    );
  }
  if (mode === "compact") {
    return (
      <div className="flex h-7 w-44 items-center justify-between rounded-full bg-black px-3 transition-all">
        <div className="flex h-3 items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-eq w-[2px] rounded-full bg-blue-400" style={{ height: "100%", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span className="font-mono text-[10px] font-semibold text-blue-300">+{moments.length} moments</span>
      </div>
    );
  }
  return (
    <div className="w-72 rounded-[28px] bg-black p-3.5 transition-all">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-full bg-blue-500/30 text-[11px] font-bold text-blue-200">{initial}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-white/90">{activeSpeaker}</p>
          <p className="meta-chip text-white/40">Thread · Live</p>
        </div>
        <span className="size-1.5 rounded-full bg-red-500 live-dot" />
      </div>
      {lastMoment && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-white/65">{lastMoment.takeaway}</p>
      )}
    </div>
  );
}

function IosPreview() {
  const [island, setIsland] = useState<IslandMode>("compact");
  const { moments, actions, elapsed } = useDemo();
  const lastMoment = moments.length > 0 ? moments[moments.length - 1] : undefined;

  return (
    <main className="mx-auto grid w-full max-w-[1560px] grid-cols-1 gap-6 px-4 pb-10 pt-4 lg:grid-cols-[1fr_360px]">
      {/* Phone simulator */}
      <div className="flex items-center justify-center">
        <div className="relative aspect-[9/19.5] h-[74vh] max-h-[820px] overflow-hidden rounded-[52px] border border-white/15 bg-gradient-to-b from-[#0b1226] via-[#07080c] to-[#0c0a1a] shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
          <div className="absolute left-1/2 top-3 -translate-x-1/2">
            <DynamicIsland mode={island} />
          </div>
          <div className="mt-20 px-6 text-center">
            <p className="meta-chip text-white/40">iPhone 16 Pro · ActivityKit simulator</p>
            <p className="mt-2 text-sm text-white/60">
              Your phone stays locked in your pocket. Thread pushes only ~410-byte moment updates — no raw audio, no battery drain.
            </p>
          </div>
          <div className="absolute inset-x-3 bottom-20">
            <LiveActivityWidget />
          </div>
          <div className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="glass-panel p-4">
          <h2 className="meta-chip text-muted-foreground">Dynamic Island Mode</h2>
          <div className="mt-3 flex gap-2">
            {(["minimal", "compact", "expanded"] as IslandMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setIsland(m)}
                className={cn(
                  "meta-chip flex-1 rounded-full px-3 py-2 ring-1 transition",
                  island === m ? "bg-primary/20 text-primary ring-primary/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4">
          <h2 className="meta-chip text-muted-foreground">Push Payload (ActivityKit ≤ 4KB)</h2>
          <pre className="thin-scroll mt-3 overflow-x-auto rounded-lg bg-black/50 p-3 font-mono text-[10px] leading-relaxed text-emerald-300/90 ring-1 ring-white/10">
{`{
  "speakerName": "${lastMoment?.speaker ?? "Sarah Chen"}",
  "shortSummary": "${(lastMoment?.takeaway ?? "Listening…").slice(0, 60)}",
  "momentType": "${lastMoment?.type ?? "NONE"}",
  "meetingDuration": ${elapsed},
  "importantMomentCount": ${moments.length},
  "actionCount": ${actions.length},
  "resourceCaptured": ${moments.some((m) => m.type === "RESOURCE")}
}`}
          </pre>
          <p className="mt-2 text-[11px] text-muted-foreground">≈ 410 bytes over APNs — raw transcripts never leave the laptop.</p>
        </div>

        <div className="glass-panel p-4">
          <h2 className="meta-chip text-muted-foreground">Why it matters</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Driving to campus? Stuck in transit? Thread keeps the meeting on your lock screen — the deadline, the link, the QR code — and its agent is already drafting your next move before you sit down.
          </p>
        </div>
      </div>
    </main>
  );
}
