import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { LiveActivityWidget } from "@/components/LiveActivityWidget";
import { AgentConsole } from "@/components/AgentConsole";
import { AgentText } from "@/components/AgentContextMenu";
import { AddToCalendar } from "@/components/AddToCalendar";
import { QrChatCard } from "@/components/QrChatCard";
import { MomentBadge, MOMENT_STYLES } from "@/components/MomentBadge";
import {
  formatClock,
  type Moment,
  type MomentType,
} from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { cn } from "@/lib/utils";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SARAH_DEMO_RECIPIENT, SARAH_FOLLOW_UP_EMAIL, isSarahFollowUp } from "@/lib/demo-recipient";

/* ---------- Left: Moments + Transcript ---------- */

const FILTERS: { key: MomentType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPPORTUNITY", label: "Opportunities" },
  { key: "DEADLINE", label: "Deadlines" },
  { key: "RESOURCE", label: "Resources" },
  { key: "REQUIREMENT", label: "Requirements" },
  { key: "EVENT", label: "Events" },
];

function MomentCard({ moment }: { moment: Moment }) {
  const [open, setOpen] = useState(false);
  const style = MOMENT_STYLES[moment.type];
  return (
    <AgentText
      context={`Moment detected in the meeting (${moment.type}), noted from ${moment.speaker} at ${formatClock(moment.timeSec)}: "${moment.takeaway}". Details: ${moment.detail}`}
      preview={moment.takeaway}
      onDetails={() => setOpen(true)}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn("w-full rounded-r-lg border-l-2 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]", style.border)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
              ⏱ {formatClock(moment.timeSec)}
            </span>
            <MomentBadge type={moment.type} />
          </div>
          <span className="text-[10px] text-primary/70">Hold 1s for Agent ✦</span>
        </div>
        <p className="mt-1.5 text-xs font-semibold leading-relaxed text-foreground/95">{moment.takeaway}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{moment.speaker} · {open ? "Less ▴" : "Details ▾"}</p>
        {open && (
          <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
            <p className="text-xs leading-relaxed text-muted-foreground">{moment.detail}</p>
            {moment.link && (
              <a
                href={moment.link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block truncate rounded-lg bg-primary/10 px-2.5 py-1.5 font-mono text-[11px] text-primary ring-1 ring-primary/25 hover:bg-primary/15"
              >
                🔗 {moment.link.replace("https://", "")}
              </a>
            )}
            {moment.matchedSkills && (
              <div className="flex flex-wrap gap-1.5">
                {moment.matchedSkills.map((s) => (
                  <span
                    key={s.skill}
                    className={cn(
                      "meta-chip rounded-full px-2 py-0.5 ring-1",
                      s.matched
                        ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                        : "bg-white/5 text-muted-foreground ring-white/10",
                    )}
                  >
                    {s.skill} {s.matched ? "✓" : "—"}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </button>
    </AgentText>
  );
}

export function MomentsPanel() {
  const { moments } = useDemo();
  const [filter, setFilter] = useState<MomentType | "ALL">("ALL");
  const filtered = filter === "ALL" ? moments : moments.filter((m) => m.type === filter);

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground/90">Meeting Notes & Timeline</h2>
          <p className="text-[10px] text-primary/80">Minute-by-minute gist · Hold 1s or right-click to inspect with Agent</p>
        </div>
        <span className="meta-chip text-muted-foreground">{moments.length} notes</span>
      </div>
      <div className="flex flex-wrap gap-1 px-4 pt-3">
        {FILTERS.map((f) => {
          const count = f.key === "ALL" ? moments.length : moments.filter((m) => m.type === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition",
                filter === f.key
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>
      <div className="thin-scroll soft-mask-b min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pb-10">
        {filtered.length === 0 && (
          <p className="pt-4 text-xs text-muted-foreground">
            {moments.length === 0 ? "Moments will appear here as the meeting unfolds." : "No moments of this type yet."}
          </p>
        )}
        {filtered.map((m) => (
          <MomentCard key={m.id} moment={m} />
        ))}
      </div>
    </section>
  );
}

export function TranscriptPanel() {
  const { transcript, liveLines, mode, liveMeeting } = useDemo();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript.length, liveLines.length]);

  const lines =
    mode === "live"
      ? liveLines.map((l) => ({
          id: l.id,
          speaker: l.speaker ?? "You",
          role: l.speaker && l.speaker !== "You" ? "Participant" : "Attendee",
          text: l.text,
          live: !l.committed,
        }))
      : transcript.map((l) => ({ id: l.id, speaker: l.speaker, role: l.role, text: l.text, live: false }));

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <h2 className="text-sm font-semibold text-foreground/85">Live Transcript</h2>
        <span className="meta-chip text-muted-foreground">{liveMeeting ? `${liveMeeting.platform} captions` : "Scribe · ~300ms"}</span>
      </div>
      <div ref={scrollRef} className="thin-scroll soft-mask-b min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pb-8">
        {lines.length === 0 && (
          <p className="pt-6 text-center text-xs text-muted-foreground">
            {liveMeeting
              ? `Waiting for captions — turn on CC in ${liveMeeting.platform}.`
              : mode === "live" ? "Speak into your mic — transcription appears here." : "Connecting to the meeting…"}
          </p>
        )}
        {lines.map((l) => (
          <AgentText
            key={l.id}
            context={`In the live meeting transcript, ${l.speaker} (${l.role}) said: "${l.text}"`}
            preview={l.text}
          >
            <div className="text-xs">
              <span className="mr-2 font-bold text-primary/90">{l.speaker}:</span>
              <span className={cn("leading-relaxed", l.live ? "italic text-muted-foreground" : "text-foreground/80")}>
                {l.text}
              </span>
            </div>
          </AgentText>
        ))}
      </div>
    </section>
  );
}

/* ---------- Center: stage + screen share + health ---------- */

function Equalizer() {
  return (
    <div className="flex h-5 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="animate-eq w-[3px] rounded-full bg-primary"
          style={{ height: "100%", animationDelay: `${i * 0.13}s` }}
        />
      ))}
    </div>
  );
}

function SlideQr({ url }: { url: string }) {
  const [src, setSrc] = useState("");
  const href = /^https?:\/\//i.test(url)
    ? url
    : url.startsWith("/") && typeof window !== "undefined"
      ? window.location.origin + url
      : `https://${url}`;
  useEffect(() => {
    void QRCode.toDataURL(href, { margin: 1, width: 220, color: { dark: "#0b0f14", light: "#ffffff" } }).then(setSrc);
  }, [href]);
  if (!src) return <div className="h-32 w-32 animate-pulse rounded-md bg-white/10" />;
  return <img src={src} alt={`QR code linking to ${href}`} className="h-32 w-32 rounded-md" />;
}

function ScreenShare() {
  const { screenShared, elapsed, scenario, liveMeeting, moments } = useDemo();
  if (liveMeeting) {
    const decoded = moments.filter((m) => m.link && m.id.startsWith("qr-"));
    return (
      <div className="panel flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="meta-chip text-muted-foreground">
          {decoded.length ? `QR codes decoded from ${liveMeeting.platform}` : `Watching the ${liveMeeting.platform} screen for QR codes…`}
        </p>
        {decoded.map((m) => (
          <a key={m.id} href={m.link} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-md bg-teal-500/10 px-2 py-1 font-mono text-[11px] text-teal-300 ring-1 ring-teal-500/25">
            🔗 {m.link}
          </a>
        ))}
      </div>
    );
  }
  const presenter = scenario.screenSharePresenter;
  const firstName = presenter.split(" ")[0];
  if (!screenShared) {
    return (
      <div className="panel flex flex-1 items-center justify-center">
        <p className="meta-chip text-muted-foreground">
          {elapsed < 36 ? `Screen share starts when ${firstName} presents…` : "Screen share ended"}
        </p>
      </div>
    );
  }
  return (
    <div className="panel relative flex-1 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <span className="meta-chip text-muted-foreground">{presenter} — Screen Share</span>
        <span className="meta-chip rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-400 ring-1 ring-emerald-500/30">Gemini Vision · ON</span>
      </div>
      <div className="flex items-center gap-5 p-5">
        <div className="shrink-0">
          <div className="relative">
            <SlideQr url={scenario.slide.url} />
            <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-teal-400/50" />
          </div>
          <span className="meta-chip mt-1.5 block whitespace-nowrap text-center text-teal-300">Vision · QR detected</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{scenario.slide.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{scenario.slide.subtitle}</p>
          <ul className="mt-2 space-y-1">
            {scenario.slide.bullets.map((b) => (
              <li key={b} className="text-xs text-muted-foreground">• {b}</li>
            ))}
          </ul>
          <p className="mt-2 truncate rounded-md bg-teal-500/10 px-2 py-1 font-mono text-[11px] text-teal-300 ring-1 ring-teal-500/25">
            🔗 {scenario.slide.url}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CenterColumn() {
  const { activeSpeaker, activeSpeakerRole, latestMoment, playing, mode } = useDemo();
  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      {/* Active speaker stage */}
      <div className="panel flex items-center gap-3 px-5 py-3.5">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary ring-1 ring-primary/40">
          {activeSpeaker.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{activeSpeaker}</p>
          <p className="meta-chip text-muted-foreground">{activeSpeakerRole}</p>
        </div>
        {(playing || mode === "live") && <Equalizer />}
        <AddToCalendar />
      </div>

      <ScreenShare />

      {/* Live understanding callout */}
      {latestMoment && (
        <div className="panel border-primary/25 p-4">
          <p className="meta-chip text-primary">Live Understanding</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/90">{latestMoment.detail}</p>
        </div>
      )}

      {/* Meeting health strip */}
      <LiveActivityWidget compact />
    </section>
  );
}

/* ---------- Right: Agent queue + chat ---------- */

export function AgentQueuePanel() {
  const { actions, approveAction } = useDemo();
  const staged = actions.filter((a) => a.status === "staged");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTo, setDraftTo] = useState(SARAH_DEMO_RECIPIENT);
  const [draftSubject, setDraftSubject] = useState(SARAH_FOLLOW_UP_EMAIL.subject);
  const [draftBody, setDraftBody] = useState(SARAH_FOLLOW_UP_EMAIL.body);

  async function approve(a: (typeof actions)[number], custom?: { to: string; subject: string; body: string }) {
    if (sendingId) return;
    if (isSarahFollowUp(a) || a.link?.startsWith("mailto:")) {
      setSendingId(a.id);
      const payload = custom ?? (editingId === a.id ? { to: draftTo, subject: draftSubject, body: draftBody } : { to: SARAH_DEMO_RECIPIENT, ...SARAH_FOLLOW_UP_EMAIL });
      const result = await approveAction(a.id, payload);
      setSendingId(null);
      if (result.ok) {
        toast.success(result.delivered === "inbox" ? `Sent and confirmed in ${payload.to}` : `Sent to ${payload.to}`);
        setEditingId(null);
      } else {
        toast.error(result.error ?? "Email could not be sent");
      }
      return;
    }
    await approveAction(a.id);
    if (a.link) window.open(a.link, "_blank", "noopener");
  }

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <h2 className="text-sm font-semibold text-foreground/85">Agent Action Queue</h2>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/30">
          {staged.length} awaiting
        </span>
      </div>
      <div className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {actions.length === 0 && (
          <p className="pt-4 text-xs text-muted-foreground">Thread's agent will stage actions here as moments are detected.</p>
        )}
        {actions.map((a) => {
          const isEmailAction = isSarahFollowUp(a) || a.link?.startsWith("mailto:");
          const isEditingThis = editingId === a.id;

          return (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3">
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                  a.status === "executed" ? "bg-emerald-500/25 text-emerald-400" : "border border-amber-400/50 text-amber-400",
                )}
              >
                {a.status === "executed" ? "✓" : "!"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-snug">{a.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.detail}</p>

                {isEmailAction && a.status === "staged" && (
                  isEditingThis ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-primary/30 bg-black/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="meta-chip text-primary">✎ Edit Email Draft</span>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Cancel ✕
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">To</label>
                        <input
                          type="email"
                          value={draftTo}
                          onChange={(e) => setDraftTo(e.target.value)}
                          className="mt-0.5 w-full rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-foreground outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Subject</label>
                        <input
                          type="text"
                          value={draftSubject}
                          onChange={(e) => setDraftSubject(e.target.value)}
                          className="mt-0.5 w-full rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Body</label>
                        <textarea
                          rows={4}
                          value={draftBody}
                          onChange={(e) => setDraftBody(e.target.value)}
                          className="mt-0.5 w-full resize-none rounded border border-white/10 bg-white/5 p-2 text-[11px] leading-relaxed text-foreground outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          className="h-7 text-[11px]"
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={sendingId === a.id}
                          onClick={() => void approve(a, { to: draftTo, subject: draftSubject, body: draftBody })}
                          className="h-7 rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground"
                        >
                          {sendingId === a.id ? "Sending…" : "Send Email Now"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingId(a.id);
                        setDraftTo(SARAH_DEMO_RECIPIENT);
                        setDraftSubject(SARAH_FOLLOW_UP_EMAIL.subject);
                        setDraftBody(SARAH_FOLLOW_UP_EMAIL.body);
                      }}
                      className="group mt-2 cursor-pointer rounded-lg border border-white/8 bg-white/[0.03] p-2.5 transition hover:border-primary/40 hover:bg-white/[0.05]"
                      title="Click to review and edit email"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider text-primary uppercase">Draft Preview (Click to Edit)</span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-primary opacity-80 group-hover:opacity-100">
                          ✎ Edit draft
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-foreground/90">
                        <span className="text-muted-foreground">To:</span> {draftTo}
                      </p>
                      <p className="text-[11px] font-medium text-foreground/90">
                        <span className="text-muted-foreground">Subject:</span> {draftSubject}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10.5px] italic text-muted-foreground">
                        “{draftBody.replace(/\n+/g, " ")}”
                      </p>
                    </div>
                  )
                )}

                {a.status === "staged" && !isEditingThis && (
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      disabled={sendingId === a.id}
                      onClick={() => void approve(a)}
                      className="rounded-lg bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/85"
                    >
                      {sendingId === a.id ? "Sending…" : isEmailAction ? "Send follow-up email" : "Execute Action"}
                    </Button>
                    {isEmailAction && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(a.id);
                          setDraftTo(SARAH_DEMO_RECIPIENT);
                          setDraftSubject(SARAH_FOLLOW_UP_EMAIL.subject);
                          setDraftBody(SARAH_FOLLOW_UP_EMAIL.body);
                        }}
                        className="h-7 text-[11px]"
                      >
                        Edit draft ✎
                      </Button>
                    )}
                  </div>
                )}
                {a.status === "executed" && a.link && (
                  <a href={a.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-[11px] text-primary underline">Open link</a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/5 px-4 py-3">
        <p className="meta-chip text-muted-foreground">Scoped delegation</p>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          scope: ["profile:read", "chat:write", "calendar:write"] · human approval required
        </p>
      </div>
    </section>
  );
}

export function ChatPanel() {
  const { chat, transcript, mode, elapsed, scenario, liveLines, addChatMessage, liveMeeting, meetingTitle, meetingPlatform } = useDemo();
  // The scripted QR card belongs to the demo meetings, never to a real call.
  const showQr = !liveMeeting && (mode === "live" || elapsed >= scenario.screenShareStart + 4);
  const qrUrl = scenario.id === "diatom" ? "https://nanomat.as.wm.edu/owncloud/s/fK5FbeKFAbzeKaQ" : (typeof window !== "undefined" ? window.location.origin : "") + "/apply/internship-app";
  const liveContext = liveMeeting
    ? `${meetingTitle} (${meetingPlatform})\nParticipants: ${liveMeeting.participants.join(", ") || "unknown"}\n` +
      transcript.map((l) => `${l.speaker}: ${l.text}`).join("\n") +
      (chat.length ? `\nMeeting chat:\n${chat.map((c) => `${c.from}: ${c.text}`).join("\n")}` : "")
    : `${scenario.meetingTitle} (${scenario.platform})\n` + [...transcript.map((l) => `${l.speaker}: ${l.text}`), ...liveLines.map((l) => `You (live mic): ${l.text}`)].join("\n") + (showQr ? `\nQR code in chat decoded to: ${qrUrl}` : "");

  return (
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground/85">Meeting Chat</h2>
        <span className="meta-chip text-muted-foreground">{chat.length} message{chat.length === 1 ? "" : "s"}</span>
      </div>
      {showQr && (
        <div className="border-b border-white/5 p-3">
          <QrChatCard key={scenario.id} url={qrUrl} from={scenario.id === "diatom" ? "Liam Park" : "Michael Torres"} />
        </div>
      )}
      <ChatMessages />
      <div className="border-t border-border p-3">
        <PromptInput onSubmit={({ text }) => addChatMessage(text)} className="rounded-md border border-border bg-background/50">
          <PromptInputBody><PromptInputTextarea aria-label="Meeting message" placeholder="Message the meeting…" className="min-h-10 text-xs" /></PromptInputBody>
          <PromptInputFooter className="min-h-9 px-2 pb-1.5">
            <span className="text-[10px] text-muted-foreground">Meeting chat</span>
            <PromptInputSubmit aria-label="Send meeting message" className="size-8 shrink-0"><Send className="size-4" /></PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
        <details className="mt-2 border-t border-border pt-2">
          <summary className="cursor-pointer text-xs font-medium text-primary">Ask Thread Agent</summary>
          <div className="pt-2"><AgentConsole compact liveContext={liveContext} placeholder="Ask Thread to act on this meeting…" /></div>
        </details>
      </div>
    </section>
  );
}

function ChatMessages() {
  const { chat } = useDemo();
  if (chat.length === 0) {
    return <div className="flex flex-1 items-center justify-center p-4"><p className="text-xs text-muted-foreground">Chat messages will appear here.</p></div>;
  }
  return (
    <Conversation className="min-h-0">
      <ConversationContent className="gap-3 p-4">
      {chat.map((c, i) => {
        const first = chat[i - 1]?.from !== c.from;
        const initials = c.isAgent ? "You" : c.from.split(" ").map((w) => w[0]).join("").slice(0, 2);
        return (
          <div key={c.id} className={cn("flex gap-2.5", (c.isAgent || c.from === "You") && "flex-row-reverse", !first && "-mt-2")}>
            <div className={cn("size-7 shrink-0", !first && "invisible")}>
              <div className={cn("flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-1", c.isAgent ? "bg-primary/20 text-primary ring-primary/40" : "bg-secondary text-foreground ring-border")}>{c.from === "You" ? "You" : initials}</div>
            </div>
            <Message from={c.isAgent || c.from === "You" ? "user" : "assistant"} className={cn("min-w-0 max-w-[80%] gap-0.5", (c.isAgent || c.from === "You") && "text-right")}>
              {first && (
                <p className="mb-1 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/85">{c.isAgent ? "You (Thread Agent)" : c.from}</span> · {formatTime(c.timeSec)}
                </p>
              )}
              <MessageContent className={cn("break-words text-left text-xs leading-relaxed", (c.isAgent || c.from === "You") ? "!bg-primary !text-primary-foreground" : "px-0 py-0 text-foreground")}>
                <MessageResponse>{c.text}</MessageResponse>
                {c.reactions.length > 0 && (
                  <div className="mt-1.5 flex gap-1">
                    {c.reactions.map((r, j) => (
                      <span key={j} className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{r}</span>
                    ))}
                  </div>
                )}
              </MessageContent>
            </Message>
          </div>
        );
      })}
      </ConversationContent>
      <ConversationScrollButton aria-label="Scroll to newest message" />
    </Conversation>
  );
}

export function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
