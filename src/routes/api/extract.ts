import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const inputSchema = z.object({
  transcript: z.string().min(20).max(60000),
  source: z.enum(["live", "saved"]),
});

const SYSTEM_PROMPT = `You are Thread, a meeting intelligence assistant. Analyze the meeting transcript and extract structured insights. Respond with ONLY a JSON object (no markdown, no commentary) in exactly this shape:
{
  "summary": "2-3 sentence summary of the meeting",
  "decisions": ["decision 1", "decision 2"],
  "actionItems": [{ "task": "what needs doing", "owner": "person responsible", "due": "deadline or empty string" }],
  "openQuestions": ["question 1"]
}
Rules:
- Summary: name the meeting's purpose and the 2-3 most important outcomes, in plain language.
- Decisions: only things the group agreed or confirmed (not suggestions or questions). Max 6, no duplicates.
- Action items: each a concrete task starting with a verb. Owner must be a person named in the transcript (use the speaker who committed to it, or the person asked); use "You" when the listener/attendee is asked to do it; use "" only if truly nobody is named. Copy due dates exactly as said (e.g. "Oct 10", "Friday"); "" if none. Max 8, no duplicates.
- Open questions: unresolved questions only.
Use empty arrays when a category has nothing. Never invent owners or deadlines not stated in the transcript.`;

export const Route = createFileRoute("/api/extract")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof inputSchema>;
        try {
          parsed = inputSchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request: expected { transcript, source }" }, { status: 400 });
        }
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "AI is not configured (missing API key)." }, { status: 500 });
        }
        try {
          const { callResponses } = await import("@/lib/ai-gateway.server");
          const text = await callResponses({
            apiKey,
            model: "openai/gpt-6-astra",
            system: SYSTEM_PROMPT,
            user: `Transcript source: ${parsed.source}\n\nTranscript:\n${parsed.transcript}`,
          });
          const cleaned = text.replace(/```(?:json)?/gi, "").trim();
          const start = cleaned.indexOf("{");
          const end = cleaned.lastIndexOf("}");
          if (start === -1 || end === -1) {
            return Response.json({ error: "The AI did not return readable results. Please try again." }, { status: 502 });
          }
          const result = JSON.parse(cleaned.slice(start, end + 1));
          return Response.json(result);
        } catch (e) {
          console.error("extract failed:", e);
          return Response.json({ error: `Analysis failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
        }
      },
    },
  },
});
