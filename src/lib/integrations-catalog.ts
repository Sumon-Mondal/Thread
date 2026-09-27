// Catalog of add-ins shown on the Integrations page.
// status "live" = really connected (server-side); "demo" = simulated toggle for the MVP.
export type IntegrationCategory =
  | "Meetings"
  | "Calendar"
  | "Notes & Docs"
  | "Tasks"
  | "Messaging"
  | "Storage"
  | "CRM & Careers"
  | "Learning";

export interface CatalogApp {
  id: string;
  name: string;
  category: IntegrationCategory;
  desc: string;
  useCases: string[];
  status: "live" | "demo";
  hue: string; // tailwind accent classes
}

const C = {
  sky: "text-sky-400 bg-sky-500/15 ring-sky-500/30",
  emerald: "text-emerald-400 bg-emerald-500/15 ring-emerald-500/30",
  blue: "text-blue-400 bg-blue-500/15 ring-blue-500/30",
  fuchsia: "text-fuchsia-400 bg-fuchsia-500/15 ring-fuchsia-500/30",
  amber: "text-amber-400 bg-amber-500/15 ring-amber-500/30",
  rose: "text-rose-400 bg-rose-500/15 ring-rose-500/30",
  teal: "text-teal-400 bg-teal-500/15 ring-teal-500/30",
  orange: "text-orange-400 bg-orange-500/15 ring-orange-500/30",
};

