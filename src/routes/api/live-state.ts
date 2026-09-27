// Live snapshot feed for the future watchOS app + iPhone widget (see native/).
// In-memory only until Lovable Cloud persistence is added.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  meetingTitle: z.string().max(200),
  playing: z.boolean(),
  elapsed: z.number().min(0).max(86400),
  speaker: z.string().max(100),
  lastLine: z.string().max(500),
  momentCount: z.number().int().min(0).max(1000),
  latestMoment: z.object({ type: z.string().max(30), takeaway: z.string().max(300) }).nullable(),
  actions: z.array(z.object({ id: z.string().max(60), label: z.string().max(200), status: z.string().max(20) })).max(20),
});

const command = z.object({ command: z.enum(["approve", "later"]), actionId: z.string().max(60).optional() });
let commands: { command: "approve" | "later"; actionId?: string | undefined; at: string }[] = [];
let snapshot: (z.infer<typeof schema> & { updatedAt: string }) | null = null;

export const Route = createFileRoute("/api/live-state")({
  server: {
    handlers: {
      GET: () => Response.json(snapshot ?? { playing: false, updatedAt: null }, { headers: { "Cache-Control": "no-store" } }),
      POST: async ({ request }) => {
        const raw = await request.json().catch(() => null);
        const c = command.safeParse(raw);
        if (c.success) {
          commands = [...commands, { ...c.data, at: new Date().toISOString() }].slice(-20);
          return Response.json({ ok: true, queued: true });
        }
        const p = schema.safeParse(raw);
        if (!p.success) return Response.json({ error: "Invalid snapshot" }, { status: 400 });
        snapshot = { ...p.data, updatedAt: new Date().toISOString() };
        const out = commands; commands = [];
        return Response.json({ ok: true, commands: out });
      },
    },
  },
});
