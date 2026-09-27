# Plan: Make Thread a clean web app — hide iPhone-specific UI

## Goal
Present Thread as a pure web app. All iOS/iPhone screens and widgets stay in the codebase (commented out or just unlinked) but no longer appear in the UI.

## What gets hidden from the UI

1. **Menu bar** — remove the "iOS Companion" and "Lock Screen" tabs.
   New menu: Live Meeting · Post-Meeting · Integrations · Transcript · Analytics.
   The pages themselves are NOT deleted — `/ios-preview` and `/lockscreen` still work if visited directly, so the code is preserved for a future mobile app.

2. **Dynamic Island pill** (the black iPhone-style bubble under the menu) — hide it from the web UI by commenting out its mount in the root layout. The component file stays intact. Moment notifications still work through the toast popups, so nothing is lost.

3. **Cockpit right rail** — the "THREAD LIVE" panel currently looks like an iPhone lock-screen widget. Restyle it as a web "Live Status" panel (same content: meeting title, latest moment, agent actions, chat) so nothing iOS-flavored shows on the main page.

## What stays untouched
- All 7 routes and their code, including the two iOS pages
- Live mic transcription, demo engine, integrations page, notifications
- The LiveActivityWidget and DynamicIsland source files (kept for the future iOS app)

## Technical details
- `src/components/TopNav.tsx`: remove 2 entries from the NAV array
- `src/routes/__root.tsx`: comment out `<DynamicIsland />` mount (import kept, commented)
- `src/components/LiveActivityWidget.tsx` / `src/routes/index.tsx`: rename headings and remove iPhone framing; content unchanged
- No route files deleted; no data or backend changes

## Verification
- Typecheck + build clean
- Playwright pass over all pages: menu shows 5 tabs, no island, no console errors, demo still plays end-to-end