export const CATALOG: CatalogApp[] = [
  { id: "gcal", name: "Google Calendar", category: "Calendar", status: "live", hue: C.sky, desc: "Syncs upcoming meetings and writes detected deadlines back to your calendar.", useCases: ["Auto-join", "Deadline sync", "Add to Calendar"] },
  { id: "gmeet", name: "Google Meet", category: "Meetings", status: "live", hue: C.emerald, desc: "Meet links in calendar events are detected — join and capture in one click.", useCases: ["Audio", "Chat links", "Screen share"] },
  { id: "zoom", name: "Zoom", category: "Meetings", status: "live", hue: C.blue, desc: "Zoom links in your calendar are detected automatically; new events get a Zoom link.", useCases: ["Auto-join", "Loopback audio"] },
  { id: "teams", name: "Microsoft Teams", category: "Meetings", status: "demo", hue: C.blue, desc: "Capture Teams calls and chat, including files shared in the meeting.", useCases: ["Transcript", "Chat files"] },
  { id: "webex", name: "Webex", category: "Meetings", status: "demo", hue: C.teal, desc: "Join Webex sessions and pull the slide deck being presented.", useCases: ["Slides", "Transcript"] },
  { id: "huddles", name: "Slack Huddles", category: "Meetings", status: "demo", hue: C.fuchsia, desc: "Quick huddles become searchable notes with owners.", useCases: ["Quick syncs"] },
  { id: "discord", name: "Discord", category: "Meetings", status: "demo", hue: C.blue, desc: "Voice channels for study groups and clubs, summarized.", useCases: ["Study groups"] },
  { id: "outlook-cal", name: "Outlook Calendar", category: "Calendar", status: "demo", hue: C.sky, desc: "Same auto-join and deadline sync for Microsoft 365 users.", useCases: ["Auto-join", "Deadline sync"] },
  { id: "apple-cal", name: "Apple Calendar", category: "Calendar", status: "demo", hue: C.rose, desc: "Subscribe via iCal link to see Thread deadlines on iPhone and Mac.", useCases: ["iCal feed"] },
  { id: "notion", name: "Notion", category: "Notes & Docs", status: "demo", hue: C.amber, desc: "Every meeting becomes a Notion page with moments, decisions and tasks.", useCases: ["Meeting notes"] },
  { id: "gdocs", name: "Google Docs", category: "Notes & Docs", status: "demo", hue: C.sky, desc: "Export summaries and filled forms as a shareable Doc.", useCases: ["Export", "Share"] },
  { id: "onenote", name: "OneNote", category: "Notes & Docs", status: "demo", hue: C.fuchsia, desc: "Drop class notes into the right notebook section.", useCases: ["Class notes"] },
  { id: "obsidian", name: "Obsidian", category: "Notes & Docs", status: "demo", hue: C.fuchsia, desc: "Markdown notes with backlinks to people and projects.", useCases: ["Markdown"] },
  { id: "asana", name: "Asana", category: "Tasks", status: "demo", hue: C.rose, desc: "Approved action items become tasks with owner and due date.", useCases: ["Action items"] },
  { id: "trello", name: "Trello", category: "Tasks", status: "demo", hue: C.blue, desc: "Cards for each action item on your chosen board.", useCases: ["Boards"] },
  { id: "jira", name: "Jira", category: "Tasks", status: "demo", hue: C.blue, desc: "Turn engineering decisions into tickets automatically.", useCases: ["Tickets"] },
  { id: "linear", name: "Linear", category: "Tasks", status: "demo", hue: C.fuchsia, desc: "Issues created from meeting action items.", useCases: ["Issues"] },
  { id: "todoist", name: "Todoist", category: "Tasks", status: "demo", hue: C.rose, desc: "Personal to-dos with reminders from deadlines heard in class.", useCases: ["Personal tasks"] },
  { id: "slack", name: "Slack", category: "Messaging", status: "demo", hue: C.fuchsia, desc: "Post summaries and approved actions to a channel after the meeting.", useCases: ["Summary delivery"] },
  { id: "gmail", name: "Gmail", category: "Messaging", status: "demo", hue: C.rose, desc: "Agent drafts follow-up emails for you to approve and send.", useCases: ["Follow-ups"] },
  { id: "outlook-mail", name: "Outlook Mail", category: "Messaging", status: "demo", hue: C.sky, desc: "Same follow-up drafts for Microsoft 365.", useCases: ["Follow-ups"] },
  { id: "gdrive", name: "Google Drive", category: "Storage", status: "demo", hue: C.emerald, desc: "Save recordings, transcripts and uploaded documents.", useCases: ["Recordings", "Files"] },
  { id: "dropbox", name: "Dropbox", category: "Storage", status: "demo", hue: C.blue, desc: "Archive meeting files to a shared folder.", useCases: ["Archive"] },
  { id: "onedrive", name: "OneDrive", category: "Storage", status: "demo", hue: C.sky, desc: "Store files next to your Microsoft 365 docs.", useCases: ["Files"] },
  { id: "hubspot", name: "HubSpot", category: "CRM & Careers", status: "demo", hue: C.orange, desc: "Log vendor and client meetings to the right contact.", useCases: ["Contact log"] },
  { id: "salesforce", name: "Salesforce", category: "CRM & Careers", status: "demo", hue: C.sky, desc: "Update opportunities with decisions and next steps.", useCases: ["Opportunities"] },
  { id: "linkedin", name: "LinkedIn", category: "CRM & Careers", status: "demo", hue: C.blue, desc: "Find recruiters mentioned in a meeting and draft a note.", useCases: ["Networking"] },
  { id: "handshake", name: "Handshake", category: "CRM & Careers", status: "demo", hue: C.rose, desc: "Pre-fill internship applications heard about at info sessions.", useCases: ["Applications"] },
  { id: "canvas", name: "Canvas", category: "Learning", status: "demo", hue: C.rose, desc: "Assignment deadlines from lectures land in your course calendar.", useCases: ["Assignments"] },
  { id: "blackboard", name: "Blackboard", category: "Learning", status: "demo", hue: C.amber, desc: "Sync class announcements and due dates.", useCases: ["Due dates"] },
  { id: "classroom", name: "Google Classroom", category: "Learning", status: "demo", hue: C.emerald, desc: "Match lecture moments to Classroom assignments.", useCases: ["Assignments"] },
];

export const CATEGORIES: IntegrationCategory[] = [
  "Meetings", "Calendar", "Notes & Docs", "Tasks", "Messaging", "Storage", "CRM & Careers", "Learning",
];

export const INTEGRATIONS_KEY = "thread-integrations";
export const DEFAULT_CONNECTED: Record<string, boolean> = { gcal: true, gmeet: true, zoom: true, slack: true, notion: true };

export function loadConnected(): Record<string, boolean> {
  try {
    return { ...DEFAULT_CONNECTED, ...JSON.parse(localStorage.getItem(INTEGRATIONS_KEY) ?? "{}"), gcal: true, gmeet: true, zoom: true };
  } catch {
    return { ...DEFAULT_CONNECTED };
  }
}

export function connectedAppNames(): string[] {
  const c = loadConnected();
  return CATALOG.filter((a) => c[a.id]).map((a) => a.name);
}
