import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  loadConnectorsConfig,
  addStoredEvent,
  type GoogleCalendarEvent,
} from "@/lib/connectors-store.server";

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

function detectPlatform(e: GEvent | { hangoutLink?: string; location?: string; description?: string }): {
  platform: "Google Meet" | "Zoom" | "Microsoft Teams" | "Calendar";
  url: string | null;
} {
  const hay = [e.hangoutLink, e.location, e.description].filter(Boolean).join(" ");
  const zoom = /https?:\/\/[\w.-]*zoom\.us\/[^\s"<>]+/i.exec(hay)?.[0];
  if (zoom) return { platform: "Zoom", url: zoom };
  const meet = e.hangoutLink ?? /https?:\/\/meet\.google\.com\/[^\s"<>]+/i.exec(hay)?.[0];
  if (meet) return { platform: "Google Meet", url: meet };
  const teams = /https?:\/\/teams\.microsoft\.com\/[^\s"<>]+/i.exec(hay)?.[0];
  if (teams) return { platform: "Microsoft Teams", url: teams };
  return { platform: "Calendar", url: null };
}

function formatGCalDate(d: Date): string {
  return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

export const Route = createFileRoute("/api/calendar")({
  server: {
    handlers: {
      GET: async () => {
        const config = loadConnectorsConfig();
        const isConnected = config.gcal.connected;
        const accountEmail = config.gcal.accountEmail || "sumonmondal@gmail.com";

        // 1. If Google OAuth token is present, fetch live events directly from Google Calendar API
        if (isConnected && config.gcal.accessToken && config.gcal.accessToken.startsWith("ya29.")) {
          try {
            const qs = new URLSearchParams({
              timeMin: new Date().toISOString(),
              maxResults: "20",
              singleEvents: "true",
              orderBy: "startTime",
            });
            const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${qs}`, {
              headers: { Authorization: `Bearer ${config.gcal.accessToken}` },
            });
            if (gRes.ok) {
              const data = (await gRes.json()) as { items?: GEvent[] };
              const liveEvents: GoogleCalendarEvent[] = (data.items ?? []).map((e) => {
                const det = detectPlatform(e);
                return {
                  id: e.id,
                  title: e.summary ?? "(Untitled Google Calendar Event)",
                  start: e.start?.dateTime ?? e.start?.date ?? "",
                  end: e.end?.dateTime ?? e.end?.date ?? "",
                  platform: det.platform,
                  joinUrl: det.url,
                  calendarUrl: e.htmlLink ?? "https://calendar.google.com/calendar/u/0/r",
                  description: e.description,
                  location: e.location,
                };
              });

              return Response.json({
                connected: true,
                accountEmail,
                syncMode: "google_oauth_live",
                events: liveEvents,
              });
            }
          } catch (err) {
            console.warn("Live Google Calendar API fetch error, falling back to synced store:", err);
          }
        }

        // 2. Return synced events from the persistent connectors store
        return Response.json({
          connected: isConnected,
          accountEmail: isConnected ? accountEmail : null,
          syncMode: config.gcal.syncMode,
          lastSynced: config.gcal.lastSynced,
          events: isConnected ? config.events : [],
        });
      },

      POST: async ({ request }) => {
        const config = loadConnectorsConfig();
        const parsed = z
          .object({
            title: z.string().min(1).max(200),
            start: z.string().min(10),
            durationMin: z.number().int().min(5).max(600).default(30),
            zoomUrl: z.string().url().max(500).optional(),
            notes: z.string().max(4000).optional(),
            attendees: z.array(z.string().email()).max(20).optional(),
            location: z.string().optional(),
          })
          .safeParse(await request.json().catch(() => null));

        if (!parsed.success) {
          return Response.json({ error: "Please verify event title and start time." }, { status: 400 });
        }

        const d = parsed.data;
        const start = new Date(d.start);
        if (Number.isNaN(start.getTime())) {
          return Response.json({ error: "Invalid start time timestamp." }, { status: 400 });
        }
        const end = new Date(start.getTime() + d.durationMin * 60000);

        // Platform detection
        let platform: "Google Meet" | "Zoom" | "Microsoft Teams" | "Calendar" = "Calendar";
        let joinUrl: string | null = null;
        if (d.zoomUrl) {
          platform = "Zoom";
          joinUrl = d.zoomUrl;
        } else {
          platform = "Google Meet";
          joinUrl = `https://meet.google.com/${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 5)}`;
        }

        // Build official 1-tap Google Calendar Web URL
        const gcalParams = new URLSearchParams({
          action: "TEMPLATE",
          text: d.title,
          dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
          details: `${d.notes ? `${d.notes}\n\n` : ""}${joinUrl ? `Join Meeting: ${joinUrl}\n\n` : ""}Added via Thread AI Assistant`,
          location: joinUrl || d.location || "Online Meeting",
        });
        if (d.attendees?.length) {
          gcalParams.set("add", d.attendees.join(","));
        }
        const googleCalendarWebUrl = `https://calendar.google.com/calendar/render?${gcalParams.toString()}`;

        // Attempt direct Google Calendar API insertion if OAuth access token is active
        let liveApiEventId: string | null = null;
        let liveApiHtmlLink: string | null = null;
        if (config.gcal.connected && config.gcal.accessToken && config.gcal.accessToken.startsWith("ya29.")) {
          try {
            const apiRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${config.gcal.accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                summary: d.title,
                description: `${d.notes ? `${d.notes}\n\n` : ""}${joinUrl ? `Join: ${joinUrl}\n\n` : ""}Added by Thread`,
                location: joinUrl || d.location || "Online Meeting",
                start: { dateTime: start.toISOString() },
                end: { dateTime: end.toISOString() },
                attendees: d.attendees?.map((email) => ({ email })),
              }),
            });
            if (apiRes.ok) {
              const liveData = (await apiRes.json()) as GEvent;
              liveApiEventId = liveData.id;
              liveApiHtmlLink = liveData.htmlLink ?? null;
            }
          } catch (e) {
            console.warn("Could not insert event into Google API directly:", e);
          }
        }

        // Save event to local store
        const savedEvent = addStoredEvent({
          title: d.title,
          start: start.toISOString(),
          end: end.toISOString(),
          platform,
          joinUrl,
          calendarUrl: liveApiHtmlLink || googleCalendarWebUrl,
          description: d.notes,
          location: joinUrl || d.location,
        });

        return Response.json({
          ok: true,
          id: liveApiEventId || savedEvent.id,
          title: savedEvent.title,
          start: savedEvent.start,
          end: savedEvent.end,
          platform: savedEvent.platform,
          joinUrl: savedEvent.joinUrl,
          calendarUrl: savedEvent.calendarUrl,
          googleCalendarWebUrl,
          accountEmail: config.gcal.accountEmail || "sumonmondal@gmail.com",
        });
      },
    },
  },
});
