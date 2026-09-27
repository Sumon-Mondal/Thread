import { SARAH_DEMO_RECIPIENT } from "@/lib/demo-recipient";
// Scripted "Discovery Day" meeting scenario for Thread demo mode.

export type MomentType =
  | "OPPORTUNITY"
  | "RESOURCE"
  | "DEADLINE"
  | "REQUIREMENT"
  | "EVENT"
  | "ACTION"
  | "DECISION";

export interface Moment {
  id: string;
  type: MomentType;
  speaker: string;
  timeSec: number;
  takeaway: string;
  detail: string;
  /** 2–3 words for the iPhone Dynamic Island; both apps show the same one. */
  headline?: string;
  link?: string;
  matchedSkills?: { skill: string; matched: boolean }[];
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  role: string;
  timeSec: number;
  text: string;
  momentType?: MomentType;
}

export interface AgentAction {
  id: string;
  label: string;
  kind: "apply" | "reminder" | "calendar" | "reply" | "log";
  status: "staged" | "executed";
  timeSec: number;
  detail: string;
  link?: string;
}

export interface ChatMsg {
  id: string;
  from: string;
  text: string;
  timeSec: number;
  reactions: string[];
  isAgent?: boolean;
}

export interface Speaker {
  name: string;
  role: string;
  initials: string;
  color: string;
}

export const MEETING_TITLE = "Nova Dynamics — Discovery Day";
export const MEETING_PLATFORM = "Google Meet";

export const SPEAKERS = {
  sarah: { name: "Sarah Chen", role: "University Recruiting Lead", initials: "SC", color: "#3b82f6" },
  michael: { name: "Michael Torres", role: "Staff Engineer", initials: "MT", color: "#8b5cf6" },
  priya: { name: "Priya Nair", role: "Hiring Manager", initials: "PN", color: "#14b8a6" },
  caroline: { name: "Caroline Zhang", role: "2026 Intern & MLH Fellow", initials: "CZ", color: "#f97316" },
  steve: { name: "Steve Miller", role: "Engineering Lead", initials: "SM", color: "#6366f1" },
  you: { name: "You", role: "Attendee", initials: "YO", color: "#f59e0b" },
} satisfies Record<string, Speaker>;

