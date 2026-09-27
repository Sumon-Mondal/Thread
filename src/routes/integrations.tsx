import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPanel } from "@/components/CalendarPanel";
import { Check, Link2, Unlink, Search } from "lucide-react";
import { CATALOG, CATEGORIES, INTEGRATIONS_KEY, loadConnected, type IntegrationCategory } from "@/lib/integrations-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Thread" },
      { name: "description", content: "Connect Thread to 30+ add-ins: calendars, meeting apps, notes, tasks, messaging, storage, CRM and learning tools." },
      { property: "og:title", content: "Integrations — Thread" },
      { property: "og:description", content: "Connect Thread to your calendar and meeting platforms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<IntegrationCategory | "All">("All");

  useEffect(() => {
    setConnected(loadConnected());
  }, []);

  const toggle = (id: string) => {
    setConnected((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const connectedCount = CATALOG.filter((a) => connected[a.id]).length;
  const list = CATALOG.filter(
    (a) =>
      (cat === "All" || a.category === cat) &&
      (q.trim() === "" || `${a.name} ${a.desc} ${a.useCases.join(" ")}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <main className="mx-auto w-[calc(100%-1.5rem)] max-w-[1560px] pb-16">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thread plugs into the tools you already use. {connectedCount} of {CATALOG.length} connected.
        </p>
      </div>
      <section className="panel mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Zoom / Google Meet side panel</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Thread in a narrow window that sits next to your call: moments, transcript, agent queue and Ask agent. Listing it inside Zoom's Apps tab or as a Meet add-on needs a Zoom Marketplace / Google Workspace developer account — the panel page itself is ready to register.
          </p>
        </div>
        <button
          onClick={() => window.open("/panel", "thread-panel", "width=380,height=820")}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/85"
        >
          Open side panel
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="glass-panel flex items-center gap-2 rounded-full px-3 py-1.5">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search add-ins…"
                aria-label="Search add-ins"
                className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium ring-1 transition",
                  cat === c ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((app) => {
              const on = !!connected[app.id];
              return (
                <div key={app.id} className="glass-panel flex flex-col rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div className={cn("flex size-10 items-center justify-center rounded-xl text-sm font-bold ring-1", app.hue)}>
                      {app.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex gap-1">
                      <span
                        className={cn(
                          "meta-chip rounded-full px-2 py-0.5 ring-1",
                          app.status === "live" ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" : "bg-secondary text-muted-foreground ring-border",
                        )}
                      >
                        {app.status === "live" ? "Live" : "Demo"}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{app.name}</h3>
                  <p className="meta-chip text-muted-foreground">{app.category}</p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{app.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {app.useCases.map((u) => (
                      <span key={u} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground/80">{u}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => toggle(app.id)}
                    disabled={app.status === "live"}
                    className={cn(
                      "mt-3 flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-70",
                      on ? "border border-border text-muted-foreground hover:text-foreground" : "bg-primary text-primary-foreground hover:bg-primary/85",
                    )}
                  >
                    {on ? (app.status === "live" ? <><Check className="size-3.5" /> Connected</> : <><Unlink className="size-3.5" /> Disconnect</>) : <><Link2 className="size-3.5" /> Connect</>}
                  </button>
                </div>
              );
            })}
            {list.length === 0 && <p className="text-sm text-muted-foreground">No add-ins match your search.</p>}
          </div>
        </div>

        <CalendarPanel />
      </div>
    </main>
  );
}
