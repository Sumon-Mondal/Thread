import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

type GEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  location?: string;
  description?: string;
  htmlLink?: string;
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
};

function detect(e: GEvent): { platform: string; url: string | null } {
  const hay = [e.hangoutLink, e.location, e.description, ...(e.conferenceData?.entryPoints?.map((p) => p.uri) ?? [])].filter(Boolean).join(" ");
  const zoom = /https?:\/\/[\w.-]*zoom\.us\/[^\s"<>]+/i.exec(hay)?.[0];
  if (zoom) return { platform: "Zoom", url: zoom };
  const meet = e.hangoutLink ?? /https?:\/\/meet\.google\.com\/[^\s"<>]+/i.exec(hay)?.[0];
  if (meet) return { platform: "Google Meet", url: meet };
  const teams = /https?:\/\/teams\.microsoft\.com\/[^\s"<>]+/i.exec(hay)?.[0];
  if (teams) return { platform: "Microsoft Teams", url: teams };
  return { platform: "Calendar", url: null };
}

export const Route = createFileRoute("/api/calendar")({
  server: {
    handlers: {
      GET: async () => {
        const lk = process.env["LOVABLE_API_KEY"];
        const ck = process.env["GOOGLE_CALENDAR_API_KEY"];
        if (!lk || !ck) return Response.json({ error: "Google Calendar is not connected." }, { status: 500 });
        const qs = new URLSearchParams({
          timeMin: new Date().toISOString(),
          maxResults: "15",
          singleEvents: "true",
          orderBy: "startTime",
        });
        const res = await fetch(`${GATEWAY}/calendars/primary/events?${qs}`, {
          headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck },
        });
        if (!res.ok) {
          const body = await res.text();
          console.error(`Calendar failed [${res.status}]: ${body}`);
          return Response.json({ error: `Google Calendar error [${res.status}]` }, { status: res.status });
        }
        const data = (await res.json()) as { items?: GEvent[] };
        const events = (data.items ?? []).map((e) => {
          const d = detect(e);
          return {
            id: e.id,
            title: e.summary ?? "(No title)",
            start: e.start?.dateTime ?? e.start?.date ?? "",
            end: e.end?.dateTime ?? e.end?.date ?? "",
            platform: d.platform,
            joinUrl: d.url,
            calendarUrl: e.htmlLink ?? null,
          };
        });
        return Response.json({ events });
      },
      POST: async ({ request }) => {
        const lk = process.env["LOVABLE_API_KEY"];
        const ck = process.env["GOOGLE_CALENDAR_API_KEY"];
        if (!lk || !ck) return Response.json({ error: "Google Calendar is not connected." }, { status: 500 });
        const { z } = await import("zod");
        const parsed = z
          .object({
            title: z.string().min(1).max(200),
            start: z.string().min(10),
            durationMin: z.number().int().min(5).max(600),
            zoomUrl: z.string().url().max(500).optional(),
            notes: z.string().max(4000).optional(),
            attendees: z.array(z.string().email()).max(20).optional(),
          })
          .safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Please check the title, time and Zoom link." }, { status: 400 });
        const d = parsed.data;
        const start = new Date(d.start);
        if (Number.isNaN(start.getTime())) return Response.json({ error: "Invalid start time." }, { status: 400 });
        const end = new Date(start.getTime() + d.durationMin * 60000);
        const res = await fetch(`${GATEWAY}/calendars/primary/events?conferenceDataVersion=1`, {
          method: "POST",
          headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: d.title,
            ...(d.zoomUrl ? {} : { conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } } }),
            ...(d.zoomUrl ? { location: d.zoomUrl } : {}),
            description: `${d.zoomUrl ? `Join on Zoom: ${d.zoomUrl}\n\n` : ""}${d.notes ?? ""}\n\nAdded by Thread`,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            ...(d.attendees?.length ? { attendees: d.attendees.map((email) => ({ email })) } : {}),
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          console.error(`Calendar insert failed [${res.status}]: ${body}`);
          return Response.json({ error: `Google Calendar error [${res.status}]`, detail: body.slice(0, 300) }, { status: res.status });
        }
        const ev = (await res.json()) as GEvent;
        return Response.json({ id: ev.id, htmlLink: ev.htmlLink ?? null, meetLink: (ev as { hangoutLink?: string }).hangoutLink ?? null });
      },
    },
  },
});
