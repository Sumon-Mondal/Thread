// Thread's spoken announcements in one ElevenLabs voice. The key stays on the server; without it the
// browser falls back to its own voice.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const API = "https://api.elevenlabs.io/v1";
const MODEL = "eleven_flash_v2_5";

// Calm, clear voices that carry over car speakers. The first one the account has wins; the iPhone app uses the same list.
const PREFERRED_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
] as const;

type Voice = { id: string; name: string };
let resolved: { key: string; voice: Voice } | null = null;

async function voiceFor(key: string): Promise<Voice> {
  const pinned = process.env["ELEVENLABS_VOICE_ID"];
  if (pinned) return { id: pinned, name: "Pinned voice" };
  if (resolved?.key === key) return resolved.voice;
  let voice: Voice = PREFERRED_VOICES[0];
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": key } }).catch(() => null);
  // A key without voice-read access can still speak, so keep the first choice then.
  if (res?.ok) {
    const { voices } = (await res.json()) as { voices: { voice_id: string; name: string }[] };
    const first = voices[0];
    voice = PREFERRED_VOICES.find((p) => voices.some((v) => v.voice_id === p.id)) ?? (first ? { id: first.voice_id, name: first.name } : voice);
  }
  resolved = { key, voice };
  return voice;
}

const input = z.object({ text: z.string().trim().min(1).max(800) });

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env["ELEVENLABS_API_KEY"];
        if (!key) return Response.json({ configured: false });
        return Response.json({ configured: true, voice: await voiceFor(key), model: MODEL });
      },
      POST: async ({ request }) => {
        const key = process.env["ELEVENLABS_API_KEY"];
        if (!key) return Response.json({ error: "ElevenLabs key is not configured" }, { status: 503 });
        const parsed = input.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Expected { text } up to 800 characters" }, { status: 400 });
        const voice = await voiceFor(key);
        const res = await fetch(`${API}/text-to-speech/${voice.id}?output_format=mp3_44100_128`, {
          method: "POST",
          headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
          body: JSON.stringify({
            text: parsed.data.text,
            model_id: MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.75, use_speaker_boost: true },
          }),
        }).catch((e: unknown) => e);
        if (!(res instanceof Response)) return Response.json({ error: `ElevenLabs unreachable: ${String(res)}` }, { status: 502 });
        if (!res.ok) {
          if (res.status === 404) resolved = null; // the voice left the account; pick again next time
          return Response.json({ error: `ElevenLabs speech failed [${res.status}]: ${(await res.text()).slice(0, 300)}` }, { status: 502 });
        }
        return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Thread-Voice": voice.name } });
      },
    },
  },
});
