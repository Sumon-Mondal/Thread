// Receives the Thread Chrome extension's feed from a real call and hands it to the live meeting. Renders nothing.
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo-store";
import type { FeedMessage } from "@/lib/meeting-feed";

function askForFeed() {
  window.postMessage({ source: "thread-app", type: "hello" }, window.location.origin);
  if (window.parent !== window) window.parent.postMessage({ source: "thread-app", type: "hello" }, "*");
}

export function ExtensionBridge() {
  const { mode, setMode, ingestMeetingFeed } = useDemo();
  const latest = useRef({ mode, setMode, ingestMeetingFeed });
  latest.current = { mode, setMode, ingestMeetingFeed };
  const offered = useRef<string | null>(null);
  // Inside the extension's side panel, Thread always follows the call.
  const embedded = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("feed") === "extension";

  useEffect(() => {
    if (embedded && mode !== "live") setMode("live");
  }, [embedded, mode, setMode]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as FeedMessage | undefined;
      if (msg?.source !== "thread-extension" || msg.kind === "idle") return;
      const fromBridge = e.source === window;
      const fromPanel = e.source === window.parent && window.parent !== window && e.origin.startsWith("chrome-extension://");
      if (!fromBridge && !fromPanel) return;
      const { mode: current, setMode: switchMode, ingestMeetingFeed: ingest } = latest.current;
      if (current !== "live") {
        // Never take over a scripted demo on its own; offer to follow the call instead.
        if (!embedded && !msg.session.endedAt && offered.current !== msg.session.id) {
          offered.current = msg.session.id;
          toast(`${msg.session.platform} call detected`, {
            description: `Switch Thread to live to follow “${msg.session.title}”.`,
            action: { label: "Follow call", onClick: () => switchMode("live") },
            duration: 15000,
          });
        }
        return;
      }
      ingest(msg.session, msg.kind === "history" ? msg.events : [msg.event]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Ask for the whole meeting so far on load and whenever Thread switches modes.
  useEffect(() => {
    askForFeed();
  }, [mode]);

  return null;
}
