import fs from "node:fs";
import path from "node:path";

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  platform: "Google Meet" | "Zoom" | "Microsoft Teams" | "Calendar";
  joinUrl: string | null;
  calendarUrl: string | null;
  description?: string;
  location?: string;
}

export interface ConnectorsConfig {
  gcal: {
    connected: boolean;
    accountEmail: string;
    accessToken?: string;
    refreshToken?: string;
    icalUrl?: string;
    calendarId: string;
    lastSynced?: string;
    syncMode: "google_account" | "oauth_token" | "ical";
  };
  gmail: {
    connected: boolean;
    accountEmail: string;
    accessToken?: string;
  };
  notion: {
    connected: boolean;
    apiKey?: string;
    databaseId?: string;
    workspaceName?: string;
  };
  outlook: {
    connected: boolean;
    token?: string;
    email?: string;
    displayName?: string;
  };
  teams: {
    connected: boolean;
    webhookUrl?: string;
  };
  zoom: {
    connected: boolean;
    personalMeetingUrl?: string;
  };
  gmeet: {
    connected: boolean;
    defaultRoomUrl?: string;
  };
  vmConfig?: {
    autoJoinPolicy: "prompt_5min" | "auto_join" | "manual";
    vmHost: string;
    botName: string;
    lastSynced?: string;
  };
  events: GoogleCalendarEvent[];
}

const STORE_PATH = path.resolve(process.cwd(), ".thread_connectors.json");

const DEFAULT_EVENTS: GoogleCalendarEvent[] = [
  {
    id: "gcal-upcoming-5min",
    title: "Thread Strategy & Enterprise Architecture Review",
    start: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 50).toISOString(),
    platform: "Google Meet",
    joinUrl: "https://meet.google.com/xyz-qwer-vbn",
    calendarUrl: "https://calendar.google.com/calendar/u/0/r",
    description: "Review real-time live captions, Gemini agentic workflows, slide QR codes, and Google Calendar sync.",
  },
  {
    id: "gcal-init-2",
    title: "Nova Dynamics AI Systems Sync with Sarah Chen",
    start: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 225).toISOString(),
    platform: "Zoom",
    joinUrl: "https://zoom.us/j/98765432100",
    calendarUrl: "https://calendar.google.com/calendar/u/0/r",
    description: "Follow up on Nova Dynamics compute allocation, slide deck QR codes, and minutes dispatch.",
  },
  {
    id: "gcal-init-3",
    title: "Cross-Platform Mobile & Web Client Verification",
    start: new Date(Date.now() + 1000 * 60 * 360).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 405).toISOString(),
    platform: "Google Meet",
    joinUrl: "https://meet.google.com/tuv-ghjk-lmn",
    calendarUrl: "https://calendar.google.com/calendar/u/0/r",
    description: "Ensure iOS client and Web console share real-time meeting state and calendar milestones.",
  },
];

const DEFAULT_CONFIG: ConnectorsConfig = {
  gcal: {
    connected: true,
    accountEmail: "sumonmondal@gmail.com",
    calendarId: "primary",
    syncMode: "google_account",
    lastSynced: new Date().toISOString(),
  },
  gmail: {
    connected: true,
    accountEmail: "sumonmondal@gmail.com",
  },
  notion: {
    connected: false,
  },
  outlook: {
    connected: false,
  },
  teams: {
    connected: false,
  },
  zoom: {
    connected: true,
    personalMeetingUrl: "https://zoom.us/j/98765432100",
  },
  gmeet: {
    connected: true,
    defaultRoomUrl: "https://meet.google.com",
  },
  vmConfig: {
    autoJoinPolicy: "prompt_5min",
    vmHost: "thread-vm-us-east.cloud",
    botName: "Thread Assistant (for Sumon)",
    lastSynced: new Date().toISOString(),
  },
  events: DEFAULT_EVENTS,
};

let memoryCache: ConnectorsConfig | null = null;

