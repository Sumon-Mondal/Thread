# Real call video, agent-to-Calendar, and hidden watch/iPhone widgets

## 1. Real Zoom call video with sound
- The current clip is AI-made and silent. I can't record a real person, so **you'll upload a video file** (MP4 or MOV, ideally 30–90 seconds, with sound: someone talking on a call). A screen recording of a real Zoom call works well.
- When you send it, I'll host it properly and swap it into the call window.
- Playback changes: starts a few seconds in (no "hi" at the start), plays once without looping, sound on after you click Accept (browsers block sound until you click). A "tap for sound" button shows if the browser still blocks it.
- If the video can't load, the window shows her name and captions instead of a black box.
- Note: the black screen you saw in my screenshots came from my test browser, which can't play video. In a normal browser the video plays.

## 2. Agent action items really land on Google Calendar
- When you tell the agent things like "put these on my calendar" or "remind me Friday at 3", it prepares calendar events (title, date/time, length, notes) instead of just suggesting it.
- Each event shows as a card with **Approve & Add to Calendar**. After you click it, a real event is created in your connected Google Calendar and the card shows an "Open in Google Calendar" link.
- If the agent can't tell the time, it uses 9:00 AM the next day and says so on the card.
- The same button works for action items in AI Insights results, so extracted tasks can go straight to your calendar.
- Tested by creating one event, checking it's on your calendar, then deleting it.

## 3. Apple Watch and iPhone widget screens (kept hidden)
- Finish the native watch app, watch-face widget, iPhone home-screen widget and Dynamic Island code already started, so they match the hidden web Watch preview: meeting glance, moment alert with Approve/Later, upcoming meetings, action list.
- Approve/Later on the watch sends the choice back to the web app, so both stay in sync.
- The live feed address points to your app's stable address, and the screens refresh every few seconds while the demo plays.
- Nothing new appears in the web menu. The /watch preview stays hidden.
- Limit: running it on your real iPhone and Watch needs Xcode on a Mac and an Apple developer account. I can't build or install it here. The setup guide will list the steps.

## Technical details
- Video: `lovable-assets` upload of the user file → `.asset.json`; `ZoomCallIntro` uses `currentTime` offset, `loop={false}`, `muted` false after the Accept click, `onError` fallback.
- Agent: extend the `/api/agent` schema with `events[] {title, start ISO, durationMin, notes}`; AgentConsole renders event cards → POST `/api/calendar` (existing, connector gateway); reuse `SendToCalendar` in InsightsEditor action items.
- Native: `live-state` POST accepts `{action:"approve"|"later", momentId}`; the web store polls and applies it; Swift `LiveFeed` uses `project--51f06c23-f68d-49c7-8a46-ff0969ec8881-dev.lovable.app`; README updated.
- Needed from you: the video file.
