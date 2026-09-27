import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPanel } from "@/components/CalendarPanel";
import {
  Check,
  Link2,
  Unlink,
  Search,
  Bot,
  Play,
  Square,
  Settings2,
  Sparkles,
  ExternalLink,
  Calendar,
  Mail,
  ShieldCheck,
  KeyRound,
  FileCode,
  Globe,
  Zap,
} from "lucide-react";
import { CATALOG, CATEGORIES, INTEGRATIONS_KEY, loadConnected, type IntegrationCategory } from "@/lib/integrations-catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations & API Connectors — Thread" },
      { name: "description", content: "Connect Thread to Google Calendar, Gmail, Notion, Outlook, Zoom, Teams, and Cloud Virtual Machine Bot." },
      { property: "og:title", content: "Integrations & API Connectors — Thread" },
      { property: "og:description", content: "Connect Thread to your Google Calendar and meeting platforms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsPage,
});

interface ConnectorServerInfo {
  id: string;
  name: string;
  status: "connected" | "needs_key" | "ready";
  accountEmail?: string;
  syncMode?: string;
  lastSynced?: string;
  workspaceName?: string;
  email?: string;
  personalMeetingUrl?: string;
  defaultRoomUrl?: string;
}

function IntegrationsPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [connectorMeta, setConnectorMeta] = useState<Record<string, ConnectorServerInfo>>({});
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<IntegrationCategory | "All">("All");

  // Virtual Machine Bot State
  const [vmMeetingUrl, setVmMeetingUrl] = useState("");
  const [vmBotStatus, setVmBotStatus] = useState<"idle" | "launching" | "connected" | "error">("idle");
  const [vmLog, setVmLog] = useState("");
  const [isVmLoading, setIsVmLoading] = useState(false);
  const [vmPolicy, setVmPolicy] = useState<"prompt_5min" | "auto_join" | "manual">("prompt_5min");
  const [upcomingMeeting, setUpcomingMeeting] = useState<{
    id: string;
    title: string;
    start: string;
    platform: string;
    joinUrl: string;
    minutesUntilStart: number;
  } | null>(null);

  // Connector Config Modal State
  const [activeConfigApp, setActiveConfigApp] = useState<string | null>(null);
  const [gcalTab, setGcalTab] = useState<"account" | "oauth" | "ical">("account");
  const [googleEmailInput, setGoogleEmailInput] = useState("sumonmondal@gmail.com");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [databaseIdInput, setDatabaseIdInput] = useState("");
  const [icalUrlInput, setIcalUrlInput] = useState("");
  const [meetingUrlInput, setMeetingUrlInput] = useState("");
  const [webhookUrlInput, setWebhookUrlInput] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; instructions?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchServerConnectors = async () => {
    try {
      const res = await fetch("/api/connectors");
      if (res.ok) {
        const data = (await res.json()) as { connectors: ConnectorServerInfo[] };
        const metaMap: Record<string, ConnectorServerInfo> = {};
        const connMap: Record<string, boolean> = {};
        for (const c of data.connectors) {
          metaMap[c.id] = c;
          if (c.status === "connected") {
            connMap[c.id] = true;
          }
        }
        setConnectorMeta(metaMap);
        setConnected((prev) => ({ ...prev, ...connMap }));
        if (metaMap["gcal"]?.accountEmail) {
          setGoogleEmailInput(metaMap["gcal"].accountEmail);
        }
      }
    } catch (e) {
      console.warn("Could not fetch server connectors:", e);
    }
  };

  useEffect(() => {
    setConnected(loadConnected());
    void fetchServerConnectors();
    void checkVmBotStatus();
  }, []);

  const checkVmBotStatus = async () => {
    try {
      const res = await fetch("/api/vm-bot");
      if (res.ok) {
        const data = (await res.json()) as {
          status: "idle" | "launching" | "connected" | "error";
          meetingUrl: string;
          lastLog: string;
          policy?: "prompt_5min" | "auto_join" | "manual";
          upcomingMeeting?: {
            id: string;
            title: string;
            start: string;
            platform: string;
            joinUrl: string;
            minutesUntilStart: number;
          };
        };
        setVmBotStatus(data.status);
        if (data.meetingUrl) setVmMeetingUrl(data.meetingUrl);
        if (data.lastLog) setVmLog(data.lastLog);
        if (data.policy) setVmPolicy(data.policy);
        if (data.upcomingMeeting) setUpcomingMeeting(data.upcomingMeeting);
      }
    } catch {}
  };

  const handleSetVmPolicy = async (policy: "prompt_5min" | "auto_join" | "manual") => {
    setVmPolicy(policy);
    try {
      await fetch("/api/vm-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_policy", policy }),
      });
    } catch {}
  };

  const handleJoinUpcoming = async () => {
    setIsVmLoading(true);
    try {
      const res = await fetch("/api/vm-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join_upcoming" }),
      });
      const data = await res.json();
      if (data.ok) {
        setVmBotStatus("connected");
        setVmLog(`Dispatched VM Bot to join upcoming meeting on your behalf`);
      }
    } catch (err) {
      setVmLog(String(err));
    } finally {
      setIsVmLoading(false);
    }
  };

  const handleStartVmBot = async () => {
    if (!vmMeetingUrl) return;
    setIsVmLoading(true);
    try {
      const res = await fetch("/api/vm-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", meetingUrl: vmMeetingUrl }),
      });
      const data = await res.json();
      if (data.ok) {
        setVmBotStatus("connected");
        setVmLog(`Dispatched VM Bot to ${vmMeetingUrl}`);
      } else {
        setVmBotStatus("error");
        setVmLog(data.error || "Failed to launch bot");
      }
    } catch (err) {
      setVmBotStatus("error");
      setVmLog(String(err));
    } finally {
      setIsVmLoading(false);
    }
  };

  const handleStopVmBot = async () => {
    setIsVmLoading(true);
    try {
      await fetch("/api/vm-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      setVmBotStatus("idle");
      setVmLog("Bot stopped by user.");
    } catch {} finally {
      setIsVmLoading(false);
    }
  };

  const handleTestConnector = async (connectorId: string, actionOverride?: "connect" | "disconnect") => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const payload: Record<string, unknown> = {
        connectorId,
        action: actionOverride || "connect",
      };

      if (connectorId === "gcal") {
        payload.accountEmail = googleEmailInput.trim();
        if (gcalTab === "oauth") payload.apiKey = apiKeyInput.trim();
        if (gcalTab === "ical") payload.icalUrl = icalUrlInput.trim();
      } else if (connectorId === "gmail") {
        payload.accountEmail = googleEmailInput.trim();
        payload.apiKey = apiKeyInput.trim() || undefined;
      } else if (connectorId === "notion") {
        payload.apiKey = apiKeyInput.trim();
        payload.databaseId = databaseIdInput.trim() || undefined;
      } else if (connectorId === "outlook-mail" || connectorId === "outlook-cal") {
        payload.apiKey = apiKeyInput.trim();
        payload.accountEmail = googleEmailInput.trim();
      } else if (connectorId === "teams") {
        payload.webhookUrl = webhookUrlInput.trim();
      } else if (connectorId === "zoom" || connectorId === "gmeet") {
        payload.personalMeetingUrl = meetingUrlInput.trim();
      }

      const res = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResult(data);

      if (data.success) {
        const isNowConnected = actionOverride !== "disconnect";
        setConnected((prev) => {
          const next = { ...prev, [connectorId]: isNowConnected };
          localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(next));
          return next;
        });
        await fetchServerConnectors();
      }
    } catch (err) {
      setTestResult({ success: false, message: `Connection error: ${String(err)}` });
    } finally {
      setIsTesting(false);
    }
  };

  const toggle = (id: string) => {
    if (["gcal", "gmail", "notion", "outlook-mail", "outlook-cal", "teams", "zoom", "gmeet"].includes(id)) {
      setActiveConfigApp(id);
      setTestResult(null);
      return;
    }
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
      (q.trim() === "" || `${a.name} ${a.desc} ${a.useCases.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <main className="mx-auto w-[calc(100%-1.5rem)] max-w-[1560px] pb-16">
      <div className="mb-5 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Integrations &amp; API Connectors</h1>
        <p className="text-sm text-muted-foreground">
          Thread connects to your workflow ecosystem. {connectedCount} of {CATALOG.length} connected.
        </p>
      </div>

      {/* Cloud Virtual Machine Control Center */}
      <section className="glass-panel mb-6 flex flex-col gap-4 rounded-2xl p-5 ring-1 ring-cyan-500/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Cloud Virtual Machine Control Center</h2>
                <span
                  className={cn(
                    "meta-chip rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                    vmBotStatus === "connected"
                      ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                      : "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30"
                  )}
                >
                  {vmBotStatus === "connected" ? "BOT ACTIVE IN CALL" : "VM STANDBY · READY"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Autonomous headless agent running on your Cloud VM. Authenticated with Google Calendar, Gmail, Zoom, and Meet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vmBotStatus === "connected" ? (
              <button
                onClick={handleStopVmBot}
                disabled={isVmLoading}
                className="flex items-center gap-2 rounded-lg bg-red-600/80 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
              >
                <Square className="size-3.5 fill-current" /> Stop VM Bot
              </button>
            ) : (
              <button
                onClick={handleStartVmBot}
                disabled={isVmLoading || !vmMeetingUrl}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-50 transition"
              >
                <Play className="size-3.5 fill-current" /> Dispatch to URL
              </button>
            )}
          </div>
        </div>

        {/* Telemetry & Synced VM Accounts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="rounded-lg bg-background/50 p-2.5 ring-1 ring-border/50">
            <span className="text-[10px] text-muted-foreground block">VM Instance</span>
            <span className="font-mono text-xs font-semibold text-cyan-300">thread-vm-us-east.cloud</span>
          </div>
          <div className="rounded-lg bg-background/50 p-2.5 ring-1 ring-border/50">
            <span className="text-[10px] text-muted-foreground block">Identity</span>
            <span className="font-mono text-xs font-semibold text-foreground truncate block">sumonmondal@gmail.com</span>
          </div>
          <div className="rounded-lg bg-background/50 p-2.5 ring-1 ring-border/50">
            <span className="text-[10px] text-muted-foreground block">Headless Engine</span>
            <span className="font-mono text-xs font-semibold text-emerald-400">Chrome v124 (18ms)</span>
          </div>
          <div className="rounded-lg bg-background/50 p-2.5 ring-1 ring-border/50">
            <span className="text-[10px] text-muted-foreground block">Synced Accounts</span>
            <span className="font-mono text-xs font-semibold text-emerald-400">Meet, Zoom, GCal, Gmail</span>
          </div>
        </div>

        {/* Upcoming Meeting Anticipation Queue */}
        {upcomingMeeting && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Upcoming Meeting Detected · Starts in ~{upcomingMeeting.minutesUntilStart}m
                  </span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    {upcomingMeeting.platform}
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-bold text-foreground">{upcomingMeeting.title}</h4>
                <p className="text-xs text-muted-foreground">
                  Detected on your synchronized Google Calendar &amp; Cloud VM ({upcomingMeeting.start}). Join autonomously on your behalf?
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleJoinUpcoming}
                  disabled={isVmLoading || vmBotStatus === "connected"}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50 transition"
                >
                  <Zap className="size-3.5 fill-black" />
                  {vmBotStatus === "connected" ? "Bot Active in Call" : "Yes, Join on My Behalf (VM Bot)"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Autonomous Join Policy Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Autonomous Join Policy:</span>
            <div className="flex gap-1.5">
              {(
                [
                  { id: "prompt_5min", label: "🔔 Prompt 5m Before (Recommended)" },
                  { id: "auto_join", label: "⚡ Auto-Join Immediately" },
                  { id: "manual", label: "✋ Manual Only" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => void handleSetVmPolicy(p.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                    vmPolicy === p.id
                      ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Direct Call URL input */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={vmMeetingUrl}
            onChange={(e) => setVmMeetingUrl(e.target.value)}
            placeholder="Paste custom Google Meet or Zoom URL (e.g. https://meet.google.com/xyz-abcd-efg)…"
            className="flex-1 rounded-xl bg-background/60 px-4 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
          />
        </div>

        {/* Live VM Terminal Log Console */}
        <div className="rounded-lg bg-black/60 p-2.5 font-mono text-[11px] text-cyan-300/80 ring-1 ring-white/10 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground border-b border-white/10 pb-1">
            <span>&gt; VM TERMINAL LOG · thread-vm-us-east.cloud</span>
            <span className="text-[10px]">SYNC PORT: 8080</span>
          </div>
          <div>[VM] Puppeteer engine online · Logged into Google Workspace as sumonmondal@gmail.com</div>
          <div>[VM] Calendar watcher active · 1 upcoming meeting in ~5m</div>
          <div>[VM] Policy: {vmPolicy === "prompt_5min" ? "Prompt 5 Mins Before" : vmPolicy === "auto_join" ? "Auto-Join Always" : "Manual Only"}</div>
          {vmBotStatus === "connected" ? (
            <div className="text-emerald-400">[VM] ACTIVE: Connected to meeting room &amp; streaming live captions to Cockpit</div>
          ) : (
            <div className="text-cyan-400/80">[VM] Standby: Ready for autonomous dispatch</div>
          )}
          {vmLog && <div className="text-white/90">&gt; {vmLog}</div>}
        </div>
      </section>

      {/* Main Grid: Integrations List + Calendar Side Panel */}
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
                  cat === c ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((app) => {
              const on = !!connected[app.id];
              const meta = connectorMeta[app.id];
              const displayAccount = meta?.accountEmail || meta?.email || meta?.workspaceName;

              return (
                <div key={app.id} className="glass-panel flex flex-col rounded-2xl p-4 transition hover:ring-1 hover:ring-cyan-500/30">
                  <div className="flex items-start justify-between">
                    <div className={cn("flex size-10 items-center justify-center rounded-xl text-sm font-bold ring-1", app.hue)}>
                      {app.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex gap-1">
                      <span
                        className={cn(
                          "meta-chip rounded-full px-2 py-0.5 ring-1 text-[10px] font-bold",
                          on ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" : "bg-secondary text-muted-foreground ring-border"
                        )}
                      >
                        {on ? "Connected" : "Available"}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{app.name}</h3>
                  {on && displayAccount ? (
                    <p className="font-mono text-[10px] text-emerald-400 truncate">● {displayAccount}</p>
                  ) : (
                    <p className="meta-chip text-muted-foreground">{app.category}</p>
                  )}
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{app.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {app.useCases.map((u) => (
                      <span key={u} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground/80">
                        {u}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => toggle(app.id)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                        on ? "border border-border text-muted-foreground hover:text-foreground hover:border-cyan-500/40" : "bg-primary text-primary-foreground hover:bg-primary/85"
                      )}
                    >
                      {on ? (
                        <>
                          <Check className="size-3.5 text-emerald-400" /> Connected
                        </>
                      ) : (
                        <>
                          <Link2 className="size-3.5" /> Connect
                        </>
                      )}
                    </button>
                    {["notion", "outlook-mail", "outlook-cal", "teams", "gcal", "gmail", "zoom", "gmeet"].includes(app.id) && (
                      <button
                        onClick={() => {
                          setActiveConfigApp(app.id);
                          setTestResult(null);
                        }}
                        className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition hover:bg-cyan-500/20 hover:text-cyan-400"
                        title="Configure API credentials & settings"
                      >
                        <Settings2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <CalendarPanel onOpenConnectModal={() => { setActiveConfigApp("gcal"); setTestResult(null); }} />
      </div>

      {/* CONNECTOR CREDENTIALS & ACCOUNT CONNECTION MODAL */}
      {activeConfigApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 ring-1 ring-border shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  {activeConfigApp === "gcal" ? (
                    <Calendar className="size-5 text-cyan-400" />
                  ) : activeConfigApp === "gmail" ? (
                    <Mail className="size-5 text-rose-400" />
                  ) : (
                    <Settings2 className="size-5 text-cyan-400" />
                  )}
                  Configure {CATALOG.find((c) => c.id === activeConfigApp)?.name || "Integration"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connect your real account credentials to enable synchronized intelligence and two-way automation.
                </p>
              </div>
              <button
                onClick={() => setActiveConfigApp(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* GOOGLE CALENDAR SPECIFIC CONFIG */}
            {activeConfigApp === "gcal" && (
              <div className="mt-4 space-y-4">
                {/* Method selector tabs */}
                <div className="flex rounded-lg bg-secondary/60 p-1 text-xs font-medium">
                  <button
                    onClick={() => setGcalTab("account")}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-center transition",
                      gcalTab === "account" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Google Account
                  </button>
                  <button
                    onClick={() => setGcalTab("oauth")}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-center transition",
                      gcalTab === "oauth" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    OAuth 2.0 Token
                  </button>
                  <button
                    onClick={() => setGcalTab("ical")}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-center transition",
                      gcalTab === "ical" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Private iCal Feed
                  </button>
                </div>

                {gcalTab === "account" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground/90">Google Account Email</label>
                      <input
                        type="email"
                        value={googleEmailInput}
                        onChange={(e) => setGoogleEmailInput(e.target.value)}
                        placeholder="you@gmail.com or Google Workspace email…"
                        className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                      />
                    </div>
                    <div className="rounded-lg bg-cyan-950/30 p-3 text-[11px] text-cyan-300 ring-1 ring-cyan-500/20 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-cyan-400" /> Active Account Integration
                      </p>
                      <p className="text-cyan-200/80">
                        Synchronizes meetings with your Google Calendar, detects deadlines, and automatically generates 1-tap Google Calendar save links for meeting milestones.
                      </p>
                    </div>
                  </div>
                )}

                {gcalTab === "oauth" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground/90">OAuth Bearer Token / API Key</label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="ya29.a0AfH6SM..."
                        className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Provide a Google OAuth 2.0 access token with <code className="font-mono">calendar.events</code> scope for full two-way REST API integration.
                      </p>
                    </div>
                  </div>
                )}

                {gcalTab === "ical" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground/90">Google Calendar Secret iCal Address</label>
                      <input
                        type="url"
                        value={icalUrlInput}
                        onChange={(e) => setIcalUrlInput(e.target.value)}
                        placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                        className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Found in Google Calendar &gt; Settings &gt; Integrate calendar &gt; Secret address in iCal format.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GMAIL CONFIG */}
            {activeConfigApp === "gmail" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/90">Connected Google Email</label>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="you@gmail.com"
                    className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                  />
                </div>
                <div className="rounded-lg bg-rose-950/30 p-3 text-[11px] text-rose-300 ring-1 ring-rose-500/20">
                  Follow-up meeting minutes and candidate application notices will be staged and delivered from this account upon your approval.
                </div>
              </div>
            )}

            {/* NOTION CONFIG */}
            {activeConfigApp === "notion" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/90">Notion Internal Integration Token</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="secret_..."
                    className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Create at <a href="https://notion.so/my-integrations" target="_blank" rel="noreferrer" className="underline text-cyan-400">notion.so/my-integrations</a>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/90">Notion Database ID (Optional)</label>
                  <input
                    type="text"
                    value={databaseIdInput}
                    onChange={(e) => setDatabaseIdInput(e.target.value)}
                    placeholder="32-character database ID..."
                    className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            )}

            {/* OUTLOOK CONFIG */}
            {(activeConfigApp === "outlook-mail" || activeConfigApp === "outlook-cal") && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/90">Microsoft 365 / Graph Token</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="EwB..."
                    className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            )}

            {/* TEAMS CONFIG */}
            {activeConfigApp === "teams" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/90">Teams Incoming Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrlInput}
                    onChange={(e) => setWebhookUrlInput(e.target.value)}
                    placeholder="https://outlook.office.com/webhook/..."
                    className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            )}

            {/* ZOOM / MEET CONFIG */}
            {(activeConfigApp === "zoom" || activeConfigApp === "gmeet") && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/90">Personal Meeting Room URL</label>
                  <input
                    type="url"
                    value={meetingUrlInput}
                    onChange={(e) => setMeetingUrlInput(e.target.value)}
                    placeholder={activeConfigApp === "zoom" ? "https://zoom.us/j/98765432100" : "https://meet.google.com/xyz-abcd-efg"}
                    className="mt-1 w-full rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground ring-1 ring-border outline-none focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            )}

            {/* Test / Feedback Result */}
            {testResult && (
              <div
                className={cn(
                  "mt-4 rounded-lg p-3 text-xs leading-relaxed",
                  testResult.success
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "bg-red-500/15 text-red-300 ring-1 ring-red-500/30"
                )}
              >
                <p className="font-semibold">{testResult.message}</p>
                {testResult.instructions && (
                  <p className="mt-2 whitespace-pre-line text-[11px] opacity-85">{testResult.instructions}</p>
                )}
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="mt-6 flex items-center justify-between gap-2 border-t border-border/50 pt-4">
              {connected[activeConfigApp] ? (
                <button
                  onClick={() => handleTestConnector(activeConfigApp, "disconnect")}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
                >
                  <Unlink className="size-3.5" /> Disconnect
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveConfigApp(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
                <button
                  onClick={() => handleTestConnector(activeConfigApp, "connect")}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-50 transition shadow-md shadow-cyan-500/20"
                >
                  {isTesting ? "Connecting…" : "Verify & Connect Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
