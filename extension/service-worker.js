// Thread background worker: keeps one running log per meeting tab and streams it to Thread pages
// (the side panel and any open Thread tab) over "thread-feed" ports.

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

const RESUME_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOG = 1500;

let sessions = {}; // tabId -> session
let latestTab = null;
const ports = new Set();

// Chrome stops idle workers, so the log lives in session storage and is reloaded on wake.
const ready = chrome.storage.session
  .get(["threadSessions", "threadLatestTab"])
  .then((r) => {
    sessions = r.threadSessions ?? {};
    latestTab = r.threadLatestTab ?? null;
  })
  .catch(() => {});

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.session.set({ threadSessions: sessions, threadLatestTab: latestTab }).catch(() => {});
  }, 300);
}

function newSession(tabId, ev) {
  return {
    id: `${ev.at.toString(36)}-${tabId}`,
    tabId,
    platform: ev.platform,
    title: ev.title || `${ev.platform} call`,
    url: ev.url,
    startedAt: ev.at,
    endedAt: null,
    participants: [],
    status: { captions: false, chat: false },
    counts: { captions: 0, chat: 0, qr: 0 },
    log: [],
    captionIndex: {},
    chatIds: {},
    qr: {},
  };
}

function summary(s) {
  const { log, captionIndex, chatIds, qr, ...rest } = s;
  return rest;
}

function latestSession() {
  if (latestTab !== null && sessions[latestTab]) return sessions[latestTab];
  return Object.values(sessions).sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
}

function trim(s) {
  if (s.log.length <= MAX_LOG) return;
  s.log = s.log.slice(-MAX_LOG + 200);
  s.captionIndex = {};
  s.log.forEach((e, i) => {
    if (e.type === "caption") s.captionIndex[e.key] = i;
  });
}

function broadcast(msg) {
  for (const port of ports) {
    try {
      port.postMessage(msg);
    } catch {
      ports.delete(port);
    }
  }
}

function updateBadge() {
  const s = latestSession();
  const live = s && !s.endedAt;
  chrome.action.setBadgeText({ text: live ? "LIVE" : "" }).catch(() => {});
  if (live) chrome.action.setBadgeBackgroundColor({ color: "#10b981" }).catch(() => {});
}

async function handle(tabId, ev) {
  await ready;
  let s = sessions[tabId];

  if (ev.type === "meeting" && ev.state === "started") {
    const rejoined = s && s.url === ev.url && s.endedAt && ev.at - s.endedAt < RESUME_WINDOW_MS;
    if (rejoined) s.endedAt = null;
    else {
      s = newSession(tabId, ev);
      sessions[tabId] = s;
    }
    latestTab = tabId;
    broadcast({ kind: "history", session: summary(s), events: s.log });
    updateBadge();
    save();
    return;
  }
  if (!s || (s.endedAt && ev.type !== "meeting")) return;

  const e = { ...ev, sessionId: s.id, t: Math.max(0, Math.round((ev.at - s.startedAt) / 1000)) };
  switch (ev.type) {
    case "meeting":
      if (ev.state === "updated" && ev.title) s.title = ev.title;
      if (ev.state === "ended") {
        if (s.endedAt) return;
        s.endedAt = ev.at;
      }
      s.log.push(e);
      break;
    case "caption": {
      const i = s.captionIndex[e.key];
      if (i === undefined) {
        s.captionIndex[e.key] = s.log.length;
        s.log.push(e);
      } else {
        const prev = s.log[i];
        if (prev.final) return;
        e.t = prev.t;
        s.log[i] = e;
      }
      if (e.final) s.counts.captions++;
      break;
    }
    case "chat":
      if (s.chatIds[e.msgId]) return;
      s.chatIds[e.msgId] = 1;
      s.counts.chat++;
      s.log.push(e);
      break;
    case "people":
      s.participants = e.names;
      s.log.push(e);
      break;
    case "qr":
      if (s.qr[e.data]) return;
      s.qr[e.data] = 1;
      s.counts.qr++;
      s.log.push(e);
      break;
    case "status":
      s.status = { captions: Boolean(e.captions), chat: Boolean(e.chat) };
      break;
    default:
      return;
  }
  trim(s);
  broadcast({ kind: "event", session: summary(s), event: e });
  updateBadge();
  save();
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "thread:event" && sender.tab?.id !== undefined) void handle(sender.tab.id, msg.event);
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "thread-feed") return;
  ports.add(port);
  port.onDisconnect.addListener(() => ports.delete(port));
  port.onMessage.addListener(async (msg) => {
    if (msg?.type !== "hello") return;
    await ready;
    const s = latestSession();
    port.postMessage(s ? { kind: "history", session: summary(s), events: s.log } : { kind: "idle" });
  });
});

function endIfLive(tabId) {
  const s = sessions[tabId];
  if (s && !s.endedAt) void handle(tabId, { type: "meeting", state: "ended", platform: s.platform, at: Date.now() });
}

chrome.tabs.onRemoved.addListener(endIfLive);
chrome.tabs.onUpdated.addListener((tabId, info) => {
  const s = sessions[tabId];
  if (!s || s.endedAt || !info.url) return;
  const next = new URL(info.url);
  if (next.origin + next.pathname !== s.url) endIfLive(tabId);
});

void ready.then(updateBadge);
