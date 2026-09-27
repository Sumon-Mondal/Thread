// Future watchOS companion — web mockups of the Apple Watch experience.
// Hidden from the web UI (route /watch is not linked in the menu).
import { useState, type ReactNode } from "react";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

export function WatchFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-[3.2rem] bg-secondary p-3 shadow-2xl ring-1 ring-border">
        <div className="absolute -right-2 top-16 h-10 w-2 rounded-r-md bg-muted" />
        <div className="absolute -right-1.5 top-32 h-6 w-1.5 rounded-r-md bg-muted" />
        <div className="h-[242px] w-[198px] overflow-hidden rounded-[2.6rem] bg-background p-3 ring-1 ring-border">
          {children}
        </div>
      </div>
      <p className="meta-chip text-muted-foreground">{label}</p>
    </div>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function WatchFace() {
  const { moments, playing, elapsed } = useDemo();
  return (
    <div className="flex h-full flex-col justify-between">
      <p className="text-right text-xs text-muted-foreground">Thread</p>
      <p className="text-center text-5xl font-semibold tracking-tight">10:09</p>
      <div className="flex justify-between">
        <div className="flex size-14 flex-col items-center justify-center rounded-full ring-2 ring-primary">
          <span className="text-sm font-bold">{moments.length}</span>
          <span className="text-[9px] text-muted-foreground">moments</span>
        </div>
        <div className="flex size-14 flex-col items-center justify-center rounded-full ring-2 ring-border">
          <span className={cn("size-2 rounded-full", playing ? "bg-primary live-dot" : "bg-muted-foreground")} />
          <span className="text-[10px]">{fmt(elapsed)}</span>
        </div>
      </div>
    </div>
  );
}

export function WatchLive() {
  const { scenario, activeSpeaker, elapsed, playing, transcript } = useDemo();
  const last = transcript[transcript.length - 1];
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={cn("size-2 rounded-full", playing ? "bg-destructive live-dot" : "bg-muted-foreground")} />
        <span className="text-[11px] font-semibold">{playing ? "LIVE" : "PAUSED"} · {fmt(elapsed)}</span>
      </div>
      <p className="line-clamp-2 text-sm font-semibold leading-tight">{scenario.meetingTitle}</p>
      <p className="text-[11px] text-primary">{activeSpeaker || "Waiting…"}</p>
      <p className="line-clamp-4 text-[11px] leading-snug text-muted-foreground">{last?.text ?? "Connecting to the meeting…"}</p>
    </div>
  );
}

export function WatchMoment() {
  const { moments } = useDemo();
  const m = moments[moments.length - 1];
  const [state, setState] = useState<"idle" | "ok" | "later">("idle");
  if (!m) return <p className="pt-20 text-center text-xs text-muted-foreground">No moments yet</p>;
  return (
    <div className="flex h-full flex-col">
      <span className="meta-chip w-fit rounded-full bg-primary/15 px-2 py-0.5 text-primary">{m.type}</span>
      <p className="mt-2 line-clamp-4 flex-1 text-sm font-medium leading-snug">{m.takeaway}</p>
      {state === "idle" ? (
        <div className="grid gap-1.5">
          <button onClick={() => setState("ok")} className="rounded-full bg-primary py-1.5 text-xs font-semibold text-primary-foreground">Approve</button>
          <button onClick={() => setState("later")} className="rounded-full bg-secondary py-1.5 text-xs">Later</button>
        </div>
      ) : (
        <p className="text-center text-xs text-primary">{state === "ok" ? "Approved" : "Reminder set"}</p>
      )}
    </div>
  );
}

export function WatchUpcoming() {
  const items = [
    { t: "11:00", n: "Design Review", p: "Zoom" },
    { t: "13:30", n: "BIO 204 Lab", p: "Google Meet" },
    { t: "16:00", n: "Vendor Sync", p: "Teams" },
  ];
  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-xs font-semibold text-primary">Up next</p>
      {items.map((i) => (
        <div key={i.n} className="rounded-xl bg-secondary px-2 py-1.5">
          <p className="text-[11px] text-muted-foreground">{i.t} · {i.p}</p>
          <p className="text-xs font-medium">{i.n}</p>
        </div>
      ))}
    </div>
  );
}

export function WatchActions() {
  const { actions } = useDemo();
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <div className="flex h-full flex-col gap-1.5 overflow-y-auto">
      <p className="text-xs font-semibold text-primary">Action items</p>
      {actions.length === 0 && <p className="text-[11px] text-muted-foreground">Nothing yet</p>}
      {actions.slice(0, 5).map((a) => (
        <button
          key={a.id}
          onClick={() => setDone((d) => ({ ...d, [a.id]: !d[a.id] }))}
          className="flex items-start gap-1.5 text-left"
        >
          <span className={cn("mt-0.5 size-3 shrink-0 rounded-full ring-1 ring-primary", done[a.id] && "bg-primary")} />
          <span className={cn("text-[11px] leading-tight", done[a.id] && "text-muted-foreground line-through")}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