export const SCRIPT_TRANSCRIPT: TranscriptLine[] = [
  { id: "t1", speaker: "Sarah Chen", role: SPEAKERS.sarah.role, timeSec: 2, text: "Welcome everyone to Nova Dynamics Discovery Day! We're thrilled to have over two hundred students joining us live today." },
  { id: "t2", speaker: "Sarah Chen", role: SPEAKERS.sarah.role, timeSec: 9, text: "Quick housekeeping — this session is being recorded and all links we share will be posted in the chat as well." },
  { id: "t3", speaker: "Sarah Chen", role: SPEAKERS.sarah.role, timeSec: 18, text: "Let's get to the big news. Our Summer 2027 Software Engineering internship applications officially open today.", momentType: "OPPORTUNITY" },
  { id: "t4", speaker: "Sarah Chen", role: SPEAKERS.sarah.role, timeSec: 26, text: "These are paid, twelve-week roles across our platform, infrastructure, and applied AI teams." },
  { id: "t5", speaker: "Michael Torres", role: SPEAKERS.michael.role, timeSec: 36, text: "I'm sharing my screen now — you can scan the QR code on this slide or use the link I'm dropping in chat to reach the application portal.", momentType: "RESOURCE" },
  { id: "t6", speaker: "Michael Torres", role: SPEAKERS.michael.role, timeSec: 46, text: "The portal has your profile pre-fill, a short statement of interest, and an optional portfolio upload." },
  { id: "t7", speaker: "Sarah Chen", role: SPEAKERS.sarah.role, timeSec: 58, text: "One important date: applications close firmly on October 18th at 11:59 PM Eastern. No extensions, so don't wait.", momentType: "DEADLINE" },
  { id: "t8", speaker: "Michael Torres", role: SPEAKERS.michael.role, timeSec: 70, text: "What do we look for? Strong fundamentals in Python, and ideally some exposure to distributed systems or data pipelines.", momentType: "REQUIREMENT" },
  { id: "t9", speaker: "Michael Torres", role: SPEAKERS.michael.role, timeSec: 80, text: "We don't expect you to know everything — we expect curiosity and evidence you can ship." },
  { id: "t10", speaker: "Priya Nair", role: SPEAKERS.priya.role, timeSec: 90, text: "We're also hosting an engineering Q&A panel next Thursday at 4 PM Eastern with interns from last summer. Highly recommend attending.", momentType: "EVENT" },
  { id: "t11", speaker: "Sarah Chen", role: SPEAKERS.sarah.role, timeSec: 102, text: "If you're driving or away from your desk right now — no worries, everything shared today is being captured for you." },
  { id: "t12", speaker: "Priya Nair", role: SPEAKERS.priya.role, timeSec: 112, text: "Final note from me: referral applications get priority review, so mention you attended Discovery Day.", momentType: "DECISION" },
  { id: "t12b", speaker: "Caroline Zhang", role: SPEAKERS.caroline.role, timeSec: 135, text: "I did MLH Fellowship before Nova Dynamics, and that hands-on open source experience really helped me pass the technical interviews.", momentType: "OPPORTUNITY" },
  { id: "t12c", speaker: "Steve Miller", role: SPEAKERS.steve.role, timeSec: 165, text: "For behavioral and architecture questions, always use the STAR method — Situation, Task, Action, and Result. It makes your impact crystal clear.", momentType: "REQUIREMENT" },
  { id: "t13", speaker: "Sarah Chen", role: SPEAKERS.sarah.role, timeSec: 190, text: "That's a wrap for the main session. Breakout rooms open in two minutes — thank you all for being here!" },
  { id: "t14", speaker: "Priya Nair", role: SPEAKERS.priya.role, timeSec: 215, text: "Looking at campus facilities, we really need a better waste management and recycling system before winter break. If anyone wants to join Jordan Lee by November 15, let us know at jordan.lee@helixsupply.com.", momentType: "OPPORTUNITY" },
];

export const SCRIPT_MOMENTS: Moment[] = [
  {
    id: "m1", type: "OPPORTUNITY", speaker: "Sarah Chen", timeSec: 18, headline: "Internships Open",
    takeaway: "Summer 2027 SWE internship applications are open as of today.",
    detail: "Paid 12-week roles across Platform, Infrastructure, and Applied AI teams. Thread matched this against your stated goal of an ML-adjacent internship from your Sept 12 career-fair meeting.",
    link: "/apply/internship-app",
  },
  {
    id: "m2", type: "RESOURCE", speaker: "Michael Torres", timeSec: 36, headline: "Portal QR Code",
    takeaway: "Application portal link + QR code captured from shared slide.",
    detail: "Gemini vision detected a QR code on the shared slide and decoded it to the application portal. The same URL was posted in meeting chat and cross-verified.",
    link: "/apply/internship-app",
  },
  {
    id: "m3", type: "DEADLINE", speaker: "Sarah Chen", timeSec: 58, headline: "Oct 18 Deadline",
    takeaway: "Applications close firmly on October 18, 11:59 PM ET — no extensions.",
    detail: "Hard cutoff stated twice with emphasis. Thread staged a reminder for Oct 16 (T-48h) and Oct 18 (T-6h).",
  },
  {
    id: "m4", type: "REQUIREMENT", speaker: "Michael Torres", timeSec: 70, headline: "Python & Systems",
    takeaway: "Wants Python fundamentals; distributed systems / data pipelines preferred.",
    detail: "Compared against your profile: Python matched from 3 projects; distributed systems matched from your coursework and capstone.",
    matchedSkills: [
      { skill: "Python", matched: true },
      { skill: "Distributed Systems", matched: true },
      { skill: "Data Pipelines", matched: true },
      { skill: "Kubernetes", matched: false },
    ],
  },
  {
    id: "m5", type: "EVENT", speaker: "Priya Nair", timeSec: 90, headline: "Engineering Q&A",
    takeaway: "Engineering Q&A panel next Thursday at 4 PM ET with former interns.",
    detail: "Calendar invite staged. Former interns on the panel — strong signal for referral conversations.",
  },
  {
    id: "m6", type: "DECISION", speaker: "Priya Nair", timeSec: 112, headline: "Priority Referrals",
    takeaway: "Referral applications get priority review — mention Discovery Day attendance.",
    detail: "Logged to meeting ledger. Thread added 'Request referral mention' to your action queue.",
  },
  {
    id: "m6b", type: "OPPORTUNITY", speaker: "Caroline Zhang", timeSec: 135, headline: "MLH Experience",
    takeaway: "MLH Fellowship hands-on open source experience helps pass technical interviews.",
    detail: "Caroline highlighted how fellowship projects in open source provide direct proof of shipping code.",
  },
  {
    id: "m6c", type: "REQUIREMENT", speaker: "Steve Miller", timeSec: 165, headline: "STAR Method",
    takeaway: "Use the STAR Method (Situation, Task, Action, Result) for behavioral questions.",
    detail: "Steve recommended structuring technical answers around measurable results and personal ownership.",
  },
  {
    id: "m7", type: "OPPORTUNITY", speaker: "Priya Nair", timeSec: 215, headline: "Waste Management",
    takeaway: "Priya is talking about waste management and campus recycling.",
    detail: "Priya highlighted campus facility sustainability targets: implementing smart IoT recycling bins and aluminum can disposal across campus by November 15. Contact eco-lead jordan.lee@helixsupply.com to join the committee.",
    link: "https://helixsupply.com/sustainability/smart-bins",
    matchedSkills: [
      { skill: "Sustainability", matched: true },
      { skill: "IoT Sensors", matched: true },
      { skill: "Resource Management", matched: true },
    ],
  },
];

