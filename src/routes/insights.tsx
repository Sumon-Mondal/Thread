import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CircleHelp, ClipboardList, Copy, Loader2, Plus, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import type { ExtractionResult } from "@/lib/extract.functions";
import { formatClock } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { MeetingTimeline } from "@/components/MeetingTimeline";
import { SendToCalendar } from "@/components/SendToCalendar";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — Thread" },
      { name: "description", content: "Extract decisions, action items, and owners from a live or saved meeting transcript with AI." },
      { property: "og:title", content: "AI Insights — Thread" },
      { property: "og:description", content: "Extract decisions, action items, and owners from a live or saved meeting transcript with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

type EditableAction = { task: string; owner: string; due: string; done: boolean };
type Editable = { summary: string; decisions: string[]; actionItems: EditableAction[]; openQuestions: string[] };

function AutoText({ value, onChange, className, ariaLabel }: { value: string; onChange: (v: string) => void; className?: string; ariaLabel: string }) {
  return (
    <textarea
      value={value}
      rows={1}
      aria-label={ariaLabel}
      placeholder="Type here…"
      onChange={(e) => onChange(e.target.value)}
      ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }}
      className={cn("w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-1 py-0.5 text-foreground/90 outline-none transition hover:border-border focus:border-primary/50 focus:bg-background/40", className)}
    />
  );
}
const RemoveBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} aria-label="Remove" className="mt-1 rounded p-0.5 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100 focus:opacity-100"><X className="h-3.5 w-3.5" /></button>
);
const AddBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><Plus className="h-3.5 w-3.5" /> {label}</button>
);

