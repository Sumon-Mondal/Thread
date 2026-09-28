// Thread meeting reader. Runs inside the Meet, Zoom or Teams tab and turns the call into events for Thread:
// meeting start/end, captions with speaker names, chat messages, participants and QR codes on screen.
(() => {
  if (window.__threadMeetingReader) return;
  window.__threadMeetingReader = true;

  const host = location.hostname;
  const platform =
    host === "meet.google.com" ? "Google Meet"
    : host.endsWith("zoom.us") ? "Zoom"
    : host.startsWith("teams.") ? "Microsoft Teams"
    : null;
  if (!platform) return;

  const textOf = (el) => (el ? (el.innerText ?? el.textContent ?? "") : "").trim();
  const linesOf = (el) => textOf(el).split("\n").map((s) => s.trim()).filter(Boolean);
  const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const TIME_RE = /^\d{1,2}:\d{2}(?:\s?[AP]M)?$/i;

  // Meet draws its icons as ligature text inside <i>, e.g. "call_end", which stays stable across redesigns.
  function iconButton(name) {
    for (const el of document.querySelectorAll("i")) {
      if (el.childElementCount === 0 && el.textContent.trim() === name) {
        const button = el.closest("button, [role='button']");
        if (button) return button;
      }
    }
    return null;
  }

  // ---- Caption entries: speaker on the first line, what they said below it ----

  function looksLikeEntry(el) {
    if (el.matches("button, [role='button']")) return false;
    const lines = linesOf(el);
    return lines.length >= 2 && lines[0].length <= 60;
  }

  function entriesIn(el, depth = 0) {
    const kids = [...el.children].filter((k) => textOf(k));
    const entries = kids.filter(looksLikeEntry);
    if (entries.length > 1) return entries;
    if (entries.length === 1 && depth < 5) {
      const inner = entriesIn(entries[0], depth + 1);
      return inner.length > 1 ? inner : entries;
    }
    return [];
  }

  function parseEntry(el, fallbackSpeaker) {
    const lines = linesOf(el);
    if (lines.length >= 2) return { node: el, speaker: lines[0], text: clean(lines.slice(1).join(" ")) };
    const named = lines[0]?.match(/^([^:]{1,40}):\s+(.+)$/);
    if (named) return { node: el, speaker: clean(named[1]), text: clean(named[2]) };
    return fallbackSpeaker && lines[0] ? { node: el, speaker: fallbackSpeaker, text: clean(lines[0]) } : null;
  }

  // ---- Chat: read as a run of "sender, time, messages…" so it doesn't depend on how the groups nest ----

  function chatFromList(list) {
    const lines = linesOf(list);
    const out = [];
    let from = null;
    let time = "";
    let n = 0;
    for (let i = 0; i < lines.length; i++) {
      if (TIME_RE.test(lines[i])) continue;
      if (TIME_RE.test(lines[i + 1] ?? "")) {
        from = lines[i];
        time = lines[i + 1];
        n = 0;
      } else if (from) {
        out.push({ from, text: lines[i], key: `${from}|${time}|${n++}|${lines[i]}` });
      }
    }
    return out;
  }

  // The chat list is whatever live region sits in the same panel as the "Send a message" box.
  function chatListNear(composerSelector) {
    const composer = document.querySelector(composerSelector);
    for (let a = composer?.parentElement; a && a !== document.body; a = a.parentElement) {
      const list = a.querySelector("[aria-live='polite'], [role='log'], [role='list']");
      if (list && !list.contains(composer)) return list;
    }
    return null;
  }

  function meetCaptionRegion() {
    return (
      document.querySelector("[role='region'][aria-label*='aption' i]") ||
      document.querySelector("div[jsname='dsyhDe']") ||
      document.querySelector(".a4cQT")
    );
  }

  const MEET_COMPOSER = "textarea[aria-label*='message' i], [contenteditable='true'][aria-label*='message' i]";

  const adapters = {
    "Google Meet": {
      inCall: () => Boolean(document.querySelector("button[aria-label*='Leave call' i]") || iconButton("call_end")),
      title: () => {
        const named = document.querySelector("[data-meeting-title]")?.getAttribute("data-meeting-title");
        const fromTab = document.title.replace(/^Meet\s*[-–—:]\s*/i, "").trim();
        return clean(named || (fromTab && fromTab !== "Meet" ? fromTab : "") || location.pathname.slice(1)) || "Google Meet call";
      },
      captionsOn: () => Boolean(meetCaptionRegion()),
      enableCaptions: () => {
        const button = document.querySelector("button[aria-label*='Turn on captions' i]") || iconButton("closed_caption_off");
        if (!button || button.getAttribute("aria-pressed") === "true") return false;
        button.click();
        return true;
      },
      captions: () => {
        const region = meetCaptionRegion();
        return region ? entriesIn(region).map((el) => parseEntry(el)).filter(Boolean) : [];
      },
      people: () => {
        const names = new Set();
        for (const tile of document.querySelectorAll("[data-participant-id]")) {
          const name =
            tile.querySelector("[data-self-name]")?.getAttribute("data-self-name") ||
            textOf(tile.querySelector(".notranslate")) ||
            linesOf(tile)[0];
          if (name && name.length <= 60) names.add(clean(name));
        }
        for (const item of document.querySelectorAll("[role='listitem'][aria-label]")) {
          if (item.closest("[aria-label*='articipant' i], [aria-label*='people' i]")) names.add(clean(item.getAttribute("aria-label")));
        }
        return [...names];
      },
      chatOpen: () => Boolean(chatListNear(MEET_COMPOSER)),
      chat: () => {
        const list = chatListNear(MEET_COMPOSER);
        return list ? chatFromList(list) : [];
      },
    },

    // Zoom and Teams web clients: best effort from their public markup.
    Zoom: {
      inCall: () => Boolean(document.querySelector(".footer__leave-btn, [class*='leave-meeting'], button[aria-label*='Leave' i]")),
      title: () => clean(textOf(document.querySelector("[class*='meeting-topic'], .meeting-info-container__topic")) || document.title.replace(/\s*[-|]\s*Zoom.*$/i, "")) || "Zoom meeting",
      captionsOn: () => Boolean(document.querySelector("[class*='live-transcription-subtitle'], [class*='lt-full-transcript']")),
      enableCaptions: () => false,
      captions: () =>
        [...document.querySelectorAll("[class*='lt-full-transcript__item'], [class*='live-transcription-subtitle__item']")]
          .map((el) => parseEntry(el, "Speaker"))
          .filter(Boolean),
      people: () =>
        [...document.querySelectorAll("[class*='participants-item__display-name'], [class*='video-avatar__avatar-name']")]
          .map((el) => clean(textOf(el)))
          .filter((n) => n && n.length <= 60),
      chatOpen: () => Boolean(document.querySelector("[class*='chat-message__container'], [class*='chat-container']")),
      chat: () =>
        [...document.querySelectorAll("[class*='chat-message__container']")].map((el) => {
          const from = clean(textOf(el.querySelector("[class*='chat-item__sender'], [class*='sender']"))) || "Participant";
          const text = clean(textOf(el.querySelector("[class*='text-content'], [class*='chat-message__text']")) || textOf(el));
          return { from, text, key: `${from}|${text}` };
        }).filter((m) => m.text),
    },

    "Microsoft Teams": {
      inCall: () => Boolean(document.querySelector("#hangup-button, [data-tid='hangup-main-btn'], button[aria-label*='Leave' i]")),
      title: () => clean(document.title.replace(/\s*\|\s*Microsoft Teams.*$/i, "").replace(/^\(\d+\)\s*/, "")) || "Teams meeting",
      captionsOn: () => Boolean(document.querySelector("[data-tid='closed-caption-text']")),
      enableCaptions: () => false,
      captions: () =>
        [...document.querySelectorAll("[data-tid='closed-caption-text']")].map((textEl) => {
          const item = textEl.closest("[data-tid='closed-caption-message'], .fui-ChatMessageCompact, [role='listitem']") ?? textEl.parentElement;
          return { node: item, speaker: clean(textOf(item?.querySelector("[data-tid='author']"))) || "Speaker", text: clean(textOf(textEl)) };
        }).filter((e) => e.text),
      people: () =>
        [...document.querySelectorAll("[data-tid*='roster'] [role='treeitem'][aria-label], [data-tid*='participant'] [title]")]
          .map((el) => clean(el.getAttribute("aria-label") || el.getAttribute("title")).split(",")[0])
          .filter((n) => n && n.length <= 60),
      chatOpen: () => Boolean(document.querySelector("[data-tid='chat-pane-message']")),
      chat: () =>
        [...document.querySelectorAll("[data-tid='chat-pane-message']")].map((el) => {
          const from = clean(textOf(el.querySelector("[data-tid='message-author-name']"))) || "Participant";
          const text = clean(textOf(el.querySelector("[id^='content-'], [data-tid='chat-pane-message-content']")) || textOf(el));
          return { from, text, key: `${from}|${text}` };
        }).filter((m) => m.text),
    },
  };

  const adapter = adapters[platform];

  // ---- Sending ----

  let stopped = false;
  function send(event) {
    if (stopped) return;
    try {
      chrome.runtime.sendMessage({ type: "thread:event", event: { ...event, platform, at: Date.now() } }).catch(() => {});
    } catch {
      stop(); // the extension was reloaded; this copy of the script is orphaned
    }
  }

  function hash(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    return (h >>> 0).toString(36);
  }

  // ---- Captions: stream each entry as it grows, commit it once the speaker pauses ----

  const tracked = new Map(); // caption entry node -> progress
  const committed = []; // recent final lines, so a re-rendered caption list isn't sent twice
  let keySeq = 0;
  const newKey = () => `${Date.now().toString(36)}${(keySeq++).toString(36)}`;

  function lastSentenceEnd(s, min, max) {
    for (let i = Math.min(max, s.length - 1); i >= min; i--) {
      if (".?!".includes(s[i]) && (i + 1 === s.length || s[i + 1] === " ")) return i + 1;
    }
    return 0;
  }

  function commit(t, text) {
    send({ type: "caption", key: t.key, speaker: t.speaker, text, final: true });
    committed.push({ speaker: t.speaker, text });
    if (committed.length > 30) committed.shift();
  }

  function alreadyCommitted(speaker, text) {
    let base = 0;
    for (const c of committed) {
      if (c.speaker !== speaker) continue;
      // A new line's first word ("We") must not match inside an old one ("Welcome…"), so short text only counts if identical.
      if (c.text === text || (text.length >= 12 && c.text.includes(text))) return text.length;
      if (c.text.length >= 12 && text.startsWith(c.text)) base = Math.max(base, c.text.length);
    }
    return base;
  }

  function scanCaptions() {
    const now = Date.now();
    const seen = new Set();
    for (const entry of adapter.captions()) {
      seen.add(entry.node);
      let t = tracked.get(entry.node);
      if (!t) {
        t = { key: newKey(), speaker: entry.speaker, base: alreadyCommitted(entry.speaker, entry.text), full: "", sent: "", changedAt: now };
        tracked.set(entry.node, t);
      }
      t.full = entry.text;
      const raw = entry.text.slice(t.base);
      const lead = raw.length - raw.trimStart().length;
      let segment = raw.trim();
      if (!segment || segment === t.sent) continue;
      t.speaker = entry.speaker || t.speaker;
      // Long monologues are cut at a sentence end so moments don't wait for the speaker to pause.
      if (segment.length > 280) {
        const cut = lastSentenceEnd(segment, 120, segment.length - 20);
        if (cut) {
          commit(t, segment.slice(0, cut).trim());
          t.base += lead + cut;
          t.key = newKey();
          segment = segment.slice(cut).trim();
        }
      }
      t.sent = segment;
      t.changedAt = now;
      send({ type: "caption", key: t.key, speaker: t.speaker, text: segment, final: false });
    }
    for (const [node, t] of tracked) {
      const gone = !seen.has(node);
      if (t.sent && (gone || now - t.changedAt > 1800)) {
        commit(t, t.sent);
        t.base = t.full.length;
        t.sent = "";
        t.key = newKey();
      }
      if (gone) tracked.delete(node);
    }
  }

  // ---- Chat and people ----

  const seenChat = new Set();
  function scanChat() {
    for (const m of adapter.chat()) {
      if (seenChat.has(m.key)) continue;
      seenChat.add(m.key);
      send({ type: "chat", msgId: hash(m.key), from: m.from, text: m.text });
    }
  }

  let lastPeople = "";
  function scanPeople() {
    const names = adapter.people().sort();
    const joined = names.join("|");
    if (joined === lastPeople) return;
    lastPeople = joined;
    send({ type: "people", names });
  }

  // ---- QR codes on shared screens and camera tiles ----

  const qrCanvas = document.createElement("canvas");
  const qrCtx = qrCanvas.getContext("2d", { willReadFrequently: true });
  const seenQr = new Set();

  function videoLabel(video) {
    const tile = video.closest("[data-participant-id]");
    const name = tile ? textOf(tile.querySelector(".notranslate")) || linesOf(tile)[0] : "";
    return name ? `${clean(name)}'s screen` : "Shared screen";
  }

  function scanQr() {
    if (typeof jsQR !== "function") return;
    const videos = [...document.querySelectorAll("video")]
      .filter((v) => v.videoWidth > 0 && v.readyState >= 2)
      .map((v) => ({ v, area: v.getBoundingClientRect().width * v.getBoundingClientRect().height }))
      .filter((x) => x.area > 0)
      .sort((a, b) => b.area - a.area)
      .slice(0, 3);
    for (const { v } of videos) {
      const scale = Math.min(1, 1280 / v.videoWidth);
      const w = Math.round(v.videoWidth * scale);
      const h = Math.round(v.videoHeight * scale);
      qrCanvas.width = w;
      qrCanvas.height = h;
      try {
        qrCtx.drawImage(v, 0, 0, w, h);
        const code = jsQR(qrCtx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
        const data = code?.data?.trim();
        if (data && !seenQr.has(data)) {
          seenQr.add(data);
          send({ type: "qr", data, source: videoLabel(v) });
        }
      } catch {
        // a protected or cross-origin frame can't be read
      }
    }
  }

  // ---- Lifecycle ----

  let inCall = false;
  let outSince = 0;
  let captionTries = 0;
  let lastTitle = "";
  let lastStatus = "";
  let ticks = 0;

  function tick() {
    ticks++;
    const present = adapter.inCall();
    if (present) outSince = 0;
    if (present && !inCall) {
      inCall = true;
      lastTitle = adapter.title();
      send({ type: "meeting", state: "started", title: lastTitle, url: location.origin + location.pathname });
    } else if (!present && inCall) {
      // Layout changes can hide the call controls for a moment, so only a sustained absence ends the meeting.
      outSince ||= Date.now();
      if (Date.now() - outSince < 4000) return;
      scanCaptions();
      for (const t of tracked.values()) if (t.sent) commit(t, t.sent);
      tracked.clear();
      inCall = false;
      send({ type: "meeting", state: "ended" });
      return;
    }
    if (!inCall) return;

    const title = adapter.title();
    if (title && title !== lastTitle) {
      lastTitle = title;
      send({ type: "meeting", state: "updated", title });
    }
    const captionsOn = adapter.captionsOn();
    if (captionsOn) captionTries = 99; // seen on once, so never fight the user if they turn it off
    else if (captionTries < 4 && ticks % 3 === 0) {
      captionTries++;
      adapter.enableCaptions();
    }
    const status = JSON.stringify({ captions: captionsOn, chat: adapter.chatOpen() });
    if (status !== lastStatus) {
      lastStatus = status;
      send({ type: "status", ...JSON.parse(status) });
    }
    scanCaptions();
    scanChat();
    if (ticks % 3 === 0) scanPeople();
    if (ticks % 3 === 1) scanQr();
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (!inCall || scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      if (!inCall || stopped) return;
      scanCaptions();
      scanChat();
    }, 250);
  });

  const timer = setInterval(tick, 1000);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  function stop() {
    stopped = true;
    clearInterval(timer);
    observer.disconnect();
  }
})();