export const SCRIPT_ACTIONS: AgentAction[] = [
  { id: "a1", label: "Go through QR Code & Apply", kind: "apply", status: "executed", timeSec: 36, detail: "Decoded QR code from slide · /apply/internship-app stored to Resources" },
  { id: "a2", label: "React 👍 to Sarah's announcement in chat", kind: "reply", status: "executed", timeSec: 20, detail: "Sent emoji reaction to meeting chat" },
  { id: "a3", label: "Set deadline reminder — Oct 18, 11:59 PM ET", kind: "reminder", status: "staged", timeSec: 66, detail: "Reminders at T-48h and T-6h; ready in your queue" },
  { id: "a4", label: "Found link in chat: RSVP for Q&A Panel", kind: "calendar", status: "staged", timeSec: 96, detail: "Draft invite with Meet link; ready in your queue" },
  { id: "a5", label: "Send follow-up email to Sarah Chen", kind: "reply", status: "staged", timeSec: 126, detail: `Attaches portfolio link & references Discovery Day session; sends to ${SARAH_DEMO_RECIPIENT}` },
  // Jordan Lee is only mentioned at 5:11, so his items can't be staged before then.
  { id: "a6", label: "Sign up for Campus Recycling Committee", kind: "apply", status: "staged", timeSec: 316, detail: "Registers for Jordan Lee's smart recycling initiative (/apply/sustainability)" },
  { id: "a7", label: "Send email to Jordan Lee re: Smart Bins", kind: "reply", status: "staged", timeSec: 321, detail: "Campus recycling initiative cutoff Nov 15; email jordan.lee@helixsupply.com" },
];