function InsightsPage() {
  const { transcript, liveLines, mode, scenario } = useDemo();
  const [text, setText] = useState("");
  const [source, setSource] = useState<"live" | "saved">("saved");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Editable | null>(null);
  const patch = (p: Partial<Editable>) => setResult((r) => (r ? { ...r, ...p } : r));

  const loadLiveTranscript = () => {
    const lines =
      mode === "live"
        ? liveLines.filter((l) => l.committed).map((l) => `You: ${l.text}`)
        : transcript.map((l) => `[${formatClock(l.timeSec)}] ${l.speaker}: ${l.text}`);
    if (lines.length === 0) {
      toast.error("No transcript yet — play the demo or start the live mic first.");
      return;
    }
    setText(lines.join("\n"));
    setSource("live");
    toast.success(`Loaded ${lines.length} lines from the ${mode === "live" ? "live" : "demo"} meeting.`);
  };

  const extractDemo = () => {
    const t = scenario.transcript.map((l) => `[${formatClock(l.timeSec)}] ${l.speaker}: ${l.text}`).join("\n");
    setText(t);
    setSource("live");
    void analyze(t, "live");
  };

  const copyNotes = () => {
    if (!result) return;
    const md = [
      `# ${scenario.meetingTitle}`, "", "## Summary", result.summary, "", "## Decisions", ...result.decisions.filter(Boolean).map((d) => `- ${d}`), "",
      "## Action items", ...result.actionItems.filter((a) => a.task).map((a) => `- [${a.done ? "x" : " "}] ${a.task} — ${a.owner || "Unassigned"}${a.due ? ` (due ${a.due})` : ""}`), "",
      "## Open questions", ...result.openQuestions.filter(Boolean).map((q) => `- ${q}`),
    ].join("\n");
    void navigator.clipboard.writeText(md).then(() => toast.success("Copied meeting notes"));
  };

  const analyze = async (override?: string, src?: "live" | "saved") => {
    const body = override ?? text;
    if (body.trim().length < 20) {
      toast.error("Paste a transcript or load the live one first.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: body, source: src ?? source }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Analysis failed.");
      const r = payload as Partial<ExtractionResult>;
      const strs = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : []);
      setResult({
        summary: typeof r.summary === "string" ? r.summary : "",
        decisions: strs(r.decisions),
        actionItems: Array.isArray(r.actionItems)
          ? r.actionItems.map((a) => ({ task: String(a?.task ?? ""), owner: String(a?.owner ?? ""), due: String(a?.due ?? ""), done: false }))
          : [],
        openQuestions: strs(r.openQuestions),
      });
      toast.success("Analysis complete.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold tracking-tight">AI Insights</h1>
        <p className="text-xs text-muted-foreground">
          Give Thread a live transcript or pick a meeting — the AI agent extracts decisions, action items, and owners.
        </p>
      </div>

      <MeetingTimeline onAnalyze={(t, title) => { setText(t); setSource("saved"); toast.success(`Loaded ${title} — press Extract insights`); }} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <section className="glass-panel flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="meta-chip text-muted-foreground">
              {source === "live" ? `Live · ${scenario.meetingTitle}` : "Agent workspace"}
            </span>
            <button
              onClick={loadLiveTranscript}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              Use live transcript
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSource("saved");
            }}
            placeholder={"Paste a meeting transcript here…\n\n[00:12] Sarah: We decided to move the launch to Friday…"}
            className="thin-scroll min-h-[320px] flex-1 resize-none rounded-xl border border-border bg-background/40 p-3 font-mono text-xs leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={extractDemo}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-3 py-2.5 text-sm font-medium transition hover:bg-primary/10 disabled:opacity-50"
            >
              Extract demo transcript
            </button>
            <button
              onClick={() => void analyze()}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "Analyzing…" : "Extract insights"}
            </button>
          </div>
        </section>

        {/* Output */}
        <section className="flex flex-col gap-4">
          {!result && !busy && (
            <div className="glass-panel flex flex-1 items-center justify-center p-8 text-center">
              <p className="max-w-xs text-sm text-muted-foreground">
                Results will appear here — a summary, the decisions made, action items with owners, and open questions.
              </p>
            </div>
          )}
          {busy && (
            <div className="glass-panel flex flex-1 items-center justify-center gap-3 p-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reading the transcript…</p>
            </div>
          )}
          {result && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Click any text to edit. Changes stay on this page.</p>
                <button onClick={copyNotes} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:border-primary/50"><Copy className="h-3.5 w-3.5" /> Copy as notes</button>
              </div>
              <div className="glass-panel p-4">
                <p className="meta-chip mb-2 text-muted-foreground">Summary</p>
                <AutoText value={result.summary} onChange={(v) => patch({ summary: v })} className="text-sm leading-relaxed" ariaLabel="Summary" />
              </div>
              <div className="glass-panel p-4">
                <p className="meta-chip mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Decisions ({result.decisions.length})
                </p>
                <ul className="space-y-1.5">
                  {result.decisions.map((d, i) => (
                    <li key={i} className="group flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <AutoText value={d} onChange={(v) => patch({ decisions: result.decisions.map((x, j) => (j === i ? v : x)) })} className="flex-1 text-sm" ariaLabel={`Decision ${i + 1}`} />
                      <RemoveBtn onClick={() => patch({ decisions: result.decisions.filter((_, j) => j !== i) })} />
                    </li>
                  ))}
                </ul>
                <AddBtn label="Add decision" onClick={() => patch({ decisions: [...result.decisions, ""] })} />
              </div>
              <div className="glass-panel p-4">
                <p className="meta-chip mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <ClipboardList className="h-3.5 w-3.5 text-primary" /> Action items ({result.actionItems.filter((a) => a.done).length}/{result.actionItems.length} done)
                </p>
                <ul className="space-y-2">
                  {result.actionItems.map((a, i) => {
                    const upd = (p: Partial<EditableAction>) => patch({ actionItems: result.actionItems.map((x, j) => (j === i ? { ...x, ...p } : x)) });
                    return (
                      <li key={i} className={cn("group rounded-xl border border-border bg-background/30 px-3 py-2", a.done && "opacity-60")}>
                        <div className="flex items-start gap-2">
                          <input type="checkbox" checked={a.done} onChange={(e) => upd({ done: e.target.checked })} aria-label="Mark done" className="mt-1.5 accent-[var(--primary)]" />
                          <AutoText value={a.task} onChange={(v) => upd({ task: v })} className={cn("flex-1 text-sm", a.done && "line-through")} ariaLabel={`Action ${i + 1}`} />
                          <RemoveBtn onClick={() => patch({ actionItems: result.actionItems.filter((_, j) => j !== i) })} />
                        </div>
                        <div className="ml-6 mt-1 flex flex-wrap gap-2 text-xs">
                          <label className="flex items-center gap-1 text-muted-foreground">Owner
                            <input value={a.owner} placeholder="Unassigned" onChange={(e) => upd({ owner: e.target.value })} className="w-32 rounded-md border border-border bg-background/50 px-2 py-0.5 text-foreground outline-none focus:border-primary/50" />
                          </label>
                          <label className="flex items-center gap-1 text-muted-foreground">Due
                            <input value={a.due} placeholder="No date" onChange={(e) => upd({ due: e.target.value })} className="w-56 rounded-md border border-border bg-background/50 px-2 py-0.5 text-foreground outline-none focus:border-primary/50" />
                          </label>
                          {a.task && <SendToCalendar title={a.task} notes={`Owner: ${a.owner || "Unassigned"}${a.due ? ` · Due: ${a.due}` : ""} — from Thread AI Insights`} {...(a.due && !isNaN(Date.parse(a.due)) ? { start: new Date(a.due).toISOString() } : {})} />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <AddBtn label="Add action item" onClick={() => patch({ actionItems: [...result.actionItems, { task: "", owner: "", due: "", done: false }] })} />
              </div>
              <div className="glass-panel p-4">
                <p className="meta-chip mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <CircleHelp className="h-3.5 w-3.5 text-amber-400" /> Open questions ({result.openQuestions.length})
                </p>
                <ul className="space-y-1.5">
                  {result.openQuestions.map((q, i) => (
                    <li key={i} className="group flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" />
                      <AutoText value={q} onChange={(v) => patch({ openQuestions: result.openQuestions.map((x, j) => (j === i ? v : x)) })} className="flex-1 text-sm" ariaLabel={`Question ${i + 1}`} />
                      <RemoveBtn onClick={() => patch({ openQuestions: result.openQuestions.filter((_, j) => j !== i) })} />
                    </li>
                  ))}
                </ul>
                <AddBtn label="Add question" onClick={() => patch({ openQuestions: [...result.openQuestions, ""] })} />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
