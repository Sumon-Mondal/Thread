<div align="center">

<img src="https://raw.githubusercontent.com/Sumon-Mondal/Thread/main/public/favicon.svg" width="72" alt="Thread logo" />

# Thread

**Real-time meeting intelligence — it listens, finds the moments that matter, and its AI agent fills the forms, sends the emails, and books the follow-ups — with your one-tap approval.**

*Don't take notes. Take action.*

Web app · Zoom / Google Meet side panel · Built for MLH hackathon judging

</div>

---

## The problem

Every meeting produces decisions, deadlines, and opportunities — and most of them vanish the second the call ends. Humans are bad at listening and recording at the same time, and even when the notes survive, the *actions* buried inside them don't: the application you meant to fill tonight, the follow-up email you never sent, the calendar invite that never got made.

Thread turns those 45 minutes after the meeting into minutes.

## What it does

**1. Listens** — Real-time transcription streams in as the conversation happens, powered by ElevenLabs.

**2. Understands** — Thread detects the seven kinds of moments that actually require action, live, while you talk:

| Moment | Example from a live meeting |
|---|---|
| Opportunity | A recruiter offers an interview slot |
| Deadline | "Get back to us by Friday" |
| Resource | A link, a shared doc — or a **QR code read off the screen share** |
| Requirement | "We need your portfolio and work authorization" |
| Event | A follow-up meeting to schedule |
| Action | "Send me your resume" |
| Decision | "Let's move forward with the second round" |

**3. Acts** — Every moment can be handed to the Thread Agent. It drafts the reply, fills out the form — **every single field** — writes the follow-up email, and creates the calendar event. And it never acts alone: every send and every submission waits for your one-tap approval in the action queue.

## Proven, not promised

Every claim below was verified end-to-end during the build:

- **100% form completion** — the agent filled a 23-field internship application completely, every answer traced back to the conversation or the user's own resume. Nothing invented.
- **Real email, really sent** — approved follow-ups went out through a real Gmail account and the delivery was confirmed in the inbox *before* the action was marked done.
- **Real calendar events** — a meeting detail became a live Google Calendar event.
- **Computer vision on the call** — when the recruiter shared their screen, Thread spotted the QR code in the video, surfaced the link behind it, and offered it as an action.
- **Honest connections** — every demo-only connection is clearly labeled, and nothing ever sends without approval. An AI that touches your email should have to ask first.

## Runs anywhere your meetings run

- **Full web app** — the live meeting cockpit: transcription, Moments timeline, chat, agent console, action queue.
- **Side panel** — a slim `/panel` route designed to sit next to Zoom and Google Meet, so the intelligence is always beside the conversation.

## The live demo (2 minutes)

1. **0:00** — The meeting starts on its own. Transcription streams in; the first Moments appear.
2. **0:36** — The recruiter shares their screen with a QR code on it. Thread's vision spots it, surfaces the link, and the agent responds in chat.
3. **0:45** — The agent is asked to complete the internship application — all 23 fields fill themselves, prefilled from the conversation and the resume.
4. **1:10** — The recruiter's request becomes a chat reply, drafted by the agent: *"You (Thread Agent)"*.
5. **1:30** — Open the action queue: approve the follow-up email and it sends through real Gmail.
6. **1:50** — Add the follow-up to Google Calendar — a real event, created live.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, TanStack Start, TanStack Query, Tailwind CSS v4, shadcn/ui |
| AI | OpenAI (via Lovable AI Gateway) — streaming responses for the agent |
| Speech | ElevenLabs — real-time transcription |
| Integrations | Gmail API, Google Calendar API |
| Backend | Lovable Cloud (database, auth, serverless) |
| Validation & QA | Zod, Playwright end-to-end verification |

## Getting started

```sh
git clone https://github.com/Sumon-Mondal/Thread
cd Thread
npm install
npm run dev
```

Connect a Gmail account and a Google Calendar to see the real sends and events; everything else works out of the box.

## Design

Thread's interface is a dark obsidian glass cockpit — built to sit beside a video call without stealing attention from it. Moments are color-coded by type, the transcript is a quiet feed, and the agent's work is always one approval away.

## License

MIT
