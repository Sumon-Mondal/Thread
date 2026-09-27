// Thread Headless Meeting Bot Worker (Containerized Virtual Machine Process)
const puppeteer = require("puppeteer");
require("dotenv").config();

const MEETING_URL = process.env.MEETING_URL || process.argv[2] || "https://meet.google.com/new";
const BOT_NAME = process.env.BOT_NAME || "Thread Assistant (for Sumon)";
const THREAD_SERVER_URL = process.env.THREAD_SERVER_URL || "http://localhost:3000/api/live-state";

console.log("==========================================");
console.log("  THREAD CLOUD VIRTUAL MACHINE BOT");
console.log(`  Target Meeting: ${MEETING_URL}`);
console.log(`  Bot Name:       ${BOT_NAME}`);
console.log(`  Sync Server:    ${THREAD_SERVER_URL}`);
console.log("==========================================");

async function syncToThread(payload) {
  try {
    const res = await fetch(THREAD_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[Thread Sync] Server returned status ${res.status}`);
    }
  } catch (err) {
    console.error("[Thread Sync] Failed to send state to Thread server:", err.message);
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,720",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Grant browser camera & microphone permissions automatically
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(new URL(MEETING_URL).origin, ["camera", "microphone"]);

  console.log(`[Bot] Navigating to ${MEETING_URL}…`);
  await page.goto(MEETING_URL, { waitUntil: "networkidle2", timeout: 60000 });

  // Handle Google Meet Join Sequence
  if (MEETING_URL.includes("meet.google.com")) {
    console.log("[Bot] Identified Google Meet. Preparing entry…");
    try {
      // 1. Enter Bot Name if prompt exists
      const nameInput = await page.$('input[type="text"][placeholder*="name" i], input[aria-label*="name" i]');
      if (nameInput) {
        await nameInput.click({ clickCount: 3 });
        await nameInput.type(BOT_NAME, { delay: 50 });
      }

      // 2. Turn off microphone & camera
      const micButton = await page.$('div[role="button"][aria-label*="microphone" i][data-is-muted="false"]');
      if (micButton) await micButton.click();

      const camButton = await page.$('div[role="button"][aria-label*="camera" i][data-is-muted="false"]');
      if (camButton) await camButton.click();

      // 3. Click Ask to join / Join now
      await page.waitForTimeout(1000);
      const joinBtn = await page.$x("//span[contains(text(), 'Ask to join') or contains(text(), 'Join now')]");
      if (joinBtn.length > 0) {
        await joinBtn[0].click();
        console.log("[Bot] Clicked Join Meeting.");
      }

      // 4. Wait for call to load and turn on captions
      await page.waitForTimeout(4000);
      const ccBtn = await page.$('button[aria-label*="captions" i]');
      if (ccBtn) {
        await ccBtn.click();
        console.log("[Bot] Enabled live Closed Captions.");
      }
    } catch (e) {
      console.warn("[Bot] Join step notice:", e.message);
    }
  }

  console.log("[Bot] Actively monitoring live captions, chat, and slides…");

  let transcriptLines = [];
  let detectedMoments = [];
  let stagedActions = [];
  let lastSpeaker = "Speaker";
  let elapsed = 0;

  setInterval(async () => {
    elapsed += 2;
    try {
      // Extract latest captions from DOM
      const captions = await page.evaluate(() => {
        const nodes = document.querySelectorAll('[jsname="YSvySm"], div[class*="iTTPOb"], div[class*="caption"]');
        if (!nodes || nodes.length === 0) return null;
        const last = nodes[nodes.length - 1];
        const parent = last.closest('[jsname="tgaKEf"]') || last.parentElement;
        const speakerEl = parent?.querySelector('[class*="zsT0Vo"], [class*="speaker"]');
        return {
          text: last.innerText || "",
          speaker: speakerEl ? speakerEl.innerText.trim() : "Speaker",
        };
      });

      if (captions && captions.text && captions.text.trim().length > 3) {
        if (!transcriptLines.some((l) => l.text === captions.text)) {
          console.log(`[Transcript] ${captions.speaker}: "${captions.text}"`);
          lastSpeaker = captions.speaker;
          transcriptLines.push(captions);

          // Heuristic detection
          const lower = captions.text.toLowerCase();
          if (lower.includes("internship") || lower.includes("deadline") || lower.includes("link") || lower.includes("approved")) {
            const momentType = lower.includes("deadline") ? "DEADLINE" : lower.includes("internship") ? "OPPORTUNITY" : "RESOURCE";
            const moment = {
              type: momentType,
              takeaway: captions.text.slice(0, 140),
            };
            detectedMoments.push(moment);
            stagedActions.push({
              id: `act-${Date.now()}`,
              label: `${momentType}: Follow up on ${captions.speaker}'s announcement`,
              status: "staged",
            });
          }
        }
      }

      // Sync state back to Thread Server
      const lastLineText = transcriptLines.length > 0 ? transcriptLines[transcriptLines.length - 1].text : "Listening to call…";
      const headline = detectedMoments.length > 0 ? detectedMoments[detectedMoments.length - 1].takeaway : `${lastSpeaker} speaking`;
      const shortHeadline = headline.length > 35 ? `${headline.slice(0, 32)}…` : headline;

      await syncToThread({
        meetingTitle: `Live Meeting (${BOT_NAME})`,
        playing: true,
        elapsed,
        speaker: lastSpeaker,
        lastLine: lastLineText,
        shortHeadline,
        source: "vm-bot",
        momentCount: detectedMoments.length,
        latestMoment: detectedMoments.length > 0 ? detectedMoments[detectedMoments.length - 1] : null,
        actions: stagedActions.slice(-10),
      });
    } catch (err) {
      // Loop error ignore
    }
  }, 2500);

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("[Bot] Disconnecting from call…");
    await browser.close();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error("[Bot Fatal]", err);
  process.exit(1);
});
