/**
 * Spoken announcements for hands-free driving mode and real-time meeting alerts.
 * Uses Thread's ElevenLabs voice (/api/tts) when the server has a key, otherwise the browser's own voice.
 */

let lastSpokenText = "";
let latest = 0;
let playing: HTMLAudioElement | null = null;
let elevenLabs: Promise<boolean> | null = null;

function elevenLabsReady(): Promise<boolean> {
  elevenLabs ??= fetch("/api/tts")
    .then((r) => r.json() as Promise<{ configured?: boolean }>)
    .then((d) => Boolean(d.configured))
    .catch(() => false);
  return elevenLabs;
}

async function speakWithElevenLabs(text: string, turn: number): Promise<boolean> {
  if (!(await elevenLabsReady())) return false;
  try {
    const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (!res.ok) return false;
    const url = URL.createObjectURL(await res.blob());
    // A newer announcement started while this one was being generated.
    if (turn !== latest) {
      URL.revokeObjectURL(url);
      return true;
    }
    playing?.pause();
    const audio = new Audio(url);
    playing = audio;
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function speakWithBrowser(text: string): void {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => (v.lang.startsWith("en-US") || v.lang.startsWith("en")) && !v.name.includes("whisper")
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[ThreadSpeech] Web Speech API error:", err);
  }
}

export function speakAloud(text: string, force: boolean = false): void {
  if (typeof window === "undefined") return;

  const isDrivingMode = localStorage.getItem("thread_is_driving_mode") === "true";
  if (!isDrivingMode && !force) {
    return;
  }

  const trimmed = text.trim();
  if (!trimmed || trimmed === lastSpokenText) return;
  lastSpokenText = trimmed;

  const turn = ++latest;
  void speakWithElevenLabs(trimmed, turn).then((spoke) => {
    if (!spoke && turn === latest) speakWithBrowser(trimmed);
  });
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  latest++;
  playing?.pause();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