export function loadConnectorsConfig(): ConnectorsConfig {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      memoryCache = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      return memoryCache!;
    }
  } catch (err) {
    console.error("Failed to read .thread_connectors.json:", err);
  }

  memoryCache = { ...DEFAULT_CONFIG };
  saveConnectorsConfig(memoryCache);
  return memoryCache;
}

export function saveConnectorsConfig(config: ConnectorsConfig): void {
  memoryCache = config;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write .thread_connectors.json:", err);
  }
}

export function updateGoogleAccount(params: {
  accountEmail: string;
  accessToken?: string;
  icalUrl?: string;
  syncMode?: "google_account" | "oauth_token" | "ical";
}): ConnectorsConfig {
  const config = loadConnectorsConfig();
  config.gcal = {
    ...config.gcal,
    connected: true,
    accountEmail: params.accountEmail,
    accessToken: params.accessToken || config.gcal.accessToken,
    icalUrl: params.icalUrl || config.gcal.icalUrl,
    syncMode: params.syncMode || config.gcal.syncMode || "google_account",
    lastSynced: new Date().toISOString(),
  };
  config.gmail = {
    ...config.gmail,
    connected: true,
    accountEmail: params.accountEmail,
    accessToken: params.accessToken || config.gmail.accessToken,
  };
  saveConnectorsConfig(config);
  return config;
}

export function disconnectGoogleAccount(): ConnectorsConfig {
  const config = loadConnectorsConfig();
  config.gcal.connected = false;
  config.gcal.accessToken = undefined;
  config.gcal.icalUrl = undefined;
  config.gmail.connected = false;
  config.gmail.accessToken = undefined;
  saveConnectorsConfig(config);
  return config;
}

export function addStoredEvent(event: Omit<GoogleCalendarEvent, "id">): GoogleCalendarEvent {
  const config = loadConnectorsConfig();
  const newEvent: GoogleCalendarEvent = {
    id: `gcal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...event,
  };
  config.events.unshift(newEvent);
  saveConnectorsConfig(config);
  return newEvent;
}

export function updateVmPolicy(policy: "prompt_5min" | "auto_join" | "manual"): ConnectorsConfig {
  const config = loadConnectorsConfig();
  config.vmConfig = {
    autoJoinPolicy: policy,
    vmHost: config.vmConfig?.vmHost || "thread-vm-us-east.cloud",
    botName: config.vmConfig?.botName || "Thread Assistant (for Sumon)",
    lastSynced: new Date().toISOString(),
  };
  saveConnectorsConfig(config);
  return config;
}

export function getUpcomingMeeting(): {
  event: GoogleCalendarEvent;
  minutesUntilStart: number;
  startsSoon: boolean;
} | null {
  const config = loadConnectorsConfig();
  const now = Date.now();
  const validEvents = config.events
    .map((e) => {
      const startTime = new Date(e.start).getTime();
      const diffMs = startTime - now;
      const minutesUntilStart = Math.round(diffMs / 60000);
      return { event: e, minutesUntilStart, diffMs };
    })
    .sort((a, b) => a.diffMs - b.diffMs);

  // Look for event starting within -5 to 30 minutes
  const soonEvent = validEvents.find((v) => v.minutesUntilStart >= -10 && v.minutesUntilStart <= 25);
  if (soonEvent) {
    return {
      event: soonEvent.event,
      minutesUntilStart: Math.max(0, soonEvent.minutesUntilStart),
      startsSoon: true,
    };
  }

  // Fallback to closest upcoming event or synthetic 5-minute meeting
  if (validEvents.length > 0) {
    const first = validEvents[0]!;
    return {
      event: first.event,
      minutesUntilStart: Math.max(0, first.minutesUntilStart),
      startsSoon: first.minutesUntilStart <= 15,
    };
  }

  return {
    event: DEFAULT_EVENTS[0]!,
    minutesUntilStart: 5,
    startsSoon: true,
  };
}
