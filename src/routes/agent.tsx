import { createFileRoute, Link } from "@tanstack/react-router";
import { AgentConsole } from "@/components/AgentConsole";
import { SubmissionsList } from "@/components/SubmissionsList";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "Agent — Thread" },
      { name: "description", content: "Tell Thread's agent what to do: fill job applications and forms, draft emails, and read your uploaded documents." },
      { property: "og:title", content: "Agent — Thread" },
      { property: "og:description", content: "Tell Thread's agent what to do: fill job applications and forms, draft emails, and read your uploaded documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <main className="mx-auto w-full max-w-[1300px] px-4 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Agent</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        No buttons to learn — just tell Thread what you need. Upload a resume or document, then press Enter.
      </p>
      <div className="mb-4 mt-2 flex gap-2 text-xs">
        <Link to="/apply/$formId" params={{ formId: "internship-app" }} className="rounded-full bg-secondary px-3 py-1 ring-1 ring-border">Full internship application →</Link>
        <Link to="/apply/$formId" params={{ formId: "job-app" }} className="rounded-full bg-secondary px-3 py-1 ring-1 ring-border">Full job application →</Link>
      </div>
      <AgentConsole />
      <SubmissionsList />
    </main>
  ),
});
