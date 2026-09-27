// Thread side panel: shows the Thread web app's /panel view beside the call and hands it the meeting feed.
const DEFAULT_URL = "http://localhost:8080";

const $ = (id) => document.getElementById(id);
const frame = $("thread");
let threadUrl = DEFAULT_URL;
let session = null;
let events = [];
let frameReady = false; // set once Thread inside the frame says hello

const port = chrome.runtime.connect({ name: "thread-feed" });

function clock(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function toFrame(msg) {
  if (frameReady) frame.contentWindow?.postMessage({ source: "thread-extension", ...msg }, new URL(threadUrl).origin);
}

port.onMessage.addListener((msg) => {
  if (msg.kind === "history") {
    session = msg.session;
    events = msg.events.slice();
  } else if (msg.kind === "event") {
    session = msg.session;
    const i = msg.event.type === "caption" ? events.findIndex((e) => e.type === "caption" && e.key === msg.event.key) : -1;
    if (i >= 0) events[i] = msg.event;
    else events.push(msg.event);
  }
  render();
  toFrame(msg);
});

window.addEventListener("message", (e) => {
  if (e.source === frame.contentWindow && e.data?.source === "thread-app" && e.data.type === "hello") {
    frameReady = true;
    port.postMessage({ type: "hello" });
  }
});

function render() {
  const live = session && !session.endedAt;
  $("title").textContent = session ? session.title : "Waiting for a meeting";
  $("subtitle").textContent = session
    ? `${session.platform} · ${session.participants.length} ${session.participants.length === 1 ? "person" : "people"}`
    : "Join a Google Meet, Zoom or Teams call in this browser";
  const pill = $("clock");
  pill.className = `pill${live ? " live" : session ? " ended" : ""}`;
  pill.textContent = !session ? "IDLE" : live ? `LIVE ${clock((Date.now() - session.startedAt) / 1000)}` : `ENDED ${clock((session.endedAt - session.startedAt) / 1000)}`;
  $("stats").hidden = !session;
  $("export").disabled = !session;
  if (session) {
    $("n-captions").textContent = session.counts.captions;
    $("n-chat").textContent = session.counts.chat;
    $("n-people").textContent = session.participants.length;
    $("n-qr").textContent = session.counts.qr;
  }
  const hints = [];
  if (live && !session.status.captions) hints.push(`Turn on captions in ${session.platform} (CC) so Thread can follow what's said.`);
  if (live && !session.status.chat) hints.push("Open the meeting chat panel to include chat messages.");
  $("hint").textContent = hints.join(" ");
}
setInterval(render, 1000);

// ---- Export everything captured as a readable text file ----

$("export").addEventListener("click", () => {
  if (!session) return;
  const at = (t) => `[${clock(t)}]`;
  const lines = [
    `Thread — ${session.title} (${session.platform})`,
    `Started ${new Date(session.startedAt).toLocaleString()}${session.endedAt ? ` · lasted ${clock((session.endedAt - session.startedAt) / 1000)}` : ""}`,
    `Participants: ${session.participants.join(", ") || "—"}`,
    "",
    "TRANSCRIPT",
    ...events.filter((e) => e.type === "caption").map((e) => `${at(e.t)} ${e.speaker}: ${e.text}`),
    "",
    "CHAT",
    ...events.filter((e) => e.type === "chat").map((e) => `${at(e.t)} ${e.from}: ${e.text}`),
    "",
    "QR CODES",
    ...events.filter((e) => e.type === "qr").map((e) => `${at(e.t)} ${e.source}: ${e.data}`),
  ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
  a.download = `Thread - ${session.title.replace(/[\\/:*?"<>|]+/g, " ")}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// ---- Thread server ----

$("settings-toggle").addEventListener("click", () => {
  $("settings").hidden = !$("settings").hidden;
  $("thread-url").value = threadUrl;
});

$("settings").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const url = new URL($("thread-url").value.trim());
    if (!/^https?:$/.test(url.protocol)) throw new Error("bad protocol");
    threadUrl = url.origin;
    await chrome.storage.local.set({ threadUrl });
    $("settings").hidden = true;
    connectThread();
  } catch {
    $("thread-url").setCustomValidity("Enter a full http(s) URL, e.g. http://localhost:8080");
    $("thread-url").reportValidity();
  }
});
$("thread-url").addEventListener("input", () => $("thread-url").setCustomValidity(""));

let retry = null;
async function connectThread() {
  clearTimeout(retry);
  try {
    const res = await fetch(`${threadUrl}/api/live-state`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    $("offline").hidden = true;
    const src = `${threadUrl}/panel?feed=extension`;
    if (frame.src !== src) {
      frameReady = false;
      frame.src = src;
    }
  } catch {
    $("offline-url").textContent = threadUrl;
    $("offline").hidden = false;
    retry = setTimeout(connectThread, 4000);
  }
}

chrome.storage.local.get("threadUrl").then(({ threadUrl: saved }) => {
  if (saved) threadUrl = saved;
  connectThread();
});
port.postMessage({ type: "hello" });
render();
