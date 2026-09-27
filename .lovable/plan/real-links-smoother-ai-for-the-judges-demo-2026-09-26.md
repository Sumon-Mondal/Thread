# Real links + smoother AI for the judges' demo

## Problem
Several links in the demo point to made-up websites that don't open:
- careers.novadynamics.com / .io (internship apply + FAQ)
- bio.wm.edu/bio204 (lab signup, syllabus)
- ops.acme-corp.com (vendor intake, NDA)
- The "Add to Calendar" Zoom link is a fake example number

## Fix
1. **Links that open real pages** — each "apply" or "sign up" link goes to Thread's own working form pages, so a click opens a form the agent can fill:
   - Internship apply → /apply/internship-app
   - Job application → /apply/job-app
   - Lab signup, vendor intake → new /apply pages built from the forms we already have
   - Supporting documents go to real public files: the IRS W-9 PDF (irs.gov), the diatom images share (already real)
   - The QR code in Live Meeting encodes the same real link, so scanning it with a phone works too
   - Uses the published address once you publish; the preview address until then
2. **Real meeting links** — "Add to Calendar" asks Google Calendar to create a **real Google Meet link** with the event, so the join button works. You can still paste your own Zoom link if you prefer.
3. **Clickable everywhere** — every detected link (moment cards, meeting pages, the chat) opens in a new tab.
4. **Smoother AI**
   - Show a "Thinking…" state right away, and text as it arrives, in the agent, AI Insights and the right-click menu
   - If the AI is busy (rate limit or brief outage), retry once after a short wait, then show a clear, friendly message instead of spinning forever
   - Stop button in the agent box
   - 45-second safety limit, then a clear "try again" message
5. **Check everything** — a test browser clicks every link and runs each AI feature (Agent fill, AI Insights extract, right-click agent, application submit) and reports any failures before I finish.

## Technical details
- Update URLs in src/lib/demo-data.ts, src/lib/past-meetings.ts, src/routes/index.tsx (QR) to a base built from window.location.origin at runtime.
- apply.$formId.tsx already handles any form id; add lab-signup / vendor-intake fields if missing.
- /api/calendar: add `conferenceData.createRequest` (hangoutsMeet) with `conferenceDataVersion=1`; return hangoutLink; AddToCalendar makes Zoom field optional.
- ai-gateway.server.ts: one bounded retry on 429/5xx honoring Retry-After; no retry on 4xx; AbortController wired to Stop and a 45s timeout; surface safe error messages.
- Playwright link checker: HEAD/GET every external URL, click-through every internal one.
