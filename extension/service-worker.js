// Thread Extension Background Service Worker (Manifest V3)

// Configure the side panel to open on extension icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
  console.error("Failed to set side panel behavior:", error);
});

// In-memory state buffer
let meetingState = {
  active: false,
  platform: null,
  meetingTitle: "Meeting in progress",
  speaker: "",
  lines: [],
  moments: [],
  actions: [],
  chat: [],
  startedAt: null,
};

// Initialize from local storage if available
chrome.storage.local.get(["threadState"], (res) => {
  if (res.threadState) {
    meetingState = { ...meetingState, ...res.threadState };
  }
});

function persistState() {
  chrome.storage.local.set({ threadState: meetingState });
}

// Update action badge
function updateBadge() {
  const stagedCount = meetingState.actions.filter((a) => a.status === "staged").length;
  if (stagedCount > 0) {
    chrome.action.setBadgeText({ text: String(stagedCount) });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" }); // Amber
  } else if (meetingState.active) {
    chrome.action.setBadgeText({ text: "LIVE" });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" }); // Emerald
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Simple heuristic moment classifier for incoming live text
function detectMoment(speaker, text) {
  const t = text.toLowerCase();
  if (/\b(internship|job|opportunity|hiring|opening|join our team)\b/i.test(t)) {
    return {
      id: `m-${Date.now()}`,
      type: "OPPORTUNITY",
      speaker,
      takeaway: text.slice(0, 120),
      timeSec: Math.floor((Date.now() - (meetingState.startedAt || Date.now())) / 1000),
    };
  }
  if (/\b(deadline|due|by (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|cutoff|firmly)\b/i.test(t)) {
    return {
      id: `m-${Date.now()}`,
      type: "DEADLINE",
      speaker,
      takeaway: text.slice(0, 120),
      timeSec: Math.floor((Date.now() - (meetingState.startedAt || Date.now())) / 1000),
    };
  }
  if (/\b(link|qr|portal|document|slide|github|notion)\b/i.test(t)) {
    return {
      id: `m-${Date.now()}`,
      type: "RESOURCE",
      speaker,
      takeaway: text.slice(0, 120),
      timeSec: Math.floor((Date.now() - (meetingState.startedAt || Date.now())) / 1000),
    };
  }
  if (/\b(decided|agreed|decision|we will lead with|approved)\b/i.test(t)) {
    return {
      id: `m-${Date.now()}`,
      type: "DECISION",
      speaker,
      takeaway: text.slice(0, 120),
      timeSec: Math.floor((Date.now() - (meetingState.startedAt || Date.now())) / 1000),
    };
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MEETING_STARTED") {
    meetingState.active = true;
    meetingState.platform = message.platform;
    meetingState.meetingTitle = message.title || `${message.platform} Call`;
    meetingState.startedAt = Date.now();
    updateBadge();
    persistState();
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "NEW_CAPTION") {
    const { speaker, text } = message;
    if (!text || text.trim().length === 0) return;

    meetingState.active = true;
    meetingState.speaker = speaker || "Speaker";
    const lineObj = {
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      speaker: meetingState.speaker,
      text: text.trim(),
      at: Date.now(),
    };
    meetingState.lines.push(lineObj);
    if (meetingState.lines.length > 200) meetingState.lines.shift();

    const moment = detectMoment(speaker, text);
    if (moment) {
      meetingState.moments.push(moment);
      // Stage an action for opportunity or deadline
      if (moment.type === "OPPORTUNITY" || moment.type === "DEADLINE") {
        meetingState.actions.push({
          id: `act-${Date.now()}`,
          label: `${moment.type}: ${moment.takeaway.slice(0, 60)}…`,
          detail: `Mentioned by ${speaker} in ${meetingState.platform}`,
          status: "staged",
          kind: moment.type === "DEADLINE" ? "reminder" : "apply",
        });
      }
    }

    updateBadge();
    persistState();
    // Forward to side panel
    chrome.runtime.sendMessage({ type: "STATE_UPDATED", state: meetingState }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "NEW_CHAT_MESSAGE") {
    const { from, text, links, emails } = message;
    const chatItem = { id: `chat-${Date.now()}`, from, text, at: Date.now() };
    meetingState.chat.push(chatItem);

    // If chat contains a link or an email, stage an agent task
    if (emails && emails.length > 0) {
      for (const email of emails) {
        meetingState.actions.push({
          id: `act-email-${Date.now()}`,
          label: `Draft email to ${from} (${email})`,
          detail: `From chat: "${text.slice(0, 80)}"`,
          status: "staged",
          kind: "reply",
          to: email,
        });
      }
    } else if (links && links.length > 0) {
      for (const link of links) {
        meetingState.actions.push({
          id: `act-link-${Date.now()}`,
          label: `Open & save link shared by ${from}`,
          detail: link,
          status: "staged",
          kind: "apply",
          link,
        });
      }
    }

    updateBadge();
    persistState();
    chrome.runtime.sendMessage({ type: "STATE_UPDATED", state: meetingState }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "QR_DETECTED") {
    const { url, source } = message;
    meetingState.moments.push({
      id: `qr-${Date.now()}`,
      type: "RESOURCE",
      speaker: source || "Shared Screen",
      takeaway: `QR Code detected: ${url}`,
      timeSec: Math.floor((Date.now() - (meetingState.startedAt || Date.now())) / 1000),
      link: url,
    });
    meetingState.actions.push({
      id: `act-qr-${Date.now()}`,
      label: `Open decoded QR link: ${url.replace(/^https?:\/\//, "").slice(0, 45)}…`,
      detail: `Decoded from screen share by Thread`,
      status: "staged",
      kind: "apply",
      link: url,
    });
    updateBadge();
    persistState();
    chrome.runtime.sendMessage({ type: "STATE_UPDATED", state: meetingState }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "GET_STATE") {
    sendResponse({ state: meetingState });
    return true;
  }

  if (message.type === "EXECUTE_ACTION") {
    const action = meetingState.actions.find((a) => a.id === message.actionId);
    if (action) {
      action.status = "executed";
      updateBadge();
      persistState();
      chrome.runtime.sendMessage({ type: "STATE_UPDATED", state: meetingState }).catch(() => {});
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "RESET_STATE") {
    meetingState = {
      active: false,
      platform: null,
      meetingTitle: "Meeting in progress",
      speaker: "",
      lines: [],
      moments: [],
      actions: [],
      chat: [],
      startedAt: null,
    };
    updateBadge();
    persistState();
    chrome.runtime.sendMessage({ type: "STATE_UPDATED", state: meetingState }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }
});
