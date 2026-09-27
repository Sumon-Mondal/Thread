# Full App Verification & Judge-Readiness Pass

Everything gets checked end to end: every page, every interaction, and each connected feature (Gmail, Google Calendar, AI agent). Anything broken gets fixed in the same pass. The judges' PowerPoint happens only after this passes.

## Step 1 — Health baseline
- Fresh production-style build and typecheck (typecheck already confirmed clean this session).
- Scan logs for hidden runtime errors.

## Step 2 — Page-by-page browser walkthrough (all 20+ routes)
Drive the real app in a browser and verify on each page:
- Home / Live Meeting: meeting auto-starts, Pause/Resume/Reset, scenario switching, live mic mode, video loop ~30s with QR, minimize/expand without restarting playback.
- Meeting chat: send a message, agent reply appears as "You (Thread Agent)".
- Agent Action Queue: staged chat action approval sends the real email to shumonmondale@gmail.com.
- Agent Console: typed message sends, resume auto-attach, toasts on outcomes.
- AI Insights: right-click/long-press menu on every timeline line, "Ask the AI agent to act on this" runs end to end.
- Forms (internship-app, job-app, lab-signup, vendor-intake, w9, class-form): one-click agent fill reaches 23/23 fields, correct recipient pre-filled, submit flows.
- Post-Meeting, Analytics, Notifications/Alerts, Integrations, Meetings library, /panel side panel.
- Screenshots captured at each step; any error (console, page, network) is logged and fixed.

## Step 3 — Fix anything the walkthrough finds
- UI polish gaps, broken interactions, or error states — fixed immediately, then re-verified in the browser.

## Step 4 — Connected-service verification
- Real Gmail send (queue approval + form submit) — a real email will arrive at shumonmondale@gmail.com; confirmed in your inbox.
- Google Calendar event creation from Live Meeting and Post-Meeting.
- AI agent responses via the AI gateway (correct model, no fallbacks).

## Step 5 — Hidden mobile/watch review
- Confirm no iOS/watch UI appears anywhere in the web app.
- Review the hidden native Swift/watch sources' configuration and document remaining gaps (pairing, live feed URL).

## Step 6 — Deploy readiness
- All routes error-free on a clean build.
- Confirm the remaining roadmap items are closed or explicitly blocked (e.g. the real transcript file is still waiting on you).

## Step 7 — LAST: judges' presentation
- Only after everything above passes: build the judges' PowerPoint explaining what Thread does and how each technology is used.
