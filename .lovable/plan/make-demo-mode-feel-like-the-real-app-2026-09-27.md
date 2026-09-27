# Make Demo Mode Feel Like the Real App

## Goal
The app should never feel like a "demo you have to press play on." Demo mode is the app running a realistic meeting by itself — it starts on its own and shows everything Thread can do. The tour stays as-is.

## Changes

### 1. Meeting starts automatically
- When the Live Meeting page loads in demo mode, the meeting begins playing on its own (no button press). Moments, transcript, chat, and agent actions unfold live.
- Changing the scenario also restarts playback automatically.
- After a reset, playback restarts automatically after a brief beat.

### 2. Top-right controls reframed as real meeting controls
- "Play Demo" / "Resume" button becomes **"Start Meeting"** / **"Join Meeting"** wording — same controls, but framed as meeting controls, not demo playback.
- The status pill already reads "Live · 00:00" when running; when idle it will read **"Ready"** instead of "Idle".
- Keep the scenario picker, Zoom intro, pause, reset, and Live Mic toggle — they demonstrate real capabilities (switching meetings, joining a call, using your real mic).

### 3. Empty-state text updated everywhere
- Transcript panel: "Press Play Demo to begin the meeting" → "Connecting to the meeting…" (auto-start makes this brief) and a graceful fallback if paused.
- Live Activity widget and any other "Press Play Demo" strings get the same treatment.
- Hidden watch/lockscreen views updated too (code kept, text aligned).

### 4. Real Thread logo
- Design two distinct logo concepts for "Thread" (meeting-intelligence brand, dark obsidian UI) as transparent PNGs and show them for you to pick.
- Refine the one you choose, then replace the placeholder dot + text in the top bar (and anywhere else the brand mark appears) with the real logo.

### 5. Verification
- Load `/` in a test browser: meeting starts by itself, timer runs, moments and chat appear, agent queue fills — all without clicking anything.
- Confirm pause/resume/reset/scenario-switch still work and auto-resume behaves.
- Typecheck (`bunx tsgo --noEmit`) and build log clean.

## Technical notes
- Auto-start lives in the demo store / Live Meeting mount effect (guard so it only fires in demo mode and once per scenario/reset).
- Text edits in `src/components/TopNav.tsx`, `src/components/LivePanels.tsx`, `src/components/LiveActivityWidget.tsx`, `src/routes/watch.tsx`, `src/components/watch/WatchViews.tsx`.
