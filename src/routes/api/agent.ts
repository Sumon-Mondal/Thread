import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FORMS, PAST_MEETINGS } from "@/lib/past-meetings";

const inputSchema = z.object({
  message: z.string().min(1).max(4000),
  meetingId: z.string().max(100).optional(),
  documents: z.array(z.object({ name: z.string().max(200), text: z.string().max(30000) })).max(5).default([]),
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
  return `You are Thread's agent. The user types a request; you do what is possible using the meeting context and uploaded documents.
Capabilities: fill one of the known forms, draft an email, or just answer.
Available forms:
${forms}

Past meetings:
${meetings}

Respond with ONLY a JSON object:
{
 "reply": "short friendly message describing what you did",
 "steps": ["short step 1", "short step 2"],
 "form": null or { "formId": "...", "submitTo": "email address the completed form should be sent to, or \"\"", "fields": { "<fieldKey>": { "value": "...", "source": "where it came from, e.g. resume, meeting transcript, QR link" } } },
 "email": null or { "to": "email", "subject": "...", "body": "..." },
 "events": [] or [{ "title": "...", "start": "ISO 8601 local datetime, e.g. 2026-10-02T15:00:00", "durationMin": 30, "notes": "...", "timeGuessed": true|false }]
}
Rules: only use field keys from the chosen form. Fill as many fields as possible from the meeting transcript (role names, dates, instructors, specimens, contacts, deadlines) and uploaded documents (personal details). Sources must be specific: "Transcript 00:42 (Dr. Osei)", "Resume", "QR link", "Meeting chat". Never invent personal data not in documents or context — leave the value "" and source "needs your input". Keep steps to 2-5 items. Emails should be concise and signed with the user's name if known.
Sending: emails you draft and forms you submit are REALLY sent from the user's Gmail after they click Approve. If the user says "submit", "send", or "email it to X", prepare it and say it's ready for approval. Use an email address the user typed if given; otherwise use the relevant contact from the meeting (set form.submitTo). If no address is known, leave it "" and ask the user for one in the reply. Never claim something was already sent.
Calendar: when the user asks to add something to their calendar, schedule, remind them, or put action items on the calendar, return "events" (max 8) — one per item. These are REALLY created in the user's Google Calendar after they click Approve. Resolve relative dates ("Friday at 3") against the current date given below. If no time is known use 09:00 the next day and set timeGuessed true. Say events are ready for approval, never that they were added.`;
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
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });
        const docs = parsed.documents.map((d) => `### Document: ${d.name}\n${d.text}`).join("\n\n");
        const user = [
          parsed.meetingId ? `Focus meeting: ${parsed.meetingId}` : "",
          parsed.liveContext ? `Live meeting context (happening now):\n${parsed.liveContext}` : "",
          parsed.connectedApps?.length ? `Connected add-ins (you may propose sending results to these, e.g. "Send action items to Asana"; say it is queued for approval): ${parsed.connectedApps.join(", ")}` : "",
          docs ? `Uploaded documents:\n${docs}` : "No documents uploaded.",
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
