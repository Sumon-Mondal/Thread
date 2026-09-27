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
}

interface DemoApi extends DemoState {
  play: () => void;
  pause: () => void;
  reset: () => void;
  setMode: (m: EngineMode) => void;
  setScenario: (id: string) => void;
  executeAction: (id: string) => void;
  addLiveLine: (text: string, committed: boolean) => void;
  addMoment: (m: Moment) => void;
  addAction: (a: AgentAction) => void;
  registerQr: (url: string, source: string) => void;
}

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __threadDemoCtx?: Context<DemoApi | null> };
const DemoContext = g.__threadDemoCtx ?? (g.__threadDemoCtx = createContext<DemoApi | null>(null));

export function DemoProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<EngineMode>("demo");
  const [scenarioId, setScenarioId] = useState<string>("discovery");
  const scenario = SCENARIOS[scenarioId] ?? SCENARIOS["discovery"]!;
  // Demo mode plays by itself — the meeting starts on load, no button press.
  const [playing, setPlaying] = useState(true);
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
    mode === "demo" && elapsed >= scenario.screenShareStart && elapsed < scenario.endSec - 8;

  // Sync scripted actions when the scenario changes
  useEffect(() => {
    setActions(scenario.actions);
  }, [scenario]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
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
    if (m === "live") {
      setPlaying(false);
      setElapsed(0);
    } else {
      setPlaying(true); // back to demo → meeting resumes on its own
    }
  }, []);
  const executeAction = useCallback((id: string) => {
    const action = actions.find((a) => a.id === id);
    if (action?.kind === "reply" && action.label.startsWith("Draft chat reply:")) {
      const text = action.label.replace(/^Draft chat reply:\s*/, "").replace(/^"|"$/g, "");
      setSentChat((prev) => [...prev, { id: crypto.randomUUID(), from: "You (Thread Agent)", text, timeSec: elapsedRef.current, reactions: [], isAgent: true }]);
    }
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status: "executed" } : a)));
  }, [actions]);
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
      const email = c.text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
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

  const value: DemoApi = {
    mode,
    scenario,
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
    setMode,
    setScenario,
    executeAction,
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
