import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Context,
} from "react";
import {
  SCENARIOS,
  type AgentAction,
  type ChatMsg,
  type Moment,
  type Scenario,
  type TranscriptLine,
} from "./demo-data";
import { SARAH_DEMO_RECIPIENT, SARAH_FOLLOW_UP_EMAIL, isSarahFollowUp } from "./demo-recipient";
import { speakAloud } from "./speech-announcer";

export type EngineMode = "demo" | "live";

interface DemoState {
  mode: EngineMode;
  scenario: Scenario;
  playing: boolean;
  elapsed: number;
  transcript: TranscriptLine[];
  moments: Moment[];
  actions: AgentAction[];
  chat: ChatMsg[];
  addChatMessage: (text: string, isAgent?: boolean) => void;
  activeSpeaker: string;
  activeSpeakerRole: string;
  screenShared: boolean;
  latestMoment: Moment | null;
  liveLines: { id: string; text: string; committed: boolean }[];
  isDrivingMode: boolean;
}

export interface ApproveResult {
  ok: boolean;
  error?: string;
  delivered?: string;
}

interface DemoApi extends DemoState {
  play: () => void;
  pause: () => void;
  reset: () => void;
  /** Jumps to the next scripted moment; past the last one it wraps the meeting up. */
  nextMoment: () => void;
  setMode: (m: EngineMode) => void;
  setScenario: (id: string) => void;
  executeAction: (id: string) => void;
  /** Approval from any surface (queue, iPhone). Sarah's follow-up only counts once the email is sent. */
  approveAction: (id: string) => Promise<ApproveResult>;
  addLiveLine: (text: string, committed: boolean) => void;
  addMoment: (m: Moment) => void;
  addAction: (a: AgentAction) => void;
  registerQr: (url: string, source: string) => void;
  toggleDrivingMode: () => void;
  sendReaction: (emoji?: string) => void;
}

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __threadDemoCtx?: Context<DemoApi | null> };
const DemoContext = g.__threadDemoCtx ?? (g.__threadDemoCtx = createContext<DemoApi | null>(null));

