// Runs on Thread web pages. Once the page asks for the meeting feed, relays the extension's events into it
// with window.postMessage, so pages that never ask never see any meeting data.
(() => {
  if (window.__threadBridge) return;
  window.__threadBridge = true;

  let port = null;
  let wanted = false;

  function connect() {
    try {
      port = chrome.runtime.connect({ name: "thread-feed" });
    } catch {
      port = null; // the extension was reloaded; this copy is orphaned
      return;
    }
    port.onMessage.addListener((msg) => window.postMessage({ source: "thread-extension", ...msg }, location.origin));
    port.onDisconnect.addListener(() => {
      port = null;
      if (wanted) setTimeout(connect, 1000);
    });
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || e.data?.source !== "thread-app" || e.data.type !== "hello") return;
    wanted = true;
    if (!port) connect();
    try {
      port?.postMessage({ type: "hello" });
    } catch {
      port = null;
    }
  });
})();
