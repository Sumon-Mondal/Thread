// What the Thread Chrome extension streams from a real Meet, Zoom or Teams call (see extension/).

export interface FeedSession {
  id: string;
  platform: string;
  title: string;
  url: string;
  startedAt: number;
  endedAt: number | null;
  participants: string[];
  status: { captions: boolean; chat: boolean };
  counts: { captions: number; chat: number; qr: number };
}

interface FeedBase {
  sessionId: string;
  platform: string;
  /** Epoch ms when the extension saw it. */
  at: number;
  /** Seconds since the meeting started. */
  t: number;
}

export type FeedEvent = FeedBase &
  (
    | { type: "meeting"; state: "updated" | "ended"; title?: string }
    | { type: "caption"; key: string; speaker: string; text: string; final: boolean }
    | { type: "chat"; msgId: string; from: string; text: string }
    | { type: "people"; names: string[] }
    | { type: "qr"; data: string; source: string }
  );

export type FeedMessage = { source: "thread-extension" } & (
  | { kind: "history"; session: FeedSession; events: FeedEvent[] }
  | { kind: "event"; session: FeedSession; event: FeedEvent }
  | { kind: "idle" }
);
