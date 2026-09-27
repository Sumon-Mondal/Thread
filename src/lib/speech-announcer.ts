/**
 * Web Speech Announcer for hands-free driving mode and real-time meeting alerts.
 * Uses Web Speech API (window.speechSynthesis) with graceful fallbacks.
 */

let lastSpokenText = "";

export function speakAloud(text: string, force: boolean = false): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const isDrivingMode = localStorage.getItem("thread_is_driving_mode") === "true";
  if (!isDrivingMode && !force) {
    return;
  }

  const trimmed = text.trim();
  if (!trimmed || trimmed === lastSpokenText) return;
  lastSpokenText = trimmed;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
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

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
