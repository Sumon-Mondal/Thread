# Past meetings, an AI agent you can type to, and a guided demo for the judges

## Goal
Make Thread demo-ready for the judges. It should open with a history of past meetings, show a live meeting where Thread reads links and QR codes from the chat, and include an AI agent. You type a request to the agent in a text box. It then fills forms and job applications, drafts emails and works with documents you upload.

## 1. Past meetings library (already filled in)
A new **Meetings** page lists three finished meetings. Each has a date, platform, length, attendees and a status of "Attended":
- **Internship Discovery Day** (Google Meet). Recruiter session, a shared application link, a QR code for the careers portal and a deadline.
- **Class: BIO 204 Cell Imaging lecture** (Zoom). Professor assigns a lab report and shares a syllabus PDF link and a QR code for the lab signup sheet. Uses the real diatom microscope image.
- **Work: Q4 Vendor Onboarding sync** (Microsoft Teams). Manager asks you to finish an NDA, a W-9 and a vendor intake form by Friday.

Opening a meeting shows its summary, decisions, action items with owners, detected links and QR codes, and the forms waiting to be done. A button sends that meeting to the agent.

## 2. Agent workspace (type a request, not buttons)
A new **Agent** page with a chat-style box. You type what you want and press Enter, for example:
- "Fill out the Nova Dynamics internship application using my resume"
- "Complete the vendor intake form from the work meeting"
- "Email Professor Osei that I'll submit the lab report Friday"

What the agent can do:
- Read the meeting context: transcript, links, QR contents and forms.
- Read documents you upload: PDF, DOCX and TXT resumes or files. The text is pulled out and given to the agent.
- **Fill forms**: it finds the right form and fills each field live on screen, with a label showing where each value came from. You can edit fields, then click Submit.
- **Draft and send emails**: it writes the email and shows a preview with Send and Edit. Sending is real if email is set up (see Questions). Otherwise the email is marked "sent" inside the demo.
- Show each step as it works ("Reading resume…", "Filling 9 fields…").
- The agent never submits or sends anything without your OK.

Built-in forms: internship job application, vendor intake form, W-9 details and a lab signup sheet.

## 3. Live meeting improvements
- The meeting chat gets a pinned message with a link and an image of a real QR code.
- Thread **actually decodes the QR code** in the browser. You see the decoded link appear as a "Resource" moment.
- Links in the chat are picked up automatically too.
- The live page gets an "Ask Thread…" box that uses the same agent, so you can say "fill the application from that QR link" during the meeting.

## 4. Guided judge demo
- A **Demo Tour** button with a step-by-step overlay: past meetings, then the live meeting (QR decoded), then typing to the agent (form filled), then the email, then AI Insights, then Integrations.
- Each step has a short caption explaining which technology does what.
- Everything works offline from the demo data, except the AI calls, so the demo can't break.

## 5. Polish and checks
- Same dark glass look across all pages. Add Meetings and Agent to the top menu.
- Automated browser run through each flow with screenshots. Must show zero errors.
- The judges' PowerPoint stays the last step, as agreed.

## Technical details
- New routes: `/meetings`, `/meetings/$id`, `/agent`. Seed data goes in `src/lib/past-meetings.ts`.
- Agent: a server function using the Lovable AI Gateway (`openai/gpt-6-astra`, Responses API, raw streaming fetch helper already in the project). It returns structured JSON steps: `{ intent, formId?, fields{}, email?{to,subject,body}, reply }`. The screen then animates these steps.
- QR decoding: `jsqr` on a canvas in the browser. The QR image is generated with the `qrcode` package so it is real and scannable.
- Uploads: PDF text with `pdfjs-dist` in the browser, DOCX with `mammoth`, then passed to the agent (size capped).
- Email: real sending needs Lovable Cloud plus an email domain. Without that, sending is simulated with a clear "Demo send" label.
- Forms and uploads are stored in the browser for now. Saving to the cloud stays on the roadmap.

## Questions (defaults used if no answer)
- Real emails: set up Lovable Cloud email (needs a domain you own) or keep simulated sending for the demo? Default: simulated, with a real send path ready.
- No extra API keys are needed. AI uses Lovable's built-in AI.
