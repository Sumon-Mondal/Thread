# Declutter the Live Meeting page — "Obsidian minimalist cockpit"

Apply the selected design direction (v3) to the real app. All existing features stay; only the look and layout change.

## What changes

### Top bar (TopNav.tsx)
- One slim, rounded glass bar: Thread logo + menu links on the left.
- Right side: a small "LIVE · meeting name" pill, then one compact control cluster holding the scenario picker, Play Demo, and a reset icon — instead of today's scattered buttons.
- "Start with Zoom call" and "Use Live Mic" move into that cluster as small icon/secondary buttons so the bar stays one clean row.

### Live Meeting page (index.tsx)
- 12-column grid with calm spacing: left column = Semantic Moments (top) + Live Transcript (bottom); wide center = screen share / speaker area with a small "Meeting Health" strip; right column = Agent Action Queue (top) + Meeting Chat (bottom).
- Panels get quieter: softer dark glass, hairline borders, rounded corners, more padding — no heavy pill outlines.
- Moment cards become clean rows with a colored left edge and small uppercase type label (deadline red, decision blue, etc. — same colors as today).
- Agent queue items become simple icon rows with status text.
- Chat becomes bubble-style messages with a slim input at the bottom.

### Kept exactly as-is
- All functionality: demo playback, Zoom intro, live mic, moments, agent queue, chat, QR decoding, right-click agent menus, Dynamic Island, Demo Tour.
- Dark obsidian glass theme and existing moment-type colors.
- All other pages (Meetings, Agent, AI Insights, Integrations, Alerts) untouched in this pass.

## Technical notes
- Files touched: `src/components/TopNav.tsx`, `src/routes/index.tsx`, and small style tweaks in the panel components they render (MomentBadge colors stay).
- Use existing semantic tokens from `src/styles.css`; add a `--panel` token if needed for the quieter panel background.
- Verify with a browser pass: demo plays, moments appear, no console errors, layout holds at 1280px and 1440px widths.