export const SCRIPT_CHAT: ChatMsg[] = [
  { id: "c1", from: "Sarah Chen", text: "Welcome everyone! 🎉 Drop your school in the chat!", timeSec: 4, reactions: ["🎉", "👋"] },
  { id: "c2", from: "Michael Torres", text: "Application portal: /apply/internship-app", timeSec: 37, reactions: [] },
  { id: "c3", from: "Thread Agent", text: "👍", timeSec: 20, reactions: [], isAgent: true },
  { id: "c3b", from: "Sarah Chen", text: `Questions after today? Demo follow-ups go to your inbox at ${SARAH_DEMO_RECIPIENT}.`, timeSec: 52, reactions: [] },
  { id: "c4", from: "Priya Nair", text: "Q&A panel RSVP link coming Thursday morning 📅", timeSec: 91, reactions: ["📅"] },
  { id: "c4b", from: "Sarah Chen", text: "Please RSVP for the intern Q&A panel by Wednesday 5 PM.", timeSec: 98, reactions: [] },
  { id: "c5", from: "Alex Kim", text: "Does the portal save progress if I start today?", timeSec: 108, reactions: [] },
  { id: "c6", from: "Sarah Chen", text: "Yes Alex — progress saves automatically ✅", timeSec: 116, reactions: ["✅"] },
];

/** Slide shown on the shared screen from t=36s until the main session wraps up at t=122s */
export const SCREEN_SHARE_START = 36;
export const SCREEN_SHARE_END = 122;
export const SLIDE = {
  title: "Summer 2027 — SWE Internship",
  subtitle: "Applications open today · Close Oct 18",
  url: "/apply/internship-app",
  bullets: ["12 weeks, paid", "Platform · Infra · Applied AI", "Referral = priority review"],
};

export const DEMO_END_SEC = 130;
/** Discovery Day runs on to Michael's 5:11 remark; the iPhone demo uses the same length. */
export const DISCOVERY_END_SEC = 330;

// ---------------------------------------------------------------------------
// Scenario system — multiple scripted meetings for demos and presentations.
// ---------------------------------------------------------------------------

export interface Scenario {
  id: string;
  label: string;
  meetingTitle: string;
  platform: string;
  speakers: Record<string, Speaker>;
  defaultSpeaker: string;
  defaultRole: string;
  transcript: TranscriptLine[];
  moments: Moment[];
  actions: AgentAction[];
  chat: ChatMsg[];
  screenShareStart: number;
  screenShareEnd: number;
  screenSharePresenter: string;
  slide: { title: string; subtitle: string; url: string; bullets: string[] };
  endSec: number;
}

const DIATOM_SPEAKERS = {
  osei: { name: "Dr. Amara Osei", role: "Principal Investigator", initials: "AO", color: "#14b8a6" },
  liam: { name: "Liam Park", role: "PhD Researcher", initials: "LP", color: "#3b82f6" },
  sofia: { name: "Sofia Reyes", role: "Lab Manager", initials: "SR", color: "#8b5cf6" },
  you: { name: "You", role: "Attendee", initials: "YO", color: "#f59e0b" },
} satisfies Record<string, Speaker>;

