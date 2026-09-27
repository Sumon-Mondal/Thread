# Full app check + Thread side panel for Zoom/Meet

## 1. Full walkthrough check (every page)
Go through every visible page in a test browser and fix anything broken or ugly:
- Live Meeting: play demo, pause, reset, scenario switch, Zoom intro call, minimize/expand, moments, transcript, agent queue approve/dismiss, chat, QR card.
- Meetings list + each past meeting page, AI Insights (right-click / long-press menu), Agent (forms, resume, email sending), Apply form pages, Post-Meeting, Integrations, Alerts, Analytics.
- Check for errors in the console and server, dead links, clipped text, empty states, and mobile width.
- Confirm real connections still answer: Gmail send, Google Calendar add-event, live mic transcription, AI agent.
- Make sure what the demo shows (e.g. "email sent", "added to calendar") matches what really happens.

## 2. Thread side panel ("plugin" mode)
A new narrow page, `/panel`, built to sit beside a Zoom or Google Meet call (about 320–400px wide):
- Tabs: Moments, Transcript, Agent queue, Ask agent.
- Uses the same live demo and live mic as the main app, so starting the demo or mic works right inside the panel.
- Approve actions (send email, add to calendar, open link) straight from the panel.
- Compact header with Live timer and Play/Pause/Mic controls.
- Integrations page gets a "Zoom / Meet side panel" card with "Open side panel" (pops a narrow window) and short setup notes explaining how it would be registered as a Zoom App / Meet add-on (that registration requires your Zoom/Google developer accounts, so it's shown as setup steps, not faked).

## 3. Verify
Screenshot the panel at 360px width and the main pages, run the full flow once end to end, and report anything that still needs you (e.g. playing the call video in a real browser).

## Technical details
- New route `src/routes/panel.tsx` with its own head(); hides TopNav when on `/panel` (check in `__root.tsx`).
- Reuses `useDemo()`, MomentsPanel/TranscriptPanel/AgentQueuePanel pieces (extracted from `index.tsx` into shared components if needed), and AgentConsole compact mode.
- "Open side panel" uses `window.open('/panel', 'thread-panel', 'width=380,height=820')`.
- Playwright checks under /tmp/browser/fullcheck/.
