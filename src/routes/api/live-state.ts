// Live snapshot feed for the future watchOS app + iPhone widget (see native/).
// In-memory only until Lovable Cloud persistence is added.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  meetingTitle: z.string().max(200),
  playing: z.boolean(),
  status: z.enum(["live", "paused", "ended"]).optional(),
  elapsed: z.number().min(0).max(86400),
  speaker: z.string().max(100),
  speakerRole: z.string().max(100).optional(),
  lastLine: z.string().max(1000),
  shortHeadline: z.string().max(60).optional(),
  platform: z.string().max(50).optional().default("Google Meet"),
  liveSummary: z.string().max(300).optional(),
  source: z.enum(["web", "extension", "vm-bot", "ios"]).optional().default("web"),
  momentCount: z.number().int().min(0).max(1000),
  latestMoment: z.object({
    type: z.string().max(30),
    takeaway: z.string().max(300),
    detail: z.string().max(1000).optional(),
    link: z.string().max(500).optional(),
  }).nullable(),
  actions: z.array(z.object({
    id: z.string().max(60),
    label: z.string().max(200),
    status: z.string().max(20),
    kind: z.string().max(20).optional(),
    detail: z.string().max(500).optional(),
    link: z.string().max(500).optional(),
  })).max(50),
  transcript: z.array(z.object({
    id: z.string().max(60),
    speaker: z.string().max(100),
    role: z.string().max(100).optional(),
    text: z.string().max(1000),
    timeSec: z.number().optional(),
  })).optional(),
  moments: z.array(z.object({
    id: z.string().max(60),
    type: z.string().max(30),
    speaker: z.string().max(100).optional(),
    timeSec: z.number().optional(),
    takeaway: z.string().max(300),
    detail: z.string().max(1000).optional(),
    headline: z.string().max(60).optional(),
    link: z.string().max(500).optional(),
  })).optional(),
});

const IDLE_SNAPSHOT = {
  meetingTitle: "No Active Meeting",
  playing: false,
  elapsed: 0,
  speaker: "",
  platform: "Google Meet",
  liveSummary: "",
  lastLine: "",
  shortHeadline: "Standby / Ready",
  source: "web" as const,
  momentCount: 0,
  latestMoment: null,
  actions: [],
  transcript: [],
  moments: [],
  updatedAt: new Date().toISOString(),
};

const DEMO_SNAPSHOT = {
  meetingTitle: "Nova Dynamics — Discovery Day",
  playing: true,
  elapsed: 42,
  speaker: "Sarah Chen",
  platform: "Google Meet",
  liveSummary: "Announcing Summer 2027 SWE internship openings across AI & Platform teams",
  lastLine: "Our Summer 2027 Software Engineering internship applications officially open today.",
  shortHeadline: "Internships Open",
  source: "web" as const,
  momentCount: 3,
  latestMoment: { type: "OPPORTUNITY", takeaway: "Summer 2027 SWE internship applications open today." },
  actions: [
    { id: "a1", label: "Save application portal link", status: "executed", detail: "Extracted from slide QR code" },
    { id: "a2", label: "Send follow-up email to Sarah Chen", status: "staged", detail: "Ready to send with portfolio link" },
    { id: "a3", label: "Stage deadline reminder — Oct 18", status: "staged", detail: "Hard cutoff announced by Sarah" }
  ],
  transcript: [],
  moments: [],
  updatedAt: new Date().toISOString()
};

const command = z.object({
  command: z.enum(["approve", "later", "dismiss", "submit", "reset", "start-demo", "vote"]),
  actionId: z.string().max(60).optional(),
  option: z.string().max(100).optional(),
});
let commands: { command: "approve" | "later" | "dismiss" | "submit" | "reset" | "start-demo" | "vote"; actionId?: string | undefined; option?: string | undefined; at: string }[] = [];
let snapshot: (z.infer<typeof schema> & { updatedAt: string }) | null = null;

export const Route = createFileRoute("/api/live-state")({
  server: {
    handlers: {
      GET: () => Response.json(snapshot ?? { ...IDLE_SNAPSHOT, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } }),
      POST: async ({ request }) => {
        const raw = await request.json().catch(() => null);
        const c = command.safeParse(raw);
        if (c.success) {
          commands = [...commands, { ...c.data, at: new Date().toISOString() }].slice(-20);
          if (c.data.command === "start-demo") {
            snapshot = { ...DEMO_SNAPSHOT, updatedAt: new Date().toISOString() };
          } else if (c.data.command === "reset") {
            snapshot = null;
          } else if (snapshot && c.data.command === "approve" && c.data.actionId) {
            const action = snapshot.actions.find((a) => a.id === c.data.actionId);
            if (action) {
              action.status = "executed";
            }
          } else if (snapshot && c.data.command === "vote" && c.data.actionId) {
            const action = snapshot.actions.find((a) => a.id === c.data.actionId);
            if (action) {
              action.status = "executed";
              action.detail = `Voted: ${c.data.option || "Yes"}`;
            }
          }
          return Response.json({ ok: true, queued: true });
        }
        const p = schema.safeParse(raw);
        if (!p.success) return Response.json({ error: "Invalid snapshot", details: p.error.format() }, { status: 400 });
        
        let headline = p.data.shortHeadline;
        if (!headline) {
          if (p.data.latestMoment) {
            headline = p.data.latestMoment.takeaway.split(" ").slice(0, 4).join(" ");
          } else if (p.data.lastLine) {
            headline = p.data.lastLine.split(" ").slice(0, 4).join(" ");
          } else {
            headline = "Live Call Active";
          }
        }

        let summary = p.data.liveSummary;
        if (!summary) {
          if (p.data.latestMoment) {
            summary = p.data.latestMoment.takeaway;
          } else if (p.data.lastLine) {
            summary = p.data.lastLine;
          } else {
            summary = headline;
          }
        }

        snapshot = { ...p.data, shortHeadline: headline, liveSummary: summary, updatedAt: new Date().toISOString() };
        const out = commands; commands = [];
        return Response.json({ ok: true, commands: out });
      },
    },
  },
});
