/** Real inbox chosen by the owner for Sarah's demonstration follow-ups. */
export const SARAH_DEMO_RECIPIENT = "shumonmondale@gmail.com";

/** Queue item created from Sarah's chat message; approving it must really send this email. */
export const SARAH_FOLLOW_UP_ACTION_ID = "chat-c3b";

/** Any queue item that emails Sarah — approving it only counts once the email is sent. */
export const isSarahFollowUp = (a: { id: string; label: string }) =>
  a.id === SARAH_FOLLOW_UP_ACTION_ID || /follow-up email to Sarah/i.test(a.label);

export const SARAH_FOLLOW_UP_EMAIL = {
  subject: "Thank you for the Discovery Day session",
  body: "Hi Sarah,\n\nThank you for sharing the internship opportunity at Discovery Day. I enjoyed learning about the team and look forward to applying.\n\nBest,\nSumon Mondal",
};
