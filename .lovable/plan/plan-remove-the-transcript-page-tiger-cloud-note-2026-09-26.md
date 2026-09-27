# Plan: Remove the Transcript page + Tiger Cloud note

## What the "Transcript" tab is (answering your question)

The **Transcript** page shows the full word-for-word record of the demo meeting — every line, who said it, and when. Its role was a "source of truth" view behind the Live Meeting page. In practice it duplicates what you already have:

- **Live Meeting** shows the transcript as it happens
- **AI Insights** timeline shows every line with timestamps, and clicking a line shows exactly who said what

So it has no unique job anymore — safe to remove.

## What I'll do

1. **Remove the Transcript page entirely**
   - Delete the "Transcript" link from the top menu
   - Delete the `/transcript` route file (the right-click agent menu on its lines moves with it — that menu already lives on Live Meeting, AI Insights, Post-Meeting and meeting pages, so nothing is lost)
   - Remove any links pointing to it

2. **Keep the demo transcripts (the spoken scripts)**
   - The Discovery Day and diatom scripts are what make the demo play for the judges — removing them would leave Live Meeting empty
   - When you send a real meeting transcript file, I'll replace the demo script with it then

3. **Tiger Cloud**
   - The app does not use Tiger Cloud at all — everything runs on Lovable's built-in services, so I won't connect it
   - You pasted its password in chat twice now: change that password in your Tiger Cloud account, since anything pasted here should be treated as exposed

## Verification

- Click through every page in a test browser after the removal: no broken links, no errors
- Confirm the demo still plays end to end
