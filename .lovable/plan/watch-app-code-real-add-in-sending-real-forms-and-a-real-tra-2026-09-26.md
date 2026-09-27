# Watch app code, real add-in sending, real forms and a real transcript

## 1. Apple Watch + iPhone widget (hidden)
- A real watchOS/iPhone widget can't be built or installed from here, because that needs Apple's Xcode. I'll write the real Swift source files anyway (a watch app, a watch complication, an iPhone Home Screen / Live Activity widget) in a separate `native/` folder. You can open that folder in Xcode later. It won't appear in the web app.
- To make live updates work, add a small live feed from the web app (current meeting, timer, speaker, latest moment, action items). Both the Swift code and the hidden /watch preview read from it.
- Nothing new appears in the menu. The /watch preview stays hidden.

## 2. Add-ins that really send
- **Google Calendar (already connected):** an "Send to Google Calendar" button on each action item creates a real event on its due date.
- **Asana (new connection):** you click "Connect Asana" once in a card and sign in. Then "Send to Asana" creates a real task with the owner, due date and meeting link. You choose the project once.
- The agent can do both when you tell it to ("send the action items to Asana"). It shows a preview first and sends only after you approve.
- On the Integrations page, Asana shows as "Live" once connected. The other add-ins stay marked "Demo".

## 3. Full internship and job application forms
- New pages at /apply/internship and /apply/job with complete, real fields: contact info, education (school, degree, GPA, graduation date), work experience entries, skills, links (LinkedIn, GitHub, portfolio), work authorization, availability/start date, a cover letter, a resume attachment and a consent checkbox.
- The agent fills these same fields from your resume and the meeting transcript. Each field shows where its answer came from, and you can edit anything before you submit.

## 4. Real submission, confirmed in your Gmail inbox
- Submit sends a formatted application email from your Gmail to the address you pick (your own, for the demo).
- After sending, Thread checks your Gmail inbox for that message and shows "Delivered to inbox" with the time, or a clear warning if it can't find it.
- I'll test this end to end by submitting one internship application to sumonmondal0701@gmail.com and confirming it arrived.
- This needs one extra Gmail permission (reading messages). You'll approve it in a reconnect card.

## 5. Real meeting transcript
- Replace the made-up Discovery Day script with a real transcript. AI Insights, the agent and form filling then all use its actual words.
- **What I need from you:** a real transcript. Pick one of these:
  - Upload a transcript file (Zoom, Meet or Teams export, TXT or DOCX).
  - Or record one live with the mic button. Thread already transcribes speech, so I'll add "Save as meeting" to keep it.
- The timestamps and speaker names come from the file. The demo playback replays the real transcript.

## Technical details
- `native/ThreadWatch/` (SwiftUI watch app + WidgetKit complication) and `native/ThreadWidget/` (iOS WidgetKit + ActivityKit). These folders aren't included in the web build.
- New `src/routes/api/live-state.ts` returns a JSON snapshot. The hidden /watch page polls the same shape. It isn't persisted until Lovable Cloud is added.
- Asana goes through the standard connector gateway (`POST /tasks`, `GET /workspaces`, `GET /projects`). Calendar reuses the POST handler in `/api/calendar`.
- Delivery check: after the send, `/api/send-email` searches with Gmail `users/me/messages?q=rfc822msgid:` or `subject:` and needs the gmail.readonly scope.
- Forms are defined in `src/lib/past-meetings.ts` FORMS (expanded field schema, repeatable sections). The agent prompt is updated to use the new keys.
- The transcript parser handles VTT/SRT/"Speaker: text" formats and becomes a new scenario that is set as the default.
