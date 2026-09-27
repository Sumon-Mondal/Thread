import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Sparkles, Mic, Cpu, Globe, CheckCircle2 } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { SCENARIO_LIST } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { mode, setMode, scenario, setScenario } = useDemo();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="App Settings & Mode"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          <Settings className="size-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-white/10 bg-[#0d1117] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Settings className="size-4 text-primary" />
            Thread Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 1. Mode Selection */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <p className="text-xs font-semibold text-foreground/90">Operation Mode</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Choose whether Thread listens to real live meetings or runs the judge pitch demo.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("live")}
                className={cn(
                  "flex flex-col items-start rounded-lg border p-2.5 text-left transition",
                  mode === "live"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Mic className="size-3.5" />
                  Live Meeting
                </div>
                <span className="mt-1 text-[10px] opacity-80">
                  Real Google Meet, Zoom, or microphone capture.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("demo")}
                className={cn(
                  "flex flex-col items-start rounded-lg border p-2.5 text-left transition",
                  mode === "demo"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Sparkles className="size-3.5" />
                  Judge Demo
                </div>
                <span className="mt-1 text-[10px] opacity-80">
                  Curated Discovery Day scenario for pitches.
                </span>
              </button>
            </div>

            {mode === "demo" && (
              <div className="mt-3 border-t border-white/5 pt-2.5">
                <label className="text-[11px] font-medium text-muted-foreground">Demo Scenario:</label>
                <select
                  value={scenario.id}
                  onChange={(e) => setScenario(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-foreground outline-none"
                >
                  {SCENARIO_LIST.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Real-World Connections */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5">
            <p className="text-xs font-semibold text-foreground/90">Real-World Meeting Connectors</p>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="size-3.5 text-cyan-400" />
                Chrome Extension (Meet / Zoom)
              </span>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                READY
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="size-3.5 text-purple-400" />
                Cloud Virtual Machine Worker
              </span>
              <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                ACTIVE
              </span>
            </div>
          </div>

          {/* 3. AI Engine */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
            <p className="text-xs font-semibold text-foreground/90">AI Model & Fallback</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-mono text-cyan-400">OpenAI (gpt-4o-mini)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quota Resilience:</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="size-3" />
                Autonomous Fallback Active
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
