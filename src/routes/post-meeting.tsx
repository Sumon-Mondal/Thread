import { createFileRoute, Link } from "@tanstack/react-router";
import { SendToCalendar } from "@/components/SendToCalendar";
import { useState } from "react";
import { MomentBadge } from "@/components/MomentBadge";
import { AgentText } from "@/components/AgentContextMenu";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/post-meeting")({
  head: () => ({
    meta: [
      { title: "Post-Meeting Debrief — Thread" },
      { name: "description", content: "Executive debrief: summary, captured resources, staged actions, and a voice companion that knows the meeting." },
      { property: "og:title", content: "Post-Meeting Debrief — Thread" },
      { property: "og:description", content: "Executive debrief: summary, captured resources, staged actions, and a voice companion that knows the meeting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostMeeting,
});

const CANNED_ANSWERS: [RegExp, string][] = [
  [/deadline|due|close/i, "Applications close firmly on **October 18 at 11:59 PM ET** — Sarah stressed there are no extensions. I've staged reminders for Oct 16 and the morning of Oct 18."],
  [/link|portal|apply|qr/i, "The application portal is the in-app application form (/apply/internship-app) — I captured it from both the slide QR code and the meeting chat. Want me to open the pre-filled draft?"],
  [/requirement|skill|qualif/i, "They want strong Python fundamentals, with distributed systems or data pipelines preferred. Your profile matches 3 of 4 listed skills — Kubernetes is the gap."],
  [/referr/i, "Priya confirmed referral applications get priority review. Mentioning your Discovery Day attendance counts — I've added 'request referral mention' to your action queue."],
  [/q&a|panel|thursday|event/i, "The engineering Q&A panel is next Thursday at 4 PM ET with former interns. I staged a calendar invite — approve it in the action queue and I'll send it."],
];

function answer(q: string): string {
  for (const [re, a] of CANNED_ANSWERS) if (re.test(q)) return a;
  return "Here's the gist: Nova Dynamics opened Summer 2027 SWE internship applications today, closing Oct 18. I captured the portal link, matched your skills (3/4), and staged a reminder, a calendar invite, and an application draft. Ask me about the deadline, requirements, or the referral tip.";
}

function PostMeeting() {
  const { moments, actions, executeAction, scenario } = useDemo();
  const [msgs, setMsgs] = useState<{ from: "you" | "agent"; text: string }[]>([
    { from: "agent", text: "Meeting wrapped. I captured 6 moments, 1 link, and staged 4 actions. What do you want to dig into?" },
  ]);
  const [input, setInput] = useState("");

  const resources = moments.filter((m) => m.link);
  const staged = actions.filter((a) => a.status === "staged");

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [...m, { from: "you", text: q }, { from: "agent", text: answer(q) }]);
    setInput("");
  };

  return (
    <main className="mx-auto grid w-full max-w-[1560px] grid-cols-1 gap-4 px-4 pb-10 pt-4 lg:grid-cols-3">
      {/* Summary */}
      <div className="glass-panel p-5">
        <p className="meta-chip text-muted-foreground">Executive Debrief</p>
        <h1 className="mt-2 text-lg font-bold tracking-tight">{scenario.meetingTitle}</h1>
        <AgentText
          context={`Post-meeting debrief summary for "${scenario.meetingTitle}": Nova Dynamics opened Summer 2027 SWE internship applications during this session. The agent captured the application portal from a slide QR code, logged a hard October 18 deadline, matched the user's profile against the stated requirements (3 of 4 skills), and staged an application draft plus calendar items for approval.`}
          preview="Nova Dynamics opened Summer 2027 SWE internship applications during this session. The agent captured the application portal from a slide QR code, logged a hard October 18 deadline, matched your profile against the stated requirements (3 of 4 skills), and staged an application draft plus calendar items for your approval."
        >
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Nova Dynamics opened Summer 2027 SWE internship applications during this session. The agent captured the
            application portal from a slide QR code, logged a hard October 18 deadline, matched your profile against the
            stated requirements (3 of 4 skills), and staged an application draft plus calendar items for your approval.
          </p>
        </AgentText>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { n: moments.length, l: "Moments" },
            { n: resources.length, l: "Links" },
            { n: actions.filter((a) => a.status === "executed").length, l: "Done" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-white/5 py-3 ring-1 ring-white/10">
              <p className="text-xl font-bold">{s.n}</p>
              <p className="meta-chip text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <p className="meta-chip mt-5 text-muted-foreground">Captured Resources</p>
        <div className="mt-2 space-y-2">
          {resources.length === 0 && <p className="text-xs text-muted-foreground">None yet — run the demo.</p>}
          {resources.map((m) => (
            <a
              key={m.id}
              href={m.link}
              target="_blank"
              rel="noreferrer"
              className="block truncate rounded-lg bg-primary/10 px-3 py-2 font-mono text-[11px] text-primary ring-1 ring-primary/25 hover:bg-primary/15"
            >
              🔗 {m.link!.replace("https://", "")}
            </a>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="glass-panel p-5">
        <p className="meta-chip text-muted-foreground">Action Ledger</p>
        <div className="mt-3 space-y-2">
          {actions.map((a) => (
            <AgentText
              key={a.id}
              context={`Action staged by the meeting agent (status: ${a.status}): "${a.label}". ${a.detail}`}
              preview={a.label}
            >
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium leading-snug">{a.label}</p>
                <span
                  className={cn(
                    "meta-chip shrink-0 rounded-full px-2 py-0.5 ring-1",
                    a.status === "executed"
                      ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 ring-amber-500/30",
                  )}
                >
                  {a.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {a.status === "staged" && a.id === "chat-c3b" && (
                  <Link to="/panel" className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/85">Review & send email in queue</Link>
                )}
                {a.status === "staged" && a.id !== "chat-c3b" && (
                  <button
                    onClick={() => executeAction(a.id)}
                    className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/85"
                  >
                    Approve & Execute
                  </button>
                )}
                <SendToCalendar title={a.label} notes={a.detail} />
              </div>
            </div>
            </AgentText>
          ))}
          {staged.length === 0 && actions.length > 0 && (
            <p className="pt-1 text-xs text-emerald-400">All actions executed. 🎉</p>
          )}
        </div>
      </div>

      {/* Talk to this meeting */}
      <div className="glass-panel flex flex-col p-5">
        <div className="flex items-center justify-between">
          <p className="meta-chip text-muted-foreground">🎙️ Talk to this meeting</p>
          <span className="meta-chip rounded bg-primary/15 px-1.5 py-0.5 text-primary ring-1 ring-primary/30">ElevenAgents</span>
        </div>
        <div className="thin-scroll mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 420 }}>
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed", m.from === "you" ? "ml-auto bg-primary text-primary-foreground" : "bg-white/6 text-foreground/90 ring-1 ring-white/10")}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about the deadline, the link, requirements…"
            className="min-w-0 flex-1 rounded-full border border-input bg-background/60 px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
          />
          <button onClick={send} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/85">
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
