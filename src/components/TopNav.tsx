import { Link } from "@tanstack/react-router";
import { Mic, RotateCcw, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { formatClock, SCENARIO_LIST } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";
import { startZoomIntro } from "@/components/ZoomCallIntro";
import threadLogo from "@/assets/thread-t.svg";

const NAV = [
  { to: "/", label: "Live Meeting" },
  // iOS Companion and Lock Screen routes are kept in the codebase for the future
  // mobile app but hidden from the web app menu (/ios-preview, /lockscreen).
  { to: "/meetings", label: "Meetings" },
  { to: "/agent", label: "Agent" },
  // Post-Meeting (/post-meeting) is superseded by Meetings in the menu; route kept.
  { to: "/insights", label: "AI Insights" },
  { to: "/integrations", label: "Integrations" },
  { to: "/notifications", label: "Alerts" },
  { to: "/analytics", label: "Analytics" },
] as const;

function VuMeter() {
  const [levels, setLevels] = useState<number[]>([3, 5, 8, 4, 6]);
  const { playing, mode } = useDemo();
  const active = playing || mode === "live";
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setLevels(Array.from({ length: 5 }, () => 2 + Math.random() * 8));
    }, 140);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className="flex h-3 items-end gap-[2px]" aria-hidden>
      {levels.map((h, i) => (
        <span
          key={i}
          className={cn("w-[2px] rounded-full transition-all duration-150", active ? "bg-emerald-400" : "bg-muted-foreground/40")}
          style={{ height: `${active ? h : 2}px` }}
        />
      ))}
    </div>
  );
}

export function TopNav() {
  const { elapsed, playing, mode, play, pause, reset, setMode, scenario, setScenario } = useDemo();
  const live = playing || mode === "live";

  return (
    <header className="panel sticky top-3 z-40 mx-auto mb-4 flex w-[calc(100%-1.5rem)] max-w-[1560px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-2.5 xl:flex-nowrap">
      {/* Brand + nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img src={threadLogo} alt="Thread logo" className="size-7 object-contain" />
          <span className="text-sm font-bold tracking-tight">Thread</span>
        </div>
        <nav className="hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Status + controls */}
      <div className="ml-auto flex items-center gap-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 ring-1",
            live ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "bg-white/5 text-muted-foreground ring-white/10",
          )}
        >
          <span className={cn("relative size-1.5 rounded-full", live ? "bg-emerald-400 live-dot" : "bg-muted-foreground/50")} />
          <span className="text-[11px] font-semibold uppercase tracking-wide">
            {live ? `Live · ${formatClock(elapsed)}` : "Ready"}
          </span>
          <VuMeter />
        </div>

        <div className="hidden h-5 w-px bg-white/10 xl:block" />

        {/* Demo control cluster */}
        <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.04] p-1">
          {mode === "demo" && (
            <select
              value={scenario.id}
              onChange={(e) => setScenario(e.target.value)}
              className="max-w-[150px] cursor-pointer bg-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground outline-none transition hover:text-foreground"
              title="Demo scenario"
            >
              {SCENARIO_LIST.map((s) => (
                <option key={s.id} value={s.id} className="bg-background text-foreground">
                  {s.label}
                </option>
              ))}
            </select>
          )}
          {mode === "demo" ? (
            <>
              <button
                onClick={startZoomIntro}
                title="Start with Zoom call"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <Video className="size-3.5" />
                <span className="hidden 2xl:inline">Zoom intro</span>
              </button>
              <button
                onClick={playing ? pause : play}
                className="rounded-lg bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/85"
              >
                {playing ? "Pause" : elapsed > 0 ? "Resume" : "Start Meeting"}
              </button>
              <button
                onClick={reset}
                title="Reset demo"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setMode("demo")}
              className="rounded-lg bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-red-500/15 hover:text-red-400 hover:ring-red-500/30"
              title="Stop live mic"
            >
              ● Live Mic — Stop
            </button>
          )}
          <button
            onClick={() => setMode(mode === "demo" ? "live" : "demo")}
            title={mode === "demo" ? "Use Live Mic" : "Use Demo"}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <Mic className="size-3.5" />
            <span className="hidden 2xl:inline">{mode === "demo" ? "Live Mic" : "Demo"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
