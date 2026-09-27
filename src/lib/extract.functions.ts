import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  transcript: z.string().min(20).max(60_000),
  source: z.enum(["live", "saved"]),
});

export interface ExtractionResult {
  summary: string;
  decisions: string[];
  actionItems: { task: string; owner: string; due: string | null }[];
  openQuestions: string[];
}

export const extractMeetingInsights = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ExtractionResult> => {
    const apiKey = process.env["OPENAI_API_KEY"] || process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this app yet.");

    const { callResponses } = await import("./ai-gateway.server");
    const text = await callResponses({
      apiKey,
      model: "openai/gpt-6-astra",
      system:
        "You are Thread, a meeting-intelligence engine. Extract structured outcomes from a meeting transcript. " +
        "Reply with ONLY a JSON object (no markdown fences) matching: " +
        '{"summary": string (2-3 sentences), "decisions": string[], "actionItems": [{"task": string, "owner": string, "due": string|null}], "openQuestions": string[]}. ' +
        "Owners must be the person named in the transcript, or 'Unassigned' if unclear. Keep each list to at most 8 items.",
      user: `Transcript source: ${data.source === "live" ? "live meeting capture" : "saved transcript"}\n\n${data.transcript}`,
    });
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("The model did not return structured output. Try again.");
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as ExtractionResult;
    return {
      summary: parsed.summary ?? "",
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
    };
  });
