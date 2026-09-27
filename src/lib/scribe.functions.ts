import { createServerFn } from "@tanstack/react-start";

export const getScribeToken = createServerFn({ method: "POST" }).handler(async () => {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key) throw new Error("ElevenLabs key is not configured");
  const res = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
    method: "POST",
    headers: { "xi-api-key": key },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs token failed [${res.status}]: ${body}`);
  }
  const data = (await res.json()) as { token: string };
  return { token: data.token };
});
