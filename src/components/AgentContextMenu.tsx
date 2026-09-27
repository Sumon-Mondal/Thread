import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Copy, CornerDownLeft, Eye, Loader2, X } from "lucide-react";

type Pos = { x: number; y: number };
type AgentState = { pos: Pos; reply: string; busy: boolean } | null;

/**
 * Wraps any text so right-click (mouse) or long-press (touch) opens a menu:
 * ask the AI agent about the text, see details (optional), or copy it.
 * The wrapper is display:contents so it never affects layout.
 */
export function AgentText({
  context,
  preview,
  onDetails,
  children,
}: {
  /** Full context sent to the agent (meeting, speaker, timestamp, text). */
  context: string;
  /** Short text shown in the menu header and used for Copy. */
  preview: string;
  /** Optional "See exactly what was said" action. */
  onDetails?: () => void;
  children: ReactNode;
}) {
  const [menu, setMenu] = useState<Pos | null>(null);
  const [agent, setAgent] = useState<AgentState>(null);
  const [input, setInput] = useState("");
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!agent) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAgent(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agent]);

  const clamp = (x: number, y: number): Pos => ({
    x: Math.max(8, Math.min(x, window.innerWidth - 300)),
    y: Math.max(8, Math.min(y, window.innerHeight - 220)),
  });

  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

  const ask = async (question: string) => {
    setAgent((a) => (a ? { ...a, reply: "", busy: true } : a));
    try {
      const res = await fetch("/api/agent", {
        signal: AbortSignal.timeout(45000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `${context}\n\n${question}` }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "The agent could not answer.");
      setAgent((a) => (a ? { ...a, reply: typeof payload?.reply === "string" ? payload.reply : "Done.", busy: false } : a));
    } catch (e) {
      setAgent((a) => (a ? { ...a, reply: e instanceof Error ? e.message : "The agent could not answer.", busy: false } : a));
    }
  };

  return (
    <>
      <span
        className="contents"
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenu(clamp(e.clientX, e.clientY)); }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (!t) return;
          pressTimer.current = setTimeout(() => setMenu(clamp(t.clientX, t.clientY)), 500);
        }}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
      >
        {children}
      </span>

      {menu && (
        <div
          className="fixed z-50 w-64 overflow-hidden rounded-xl border border-border bg-popover/95 p-1 shadow-2xl backdrop-blur-xl"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="line-clamp-2 px-3 py-1.5 text-[11px] text-muted-foreground">“{preview}”</p>
          {onDetails && (
            <button
              onClick={() => { onDetails(); setMenu(null); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
            >
              <Eye className="size-4 text-primary" /> See exactly what was said
            </button>
          )}
          <button
            onClick={() => {
              const pos = menu;
              setMenu(null);
              setInput("");
              setAgent({ pos, reply: "", busy: true });
              void ask("Summarize what this means and suggest any useful follow-up action.");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
          >
            <Bot className="size-4 text-primary" /> Ask the AI agent to act on this
          </button>
          <button
            onClick={() => { void navigator.clipboard?.writeText(preview).catch(() => {}); setMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
          >
            <Copy className="size-4 text-primary" /> Copy text
          </button>
        </div>
      )}

      {agent && (
        <div
          className="fixed z-50 w-80 rounded-xl border border-primary/30 bg-popover/95 p-3 shadow-2xl backdrop-blur-xl"
          style={{ left: agent.pos.x, top: agent.pos.y }}
        >
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
            onSubmit={(e) => { e.preventDefault(); const q = input.trim(); if (q) { setInput(""); void ask(q); } }}
            className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background/50 px-2.5 py-1.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell the agent what to do with this…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <button type="submit" aria-label="Send to agent" className="text-primary hover:brightness-110"><CornerDownLeft className="size-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
