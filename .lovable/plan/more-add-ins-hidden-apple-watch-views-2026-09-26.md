# More add-ins + hidden Apple Watch views

## Answer: can Thread run on Apple Watch?
A real watchOS app can't be built here (needs Xcode/Swift). What we can do, like the iPhone views: build web mockups of the Watch experience (watch face complication, live meeting glance, moment alerts, approve/snooze actions) kept in code but hidden from the menu, ready for a future native app.

## 1. More add-ins (Integrations page)
Add new cards grouped by category, each with connect toggle, short "what Thread does with it", and use-case chips:
- Meetings: Microsoft Teams, Webex, Slack Huddles, Discord
- Calendar: Outlook Calendar, Apple Calendar (iCal link)
- Notes/Docs: Notion, Google Docs, OneNote, Obsidian
- Tasks: Asana, Trello, Jira, Linear, Todoist
- Messaging: Slack, Microsoft Teams chat, Gmail, Outlook Mail
- Storage: Google Drive, Dropbox, OneDrive
- CRM/Careers: HubSpot, Salesforce, LinkedIn, Handshake
- Learning: Canvas, Blackboard, Google Classroom
Plus a search box and category filter. Real-connected ones (Google Calendar) keep a "Live" badge; others are marked "Demo" so judges see the difference honestly.
- Agent: when an add-in is connected, the agent can mention it ("Send action items to Asana", "Save notes to Notion") as demo actions.

## 2. Hidden Apple Watch views
New route `/watch` (not in menu, like /ios-preview):
- Watch frame (45mm) with pages: Complication/face, Live meeting glance (title, timer, speaker), Moment alert with Approve / Later, Upcoming meetings list, Action items checklist.
- Driven by the same demo store so it updates live during Play Demo.
- Components in `src/components/watch/`, commented as future watchOS.

## Technical details
- Integrations data moved to `src/lib/integrations-catalog.ts` (id, name, category, useCases, status live|demo); localStorage key `thread-integrations` kept.
- Agent route prompt receives connected add-in names.
- TopNav untouched (watch stays hidden).
