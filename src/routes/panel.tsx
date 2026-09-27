import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { MomentsPanel, TranscriptPanel, AgentQueuePanel, ChatPanel, formatTime } from "@/components/LivePanels";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Thread Side Panel — Zoom & Meet" },
      { name: "description", content: "Thread's compact side panel for Zoom and Google Meet: live moments, transcript and agent actions beside your call." },
      { property: "og:title", content: "Thread Side Panel — Zoom & Meet" },
      { property: "og:description", content: "Live moments, transcript and agent actions beside your Zoom or Meet call." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SidePanel,
});

const TABS = ["Moments", "Transcript", "Queue", "Agent"] as const;
type Tab = (typeof TABS)[number];

function SidePanel() {
  const { elapsed, playing, play, pause, reset, nextMoment, mode, setMode, actions, moments, meetingTitle, meetingPlatform, liveMeeting } = useDemo();
  const [tab, setTab] = useState<Tab>("Moments");
  const staged = actions.filter((a) => a.status === "staged").length;
  const badge = mode === "live" ? (liveMeeting ? (liveMeeting.endedAt ? "ENDED" : "LIVE") : "MIC") : playing ? "LIVE" : "READY";
  const people = liveMeeting ? ` · ${liveMeeting.participants.length} ${liveMeeting.participants.length === 1 ? "person" : "people"}` : "";
  const btn = "flex size-8 items-center justify-center rounded-lg bg-white/5 text-foreground/80 hover:bg-white/10";

  return (
    <div className="mx-auto flex h-screen w-full max-w-[440px] flex-col gap-2 p-2">
      <header className="panel flex items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">Thread</p>
          <p className="truncate text-[10px] text-muted-foreground">{meetingTitle} · {meetingPlatform}{people}</p>
        </div>
        <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-mono text-[10px] text-red-300">
          {badge} {formatTime(elapsed)}
        </span>
        {mode === "demo" && (
          <>
            <button aria-label={playing ? "Pause" : "Play"} onClick={playing ? pause : play} className={btn}>
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button aria-label="Next moment" onClick={nextMoment} className={btn}><SkipForward className="size-4" /></button>
            <button aria-label="Reset" onClick={reset} className={btn}><RotateCcw className="size-4" /></button>
          </>
        )}
        {!liveMeeting && (
          <button
            aria-label="Live mic"
            onClick={() => setMode(mode === "demo" ? "live" : "demo")}
            className={cn(btn, mode === "live" && "bg-red-500/25 text-red-300")}
          >
            <Mic className="size-4" />
          </button>
        )}
      </header>
      <nav className="panel grid grid-cols-4 gap-1 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-lg py-1.5 text-[11px] font-medium", tab === t ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {t}
            {t === "Moments" && moments.length > 0 && ` ${moments.length}`}
            {t === "Queue" && staged > 0 && <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 text-amber-300">{staged}</span>}
          </button>
        ))}
      </nav>
      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "Moments" && <MomentsPanel />}
        {tab === "Transcript" && <TranscriptPanel />}
        {tab === "Queue" && <AgentQueuePanel />}
        {tab === "Agent" && <ChatPanel />}
      </div>
    </div>
  );
}
