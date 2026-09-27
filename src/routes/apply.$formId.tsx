import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, CheckCircle2, Inbox, Loader2, Send } from "lucide-react";
import { FORMS, SAMPLE_RESUME, getForm, getMeeting } from "@/lib/past-meetings";
import { addSubmission } from "@/components/AgentConsole";
import { cn } from "@/lib/utils";
import { completedAnswers } from "@/lib/applicant-answers";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/apply/$formId")({
  loader: ({ params }) => {
    const form = getForm(params.formId);
    if (!form) throw notFound();
    return { form };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.form.title} — Thread` : "Application — Thread";
    const d = "Complete application form the Thread agent fills from your resume and meeting transcript, then submits from your Gmail.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <main className="p-10 text-center">Form not found. <Link to="/agent" className="text-primary">Back to Agent</Link></main>,
  component: ApplyPage,
});

type Val = { value: string; source?: string };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

function ApplyPage() {
  const { form } = Route.useLoaderData();
  const meeting = getMeeting(form.meetingId);
  const [vals, setVals] = useState<Record<string, Val>>({});
  const [to, setTo] = useState(form.submitTo);
  const [filling, setFilling] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | { to: string; inbox: boolean; at: string }>(null);
  const startedFor = useRef<string | null>(null);
  const filled = form.fields.filter((f) => vals[f.key]?.value.trim()).length;

  useEffect(() => {
    if (startedFor.current === form.id) return;
    startedFor.current = form.id;
    setVals({});
    setTo(form.submitTo);
    void fillWithAgent();
  }, [form.id]);

  async function fillWithAgent() {
    setFilling(true);
    try {
      const res = await fetch("/api/agent", {
        signal: AbortSignal.timeout(45000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Fill the form "${form.id}" completely using my resume and the meeting. Use formId "${form.id}".`,
          meetingId: form.meetingId,
          documents: [SAMPLE_RESUME],
        }),
      });
      const data = (await res.json()) as { error?: string; form?: { fields?: Record<string, Val> } | null };
      if (!res.ok || data.error) throw new Error(data.error ?? `Agent failed (${res.status})`);
      const f = data.form?.fields ?? {};
      const completed = completedAnswers(form, f);
      setVals((v) => ({ ...v, ...completed }));
      const count = form.fields.filter((field) => completed[field.key]?.value?.trim()).length;
      if (count === 0) toast.warning("The agent couldn't fill any fields. Add a document or fill them yourself.");
      else toast.success(`Agent filled ${count} of ${form.fields.length} fields${count < form.fields.length ? "; review the remaining fields" : "; ready for your review"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Agent failed");
    } finally {
      setFilling(false);
    }
  }

  async function submit() {
     if (filling) { toast.error("Wait for the agent to finish filling the form"); return; }
     if (filled < form.fields.length) { toast.error(`Complete the ${form.fields.length - filled} missing field${form.fields.length - filled === 1 ? "" : "s"} before sending`); return; }
     if (!EMAIL_RE.test(to.trim())) { toast.error("Enter a real email address to send it to"); return; }
    setSending(true);
    try {
      const rows = form.fields.map((f) => [f.label, vals[f.key]?.value || "—"] as const);
      const body = `${form.title} — ${form.org}\n\n` + rows.map(([l, v]) => `${l}: ${v}`).join("\n") + "\n\nSubmitted via Thread";
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px"><h2 style="margin:0 0 4px">${esc(form.title)}</h2><p style="color:#666;margin:0 0 16px">${esc(form.org)}</p><table style="border-collapse:collapse;width:100%">${rows.map(([l, v]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:38%;vertical-align:top">${esc(l)}</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table><p style="color:#999;font-size:12px;margin-top:16px">Submitted via Thread</p></div>`;
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), subject: `Application: ${form.title}`, body, html }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; delivered?: string; sentAt?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Send failed");
      setDone({ to: to.trim(), inbox: data.delivered === "inbox", at: data.sentAt ?? new Date().toISOString() });
      addSubmission({ kind: "form", title: form.title, to: to.trim() });
      toast.success(data.delivered === "inbox" ? "Submitted — confirmed in your Gmail inbox" : `Submitted to ${to.trim()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-4 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="meta-chip text-muted-foreground">{form.org} · due {form.due}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{form.title}</h1>
          {meeting && <p className="mt-1 text-sm text-muted-foreground">From meeting: {meeting.title}</p>}
        </div>
        <div className="flex gap-2">
          {FORMS.filter((f) => f.id === "internship-app" || f.id === "job-app").map((f) => (
            <Link key={f.id} to="/apply/$formId" params={{ formId: f.id }} className={cn("rounded-full px-3 py-1 text-xs ring-1 ring-border", f.id === form.id && "bg-primary text-primary-foreground")}>
              {f.id === "job-app" ? "Job" : "Internship"}
            </Link>
          ))}
        </div>
      </div>

       <div className="glass-panel mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-medium">Filled {filled} of {form.fields.length} fields</p>
          <div className="mt-1.5 h-1.5 w-56 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${(filled / form.fields.length) * 100}%` }} />
          </div>
        </div>
         <Button onClick={fillWithAgent} disabled={filling} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {filling ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
           {filling ? "Agent is filling…" : "Refill with agent"}
         </Button>
      </div>

      <form className="glass-panel mt-4 grid gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        {form.fields.map((f) => {
          const v = vals[f.key];
          const wide = f.type === "textarea";
          const set = (value: string) => setVals((s) => ({ ...s, [f.key]: { value, source: s[f.key]?.source ?? "You" } }));
          return (
            <label key={f.key} className={cn("block text-sm", wide && "sm:col-span-2")}>
              <span className="text-muted-foreground">{f.label}</span>
              {wide ? (
                <textarea value={v?.value ?? ""} onChange={(e) => set(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background/50 px-3 py-2" />
              ) : (
                <input type={f.type === "date" ? "text" : (f.type ?? "text")} value={v?.value ?? ""} onChange={(e) => set(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background/50 px-3 py-2" />
              )}
              {v?.source && <span className={cn("mt-1 block text-[11px]", v.value ? "text-primary" : "text-amber-400")}>{v.value ? `From: ${v.source}` : "Needs your input"}</span>}
            </label>
          );
        })}
        <div className="border-t border-border pt-4 sm:col-span-2">
          <label className="block text-sm">
            <span className="text-muted-foreground">Send the completed application to</span>
            <input type="email" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background/50 px-3 py-2" />
          </label>
            <Button type="submit" disabled={sending || filling || filled < form.fields.length} className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
             {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Review & send from my Gmail
           </Button>
          {done && (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
              {done.inbox ? <Inbox className="size-4" /> : <CheckCircle2 className="size-4" />}
              {done.inbox ? "Delivered to your Gmail inbox" : `Sent to ${done.to}`} · {new Date(done.at).toLocaleTimeString()}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
