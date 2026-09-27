# Right-click / long-press agent menu on all text

Right now the "See exactly what was said / Ask the AI agent" menu only works on the AI Insights timeline. Make it work on every meaningful piece of text in the app.

## What I'll build

**1. One reusable menu component** — `src/components/AgentContextMenu.tsx`
- Wraps any text block. Right-click (mouse) or long-press ~500ms (touchscreen) opens a small glass menu at the pointer:
  - **Ask the AI agent** — opens the inline agent card with that text as context (explain it, draft an email, add to a form, anything typed + Enter)
  - **See details** — where it applies (transcript lines), shows who said it and when
  - **Copy text**
- Menu closes on click-away, Escape, or scroll. Refactored from the existing MeetingTimeline menu so behavior stays identical there.

**2. Apply it everywhere text appears**
- **Live Meeting page** — every live transcript line (works in demo mode and live mic mode), and every moment card in the moments feed
- **Transcript page** — every transcript line
- **Post-Meeting page** — summary paragraphs, decisions, action items
- **Meetings detail pages** — summary, decisions, action items, detected links
- **AI Insights timeline** — keep existing behavior, switched to the shared component

**3. Agent context**
- The agent receives the clicked text plus where it came from (meeting title, speaker, timestamp) so answers stay relevant, same as the timeline agent does now.

## Technical details
- New: `src/components/AgentContextMenu.tsx` (pointer-positioned fixed menu, long-press timer with move/end cancel, focus-trap light, Escape/click-away close)
- Edit: MeetingTimeline.tsx (use shared component), index.tsx (Live Meeting transcript + moments), transcript.tsx, post-meeting.tsx, meetings.$id.tsx
- No new packages, no backend changes — reuses the existing `/api/agent` route
- Verify with Playwright: right-click a live transcript line, a moment card, and a post-meeting decision; confirm menu opens, agent replies, zero page errors