export function DemoProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<EngineMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thread_engine_mode");
      if (saved === "demo" || saved === "live") return saved;
    }
    return "live";
  });
  const [scenarioId, setScenarioId] = useState<string>("discovery");
  const scenario = SCENARIOS[scenarioId] ?? SCENARIOS["discovery"]!;
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [extraMoments, setExtraMoments] = useState<Moment[]>([]);
  const [liveLines, setLiveLines] = useState<DemoState["liveLines"]>([]);
  const [sentChat, setSentChat] = useState<ChatMsg[]>([]);
  const liveId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Demo clock
  useEffect(() => {
    if (playing && mode === "demo") {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e >= scenario.endSec) {
            setPlaying(false);
            return e;
          }
          return e + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, mode, scenario.endSec]);

  const transcript = useMemo(
    () => (mode === "demo" ? scenario.transcript.filter((l) => l.timeSec <= elapsed) : []),
    [mode, elapsed, scenario],
  );
  const moments = useMemo(() => {
    const scripted = mode === "demo" ? scenario.moments.filter((m) => m.timeSec <= elapsed) : [];
    return [...scripted, ...extraMoments].sort((a, b) => a.timeSec - b.timeSec);
  }, [mode, elapsed, extraMoments, scenario]);
  const visibleActions = useMemo(
    () => (mode === "demo" ? actions.filter((a) => a.timeSec <= elapsed) : actions),
    [mode, elapsed, actions],
  );
  const chat = useMemo(
    () => [...(mode === "demo" ? scenario.chat.filter((c) => c.timeSec <= elapsed) : []), ...sentChat].sort((a, b) => a.timeSec - b.timeSec),
    [mode, elapsed, scenario, sentChat],
  );

  const lastLine = transcript[transcript.length - 1];
  const activeSpeaker = mode === "live" ? "You" : (lastLine?.speaker ?? scenario.defaultSpeaker);
  const activeSpeakerRole = mode === "live" ? "Attendee" : (lastLine?.role ?? scenario.defaultRole);
  const latestMoment = moments[moments.length - 1] ?? null;
  const screenShared =
    mode === "demo" && elapsed >= scenario.screenShareStart && elapsed < scenario.screenShareEnd;

  // Sync scripted actions when the scenario changes
  useEffect(() => {
    setActions(scenario.actions);
  }, [scenario]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const nextMoment = useCallback(() => {
    // Every moment and every staged action, matching the iPhone's Next.
    const times = [...new Set([...scenario.moments, ...scenario.actions].map((x) => x.timeSec))].filter((t) => t > 0).sort((a, b) => a - b);
    const next = times.find((t) => t > elapsedRef.current);
    setElapsed(next ?? scenario.endSec);
    setPlaying(next !== undefined);
  }, [scenario]);
  const reset = useCallback(() => {
    setElapsed(0);
    setActions(scenario.actions);
    setExtraMoments([]);
    setLiveLines([]);
    setSentChat([]);
    seenQr.current.clear();
    setPlaying(true); // restart the meeting right away
  }, [scenario]);
  const setScenario = useCallback((id: string) => {
    setScenarioId(id);
    setElapsed(0);
    setExtraMoments([]);
    setLiveLines([]);
    setSentChat([]);
    setPlaying(true); // switching meetings joins the new one immediately
  }, []);
  const setMode = useCallback((m: EngineMode) => {
    setModeState(m);
    if (typeof window !== "undefined") {
      localStorage.setItem("thread_engine_mode", m);
    }
    // Each mode starts a fresh meeting, so a QR decoded while on the live mic doesn't leak into the demo.
    setElapsed(0);
    setActions(scenario.actions);
    setExtraMoments([]);
    setLiveLines([]);
    setSentChat([]);
    seenQr.current.clear();
    setPlaying(m === "demo");
  }, [scenario]);
  const executeAction = useCallback((id: string) => {
    const action = actions.find((a) => a.id === id);
    if (action?.kind === "reply" && action.label.startsWith("Draft chat reply:")) {
      const text = action.label.replace(/^Draft chat reply:\s*/, "").replace(/^"|"$/g, "");
      setSentChat((prev) => [...prev, { id: crypto.randomUUID(), from: "You (Thread Agent)", text, timeSec: elapsedRef.current, reactions: [], isAgent: true }]);
    }
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status: "executed" } : a)));
  }, [actions]);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const approveAction = useCallback(async (id: string): Promise<ApproveResult> => {
    const action = actionsRef.current.find((a) => a.id === id);
    if (!action || action.status === "executed") return { ok: true };
    if (isSarahFollowUp(action)) {
      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: SARAH_DEMO_RECIPIENT, ...SARAH_FOLLOW_UP_EMAIL }),
        });
        const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; delivered?: string };
        if (!res.ok || !result.ok) return { ok: false, error: result.error ?? "Gmail could not send the email" };
        executeAction(id);
        return result.delivered ? { ok: true, delivered: result.delivered } : { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Email could not be sent" };
      }
    }
    executeAction(id);
    return { ok: true };
  }, [executeAction]);
  const addChatMessage = useCallback((text: string, isAgent = false) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSentChat((prev) => [...prev, { id: crypto.randomUUID(), from: isAgent ? "You (Thread Agent)" : "You", text: trimmed, timeSec: elapsedRef.current, reactions: [], isAgent }]);
  }, []);
  const addLiveLine = useCallback((text: string, committed: boolean) => {
    setLiveLines((prev) => {
      const last = prev[prev.length - 1];
      if (!committed && last && !last.committed) {
        return [...prev.slice(0, -1), { id: last.id, text, committed }];
      }
      liveId.current += 1;
      return [...prev, { id: `live-${liveId.current}`, text, committed }];
    });
  }, []);
  const addMoment = useCallback((m: Moment) => {
    setExtraMoments((prev) => [...prev, m]);
  }, []);
  const addAction = useCallback((a: AgentAction) => {
    setActions((prev) => (prev.some((x) => x.id === a.id) ? prev : [...prev, a]));
  }, []);
  const seenQr = useRef(new Set<string>());
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const registerQr = useCallback((url: string, source: string) => {
    if (seenQr.current.has(url)) return;
    seenQr.current.add(url);
    const t = elapsedRef.current;
    const isApply = url.includes("/apply/");
    addMoment({
      id: `qr-${Date.now()}`,
      type: "RESOURCE",
      speaker: source,
      timeSec: t,
      takeaway: isApply ? "QR code → internship application" : "QR code → shared resource",
      headline: isApply ? "Application QR" : "Shared QR Code",
      detail: `Thread scanned the QR code from ${source} and decoded: ${url}`,
      link: url,
    });
    addAction({
      id: `qr-act-${url}`,
      label: isApply ? "Open & fill the internship application (from QR)" : "Open and save the shared link (from QR)",
      kind: "apply",
      status: "staged",
      timeSec: -1,
      detail: `Decoded from ${source}: ${url.replace(/^https?:\/\//, "")}`,
      link: url,
    });
  }, [addMoment, addAction]);
  useEffect(() => { seenQr.current.clear(); }, [scenario]);

  // Participant chat messages with an email, a link or a request become agent tasks.
  useEffect(() => {
    for (const c of chat) {
      if (c.isAgent) continue;
      // Domain labels must follow each dot, so a sentence's final period isn't swallowed into the address.
      const email = c.text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0];
      const link = c.text.match(/(https?:\/\/\S+|\/apply\/[\w-]+)/)?.[0];
      const request = /\b(please|rsvp|send|submit|email|register|sign up|due|by (mon|tues|wednes|thurs|fri)day)\b/i.test(c.text);
      if (!email && !link && !request) continue;
      if (!email && !request && link?.includes("/apply/")) continue; // the QR task already covers the application portal
      const first = c.from.split(" ")[0];
      addAction({
        id: `chat-${c.id}`,
        kind: email ? "reply" : link ? "apply" : "reminder",
        status: "staged",
        timeSec: c.timeSec,
        label: email ? `Draft email to ${first} (${email})` : link ? `Open & save link ${first} shared` : `Follow up on ${first}'s request`,
        detail: `From chat — ${c.from}: “${c.text}”`,
        ...(email ? { link: `mailto:${email}` } : link ? { link: link.startsWith("/") && typeof window !== "undefined" ? window.location.origin + link : link } : {}),
      });
    }
  }, [chat, addAction]);

  const [isDrivingMode, setIsDrivingMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("thread_is_driving_mode") === "true";
    }
    return false;
  });

  const toggleDrivingMode = useCallback(() => {
    setIsDrivingMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("thread_is_driving_mode", String(next));
      }
      if (next) {
        speakAloud("Driving copilot active. Live meeting announcements enabled.", true);
      }
      return next;
    });
  }, []);

  const sendReaction = useCallback((emoji: string = "👍") => {
    setSentChat((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        from: "You (Driving Copilot)",
        text: `${emoji} (Reaction)`,
        timeSec: elapsedRef.current,
        reactions: [emoji],
      },
    ]);
    speakAloud(`Sent thumbs up reaction to meeting`, true);
  }, []);

  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastLine || lastSpokenIdRef.current === lastLine.id) return;
    lastSpokenIdRef.current = lastLine.id;

    let phrase = `${lastLine.speaker} is speaking`;
    if (lastLine.id === "t12b" || lastLine.text.includes("MLH")) {
      phrase = "Caroline is sharing her work experience in MLH";
    } else if (lastLine.id === "t12c" || lastLine.text.includes("STAR")) {
      phrase = "Steve is talking about STAR Method of interview";
    } else if (lastLine.id === "t14" || lastLine.text.includes("waste management")) {
      phrase = "Priya is talking about waste management";
    } else if (lastLine.id === "t3") {
      phrase = "Sarah is announcing Summer 2027 SWE internships";
    } else if (lastLine.id === "t5") {
      phrase = "Michael is sharing the application portal QR code";
    }
    speakAloud(phrase);
  }, [lastLine]);

  const value: DemoApi = {
    mode,
    scenario,
    isDrivingMode,
    toggleDrivingMode,
    sendReaction,
    playing,
    elapsed,
    transcript,
    moments,
    actions: visibleActions,
    chat,
    addChatMessage,
    activeSpeaker,
    activeSpeakerRole,
    screenShared,
    latestMoment,
    liveLines,
    play,
    pause,
    reset,
    nextMoment,
    setMode,
    setScenario,
    executeAction,
    approveAction,
    addLiveLine,
    addMoment,
    addAction,
    registerQr,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoApi {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}
