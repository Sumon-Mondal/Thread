import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const DAILY_API_BASE = "https://api.daily.co/v1";

const createRoomSchema = z.object({
  name: z.string().optional(),
  properties: z.object({
    enable_chat: z.boolean().default(true),
    enable_transcription: z.boolean().default(true),
    exp: z.number().optional(),
  }).optional(),
});

export const Route = createFileRoute("/api/daily")({
  server: {
    handlers: {
      // GET: List active rooms or domain status
      GET: async () => {
        const apiKey = process.env["DAILY_API_KEY"];
        if (!apiKey) return Response.json({ error: "DAILY_API_KEY is not configured." }, { status: 500 });

        try {
          const res = await fetch(`${DAILY_API_BASE}/rooms?limit=10`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          const data = await res.json();
          return Response.json(data);
        } catch (err) {
          return Response.json({ error: String(err) }, { status: 502 });
        }
      },

      // POST: Create a new Daily meeting room for Thread with AI transcription
      POST: async ({ request }) => {
        const apiKey = process.env["DAILY_API_KEY"];
        if (!apiKey) return Response.json({ error: "DAILY_API_KEY is not configured." }, { status: 500 });

        let parsed = {};
        try {
          parsed = createRoomSchema.parse(await request.json().catch(() => ({})));
        } catch {
          // default options
        }

        try {
          const res = await fetch(`${DAILY_API_BASE}/rooms`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              properties: {
                enable_chat: true,
                enable_people_ui: true,
                enable_pip_ui: true,
                enable_noise_cancellation_ui: true,
                exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours expiry
              },
            }),
          });

          if (!res.ok) {
            const err = await res.text();
            return Response.json({ error: `Daily room creation failed: ${err}` }, { status: res.status });
          }

          const room = await res.json();
          return Response.json({
            ok: true,
            roomName: room.name,
            roomUrl: room.url,
            domain: "threadai",
          });
        } catch (err) {
          return Response.json({ error: String(err) }, { status: 502 });
        }
      },
    },
  },
});
