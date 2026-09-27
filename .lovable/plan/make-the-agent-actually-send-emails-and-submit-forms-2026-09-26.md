# Make the agent actually send emails and submit forms

## What you'll get
- Tell the agent in plain words ("fill the internship form and send it to the recruiter", "email Sarah the action items") and press Enter.
- The agent fills the form or drafts the email, shows you a preview, and when you click Approve (or say "yes, send it") it **really sends from your Gmail**.
- **Submitting a form** saves it to a new "Submissions" list (on the Agent page) and emails a neatly formatted copy of the filled form to the right person (for example the recruiter or professor from the meeting), or to you if no one is named.
- Each sent email and submission shows a green "Sent from your Gmail" / "Submitted" note with the time and recipient.
- Safety for the demo: nothing goes out without your approval, and the agent always shows the recipient's address first. Demo people (Sarah Chen etc.) have made-up addresses, so the agent will ask you for a real address before sending — use your own to show the judges live.

## What I need from you
- **No API key.** You'll click "Connect Gmail" once in the approval card and sign in with Google. That's it.

## Steps
1. Connect Gmail (same way Google Calendar was connected).
2. Add a server endpoint that sends an email through your Gmail (plain text + nicely formatted HTML for filled forms).
3. Update the agent so it understands "send", "submit", "email it to …", and asks for a missing recipient address.
4. Replace the current "(demo send)" behavior in the agent console with real sending; add the Submissions list, saved in your browser.
5. Test: send a real email to your address and submit one form; confirm both arrive and no page errors.

## Technical details
- Gmail via standard connector gateway (`google_mail`), `POST /gmail/v1/users/me/messages/send` with base64url RFC 2822 message.
- New `src/routes/api/send-email.ts` (zod-validated: to, subject, body, optional formHtml); rejects invalid addresses.
- `/api/agent` returns an intent (`send_email` | `submit_form`) with recipient; AgentConsole calls send-email after Approve.
- Submissions stored in localStorage (`thread-submissions`) for now; moving to Lovable Cloud stays on the roadmap.