export const SCENARIOS: Record<string, Scenario> = {
  discovery: {
    id: "discovery",
    label: "Discovery Day — Internship",
    meetingTitle: MEETING_TITLE,
    platform: MEETING_PLATFORM,
    speakers: SPEAKERS,
    defaultSpeaker: "Sarah Chen",
    defaultRole: "University Recruiting Lead",
    transcript: SCRIPT_TRANSCRIPT,
    moments: SCRIPT_MOMENTS,
    actions: SCRIPT_ACTIONS,
    chat: SCRIPT_CHAT,
    screenShareStart: SCREEN_SHARE_START,
    screenShareEnd: SCREEN_SHARE_END,
    screenSharePresenter: "Michael Torres",
    slide: SLIDE,
    endSec: DISCOVERY_END_SEC,
  },
  diatom: {
    id: "diatom",
    label: "NanoBio Lab — Diatom Imaging",
    meetingTitle: "NanoBio Lab — Diatom Imaging Review",
    platform: "Zoom",
    speakers: DIATOM_SPEAKERS,
    defaultSpeaker: "Dr. Amara Osei",
    defaultRole: "Principal Investigator",
    transcript: [
      { id: "d1", speaker: "Dr. Amara Osei", role: DIATOM_SPEAKERS.osei.role, timeSec: 2, text: "Good morning everyone. Today we review the new Thalassiosira SEM scans and plan the paper submission." },
      { id: "d2", speaker: "Dr. Amara Osei", role: DIATOM_SPEAKERS.osei.role, timeSec: 10, text: "This session is recorded — Thread is capturing notes, links and action items for us." },
      { id: "d3", speaker: "Liam Park", role: DIATOM_SPEAKERS.liam.role, timeSec: 18, text: "Great news first: the NSF supplement got approved, so we have funding for forty more hours of SEM time this semester.", momentType: "OPPORTUNITY" },
      { id: "d4", speaker: "Dr. Amara Osei", role: DIATOM_SPEAKERS.osei.role, timeSec: 28, text: "Excellent. That changes our imaging schedule completely — we can rescan the whole A-series." },
      { id: "d5", speaker: "Liam Park", role: DIATOM_SPEAKERS.liam.role, timeSec: 36, text: "Sharing my screen — this is the 25,000× scan of the A2 frustule. The valve structure is beautifully resolved. I've dropped the ownCloud folder link in chat.", momentType: "RESOURCE" },
      { id: "d6", speaker: "Liam Park", role: DIATOM_SPEAKERS.liam.role, timeSec: 48, text: "You can see the areolae pattern clearly here — this is the figure I'd propose for the paper's figure two." },
      { id: "d7", speaker: "Dr. Amara Osei", role: DIATOM_SPEAKERS.osei.role, timeSec: 58, text: "Key date: the Journal of Phycology submission deadline is November 3rd. We need the full draft two weeks before that.", momentType: "DEADLINE" },
      { id: "d8", speaker: "Sofia Reyes", role: DIATOM_SPEAKERS.sofia.role, timeSec: 70, text: "For the rescan, remember the new protocol — 10 kilovolts, gold-palladium coating, and every sample needs a scale-bar reference shot.", momentType: "REQUIREMENT" },
      { id: "d9", speaker: "Sofia Reyes", role: DIATOM_SPEAKERS.sofia.role, timeSec: 82, text: "I'll book the SEM slots once Liam confirms which samples are priority." },
      { id: "d10", speaker: "Dr. Amara Osei", role: DIATOM_SPEAKERS.osei.role, timeSec: 92, text: "Also — the diatom taxonomy workshop is October 9th in Norfolk. I want both of you there.", momentType: "EVENT" },
      { id: "d11", speaker: "Liam Park", role: DIATOM_SPEAKERS.liam.role, timeSec: 102, text: "I'll be joining from the road that week, so I'll rely on the captured notes." },
      { id: "d12", speaker: "Dr. Amara Osei", role: DIATOM_SPEAKERS.osei.role, timeSec: 112, text: "Decision: we lead with the A2 frustule scan as figure two, and Liam drafts the results section by Friday.", momentType: "DECISION" },
      { id: "d13", speaker: "Dr. Amara Osei", role: DIATOM_SPEAKERS.osei.role, timeSec: 122, text: "That's everything. Great work on these scans — see you all at the workshop." },
    ],
    moments: [
      {
        id: "dm1", type: "OPPORTUNITY", speaker: "Liam Park", timeSec: 18,
        takeaway: "NSF supplement approved — 40 extra hours of SEM time funded.",
        detail: "Thread matched this to your grant-tracking note from the Sept 5 lab meeting and flagged the imaging schedule impact.",
      },
      {
        id: "dm2", type: "RESOURCE", speaker: "Liam Park", timeSec: 36,
        takeaway: "SEM scan of Thalassiosira A2 frustule shared on screen; ownCloud folder link captured.",
        detail: "Vision model identified a diatom frustule at 25,000× on the shared slide and cross-verified the dataset link posted in chat.",
        link: "https://nanomat.as.wm.edu/owncloud/s/fK5FbeKFAbzeKaQ",
      },
      {
        id: "dm3", type: "DEADLINE", speaker: "Dr. Amara Osei", timeSec: 58,
        takeaway: "Journal of Phycology submission due Nov 3 — full draft needed 2 weeks prior.",
        detail: "Thread staged reminders for Oct 20 (draft due) and Nov 1 (T-48h), pending your approval.",
      },
      {
        id: "dm4", type: "REQUIREMENT", speaker: "Sofia Reyes", timeSec: 70,
        takeaway: "New imaging protocol: 10 kV, gold-palladium coating, scale-bar shot per sample.",
        detail: "Logged to the lab protocol ledger and attached to the rescan task.",
        matchedSkills: [
          { skill: "SEM operation", matched: true },
          { skill: "Sample coating", matched: true },
          { skill: "ImageJ analysis", matched: true },
          { skill: "Cryo-SEM", matched: false },
        ],
      },
      {
        id: "dm5", type: "EVENT", speaker: "Dr. Amara Osei", timeSec: 92,
        takeaway: "Diatom taxonomy workshop — October 9th, Norfolk. Attendance expected.",
        detail: "Calendar invite staged with travel block; requires your approval.",
      },
      {
        id: "dm6", type: "DECISION", speaker: "Dr. Amara Osei", timeSec: 112,
        takeaway: "A2 frustule scan becomes figure two; Liam drafts results section by Friday.",
        detail: "Logged to meeting ledger. Thread added 'Draft results section' to the action queue with the figure attached.",
      },
    ],
    actions: [
      { id: "da1", label: "Save ownCloud dataset link", kind: "log", status: "executed", timeSec: 38, detail: "nanomat.as.wm.edu/owncloud/s/fK5FbeKFAbzeKaQ stored to Resources" },
      { id: "da2", label: "React 🎉 to Liam's funding announcement", kind: "reply", status: "executed", timeSec: 20, detail: "Sent emoji reaction to meeting chat" },
      { id: "da3", label: "Stage deadline reminders — Nov 3 submission", kind: "reminder", status: "staged", timeSec: 60, detail: "Reminders Oct 20 and Nov 1; requires your approval" },
      { id: "da4", label: "Add taxonomy workshop to calendar — Oct 9", kind: "calendar", status: "staged", timeSec: 94, detail: "Draft invite with travel block; requires your approval" },
      { id: "da5", label: "Draft chat reply: \"Congrats Liam! Grabbing the dataset now 🙌\"", kind: "reply", status: "staged", timeSec: 104, detail: "Agent-drafted reply to meeting chat; requires your approval" },
      { id: "da6", label: "Create task: draft results section by Friday", kind: "apply", status: "staged", timeSec: 118, detail: "Task created with A2 figure attached; requires your approval" },
    ],
    chat: [
      { id: "dc1", from: "Dr. Amara Osei", text: "Morning all! Agenda: SEM scans + paper plan 🔬", timeSec: 4, reactions: ["🔬"] },
      { id: "dc2", from: "Thread Agent", text: "🎉", timeSec: 20, reactions: [], isAgent: true },
      { id: "dc3", from: "Liam Park", text: "Dataset: https://nanomat.as.wm.edu/owncloud/s/fK5FbeKFAbzeKaQ", timeSec: 37, reactions: [] },
      { id: "dc4", from: "Sofia Reyes", text: "SEM booking sheet is in the shared drive 📅", timeSec: 84, reactions: ["📅"] },
      { id: "dc5", from: "Liam Park", text: "Can we add the B-series to the rescan queue?", timeSec: 108, reactions: [] },
      { id: "dc6", from: "Dr. Amara Osei", text: "Yes — if the coating holds up ✅", timeSec: 116, reactions: ["✅"] },
    ],
    screenShareStart: 36,
    screenShareEnd: DEMO_END_SEC - 8,
    screenSharePresenter: "Liam Park",
    slide: {
      title: "Thalassiosira sp. — A2 Frustule",
      subtitle: "SEM · 25,000× · 10 kV · NanoBio Lab",
      url: "nanomat.as.wm.edu/owncloud/s/fK5FbeKFAbzeKaQ",
      bullets: ["Valve structure resolved", "Proposed: paper figure 2", "Rescan A-series funded"],
    },
    endSec: DEMO_END_SEC,
  },
};

export const SCENARIO_LIST = Object.values(SCENARIOS);

export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
