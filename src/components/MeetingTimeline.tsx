import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, Clock, CornerDownLeft, Eye, Loader2, Sparkles, X } from "lucide-react";
import { MomentBadge } from "@/components/MomentBadge";
import { SCENARIO_LIST, formatClock, type MomentType } from "@/lib/demo-data";
import { PAST_MEETINGS } from "@/lib/past-meetings";
import { cn } from "@/lib/utils";

type Line = { id: string; t: number; speaker: string; role: string; text: string; headline: string; type?: MomentType };
type Meeting = { id: string; title: string; meta: string; summary: string; lines: Line[] };

function headline(text: string) {
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return first.length > 80 ? `${first.slice(0, 77).trimEnd()}…` : first;
}

function buildMeetings(): Meeting[] {
  const scen = SCENARIO_LIST.map((s) => ({
    id: `scn-${s.id}`,
    title: s.meetingTitle,
    meta: `${s.platform} · ${formatClock(s.endSec)} · ${s.transcript.length} lines`,
    summary: s.moments.slice(0, 3).map((m) => m.takeaway).join(" · "),
    lines: s.transcript.map((l) => {
      const m = s.moments.find((x) => Math.abs(x.timeSec - l.timeSec) <= 2);
      return { id: l.id, t: l.timeSec, speaker: l.speaker, role: l.role, text: l.text, headline: m ? m.takeaway : headline(l.text), ...(m ? { type: m.type } : l.momentType ? { type: l.momentType } : {}) };
    }),
  }));
  const past = PAST_MEETINGS.map((pm) => {
    const parts = pm.transcript.split(/\s(?=[A-Z][\w.]*(?: [A-Z][\w.]*)?:\s)/);
    const lines = parts.map((p, i) => {
      const idx = p.indexOf(":");
      const speaker = idx > 0 && idx < 30 ? p.slice(0, idx) : "Speaker";
      const text = idx > 0 && idx < 30 ? p.slice(idx + 1).trim() : p;
      const contact = pm.contacts.find((c) => c.name.toLowerCase().includes(speaker.toLowerCase()));
      return { id: `${pm.id}-${i}`, t: i * 45, speaker: contact?.name ?? speaker, role: contact?.role ?? "", text, headline: headline(text) };
    });
    return { id: pm.id, title: pm.title, meta: `${pm.platform} · ${pm.date} · ${pm.duration}`, summary: pm.summary, lines };
  });
  return [...scen, ...past];
}

type Menu = { lineId: string; x: number; y: number };
type AgentState = { lineId: string; reply: string; busy: boolean } | null;

