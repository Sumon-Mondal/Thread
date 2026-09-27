# Opening scene: incoming Zoom call, then Thread takes over

Yes, this works well as the opening moment for the judges.

## What the judges see
1. **Incoming call** (about 2 s): a Zoom-style "Sarah Chen is calling..." card with Accept / Decline. Click Accept (or it auto-accepts in the Demo Tour).
2. **Full-screen call** (about 6 s): a realistic video of a woman (the recruiter) speaking on a video call, with a Zoom-style bottom bar (mute, video, chat, participants). Captions show her words: the internship opening and the deadline.
3. **The slide** (about 1 s): the call window shrinks and glides to the left side of the screen. At the same moment the Thread panels slide in from the right and the Dynamic Island drops down.
4. **Thread at work:** the live transcript fills in line by line, the first moment card appears ("OPPORTUNITY — internship applications open"), and the agent queue starts. From here the normal demo keeps playing, with her video still running in the left pane.

## How it's started
- A new "Start with Zoom call" button next to Play Demo on Live Meeting.
- The Demo Tour starts with this scene.
- Skip link in the corner. Plays once per click, with nothing saved.

## The video
- One short (about 6–8 s) AI-generated clip: a professional woman in a home office, speaking to the camera, lit like a webcam. It has no sound, so her words show as captions. The clip is made-up footage, so tell the judges she isn't a real person.
- If the clip looks off, the call falls back to a still photo with a "speaking" ring animation.

## Technical details
- Generate the clip with videogen (16:9, 1080p) into src/assets, then save its pointer file in the project.
- New component `ZoomCallIntro.tsx`: phases `ringing → fullscreen → docking → done`, uses CSS transforms/transitions (scale + translate to the measured rect of the left video pane via getBoundingClientRect), and the prefers-reduced-motion setting skips straight to the docked view.
- On `docking`, call the existing demo `play()` so the transcript and moments start in sync. The video element is reused in the left pane (the existing screen share still takes over at its usual time).
- Colors come from the existing theme settings, and the glass panels are reused. No server changes.
- Check it in a test browser: screenshots of each phase, zero console errors.
