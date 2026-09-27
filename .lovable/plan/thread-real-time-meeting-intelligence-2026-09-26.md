# Thread — Real-Time Meeting Intelligence

A dark, glass-style web app (inspired by Cluely / Linear / Apple Liquid Glass) that listens to a live "Discovery Day" meeting (Zoom/Google Meet style), transcribes it in real time, detects important Moments (opportunities, deadlines, links, QR codes, action items), and stages agent actions — including capturing links from chat and drafting chat replies with emoji reactions. Built for the "I'm driving and have to jump on this meeting" use case: the phone lock screen view keeps you in the loop hands-free.

## Pages

1. **Live Meeting (`/`)** — the 3-column cockpit:
   - Left: Semantic Moments timeline with filter pills (Opportunities, Deadlines, Resources, Actions) and expandable moment cards
   - Center: active speaker stage with animated equalizer, live transcript feed, "why this matters" AI callout, and a shared-screen viewer with QR/link detection overlay
   - Right: Thread Copilot — autonomous action queue with one-click approve (apply to link, stage reminder, draft chat reply), plus an embedded phone lock-screen widget mirror
2. **iOS Companion (`/ios-preview`)** — interactive iPhone simulator showing the Lock Screen Live Activity and Dynamic Island (minimal/compact/expanded modes)
3. **Lock Screen (`/lockscreen`)** — full-screen phone view to open on a real phone: live meeting title, timer, current speaker, moment badge, quick actions
4. **Post-Meeting (`/post-meeting`)** — executive debrief: summary, all captured links/resources, staged actions, and a "Talk to this meeting" voice/chat companion
5. **Transcript (`/transcript`)** — searchable, speaker-labeled transcript with word-level timestamps
6. **Analytics (`/analytics`)** — meeting stats dashboard: moments over time, speaker talk time, action completion

## Meeting scenario (scripted demo + real mic mode)

- A **Discovery Day info session** (company presenting internship/grad opportunities) over a Zoom/Meet-style call
- Scripted sequence: welcome → internship announced (OPPORTUNITY) → slide with QR/link appears (RESOURCE captured) → deadline announced (DEADLINE, reminder staged) → requirements listed (matched against user profile) → Q&A event announced (EVENT) → agent drafts application + chat reply with emoji reaction 👍
- **Two modes**: "Play Demo" (scripted, for showcasing) and "Live Mic" (real transcription of your actual meeting)

## Real integrations

- **Live transcription**: ElevenLabs Scribe Realtime from the microphone (needs your ElevenLabs API key — I'll set up the secure connection; falls back to demo mode without it)
- **AI moment detection**: each transcript line is classified by Lovable's built-in AI into the 7 Moment types with a one-line takeaway — no key needed
- **Chat agent**: the copilot can draft chat replies and emoji reactions to the meeting chat
- **Database + history** (Lovable Cloud): meetings, moments, transcripts, and actions saved so Post-Meeting, Transcript, and Analytics pages show real persisted data; login to keep your meetings private

## Design

- Deep obsidian canvas (#07080c) with subtle sapphire/indigo ambient gradients
- Translucent glass panels (blur + hairline borders), SF Pro/Inter typography, monospace metadata chips
- Pulsing red LIVE indicator, VU audio meter, glowing timeline nodes
- Every page gets its own title/description metadata

## Technical notes

- Stack: React 19 + TanStack Start + Tailwind v4 (this project's stack; not Next.js — same result)
- ElevenLabs via the standard connector (`ELEVENLABS_API_KEY` server-side only); realtime via `@elevenlabs/react` `useScribe` with server-minted single-use tokens
- AI via Lovable AI Gateway (default model), called from server functions; streaming where relevant
- Lovable Cloud (Supabase) for auth + tables: `meetings`, `moments`, `transcript_lines`, `actions` — with row-level security per user
- Native iOS Swift app and FastAPI backend from the manifest are out of scope for Lovable; the lock screen and Dynamic Island are built as pixel-accurate web views (which is what gets demoed)

## Build order

1. Design system + app shell (top nav with REC timer, VU meter, page dock)
2. Demo engine (scripted meeting state store driving all pages)
3. Live Meeting cockpit (all 3 columns)
4. Lock screen + iOS companion views
5. Post-Meeting, Transcript, Analytics pages
6. Lovable Cloud: auth + persistence
7. ElevenLabs live transcription + AI moment detection
8. End-to-end verification of demo mode and live mode
