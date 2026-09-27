# Zoom call video: seamless loop, keeps playing, she presents a QR code

## What you'll see
1. **Longer, seamless video.** Generate 3 new clips of the same recruiter (same look, room, lighting), each starting mid-sentence. They play back to back with a soft cross-fade, then repeat. About 30 seconds before anything repeats, and the joins are hidden, so it doesn't feel like a loop.
2. **She presents a QR code.** In one clip she holds up a card to the camera. Over that card, the app shows a real, scannable QR code that opens the internship application. Her caption says: "Scan this to apply." Thread then reads that QR code from her video and adds the link as a moment. This replaces the dashed box you selected on the screen share. That box was only the "image detected" outline around the diatom photo.
3. **Minimize and expand never pause or restart.** The same video keeps playing through fullscreen, corner and expand, picking up exactly where it was. Sound stays as you set it.
4. **The dashed outline gets cleaned up.** The dashed box on the screen share becomes a subtle solid outline with a clear label, so it no longer looks like a broken element.

## Technical details
- Generate 3 clips (about 10s each, 1080p). Frame 1 of each clip is the same still image, so the look stays consistent. Clip 2 prompt: she raises a plain white card toward the camera. Upload all 3 as assets.
- ZoomCallIntro: use two stacked `<video>` elements that swap on `ended`, with a 400ms opacity cross-fade across the playlist. Remove the loop attribute.
- Render a single persistent video layer for all phases, so a phase change is a CSS resize, not a remount. Remove `currentTime = START_AT` from `expand()`.
- QR overlay: during clip 2, a `qrcode`-generated SVG is placed over the card area, with a slight tilt and shadow. When it appears, fire the existing QR-to-moment flow, which uses jsQR on that canvas.
- Captions follow the playlist time.
- Verify: typecheck, plus a Playwright check of the phases. Headless Chromium can't decode the video, so you'll need to watch it in your browser.
