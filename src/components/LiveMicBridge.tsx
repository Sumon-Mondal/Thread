import { useEffect, useRef, useState } from "react";
import { useScribe } from "@elevenlabs/react";
import { useDemo } from "@/lib/demo-store";
import { getScribeToken } from "@/lib/scribe.functions";

/** Connects the mic to ElevenLabs Scribe while the app is in Live Mic mode. */
export function LiveMicBridge() {
  const { mode, addLiveLine } = useDemo();
  const [error, setError] = useState<string | null>(null);
  const addRef = useRef(addLiveLine);
  addRef.current = addLiveLine;

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad" as never,
    onPartialTranscript: (d: { text: string }) => d.text && addRef.current(d.text, false),
    onCommittedTranscript: (d: { text: string }) => d.text && addRef.current(d.text, true),
  });
  const scribeRef = useRef(scribe);
  scribeRef.current = scribe;

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const { token } = await getScribeToken();
        if (cancelled) return;
        await scribeRef.current.connect({
          token,
          microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Microphone connection failed");
      }
    })();
    return () => {
      cancelled = true;
      scribeRef.current.disconnect();
    };
  }, [mode]);

  if (mode !== "live" || !error) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 glass-panel rounded-xl px-4 py-2 text-sm text-destructive">
      Live mic unavailable: {error}
    </div>
  );
}