export function MeetingTimeline({ onAnalyze }: { onAnalyze: (text: string, title: string) => void }) {
  const meetings = useMemo(buildMeetings, []);
  const [sel, setSel] = useState(meetings[0]?.id ?? "");
  const [open, setOpen] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [agent, setAgent] = useState<AgentState>(null);
  const [agentInput, setAgentInput] = useState("");
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const m = meetings.find((x) => x.id === sel) ?? meetings[0];

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  if (!m) return null;

  const openMenu = (lineId: string, x: number, y: number) => {
    setMenu({ lineId, x: Math.min(x, window.innerWidth - 280), y: Math.min(y, window.innerHeight - 140) });
  };

  const askAgent = async (line: Line, question: string) => {
    setAgent({ lineId: line.id, reply: "", busy: true });
    try {
      const res = await fetch("/api/agent", {
        signal: AbortSignal.timeout(45000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `In the meeting "${m.title}", at ${formatClock(line.t)}, ${line.speaker} said: "${line.text}". ${question}`,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "The agent could not answer.");
      setAgent({ lineId: line.id, reply: typeof payload?.reply === "string" ? payload.reply : "Done.", busy: false });
    } catch (e) {
      setAgent({ lineId: line.id, reply: e instanceof Error ? e.message : "The agent could not answer.", busy: false });
    }
  };

  const menuLine = menu ? m.lines.find((l) => l.id === menu.lineId) : undefined;

  return (
    <section className="mb-4 grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="glass-panel p-3">
        <p className="meta-chip mb-2 px-1 text-muted-foreground">Meetings</p>
        <div className="space-y-1.5">
          {meetings.map((x) => (
            <button key={x.id} onClick={() => { setSel(x.id); setOpen(null); setAgent(null); }}
              className={cn("w-full rounded-xl border px-3 py-2 text-left transition", x.id === m.id ? "border-primary/50 bg-primary/10" : "border-transparent hover:border-border hover:bg-white/5")}>
              <p className="truncate text-sm font-medium">{x.title}</p>
              <p className="text-[11px] text-muted-foreground">{x.meta}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{m.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.summary}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">Tip: click any line to expand it and talk to the AI agent; right-click or long-press for more options.</p>
          </div>
          <button onClick={() => onAnalyze(m.lines.map((l) => `[${formatClock(l.t)}] ${l.speaker}: ${l.text}`).join("\n"), m.title)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/85">
            <Sparkles className="size-3.5" /> Analyze this meeting
          </button>
        </div>

        <ol className="thin-scroll relative mt-4 max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {m.lines.map((l) => {
            const isOpen = open === l.id;
            const agentHere = agent?.lineId === l.id;
            return (
              <li key={l.id}>
                <button
                  onClick={() => {
                    setOpen(isOpen ? null : l.id);
                    if (!isOpen) {
                      setAgent({ lineId: l.id, reply: "", busy: false });
                      setAgentInput("");
                    } else if (agent?.lineId === l.id) {
                      setAgent(null);
                    }
                  }}
                  onContextMenu={(e) => { e.preventDefault(); openMenu(l.id, e.clientX, e.clientY); }}
                  onTouchStart={(e) => {
                    const t = e.touches[0];
                    if (!t) return;
                    pressTimer.current = setTimeout(() => openMenu(l.id, t.clientX, t.clientY), 500);
                  }}
                  onTouchEnd={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
                  onTouchMove={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
                  aria-expanded={isOpen}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition", isOpen || agentHere ? "bg-white/5" : "hover:bg-white/5")}>
                  <span className="flex w-14 shrink-0 items-center gap-1 font-mono text-[11px] text-primary"><Clock className="size-3" />{formatClock(l.t)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{l.headline}</span>
                  {l.type && <MomentBadge type={l.type} />}
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="mb-2 ml-[4.25rem] mr-2 rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">{l.speaker.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                      <div><p className="text-sm font-medium">{l.speaker}</p>{l.role && <p className="text-[11px] text-muted-foreground">{l.role}</p>}</div>
                      <span className="ml-auto font-mono text-[11px] text-muted-foreground">at {formatClock(l.t)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">“{l.text}”</p>
                  </div>
                )}
                {agentHere && agent && (
                  <div className="mb-2 ml-[4.25rem] mr-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/20"><Bot className="size-4 text-primary" /></span>
                      <p className="text-sm font-medium">Thread Agent</p>
                      <button onClick={() => setAgent(null)} aria-label="Close agent" className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
                    </div>
                    {agent.busy ? (
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin text-primary" /> Working on it…</p>
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{agent.reply}</p>
                    )}
                    <form
                      onSubmit={(e) => { e.preventDefault(); const q = agentInput.trim(); if (q) { setAgentInput(""); void askAgent(l, q); } }}
                      className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background/50 px-2.5 py-1.5">
                      <input
                        value={agentInput}
                        onChange={(e) => setAgentInput(e.target.value)}
                        placeholder="Tell the agent what to do with this…"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      />
                      <button type="submit" aria-label="Send to agent" className="text-primary hover:brightness-110"><CornerDownLeft className="size-4" /></button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {menu && menuLine && (
        <div
          className="fixed z-50 w-64 overflow-hidden rounded-xl border border-border bg-popover/95 p-1 shadow-2xl backdrop-blur-xl"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="truncate px-3 py-1.5 text-[11px] text-muted-foreground">“{menuLine.headline}”</p>
          <button
            onClick={() => { setOpen(menuLine.id); setMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10">
            <Eye className="size-4 text-primary" /> See exactly what was said
          </button>
          <button
            onClick={() => {
              setAgent({ lineId: menuLine.id, reply: "", busy: false });
              setAgentInput("");
              setMenu(null);
              void askAgent(menuLine, "Summarize what this means and suggest any useful follow-up action.");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10">
            <Bot className="size-4 text-primary" /> Ask the AI agent to act on this
          </button>
        </div>
      )}
    </section>
  );
}
