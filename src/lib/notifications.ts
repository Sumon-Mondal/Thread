// In-app notifications + preferences (stored in this browser).
export type MeetingNotif = { recording: boolean; transcript: boolean };
export interface NotifPrefs {
  reminders: boolean;
  reminderMinutes: number;
  reminderOffsets: number[]; // minutes before start
  platforms: Record<string, boolean>;
  quietHours: { on: boolean; start: number; end: number }; // hours 0-23
  perMeeting: Record<string, MeetingNotif>;
  recordingReady: boolean;
  transcriptReady: boolean;
  moments: boolean;
  browserPush: boolean;
}
export interface Notif {
  id: string;
  kind: "reminder" | "recording" | "transcript" | "moment";
  title: string;
  body: string;
  at: number;
  read: boolean;
  href?: string;
}

export const REMINDER_CHOICES = [5, 10, 15, 30, 60, 1440];
export const PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams", "Calendar"];

export const DEFAULT_PREFS: NotifPrefs = {
  reminders: true,
  reminderMinutes: 10,
  reminderOffsets: [10, 60],
  platforms: { Zoom: true, "Google Meet": true, "Microsoft Teams": true, Calendar: true },
  quietHours: { on: false, start: 22, end: 7 },
  perMeeting: {},
  recordingReady: true,
  transcriptReady: true,
  moments: true,
  browserPush: false,
};

export function meetingPref(p: NotifPrefs, id: string): MeetingNotif {
  return p.perMeeting[id] ?? { recording: true, transcript: true };
}
export function inQuietHours(p: NotifPrefs, d = new Date()) {
  if (!p.quietHours.on) return false;
  const h = d.getHours();
  const { start, end } = p.quietHours;
  return start <= end ? h >= start && h < end : h >= start || h < end;
}
export function fmtOffset(m: number) {
  return m >= 1440 ? "1 day" : m >= 60 ? `${m / 60} hr` : `${m} min`;
}

const PK = "thread-notif-prefs";
const FK = "thread-notifs";
const EVT = "thread-notifs-changed";

export function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PK) ?? "{}") as Partial<NotifPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}
export function savePrefs(p: NotifPrefs) {
  localStorage.setItem(PK, JSON.stringify(p));
  window.dispatchEvent(new Event(EVT));
}
export function loadNotifs(): Notif[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FK) ?? "[]") as Notif[];
  } catch {
    return [];
  }
}
export function saveNotifs(n: Notif[]) {
  localStorage.setItem(FK, JSON.stringify(n.slice(0, 50)));
  window.dispatchEvent(new Event(EVT));
}
export function pushNotif(n: Omit<Notif, "at" | "read">) {
  const list = loadNotifs();
  if (list.some((x) => x.id === n.id)) return false;
  saveNotifs([{ ...n, at: Date.now(), read: false }, ...list]);
  if (loadPrefs().browserPush && "Notification" in window && Notification.permission === "granted") {
    new Notification(n.title, { body: n.body });
  }
  return true;
}
export function onNotifsChanged(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  platform: string;
  joinUrl: string | null;
  calendarUrl: string | null;
};
