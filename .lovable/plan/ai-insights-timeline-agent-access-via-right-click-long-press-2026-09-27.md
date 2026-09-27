# AI Insights timeline: agent access via right-click / long-press only

## What changes

On the AI Insights page timeline:

1. **Remove the "Ask the AI agent to act on this" button** that was just added inside the expanded line detail. Clicking a line goes back to only expanding/collapsing the quote.
2. **Keep the existing context menu as the way to reach the agent** — right-click (or long-press on touch) on any line already opens a small menu with:
   - "See exactly what was said" (expands the quote)
   - "Ask the AI agent to act on this" (opens the Thread Agent reply box under that line)
   
   This menu already works on every line of every meeting, so no new behavior is needed — just removing the button.
3. **Restore the tip text** under the meeting title to: "Tip: right-click or long-press any line for more options."

## Technical details

- File: `src/components/MeetingTimeline.tsx`
- Delete the `<button>` block added at lines ~154–158 (the one calling `setAgent({ lineId: l.id, ... })` from the expanded detail).
- Revert the tip paragraph text.
- No changes to the context menu, `askAgent`, or any other component.
- Verify with a quick browser pass on `/insights`: click expands quote only; right-click opens the menu with the agent option.
