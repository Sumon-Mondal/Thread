import { connectedAppNames } from "@/lib/integrations-catalog";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, FileUser, Mail, Paperclip, Send, X, CheckCircle2, Loader2 } from "lucide-react";
import { FORMS, PAST_MEETINGS, SAMPLE_RESUME, getForm } from "@/lib/past-meetings";
import { cn } from "@/lib/utils";
import { SendToCalendar } from "@/components/SendToCalendar";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Tool, ToolHeader, ToolContent } from "@/components/ai-elements/tool";
import threadLogo from "@/assets/thread-t.svg";
import { completedAnswers } from "@/lib/applicant-answers";

type Doc = { name: string; text: string };
type FilledField = { value: string; source: string };
type AgentResult = {
  reply: string;
  steps?: string[];
  form?: { formId: string; submitTo?: string; fields: Record<string, FilledField> } | null;
  email?: { to?: string; subject: string; body: string } | null;
  events?: { title: string; start?: string; durationMin?: number; notes?: string; timeGuessed?: boolean }[] | null;
};
type Msg = { id: number; role: "user" | "agent"; text: string; steps?: string[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SUBMISSIONS_KEY = "thread-submissions";
export type Submission = { id: string; kind: "form" | "email"; title: string; to: string; at: string };
export function loadSubmissions(): Submission[] {
  try { return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) ?? "[]") as Submission[]; } catch { return []; }
}
export function addSubmission(s: Omit<Submission, "id" | "at">) {
  const list = [{ ...s, id: crypto.randomUUID(), at: new Date().toISOString() }, ...loadSubmissions()].slice(0, 50);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("thread-submissions"));
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const c = await page.getTextContent();
      out += c.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
    }
    return out;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return r.value;
  }
  return file.text();
}

