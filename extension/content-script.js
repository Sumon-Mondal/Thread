// Thread Content Script: Observes Meet, Zoom, and Teams DOM for Captions, Chat & Shared Slides
(() => {
  console.log("[Thread Extension] Content script attached to:", window.location.href);

  const hostname = window.location.hostname;
  let platform = "Web Meeting";
  if (hostname.includes("meet.google.com")) platform = "Google Meet";
  else if (hostname.includes("zoom.us")) platform = "Zoom";
  else if (hostname.includes("teams.microsoft.com")) platform = "Microsoft Teams";

  // Notify service worker that a meeting tab has been detected
  chrome.runtime.sendMessage({
    type: "MEETING_STARTED",
    platform,
    title: document.title || `${platform} Meeting`,
  }).catch(() => {});

  let lastCaptionText = "";
  let lastSpeaker = "";

  // 1. Monitor Captions via MutationObserver
  function initCaptionObserver() {
    const observer = new MutationObserver(() => {
      // Google Meet Captions
      if (platform === "Google Meet") {
        // Look for typical Google Meet caption containers
        const captionNodes = document.querySelectorAll('[jsname="YSvySm"], div[class*="iTTPOb"], div[class*="caption"]');
        if (captionNodes.length > 0) {
          const latest = captionNodes[captionNodes.length - 1];
          const text = latest.innerText || latest.textContent || "";
          
          // Look for speaker name
          const parent = latest.closest('[jsname="tgaKEf"]') || latest.parentElement;
          const speakerEl = parent?.querySelector('[class*="zsT0Vo"], [class*="speaker"], [jsname="WBs04"]');
          const speaker = speakerEl ? speakerEl.innerText.trim() : "Speaker";

          if (text && text !== lastCaptionText && text.trim().length > 3) {
            lastCaptionText = text;
            lastSpeaker = speaker;
            chrome.runtime.sendMessage({
              type: "NEW_CAPTION",
              platform,
              speaker,
              text,
            }).catch(() => {});
          }
        }
      }

      // Zoom Web Captions
      if (platform === "Zoom") {
        const captionNodes = document.querySelectorAll('.caption-content, [class*="caption-text"], .meeting-captions');
        if (captionNodes.length > 0) {
          const latest = captionNodes[captionNodes.length - 1];
          const text = latest.innerText || "";
          if (text && text !== lastCaptionText) {
            lastCaptionText = text;
            chrome.runtime.sendMessage({
              type: "NEW_CAPTION",
              platform,
              speaker: "Zoom Attendee",
              text,
            }).catch(() => {});
          }
        }
      }

      // Teams Web Captions
      if (platform === "Microsoft Teams") {
        const captionNodes = document.querySelectorAll('[data-tid="closed-captions-renderer"] span');
        if (captionNodes.length > 0) {
          const latest = captionNodes[captionNodes.length - 1];
          const text = latest.innerText || "";
          if (text && text !== lastCaptionText) {
            lastCaptionText = text;
            chrome.runtime.sendMessage({
              type: "NEW_CAPTION",
              platform,
              speaker: "Teams Speaker",
              text,
            }).catch(() => {});
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // 2. Monitor Meeting Chat for links, emails, and action requests
  const seenChatMessages = new Set();
  function initChatObserver() {
    const chatObserver = new MutationObserver(() => {
      // Look for chat message bubbles across Meet, Zoom, Teams
      const messageElements = document.querySelectorAll(
        '[data-message-text], [jsname="xySENc"], div[class*="GDhqjd"], .chat-item__chat-info-msg, [data-tid="chat-pane-item"]'
      );

      messageElements.forEach((el) => {
        const text = el.innerText || el.textContent || "";
        if (!text || text.length < 3 || seenChatMessages.has(text)) return;
        seenChatMessages.add(text);

        // Find speaker/author if present
        const authorEl = el.closest('[class*="message-wrapper"], [class*="chat-item"]')?.querySelector('[class*="name"], [class*="sender"], [class*="author"]');
        const from = authorEl ? authorEl.innerText.trim() : "Participant";

        const emails = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
        const links = text.match(/https?:\/\/[^\s"'<>]+/g) || [];

        if (emails.length > 0 || links.length > 0 || /\b(please|rsvp|submit|send|deadline|due)\b/i.test(text)) {
          chrome.runtime.sendMessage({
            type: "NEW_CHAT_MESSAGE",
            from,
            text,
            emails,
            links,
          }).catch(() => {});
        }
      });
    });

    chatObserver.observe(document.body, { childList: true, subtree: true });
  }

  // 3. Screen Share Video Canvas Grabber (Periodic slide check)
  function initSlideWatcher() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    setInterval(() => {
      const videos = Array.from(document.querySelectorAll("video"));
      // The screen share video is usually the largest video element on the screen
      let largestVideo = null;
      let maxArea = 0;
      videos.forEach((v) => {
        const rect = v.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area > maxArea && rect.width > 300) {
          maxArea = area;
          largestVideo = v;
        }
      });

      if (!largestVideo || largestVideo.paused || largestVideo.ended) return;

      try {
        canvas.width = 320;
        canvas.height = 180;
        ctx.drawImage(largestVideo, 0, 0, canvas.width, canvas.height);
        // Note: Full QR decoding can be performed here or in the background worker
      } catch (err) {
        // Cross-origin video element protection if any
      }
    }, 4000);
  }

  // Start observers after initial load
  window.addEventListener("load", () => {
    initCaptionObserver();
    initChatObserver();
    initSlideWatcher();
  });

  // Also run immediately if page is already loaded
  if (document.readyState === "complete" || document.readyState === "interactive") {
    initCaptionObserver();
    initChatObserver();
    initSlideWatcher();
  }
})();
