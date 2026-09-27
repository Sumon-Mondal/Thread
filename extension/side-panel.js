// Thread Side Panel Client Logic
let currentTab = "moments";
let state = {
  active: false,
  platform: null,
  meetingTitle: "Meeting in progress",
  speaker: "",
  lines: [],
  moments: [],
  actions: [],
  chat: [],
};

const titleEl = document.getElementById("meeting-title");
const subtitleEl = document.getElementById("meeting-subtitle");
const contentEl = document.getElementById("tab-content");
const queueBadge = document.getElementById("queue-badge");
const agentInput = document.getElementById("agent-input");
const tabBtns = document.querySelectorAll(".tab-btn");

// Tab Switching
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.getAttribute("data-tab");
    render();
  });
});

// Request initial state from service worker
chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
  if (res?.state) {
    state = res.state;
    render();
  }
});

// Listen for state updates from service worker
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "STATE_UPDATED" && msg.state) {
    state = msg.state;
    render();
  }
});

function render() {
  if (state.platform) {
    titleEl.textContent = state.meetingTitle || `${state.platform} Call`;
    subtitleEl.textContent = `${state.platform} · Live Intelligence`;
  }

  const stagedCount = (state.actions || []).filter((a) => a.status === "staged").length;
  if (stagedCount > 0) {
    queueBadge.textContent = stagedCount;
    queueBadge.style.display = "inline";
  } else {
    queueBadge.style.display = "none";
  }

  if (currentTab === "moments") renderMoments();
  else if (currentTab === "transcript") renderTranscript();
  else if (currentTab === "queue") renderQueue();
  else if (currentTab === "agent") renderAgent();
}

function renderMoments() {
  if (!state.moments || state.moments.length === 0) {
    contentEl.innerHTML = `<div class="empty-state">No semantic moments detected yet.<br>Listening for deadlines, decisions, and opportunities…</div>`;
    return;
  }
  contentEl.innerHTML = state.moments
    .slice()
    .reverse()
    .map(
      (m) => `
      <div class="card">
        <div class="card-meta">
          <span class="moment-tag tag-${m.type}">${m.type}</span>
          <span style="font-size: 10px; color: var(--muted);">${m.speaker || "Speaker"}</span>
        </div>
        <div style="font-size: 12px; font-weight: 500; margin-top: 4px;">${m.takeaway}</div>
        ${m.link ? `<a href="${m.link}" target="_blank" style="display:inline-block; font-size:11px; color:#60a5fa; margin-top:6px; text-decoration:none;">🔗 Open link</a>` : ""}
      </div>
    `
    )
    .join("");
}

function renderTranscript() {
  if (!state.lines || state.lines.length === 0) {
    contentEl.innerHTML = `<div class="empty-state">No transcript lines yet.<br>Speak or enable captions in your meeting.</div>`;
    return;
  }
  contentEl.innerHTML = state.lines
    .slice()
    .reverse()
    .map(
      (l) => `
      <div class="transcript-line">
        <span class="transcript-speaker">${l.speaker}:</span>
        <span>${l.text}</span>
      </div>
    `
    )
    .join("");
}

function renderQueue() {
  if (!state.actions || state.actions.length === 0) {
    contentEl.innerHTML = `<div class="empty-state">No staged tasks yet.<br>When someone mentions an action item, form, or deadline, the agent will stage it here.</div>`;
    return;
  }
  contentEl.innerHTML = state.actions
    .map(
      (a) => `
      <div class="card action-card ${a.status === "executed" ? "done" : ""}">
        <div style="font-size: 12px; font-weight: 600;">${a.label}</div>
        <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">${a.detail}</div>
        ${
          a.status === "staged"
            ? `<button class="action-btn" data-action-id="${a.id}">Approve & Execute</button>`
            : `<button class="action-btn done" disabled>✓ Executed</button>`
        }
      </div>
    `
    )
    .join("");

  contentEl.querySelectorAll(".action-btn[data-action-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const actionId = btn.getAttribute("data-action-id");
      chrome.runtime.sendMessage({ type: "EXECUTE_ACTION", actionId });
    });
  });
}

function renderAgent() {
  contentEl.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      <div class="card">
        <div style="font-size: 12px; font-weight: 600;">Thread Agent</div>
        <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">
          Ask questions about this meeting, tell the agent to fill a form, or draft a follow-up email.
        </div>
      </div>
      <div id="agent-chat-log" style="display:flex; flex-direction:column; gap:6px;"></div>
    </div>
  `;
}

// Agent prompt input handling
agentInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && agentInput.value.trim()) {
    const query = agentInput.value.trim();
    agentInput.value = "";

    // Switch to agent tab
    tabBtns.forEach((b) => b.classList.remove("active"));
    document.querySelector('.tab-btn[data-tab="agent"]')?.classList.add("active");
    currentTab = "agent";
    render();

    const logEl = document.getElementById("agent-chat-log");
    if (logEl) {
      logEl.innerHTML += `<div style="padding:6px 10px; background:rgba(255,255,255,0.08); border-radius:8px; font-size:12px; align-self:flex-end;">You: ${query}</div>`;
      logEl.innerHTML += `<div id="agent-thinking" style="padding:6px 10px; font-size:12px; color:var(--muted); font-style:italic;">Thread is thinking…</div>`;

      // Context string from recent lines
      const context = state.lines.slice(-15).map((l) => `${l.speaker}: ${l.text}`).join("\n");

      try {
        const res = await fetch("http://localhost:3000/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: query, liveContext: context }),
        });
        const data = await res.json();
        document.getElementById("agent-thinking")?.remove();
        logEl.innerHTML += `<div style="padding:8px 10px; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); border-radius:8px; font-size:12px;">${data.reply || "Done."}</div>`;
      } catch (err) {
        document.getElementById("agent-thinking")?.remove();
        logEl.innerHTML += `<div style="padding:8px 10px; background:rgba(239,68,68,0.15); border-radius:8px; font-size:12px; color:#f87171;">Could not reach Thread local server. Ensure Thread is running at http://localhost:3000.</div>`;
      }
    }
  }
});
