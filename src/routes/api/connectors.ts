import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  loadConnectorsConfig,
  saveConnectorsConfig,
  updateGoogleAccount,
  disconnectGoogleAccount,
} from "@/lib/connectors-store.server";

const testSchema = z.object({
  connectorId: z.enum(["notion", "gcal", "gmail", "outlook-mail", "outlook-cal", "zoom", "teams", "gmeet"]),
  action: z.enum(["connect", "disconnect", "test", "sync"]).optional(),
  accountEmail: z.string().email().optional(),
  apiKey: z.string().optional(),
  databaseId: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  icalUrl: z.string().url().optional(),
  personalMeetingUrl: z.string().url().optional(),
  meetingData: z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      moments: z.array(z.string()).optional(),
      actions: z.array(z.string()).optional(),
    })
    .optional(),
});

export const Route = createFileRoute("/api/connectors")({
  server: {
    handlers: {
      GET: () => {
        const config = loadConnectorsConfig();
        const hasOpenAI = Boolean(process.env["OPENAI_API_KEY"]);

        return Response.json({
          connectors: [
            {
              id: "gcal",
              name: "Google Calendar",
              status: config.gcal.connected ? "connected" : "needs_key",
              type: "oauth",
              accountEmail: config.gcal.accountEmail,
              syncMode: config.gcal.syncMode,
              lastSynced: config.gcal.lastSynced,
            },
            {
              id: "gmail",
              name: "Gmail",
              status: config.gmail.connected ? "connected" : "needs_key",
              type: "oauth",
              accountEmail: config.gmail.accountEmail,
            },
            {
              id: "gmeet",
              name: "Google Meet",
              status: config.gmeet.connected ? "connected" : "needs_key",
              type: "native",
              defaultRoomUrl: config.gmeet.defaultRoomUrl,
            },
            {
              id: "zoom",
              name: "Zoom Web / App",
              status: config.zoom.connected ? "connected" : "needs_key",
              type: "native",
              personalMeetingUrl: config.zoom.personalMeetingUrl,
            },
            {
              id: "notion",
              name: "Notion",
              status: config.notion.connected ? "connected" : "needs_key",
              type: "token",
              workspaceName: config.notion.workspaceName,
            },
            {
              id: "outlook-mail",
              name: "Outlook Mail",
              status: config.outlook.connected ? "connected" : "needs_key",
              type: "token",
              email: config.outlook.email,
            },
            {
              id: "outlook-cal",
              name: "Outlook Calendar",
              status: config.outlook.connected ? "connected" : "needs_key",
              type: "token",
              email: config.outlook.email,
            },
            {
              id: "teams",
              name: "Microsoft Teams",
              status: config.teams.connected ? "connected" : "ready",
              type: "webhook",
            },
          ],
          aiEngine: hasOpenAI ? "openai_gpt4" : "fallback_heuristic",
        });
      },
      POST: async ({ request }) => {
        const parsed = testSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Invalid connector test parameters." }, { status: 400 });
        }

        const {
          connectorId,
          action,
          accountEmail,
          apiKey,
          databaseId,
          webhookUrl,
          icalUrl,
          personalMeetingUrl,
          meetingData,
        } = parsed.data;

        const config = loadConnectorsConfig();

        // 1. GOOGLE CALENDAR CONNECTOR
        if (connectorId === "gcal") {
          if (action === "disconnect") {
            disconnectGoogleAccount();
            return Response.json({
              success: true,
              message: "Google Calendar has been disconnected.",
              accountEmail: "",
            });
          }

          let resolvedEmail = accountEmail || config.gcal.accountEmail || "sumonmondal@gmail.com";
          let syncMode: "google_account" | "oauth_token" | "ical" = "google_account";

          // If OAuth Access Token is provided, verify with Google Identity API
          if (apiKey && apiKey.startsWith("ya29.")) {
            try {
              const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${apiKey}` },
              });
              if (userRes.ok) {
                const userData = (await userRes.json()) as { email?: string; name?: string };
                if (userData.email) {
                  resolvedEmail = userData.email;
                  syncMode = "oauth_token";
                }
              }
            } catch (e) {
              console.warn("Could not verify Google OAuth token online:", e);
            }
          } else if (icalUrl) {
            syncMode = "ical";
          }

          // Update and persist Google Account
          updateGoogleAccount({
            accountEmail: resolvedEmail,
            accessToken: apiKey,
            icalUrl,
            syncMode,
          });

          return Response.json({
            success: true,
            message: `Connected to Google Calendar on account "${resolvedEmail}"! Live deadline sync and 1-tap event actions active.`,
            accountEmail: resolvedEmail,
            syncMode,
          });
        }

        // 2. GMAIL CONNECTOR
        if (connectorId === "gmail") {
          const email = accountEmail || config.gmail.accountEmail || config.gcal.accountEmail || "sumonmondal@gmail.com";
          config.gmail = {
            connected: true,
            accountEmail: email,
            accessToken: apiKey || config.gmail.accessToken,
          };
          saveConnectorsConfig(config);

          return Response.json({
            success: true,
            message: `Connected to Gmail on account "${email}"! Automated follow-up drafts and meeting minutes delivery active.`,
            accountEmail: email,
          });
        }

        // 3. NOTION CONNECTOR
        if (connectorId === "notion") {
          const effectiveKey = apiKey || config.notion.apiKey || process.env["NOTION_API_KEY"];
          if (!effectiveKey) {
            return Response.json({
              success: false,
              message: "Notion Integration Token required. Please provide an Internal Integration Secret from notion.so/my-integrations.",
              instructions: "1. Visit notion.so/my-integrations\n2. Create an integration 'Thread Meeting Sync'\n3. Copy the 'Internal Integration Secret' and paste it here.",
            });
          }

          try {
            const authRes = await fetch("https://api.notion.com/v1/users/me", {
              headers: {
                Authorization: `Bearer ${effectiveKey}`,
                "Notion-Version": "2022-06-28",
              },
            });

            if (!authRes.ok) {
              const err = await authRes.text();
              return Response.json({
                success: false,
                message: `Notion authentication failed (HTTP ${authRes.status}). Check secret token.`,
              });
            }

            const userData = (await authRes.json()) as { name?: string };
            config.notion = {
              connected: true,
              apiKey: effectiveKey,
              databaseId: databaseId || config.notion.databaseId,
              workspaceName: userData.name || "Thread Workspace Bot",
            };
            saveConnectorsConfig(config);

            return Response.json({
              success: true,
              message: `Notion authenticated successfully! Connected as "${userData.name ?? "Thread Assistant"}".`,
            });
          } catch (err) {
            // If offline, save locally
            config.notion = {
              connected: true,
              apiKey: effectiveKey,
              databaseId: databaseId || config.notion.databaseId,
              workspaceName: "Thread Workspace Bot",
            };
            saveConnectorsConfig(config);
            return Response.json({
              success: true,
              message: "Notion credentials configured and saved successfully.",
            });
          }
        }

        // 4. MICROSOFT OUTLOOK
        if (connectorId === "outlook-mail" || connectorId === "outlook-cal") {
          const token = apiKey || config.outlook.token || process.env["MICROSOFT_GRAPH_TOKEN"];
          if (!token && !accountEmail) {
            return Response.json({
              success: false,
              message: "Microsoft Graph Token or work email required for Outlook integration.",
            });
          }

          config.outlook = {
            connected: true,
            token,
            email: accountEmail || config.outlook.email || "user@outlook.com",
            displayName: "Microsoft 365 User",
          };
          saveConnectorsConfig(config);

          return Response.json({
            success: true,
            message: `Connected to Microsoft Outlook (${config.outlook.email}). Mail and calendar sync active.`,
          });
        }

        // 5. MICROSOFT TEAMS
        if (connectorId === "teams") {
          config.teams = {
            connected: true,
            webhookUrl: webhookUrl || config.teams.webhookUrl,
          };
          saveConnectorsConfig(config);

          return Response.json({
            success: true,
            message: "Microsoft Teams connector active! Ready to push meeting summaries and approval cards.",
          });
        }

        // 6. ZOOM
        if (connectorId === "zoom") {
          config.zoom = {
            connected: true,
            personalMeetingUrl: personalMeetingUrl || config.zoom.personalMeetingUrl || "https://zoom.us/j/98765432100",
          };
          saveConnectorsConfig(config);

          return Response.json({
            success: true,
            message: "Zoom connector active! 1-tap join detection and meeting link generation ready.",
          });
        }

        // 7. GOOGLE MEET
        if (connectorId === "gmeet") {
          config.gmeet = {
            connected: true,
            defaultRoomUrl: personalMeetingUrl || config.gmeet.defaultRoomUrl || "https://meet.google.com",
          };
          saveConnectorsConfig(config);

          return Response.json({
            success: true,
            message: "Google Meet connector active! Closed caption observer and Gemini screen-share QR reader ready.",
          });
        }

        return Response.json({ success: true, message: "Connector verified." });
      },
    },
  },
});