export function AgentConsole({
  compact = false,
  liveContext,
  defaultMeetingId = "",
  placeholder = "Tell Thread what to do… e.g. “Fill out the Nova internship application using my resume”",
}: {
  compact?: boolean;
  liveContext?: string;
  defaultMeetingId?: string;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [meetingId, setMeetingId] = useState(defaultMeetingId);
  const [form, setForm] = useState<{ formId: string; fields: Record<string, FilledField>; submitTo: string; sentTo?: string; shown: number; submitted: boolean } | null>(null);
  const [events, setEvents] = useState<NonNullable<AgentResult["events"]>>([]);
  const [email, setEmail] = useState<{ to: string; subject: string; body: string; sent: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  // Animate form fields filling in one by one
  useEffect(() => {
    if (!form) return;
    const total = getForm(form.formId)?.fields.length ?? 0;
    if (form.shown >= total) return;
    const t = setTimeout(() => setForm((f) => (f ? { ...f, shown: f.shown + 1 } : f)), 180);
    return () => clearTimeout(t);
  }, [form]);

  async function onFiles(list: FileList | null) {
    if (!list) return;
    for (const f of Array.from(list).slice(0, 5)) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 10MB`);
        continue;
      }
      try {
        const text = (await extractText(f)).slice(0, 30000);
        setDocs((d) => [...d, { name: f.name, text }]);
        toast.success(`Read ${f.name}`);
      } catch {
        toast.error(`Couldn't read ${f.name}`);
      }
    }
  }

  async function send(messageText = input) {
    const message = messageText.trim();
    if (!message || busy) return;
    const requestDocs = docs.length ? docs : /\b(fill|complete|application|form)\b/i.test(message) ? [SAMPLE_RESUME] : [];
    setInput("");
    setMsgs((m) => [...m, { id: ++idRef.current, role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        signal: AbortSignal.timeout(45000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, meetingId: meetingId || undefined, documents: requestDocs, liveContext, connectedApps: connectedAppNames() }),
      });
      const data = (await res.json()) as AgentResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Request failed (${res.status})`);
      setMsgs((m) => [...m, { id: ++idRef.current, role: "agent", text: data.reply, steps: data.steps ?? [] }]);
      if (data.form) {
        const formDef = getForm(data.form.formId);
        if (formDef) {
          const fields = completedAnswers(formDef, data.form.fields);
          setForm({ formId: data.form.formId, fields, submitTo: formDef.submitTo, shown: 0, submitted: false });
          const count = formDef.fields.filter((field) => fields[field.key]?.value?.trim()).length;
          toast.success(`${formDef.title}: ${count} of ${formDef.fields.length} fields filled${count < formDef.fields.length ? "; review missing fields" : ""}`);
        }
      }
      setEvents(Array.isArray(data.events) ? data.events.filter((ev) => ev && ev.title).slice(0, 8) : []);
      if (data.email) setEmail({ ...data.email, to: data.email.to ?? "", sent: false });
      if (data.email) toast.success("Email draft ready for review");
      if (data.events?.length) toast.success(`${data.events.length} calendar event${data.events.length === 1 ? "" : "s"} ready for review`);
    } catch (e) {
      const text = e instanceof Error ? e.message : "Something went wrong";
      setMsgs((m) => [...m, { id: ++idRef.current, role: "agent", text: `⚠ ${text}` }]);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  async function realSend(to: string, subject: string, body: string, html?: string) {
    setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(html ? { to, subject, body, html } : { to, subject, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; delivered?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Send failed (${res.status})`);
      if (data.delivered === "inbox") toast.success("Confirmed: it's in your Gmail inbox");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
      return false;
    } finally {
      setSending(false);
    }
  }

  async function sendDraft() {
    if (!email) return;
    if (!EMAIL_RE.test(email.to.trim())) { toast.error("Add a real email address in the To field first"); return; }
    if (await realSend(email.to.trim(), email.subject, email.body)) {
      setEmail({ ...email, sent: true });
      addSubmission({ kind: "email", title: email.subject, to: email.to.trim() });
      toast.success(`Email sent to ${email.to} from your Gmail`);
    }
  }

  async function submitForm(d: NonNullable<ReturnType<typeof getForm>>) {
    if (!form) return;
    const missing = d.fields.filter((field) => !form.fields[field.key]?.value?.trim()).length;
    if (missing) { toast.error(`Complete ${missing} missing field${missing === 1 ? "" : "s"} before sending`); return; }
    const to = form.submitTo.trim();
    if (to && !EMAIL_RE.test(to)) { toast.error("That email address doesn't look right"); return; }
    if (to) {
      const rows = d.fields.map((f) => [f.label, form.fields[f.key]?.value || "—"] as const);
      const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
      const text = `${d.title} — ${d.org}\n\n` + rows.map(([l, v]) => `${l}: ${v}`).join("\n") + "\n\nSubmitted via Thread";
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="margin:0 0 4px">${esc(d.title)}</h2><p style="color:#666;margin:0 0 16px">${esc(d.org)}</p><table style="border-collapse:collapse;width:100%">${rows.map(([l, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:40%">${esc(l)}</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table><p style="color:#999;font-size:12px;margin-top:16px">Submitted via Thread</p></div>`;
      if (!(await realSend(to, `Completed: ${d.title}`, text, html))) return;
    }
    setForm((f) => f && { ...f, submitted: true, ...(to ? { sentTo: to } : {}) });
    addSubmission({ kind: "form", title: d.title, to: to || "saved in app" });
    toast.success(to ? `${d.title} submitted and emailed to ${to}` : `${d.title} saved to Submissions`);
  }

  const def = form ? getForm(form.formId) : undefined;

  return (
    <div className={cn("grid gap-4", !compact && (form || email) && "lg:grid-cols-[1fr_1fr]")}>
      {/* Conversation */}
      <div className={cn("glass-panel flex min-w-0 flex-col p-4", compact ? "min-h-0" : "min-h-[520px]")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={threadLogo} alt="" className="size-4 object-contain" />
            <p className="text-sm font-semibold">Thread Agent</p>
          </div>
          {!compact && (
            <select
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="rounded-lg border border-border bg-background/60 px-2 py-1 text-xs"
              aria-label="Meeting context"
            >
              <option value="">All past meetings</option>
              {PAST_MEETINGS.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          )}
        </div>

        <Conversation className={cn("min-h-0", compact ? "max-h-48" : "max-h-[380px]")}>
          <ConversationContent className="gap-3 p-1">
          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                ["Fill internship app", "Fill out the Nova Dynamics internship application using my resume"],
                ["Job application", "Fill the job application from the Discovery Day transcript"],
                ...(compact ? [] : [["Lab report", "Fill the BIO 204 lab report form from the class meeting"], ["Vendor intake", "Complete the vendor intake form from the work meeting"]]),
              ].map(([label, s]) => (
                <Button key={label} variant="outline" size="sm" onClick={() => void send(s ?? "")} className="h-7 text-[11px] text-muted-foreground hover:text-foreground">
                  {label}
                 </Button>
              ))}
            </div>
          )}
          {msgs.map((m) => (
            <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
              <MessageContent className={cn("text-sm leading-relaxed", m.role === "user" ? "!bg-primary !text-primary-foreground" : "px-0 py-0 text-foreground")}>
                <MessageResponse>{m.text}</MessageResponse>
              </MessageContent>
              {m.steps && m.steps.length > 0 && (
                <Tool defaultOpen={false} className="mt-2 mb-0 border-border bg-muted/30">
                  <ToolHeader title="Agent steps" type="dynamic-tool" toolName="Agent steps" state="output-available" className="p-2" />
                  <ToolContent className="p-2"><ul className="space-y-1">
                  {m.steps.map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="size-3 text-emerald-400" /> {s}
                    </li>
                  ))}
                  </ul></ToolContent>
                </Tool>
              )}
            </Message>
          ))}
          {busy && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Thread is working… reading context{docs.length ? " and documents" : ""}
            </p>
          )}
          </ConversationContent>
          <ConversationScrollButton aria-label="Scroll to newest reply" />
        </Conversation>

        {docs.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {docs.map((d, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[11px]">
                <FileText className="size-3" /> {d.name}
                 <Button variant="ghost" size="icon" className="size-5" aria-label={`Remove ${d.name}`} onClick={() => setDocs((x) => x.filter((_, j) => j !== i))}><X className="size-3" /></Button>
              </span>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="mt-2">
          <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
           <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="rounded-md border border-border bg-background/50">
             <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} aria-label="Ask Thread" placeholder={placeholder} rows={2} className="min-h-12 w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground" />
             <div className="flex min-h-10 items-center justify-between px-1.5 pb-1.5">
               <div className="flex items-center gap-1">
                 <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} aria-label="Upload documents" title="Upload documents" className="size-8"><Paperclip className="size-4" /></Button>
                 {!docs.some((d) => d.name === SAMPLE_RESUME.name) && <Button type="button" variant="ghost" size="icon" onClick={() => setDocs((d) => [...d, SAMPLE_RESUME])} aria-label="Attach sample resume" title="Attach sample resume" className="size-8"><FileUser className="size-4" /></Button>}
               </div>
               <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send to Thread" className="size-8 shrink-0">{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button>
             </div>
           </form>
        </div>
      </div>

      {/* Results */}
      {(form || email) && (
        <div className="space-y-4">
          {form && def && (
            <div className="glass-panel p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="meta-chip text-primary">Agent-filled form</p>
                  <h3 className="text-sm font-semibold">{def.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{def.org} · due {def.due}</p>
                </div>
                {form.submitted && <span className="meta-chip rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-400">Submitted</span>}
              </div>
              {(() => {
                const filled = def.fields.filter((f) => form.fields[f.key]?.value);
                const missing = def.fields.length - filled.length;
                const done = form.shown >= def.fields.length;
                const sources = [...new Set(filled.map((f) => (form.fields[f.key]?.source ?? "").split(/[ (]/)[0]).filter(Boolean))];
                return (
                  <div role="status" className={cn("mb-3 rounded-xl border p-3", form.submitted ? "border-emerald-500/40 bg-emerald-500/10" : "border-primary/30 bg-primary/5")}>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {done ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Loader2 className="size-4 animate-spin text-primary" />}
                      {form.submitted ? `Submitted · ${filled.length} fields sent to ${def.org}` : done ? `Filled ${filled.length} of ${def.fields.length} fields` : "Filling fields…"}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(filled.length / Math.max(def.fields.length, 1)) * 100}%` }} />
                    </div>
                    {done && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {sources.length > 0 && <>Sources: {sources.join(" · ")}. </>}
                        {missing > 0 ? <span className="text-amber-400">{missing} field{missing > 1 ? "s" : ""} need your input.</span> : "Nothing missing."}
                        {!form.submitted && " Review, then approve."}
                      </p>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-2.5">
                {def.fields.map((f, i) => {
                  const v = form.fields[f.key] ?? { value: "", source: "needs your input" };
                  const visible = i < form.shown;
                  const Input = f.type === "textarea" ? "textarea" : "input";
                  return (
                    <label key={f.key} className={cn("block transition-opacity duration-300", visible ? "opacity-100" : "opacity-30")}>
                      <span className="flex items-center justify-between text-[11px] text-muted-foreground">
                        {f.label}
                        {visible && <span className={cn("meta-chip", v.value ? "text-emerald-400" : "text-amber-400")}>{v.value ? `from ${v.source}` : "needs your input"}</span>}
                      </span>
                      <Input
                        value={visible ? v.value : ""}
                        disabled={form.submitted}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setForm((fm) => fm && { ...fm, fields: { ...fm.fields, [f.key]: { value: e.target.value, source: "you" } } })
                        }
                        className={cn("mt-1 w-full rounded-lg border bg-background/50 px-2.5 py-1.5 text-sm outline-none focus:border-primary/60", v.value ? "border-emerald-500/30" : "border-amber-500/40")}
                      />
                    </label>
                  );
                })}
              </div>
              {!form.submitted ? (
                <>
                  <label className="mt-4 block text-[11px] text-muted-foreground">
                    Send completed form to
                    <input value={form.submitTo} onChange={(e) => setForm((f) => f && { ...f, submitTo: e.target.value })} placeholder="recruiter@company.com" aria-label="Send form to" className="mt-1 w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-sm" />
                  </label>
                   <Button
                    disabled={sending}
                    onClick={() => submitForm(def)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-60"
                  >
                    {sending && <Loader2 className="size-4 animate-spin" />} Approve & Submit
                   </Button>
                </>
              ) : (
                form.sentTo && <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" /> Emailed to {form.sentTo} from your Gmail</p>
              )}
            </div>
          )}
          {events.length > 0 && (
            <div className="glass-panel p-4">
              <p className="meta-chip mb-2 w-fit text-primary">Google Calendar · {events.length} event{events.length > 1 ? "s" : ""} ready</p>
              <ul className="space-y-2">
                {events.map((ev, i) => {
                  const d = ev.start ? new Date(ev.start) : null;
                  const when = d && !isNaN(d.getTime()) ? d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Tomorrow 9:00 AM";
                  return (
                    <li key={`${ev.title}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/40 p-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-[11px] text-muted-foreground">{when} · {ev.durationMin ?? 30} min{ev.timeGuessed ? " · time guessed, no time was given" : ""}</p>
                      </div>
                      <SendToCalendar title={ev.title} prefix="" label="Approve & Add to Calendar" {...(ev.start ? { start: ev.start } : {})} {...(ev.durationMin ? { durationMin: ev.durationMin } : {})} {...(ev.notes ? { notes: ev.notes } : {})} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {email && (
            <div className="glass-panel p-4">
              <p className="meta-chip mb-2 flex items-center gap-1 text-primary"><Mail className="size-3" /> Agent-drafted email</p>
              <div className="space-y-2 text-sm">
                <input value={email.to} disabled={email.sent} placeholder="name@example.com" onChange={(e) => setEmail({ ...email, to: e.target.value })} aria-label="To" className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5" />
                <input value={email.subject} disabled={email.sent} onChange={(e) => setEmail({ ...email, subject: e.target.value })} aria-label="Subject" className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5 font-medium" />
                <textarea value={email.body} disabled={email.sent} rows={7} onChange={(e) => setEmail({ ...email, body: e.target.value })} aria-label="Body" className="w-full rounded-lg border border-border bg-background/50 px-2.5 py-1.5" />
              </div>
              {email.sent ? (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" /> Sent to {email.to} from your Gmail</p>
              ) : (
                 <Button disabled={sending} onClick={sendDraft} className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/85 disabled:opacity-60">
                  {sending && <Loader2 className="size-4 animate-spin" />} Approve & Send
                 </Button>
              )}
            </div>
          )}
        </div>
      )}
      <span className="sr-only">{FORMS.length} forms available</span>
    </div>
  );
}
