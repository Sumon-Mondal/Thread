import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Mail } from "lucide-react";
import { loadSubmissions, type Submission } from "@/components/AgentConsole";

export function SubmissionsList() {
  const [list, setList] = useState<Submission[]>([]);
  useEffect(() => {
    const load = () => setList(loadSubmissions());
    load();
    window.addEventListener("thread-submissions", load);
    return () => window.removeEventListener("thread-submissions", load);
  }, []);
  return (
    <section className="glass-panel mt-6 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-emerald-400" /> Submissions & sent emails</h2>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing sent yet. Ask the agent to fill a form or write an email, then approve it.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm">
              {s.kind === "form" ? <FileText className="size-4 text-primary" /> : <Mail className="size-4 text-primary" />}
              <span className="flex-1 truncate font-medium">{s.title}</span>
              <span className="truncate text-xs text-muted-foreground">→ {s.to}</span>
              <span className="meta-chip text-muted-foreground">{new Date(s.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
