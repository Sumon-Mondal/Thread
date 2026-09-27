import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Compass, X } from "lucide-react";
import { startZoomIntro } from "@/components/ZoomCallIntro";

const STEPS = [
  { to: "/meetings", title: "1 · Meetings Thread attended", body: "An internship info session, a class lecture and a work sync — each with summary, action items, links and forms, captured automatically.", tech: "Lovable AI Gateway (openai/gpt-6-astra) summarizes and extracts." },
  { to: "/", title: "2 · Live meeting", body: "A Zoom call comes in — accept it and watch it glide left while Thread transcribes speech, spots moments, and decodes the QR code posted in chat right in the browser.", tech: "ElevenLabs Scribe realtime · jsQR decoding", play: true },
  { to: "/agent", title: "3 · Tell the agent", body: "Type “Fill out the Nova internship application using my resume” and press Enter. Watch every field fill, with its source.", tech: "Agent reads uploads (PDF/DOCX) + meeting context via AI Gateway" },
  { to: "/agent", title: "4 · Emails with approval", body: "Type “Email Sarah a thank-you note”. Thread drafts it; nothing is sent until you approve.", tech: "Human-in-the-loop approval on every action" },
  { to: "/insights", title: "5 · AI Insights", body: "Paste any transcript and extract decisions, action items and owners.", tech: "Structured extraction via AI Gateway" },
  { to: "/integrations", title: "6 · Works with your apps", body: "Google Calendar, Google Meet, Zoom, Slack and Notion, with an auto-join queue.", tech: "Integration connectors" },
] as const;

export function DemoTour() {
  const [step, setStep] = useState<number | null>(null);
  const navigate = useNavigate();
  

  function go(i: number) {
    const s = STEPS[i];
    if (!s) return setStep(null);
    setStep(i);
    void navigate({ to: s.to });
    if ("play" in s && s.play) setTimeout(startZoomIntro, 400);
  }

  if (step === null) {
    return (
      <button onClick={() => go(0)} className="glass-panel fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/40 hover:bg-primary/10">
        <Compass className="size-4" /> Demo Tour
      </button>
    );
  }
  const s = STEPS[step]!;
  return (
    <div className="glass-panel fixed bottom-5 left-5 z-50 w-[340px] rounded-2xl p-4 ring-1 ring-primary/40">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold">{s.title}</p>
        <button aria-label="Close tour" onClick={() => setStep(null)}><X className="size-4 text-muted-foreground" /></button>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
      <p className="meta-chip mt-2 text-primary">{s.tech}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{step + 1} / {STEPS.length}</span>
        <div className="flex gap-2">
          {step > 0 && <button onClick={() => go(step - 1)} className="rounded-full border border-border px-3 py-1 text-xs">Back</button>}
          <button onClick={() => go(step + 1)} className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{step === STEPS.length - 1 ? "Finish" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
