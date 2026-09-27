# Alerts upgrade, AI Insights check, form-filling agent, "Add to Calendar"

## 1. Notifications & Preferences (upgrade the existing Alerts page)
The Alerts page already has on/off toggles and an inbox. Add:
- **Meeting reminders**: several reminders per meeting (e.g. 1 day, 1 hour, 10 min), a "quiet hours" window, and per-platform choice (Zoom / Meet / Teams).
- **Choose what notifies you**: a list of the saved meetings (Internship Discovery Day, BIO 204, Vendor Onboarding) plus "Live meetings", each with its own "Recording ready" and "Transcript ready" switches.
- "Send test notification" button, and "Mark all read" / "Clear" on the inbox.
- The background watcher respects these per-meeting choices.

## 2. AI Insights walkthrough and fixes
- Play the demo (both scenarios), extract insights, and screenshot the results.
- Check that the summary matches what was said, decisions are real decisions, and every action item has the right owner and due date from the transcript.
- Tighten the AI instructions (owners must be people named in the transcript, dates copied exactly, no duplicates) and pass speaker names + timestamps so owners come out right.
- Fix any display issues found (empty cards, "Unassigned" where an owner was said, long text overflow).

## 3. Agent fills forms from the meeting transcript
- Add a **Job Application** form and a **Class Assignment/Enrollment** form next to the existing internship, lab signup, vendor and W-9 forms.
- The agent uses the live transcript or a saved meeting's transcript (plus any uploaded resume) as its source — you just type, e.g. "fill the internship application from this meeting".
- **Visible confirmation card** after filling: "Filled 9 of 11 fields", each field listed with its value and a source tag (Transcript 00:42, Resume, QR link), missing fields highlighted "Needs your input" and editable, then Approve & Submit. Submitted forms show a green "Submitted" receipt.

## 4. "Add to Google Calendar with Zoom link" button on Live Meeting
- Button in the Live Meeting header opens a small panel: title (prefilled from the meeting), date/time, duration, attendees, and a Zoom link (prefilled/editable).
- Creates the event in your connected Google Calendar with the Zoom link in location and description, then shows "Added to Calendar" with an "Open in Calendar" link. The event then appears in the Integrations calendar list.
- Note: a real Zoom meeting can't be generated without a Zoom connection, so the link is either one you paste or a demo link, clearly marked.

## Technical details
- Prefs stay in localStorage (`thread-notif-prefs`), extended with `reminderOffsets[]`, `quietHours`, `perMeeting: Record<id, {recording, transcript}>`; `Notifier.tsx` checks them.
- New `POST` handler in `src/routes/api/calendar.ts` → gateway `calendars/primary/events` insert. If the current Google Calendar connection is read-only, I'll ask you to reconnect with the calendar-events permission.
- `src/routes/api/agent.ts` prompt gets transcript lines with timestamps; `FORMS` in `past-meetings.ts` gains `job-app` and `class-form`; `AgentConsole.tsx` gets the confirmation card.
- `src/routes/api/extract.ts` prompt tightened; `insights.tsx` display fixes. Verified with browser runs on each page.
