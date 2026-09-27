import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, Users } from "lucide-react";
import { PAST_MEETINGS } from "@/lib/past-meetings";

export const Route = createFileRoute("/meetings/")({
  head: () => ({
    meta: [
      { title: "Meetings — Thread" },
      { name: "description", content: "Your attended meetings with summaries, action items, detected links, QR codes and forms." },
      { property: "og:title", content: "Meetings — Thread" },
      { property: "og:description", content: "Your attended meetings with summaries, action items, detected links, QR codes and forms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Meetings,
});

const KIND_STYLE = {
  Internship: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  Class: "bg-teal-500/15 text-teal-300 ring-teal-500/30",
  Work: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
} as const;

function Meetings() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Meetings Thread attended for you — open one to see what was captured, or hand it to the agent.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {PAST_MEETINGS.map((m) => (
          <Link key={m.id} to="/meetings/$id" params={{ id: m.id }} className="glass-panel group block p-5 transition hover:ring-1 hover:ring-primary/40">
            <div className="flex items-center justify-between">
              <span className={`meta-chip rounded px-1.5 py-0.5 ring-1 ${KIND_STYLE[m.kind]}`}>{m.kind}</span>
              <span className="meta-chip text-emerald-400">✓ Attended</span>
            </div>
            <h2 className="mt-3 font-semibold leading-snug group-hover:text-primary">{m.title}</h2>
            <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{m.summary}</p>
            <div className="mt-4 space-y-1 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-1.5"><Calendar className="size-3" /> {m.date} · {m.platform}</p>
              <p className="flex items-center gap-1.5"><Clock className="size-3" /> {m.duration}</p>
              <p className="flex items-center gap-1.5"><Users className="size-3" /> {m.attendees.length} attendees</p>
            </div>
            <div className="mt-4 flex gap-2 text-[11px]">
              <span className="rounded-full bg-white/8 px-2 py-0.5">{m.actionItems.length} actions</span>
              <span className="rounded-full bg-white/8 px-2 py-0.5">{m.links.length} links</span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">{m.formIds.length} forms to fill</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
