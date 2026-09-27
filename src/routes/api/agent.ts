import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FORMS, PAST_MEETINGS } from "@/lib/past-meetings";

const inputSchema = z.object({
  message: z.string().min(1).max(4000),
  meetingId: z.string().max(100).optional(),
  documents: z.array(z.object({ name: z.string().max(200), text: z.string().max(30000) })).max(5).default([]),
  images: z.array(z.object({ name: z.string().max(200), dataUrl: z.string().max(500000).optional(), text: z.string().max(10000).optional() })).max(5).default([]),
  liveContext: z.string().max(20000).optional(),
  connectedApps: z.array(z.string().max(60)).max(60).optional(),
});

function buildSystem() {
  const forms = FORMS.map(
    (f) => `- formId "${f.id}": ${f.title} (${f.org}), fields: ${f.fields.map((x) => `${x.key}=${x.label}`).join(", ")}`,
  ).join("\n");
  const meetings = PAST_MEETINGS.map(
    (m) =>
      `## ${m.id}: ${m.title} (${m.platform}, ${m.date})\nSummary: ${m.summary}\nTranscript: ${m.transcript}\nLinks: ${m.links.map((l) => `${l.label} ${l.url} [${l.via}]`).join("; ")}\nContacts: ${m.contacts.map((c) => `${c.name} <${c.email}> ${c.role}`).join("; ")}\nForms: ${m.formIds.join(", ")}`,
  ).join("\n\n");
  return `You are Thread's autonomous meeting agent. The user types a request or uploads images/documents; you fulfill their request using the meeting context, knowledge database, and uploaded files.

Capabilities:
1. QR Codes & Shared Links: Retrieve and explain QR codes or links from slides/chat. Offer to auto-fill the application form using candidate resume.
2. Host & Contacts: Look up hosts and attendees (e.g. Sarah Chen <sarah.chen@novadynamics.internal>), draft follow-up emails, and stage for one-tap dispatch.
3. Form Auto-Fill: Fill forms using candidate resume and meeting details.
4. Batch Minutes Dispatch: When given attendee emails or an image roster and asked to send meeting minutes, extract all emails and prepare batch delivery to all recipients.
5. Calendar & Deadlines: Extract deadlines and create calendar milestones.

Available forms:
${forms}

Past meetings & Memory:
${meetings}

Respond with ONLY a JSON object:
{
 "reply": "short friendly message describing what you did",
 "steps": ["short step 1", "short step 2"],
 "form": null or { "formId": "...", "submitTo": "email", "fields": { "<fieldKey>": { "value": "...", "source": "..." } } },
 "email": null or { "to": "email", "subject": "...", "body": "..." },
 "events": [] or [{ "title": "...", "start": "ISO datetime", "durationMin": 30, "notes": "...", "timeGuessed": true|false }],
 "qrCard": null or { "label": "...", "url": "...", "via": "slide QR code", "meetingTitle": "..." },
 "batchDispatch": null or { "recipients": ["email1", "email2"], "meetingTitle": "...", "subject": "...", "body": "..." }
}
Rules: Be precise and helpful. If 10 emails are detected or an image roster is provided to send minutes to, populate batchDispatch with all recipients and full synthesized minutes. Keep UI clean.`;
}

export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof inputSchema>;
        try {
          parsed = inputSchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        const apiKey = process.env["OPENAI_API_KEY"] || process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });
        const docs = parsed.documents.map((d) => `### Document: ${d.name}\n${d.text}`).join("\n\n");
        const imgContext = parsed.images.map((img) => `### Uploaded Image / Roster: ${img.name}\n${img.text || "Image indexed in database"}`).join("\n\n");
        const user = [
          parsed.meetingId ? `Focus meeting: ${parsed.meetingId}` : "",
          parsed.liveContext ? `Live meeting context (happening now):\n${parsed.liveContext}` : "",
          parsed.connectedApps?.length ? `Connected add-ins: ${parsed.connectedApps.join(", ")}` : "",
          docs ? `Database documents:\n${docs}` : "",
          imgContext ? `Database images / rosters:\n${imgContext}` : "",
          `Current date/time: ${new Date().toISOString()}`,
          `User request: ${parsed.message}`,
        ]
          .filter(Boolean)
          .join("\n\n");
        try {
          const { callResponses } = await import("@/lib/ai-gateway.server");
          const text = await callResponses({ apiKey, model: "openai/gpt-6-astra", system: buildSystem(), user });
          const cleaned = text.replace(/```(?:json)?/gi, "").trim();
          const s = cleaned.indexOf("{");
          const e = cleaned.lastIndexOf("}");
          if (s === -1 || e === -1) return Response.json({ reply: cleaned, steps: [], form: null, email: null });
          return Response.json(JSON.parse(cleaned.slice(s, e + 1)));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const status = /\[(402|403|429)\]/.exec(msg)?.[1];
          return Response.json({ error: `Agent failed: ${msg.slice(0, 200)}` }, { status: status ? Number(status) : 502 });
        }
      },
    },
  },
});
