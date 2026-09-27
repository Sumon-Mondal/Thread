// Server-only: Lovable AI Gateway Responses helpers. Never import from the browser.
// Raw streaming HTTP (SSE) — safe in the edge server runtime.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";

export interface ResponsesCallConfig {
  apiKey: string;
  model: string;
  system?: string;
  user: string;
}

/** Streams a Responses call and resolves with the final output text. */
export async function callResponses(config: ResponsesCallConfig): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.model,
    stream: true,
    store: false,
    reasoning: { effort: "low", summary: "auto" },
    input: [{ role: "user", content: config.user }],
  };
  if (config.system) body["instructions"] = config.system;

  const send = () =>
    fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Lovable-API-Key": config.apiKey,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify(body),
    });

  let response = await send();
  // One bounded retry for transient failures (rate limit / brief outage).
  if (response.status === 429 || response.status >= 500) {
    const ra = Number(response.headers.get("Retry-After"));
    await new Promise((r) => setTimeout(r, Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1500, 5000)));
    response = await send();
  }

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => "");
    console.error(`AI request failed [${response.status}]: ${errText.slice(0, 300)}`);
    const friendly =
      response.status === 429 ? "The AI is busy right now. Please try again in a few seconds."
      : response.status === 402 ? "AI credits have run out. Add credits in Settings, then try again."
      : response.status >= 500 ? "The AI had a brief hiccup. Please try again."
      : `AI request failed [${response.status}].`;
    throw new Error(friendly);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && event.delta) {
          text += event.delta;
        } else if (event.type === "response.completed") {
          if (!text && event.response?.output_text) text = event.response.output_text;
          done = true;
        } else if (event.type === "response.failed" || event.type === "error") {
          throw new Error(`AI stream failed: ${payload.slice(0, 300)}`);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue; // partial JSON chunk
        throw e;
      }
    }
  }

  if (!text) throw new Error("The AI returned no output. Please try again.");
  return text;
}
