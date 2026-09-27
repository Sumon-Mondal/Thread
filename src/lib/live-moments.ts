// Turns finished caption lines from a real meeting into Thread moments and staged agent actions.
import type { AgentAction, Moment, MomentType } from "./demo-data";

const MONTH = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const WEEKDAY = "(?:mon|tues|wednes|thurs|fri|satur|sun)day";
const TIME = "(?:,?\\s+(?:at\\s+)?(?:\\d{1,2}(?::\\d{2})?\\s*[ap]\\.?m\\.?|noon|midnight))";
const DATE = new RegExp(
  `\\b(?:${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}|(?:next|this)\\s+${WEEKDAY}|${WEEKDAY}|tomorrow|tonight|today|next week|end of (?:the )?(?:day|week|month))\\b${TIME}?`,
  "i",
);
const EVENT_NOUN = /\b(info(?:rmation)? session|q ?& ?a(?: panel| session)?|workshop|webinar|office hours|panel|meetup|career fair|hackathon|seminar|orientation|coffee chat|mixer|info night|interview)\b/i;

interface Rule {
  type: MomentType;
  re: RegExp;
  needsDate?: boolean;
  headline: (sentence: string, date: string | null) => string;
}

// First match wins, so the more specific kinds come first.
const RULES: Rule[] = [
  {
    type: "DEADLINE",
    re: /\b(deadlines?|due|closes?|closing|cut-?off|no later than|last day to|submit(?:ted)? by|apply by|register by)\b/i,
    headline: (_, d) => (d ? `Due ${shortDate(d)}` : "Deadline Set"),
  },
  {
    type: "EVENT",
    re: EVENT_NOUN,
    needsDate: true,
    headline: (s, d) => `${titleCase(s.match(EVENT_NOUN)?.[1] ?? "Event")} ${shortDate(d ?? "", true)}`.trim(),
  },
  {
    type: "OPPORTUNITY",
    re: /\b(internships?|job openings?|openings?|now hiring|we(?:'re| are) hiring|hiring|positions?|roles? (?:open|available)|opportunit(?:y|ies)|fellowships?|scholarships?|grants?|now accepting|applications? (?:are |is )?(?:now )?open)\b/i,
    headline: (s) =>
      /internship/i.test(s) ? "Internships Open" : /scholarship|fellowship|grant/i.test(s) ? "Funding Open" : /hiring|job|position|role/i.test(s) ? "Hiring Now" : "New Opportunity",
  },
  {
    type: "REQUIREMENT",
    re: /\b(requires?|required|requirements?|must (?:have|know|be)|looking for (?:people|candidates|someone|students|folks|engineers)|experience (?:with|in)|proficien(?:t|cy)|familiar(?:ity)? with|skills? in|background in|you(?:'ll)? need to (?:know|have))\b/i,
    headline: () => "Skills Needed",
  },
  {
    type: "ACTION",
    re: /\b(please|make sure (?:to|you)|remember to|don't forget to|be sure to|you should|you'll need to|rsvp|sign up|register|fill out|send (?:us|me|your)|email (?:us|me)|reach out|submit your)\b/i,
    headline: () => "Action For You",
  },
  {
    type: "RESOURCE",
    re: /\b(link|portal|qr code|slides?|deck|website|repo(?:sitory)?|github|notion|google (?:doc|drive|form)|resources?|check out|handout|recording)\b/i,
    headline: (s) => (/qr/i.test(s) ? "QR Code Shared" : /portal/i.test(s) ? "Portal Shared" : /slides?|deck/i.test(s) ? "Slides Shared" : "Resource Shared"),
  },
  {
    type: "DECISION",
    re: /\b(we(?:'ve| have)? decided|we agreed|agreed to|the decision is|we(?:'ll| will) go with|finali[sz]ed|approved|let's go with)\b/i,
    headline: () => "Decision Made",
  },
];

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const titleCase = (s: string) => s.replace(/q ?& ?a/i, "Q&A").split(" ").map((w) => (w === "Q&A" ? w : cap(w))).join(" ");
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function shortDate(d: string, withTime = false): string {
  const md = d.match(new RegExp(`(${MONTH})\\.?\\s+(\\d{1,2})`, "i")) ?? d.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH})`, "i"));
  let out: string;
  if (md) {
    const [month, day] = /\d/.test(md[1] ?? "") ? [md[2] ?? "", md[1] ?? ""] : [md[1] ?? "", md[2] ?? ""];
    out = `${cap(month.slice(0, 3))} ${day}`;
  } else {
    const wd = d.match(/(mon|tues|wednes|thurs|fri|satur|sun)day/i);
    out = wd ? cap((wd[1] ?? "").slice(0, 3)) : titleCase(d.replace(/\bof the\b/i, "of").trim());
  }
  const time = withTime ? d.match(/(\d{1,2}(?::\d{2})?)\s*([ap])\.?m\.?/i) : null;
  return time ? `${out} ${time[1]} ${(time[2] ?? "").toUpperCase()}M` : out;
}

export interface LiveLine {
  key: string;
  speaker: string;
  text: string;
  timeSec: number;
}

/** Up to two moments per line, each with the action Thread would stage for it (if any). */
export function detectLiveMoments(line: LiveLine): { moments: Moment[]; actions: AgentAction[] } {
  const moments: Moment[] = [];
  const actions: AgentAction[] = [];
  const first = line.speaker.split(" ")[0] ?? line.speaker;
  const sentences = line.text.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter((s) => s.length > 8);

  sentences.forEach((sentence, i) => {
    if (moments.length >= 2) return;
    const date = sentence.match(DATE)?.[0]?.trim().replace(/\.$/, "") ?? null;
    const rule = RULES.find((r) => r.re.test(sentence) && (!r.needsDate || date));
    if (!rule) return;
    const id = `lm-${line.key}-${i}`;
    moments.push({
      id,
      type: rule.type,
      speaker: line.speaker,
      timeSec: line.timeSec,
      takeaway: clip(sentence, 160),
      detail: `${line.speaker} said: “${sentence}”`,
      headline: rule.headline(sentence, date),
    });
    const base = { id: `${id}-act`, status: "staged" as const, timeSec: line.timeSec, detail: `${line.speaker}: “${clip(sentence, 200)}”` };
    if (rule.type === "DEADLINE") actions.push({ ...base, kind: "reminder", label: `Set deadline reminder — ${date ?? clip(sentence, 50)}` });
    else if (rule.type === "EVENT") actions.push({ ...base, kind: "calendar", label: `Add to calendar — ${titleCase(sentence.match(EVENT_NOUN)?.[1] ?? "event")}, ${date}` });
    else if (rule.type === "OPPORTUNITY") actions.push({ ...base, kind: "apply", label: `Save the opportunity ${first} mentioned` });
    else if (rule.type === "ACTION") actions.push({ ...base, kind: "reminder", label: `Follow up — ${clip(sentence, 70)}` });
  });
  return { moments, actions };
}
