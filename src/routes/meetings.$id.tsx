import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { QrCode, Link2, Presentation } from "lucide-react";
import { AgentConsole } from "@/components/AgentConsole";
import { AgentText } from "@/components/AgentContextMenu";
import { getForm, getMeeting } from "@/lib/past-meetings";
import { SendToCalendar } from "@/components/SendToCalendar";

export const Route = createFileRoute("/meetings/$id")({
  loader: ({ params }) => {
    const m = getMeeting(params.id);
    if (!m) throw notFound();
    return m;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Meeting"} — Thread` },
      { name: "description", content: loaderData?.summary ?? "Meeting details captured by Thread." },
      { property: "og:title", content: `${loaderData?.title ?? "Meeting"} — Thread` },
      { property: "og:description", content: loaderData?.summary ?? "Meeting details captured by Thread." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  notFoundComponent: () => (
    <main className="mx-auto max-w-xl p-10 text-center">
      <p>Meeting not found.</p>
      <Link to="/meetings" className="text-primary underline">Back to meetings</Link>
    </main>
  ),
  component: MeetingDetail,
});

const VIA = { qr: QrCode, chat: Link2, slide: Presentation } as const;

function MeetingDetail() {
  const m = Route.useLoaderData();
  return (
    <main className="mx-auto w-full max-w-[1300px] px-4 pb-10">
      <Link to="/meetings" className="text-xs text-muted-foreground hover:text-foreground">← All meetings</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{m.title}</h1>
      <p className="text-sm text-muted-foreground">{m.date} · {m.platform} · {m.duration} · {m.attendees.join(", ")}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <section className="glass-panel p-5 lg:col-span-2">
          <h2 className="meta-chip text-muted-foreground">Summary</h2>
          <AgentText context={`Summary of the meeting "${m.title}" (${m.date}, ${m.platform}): ${m.summary}`} preview={m.summary}>
            <p className="mt-2 text-sm leading-relaxed">{m.summary}</p>
          </AgentText>
          <h2 className="meta-chip mt-5 text-muted-foreground">Decisions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {m.decisions.map((d) => (
              <AgentText key={d} context={`Decision made in the meeting "${m.title}": "${d}"`} preview={d}>
                <li>{d}</li>
              </AgentText>
            ))}
          </ul>
          <h2 className="meta-chip mt-5 text-muted-foreground">Action items</h2>
          <div className="mt-2 space-y-1.5">
            {m.actionItems.map((a) => (
              <AgentText key={a.task} context={`Action item from the meeting "${m.title}": "${a.task}" — owner: ${a.owner}, due: ${a.due}.`} preview={a.task}>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">
                  <span>{a.task}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">{a.owner} · {a.due}<SendToCalendar title={a.task} notes={`From "${m.title}". Owner: ${a.owner}. Due: ${a.due}.`} /></span>
                </div>
              </AgentText>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="glass-panel p-5">
            <h2 className="meta-chip text-muted-foreground">Links & QR codes captured</h2>
            <div className="mt-2 space-y-2">
              {m.links.map((l) => {
                const Icon = VIA[l.via];
                return (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-2 text-sm hover:border-primary/40">
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0"><span className="block">{l.label}</span><span className="block truncate font-mono text-[10px] text-muted-foreground">from {l.via} · {l.url}</span></span>
                  </a>
                );
              })}
            </div>
          </div>
          <div className="glass-panel p-5">
            <h2 className="meta-chip text-muted-foreground">Forms waiting</h2>
            {m.formIds.map((id) => {
              const f = getForm(id);
              return f ? <p key={id} className="mt-2 text-sm">{f.title} <span className="text-xs text-amber-400">· due {f.due}</span></p> : null;
            })}
          </div>
        </section>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Hand it to the agent</h2>
      <p className="mb-3 text-sm text-muted-foreground">Type what you want done with this meeting — Thread fills the forms and drafts emails for you.</p>
      <AgentConsole defaultMeetingId={m.id} />
    </main>
  );
}
