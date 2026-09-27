# Link the QR code to the agent queue, and tidy the Meeting Chat

## What you'll see
1. **A QR code creates a task for the agent.** When Thread reads a QR code, either the one Sarah holds up in the call or the one posted in chat, a task appears in the Agent Action Queue: "Open & fill the internship application (from QR)". You can approve it there, from the Dynamic Island, or from the watch. On approval it opens the full application form filled in by the agent. The moment card, the queue and the chat all show the same link, so every panel matches.
2. **The same QR is never counted twice.** If both the video and the chat show the same link, you get one moment and one task.
3. **A cleaner Meeting Chat:**
   - Messages from the same person are grouped under one round avatar with their initials, the time and their name. Soft bubbles line up neatly instead of floating around.
   - The QR message becomes a proper pinned card at the top of the chat, with a small QR image, the link, a "Decoded by Thread" status and an "Open" button.
   - A small "Chat · N messages" header, clear spacing, and it scrolls to the newest message automatically.
   - The "Ask Thread" box sits as a slim bar at the bottom.

## Technical details
- In `demo-store`, add `addAction(a)` to the API. It is a no-op if the id exists, and `visibleActions` includes added actions regardless of `timeSec`.
- A shared helper `registerQr(url, source)` in demo-store keeps a Set of decoded URLs. On the first sighting it calls `addMoment` plus `addAction({kind:"apply", status:"staged", label, detail})`. Both `ZoomCallIntro` and `QrChatCard` call it instead of `addMoment` directly.
- Executing an "apply" action opens `/apply/internship-app` with agent autofill. The existing exec path keeps working for the watch and the Dynamic Island.
- Rewrite `ChatPanel` and `QrChatCard` styling with existing tokens only, grouping by consecutive `from`.
- Verify with a typecheck, plus Playwright: play the demo past the screen share and confirm the queue gains the QR task and the chat renders cleanly.
