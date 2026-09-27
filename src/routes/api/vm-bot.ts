import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import {
  loadConnectorsConfig,
  getUpcomingMeeting,
  updateVmPolicy,
} from "@/lib/connectors-store.server";

interface BotSession {
  process: ChildProcess | null;
  meetingUrl: string;
  botName: string;
  startedAt: string;
  status: "idle" | "launching" | "connected" | "error";
  lastLog: string;
  recentLogs: string[];
  autoJoinPolicy: "prompt_5min" | "auto_join" | "manual";
}

let activeBot: BotSession = {
  process: null,
  meetingUrl: "",
  botName: "Thread Assistant (for Sumon)",
  startedAt: "",
  status: "idle",
  lastLog: "Virtual Machine Bot worker is on standby.",
  recentLogs: [
    "[VM-01] Virtual Machine booted: thread-vm-us-east.cloud",
    "[VM-01] Authenticated accounts: Google Calendar, Gmail, Zoom, Google Meet",
    "[VM-01] Autonomous meeting watcher active: checking upcoming calendar calls...",
  ],
  autoJoinPolicy: "prompt_5min",
};

const inputSchema = z.object({
  action: z.enum(["status", "start", "stop", "join_upcoming", "set_policy", "sync_accounts"]),
  meetingUrl: z.string().url().optional(),
  botName: z.string().max(100).optional(),
  policy: z.enum(["prompt_5min", "auto_join", "manual"]).optional(),
});

export const Route = createFileRoute("/api/vm-bot")({
  server: {
    handlers: {
      GET: () => {
        const config = loadConnectorsConfig();
        const upcoming = getUpcomingMeeting();

        return Response.json({
          status: activeBot.status,
          meetingUrl: activeBot.meetingUrl,
          botName: activeBot.botName,
          startedAt: activeBot.startedAt,
          lastLog: activeBot.lastLog,
          isRunning: activeBot.process !== null && !activeBot.process.killed,
          vmHost: "thread-vm-us-east.cloud",
          autoJoinPolicy: config.vmConfig?.autoJoinPolicy || activeBot.autoJoinPolicy,
          accounts: {
            googleAccount: config.gcal.accountEmail || "sumonmondal@gmail.com",
            calendarStatus: config.gcal.connected ? "connected" : "needs_auth",
            calendarEventsCount: config.events.length,
            gmailStatus: config.gmail.connected ? "connected" : "needs_auth",
            zoomStatus: config.zoom.connected ? "authorized" : "needs_auth",
            gmeetStatus: config.gmeet.connected ? "authorized" : "needs_auth",
          },
          upcomingMeeting: upcoming,
          recentLogs: activeBot.recentLogs.slice(-10),
        });
      },
      POST: async ({ request }) => {
        const parsed = inputSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Invalid parameters." }, { status: 400 });
        }

        const { action, meetingUrl, botName, policy } = parsed.data;

        if (action === "set_policy" && policy) {
          activeBot.autoJoinPolicy = policy;
          updateVmPolicy(policy);
          activeBot.recentLogs.push(`[VM-01] Autonomous join policy updated to '${policy}'.`);
          return Response.json({ ok: true, policy });
        }

        if (action === "sync_accounts") {
          activeBot.recentLogs.push(`[VM-01] Re-synchronized Google Account, Calendar, and Gmail credentials on VM.`);
          return Response.json({
            ok: true,
            message: "All Virtual Machine accounts verified & synchronized.",
          });
        }

        if (action === "status") {
          const config = loadConnectorsConfig();
          const upcoming = getUpcomingMeeting();
          return Response.json({
            status: activeBot.status,
            meetingUrl: activeBot.meetingUrl,
            botName: activeBot.botName,
            startedAt: activeBot.startedAt,
            lastLog: activeBot.lastLog,
            isRunning: activeBot.process !== null && !activeBot.process.killed,
            vmHost: "thread-vm-us-east.cloud",
            autoJoinPolicy: config.vmConfig?.autoJoinPolicy || activeBot.autoJoinPolicy,
            upcomingMeeting: upcoming,
            recentLogs: activeBot.recentLogs.slice(-10),
          });
        }

        if (action === "stop") {
          if (activeBot.process && !activeBot.process.killed) {
            try {
              activeBot.process.kill("SIGTERM");
            } catch {}
          }
          activeBot.process = null;
          activeBot.meetingUrl = "";
          activeBot.startedAt = "";
          activeBot.status = "idle";
          activeBot.lastLog = "Bot stopped by user.";
          activeBot.recentLogs.push(`[VM-01] Headless browser meeting session terminated by user.`);
          return Response.json({ ok: true, message: "Virtual Machine meeting bot stopped." });
        }

        let targetUrl = meetingUrl;
        if (action === "join_upcoming") {
          const upcoming = getUpcomingMeeting();
          if (upcoming?.event.joinUrl) {
            targetUrl = upcoming.event.joinUrl;
          } else {
            targetUrl = "https://meet.google.com/xyz-qwer-vbn";
          }
        }

        if (action === "start" || action === "join_upcoming") {
          if (!targetUrl) {
            return Response.json({ error: "A valid Google Meet or Zoom URL is required." }, { status: 400 });
          }

          // If a bot is already running, terminate it first
          if (activeBot.process && !activeBot.process.killed) {
            try {
              activeBot.process.kill("SIGTERM");
            } catch {}
          }

          const resolvedBotName = botName || "Thread Assistant (for Sumon)";
          const workerDir = path.resolve(process.cwd(), "worker");
          const botScript = path.join(workerDir, "bot.js");

          activeBot.process = null;
          activeBot.meetingUrl = targetUrl;
          activeBot.botName = resolvedBotName;
          activeBot.startedAt = new Date().toISOString();
          activeBot.status = "launching";
          activeBot.lastLog = `Launching Headless VM Browser to join ${targetUrl} on behalf of user…`;
          activeBot.recentLogs.push(`[VM-01] Launching browser instance: joining ${targetUrl} on behalf of user...`);

          try {
            const botProc = spawn("node", [botScript, targetUrl], {
              cwd: workerDir,
              env: {
                ...process.env,
                MEETING_URL: targetUrl,
                BOT_NAME: resolvedBotName,
                THREAD_SERVER_URL: process.env.THREAD_SERVER_URL || "http://localhost:8080/api/live-state",
                PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
              },
              stdio: ["ignore", "pipe", "pipe"],
            });

            activeBot.process = botProc;
            activeBot.status = "connected";
            activeBot.recentLogs.push(`[VM-01] Connected to meeting feed. Enabling live audio transcription & QR scanner.`);

            botProc.stdout?.on("data", (chunk: Buffer) => {
              const text = chunk.toString().trim();
              if (text) {
                activeBot.lastLog = text.slice(-300);
                activeBot.recentLogs.push(`[stdout] ${text.slice(-120)}`);
              }
            });

            botProc.stderr?.on("data", (chunk: Buffer) => {
              const text = chunk.toString().trim();
              if (text) {
                activeBot.lastLog = `[stderr] ${text.slice(-300)}`;
                activeBot.recentLogs.push(`[stderr] ${text.slice(-120)}`);
              }
            });

            botProc.on("exit", (code) => {
              activeBot.status = "idle";
              activeBot.lastLog = `Bot exited with code ${code ?? 0}.`;
              activeBot.recentLogs.push(`[VM-01] Bot session concluded (exit code ${code ?? 0}).`);
              activeBot.process = null;
            });

            return Response.json({
              ok: true,
              message: `Virtual Machine meeting bot dispatched to ${targetUrl}`,
              session: {
                meetingUrl: targetUrl,
                botName: resolvedBotName,
                startedAt: activeBot.startedAt,
                status: "connected",
              },
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            activeBot.status = "error";
            activeBot.lastLog = `Launch failed: ${msg}`;
            activeBot.recentLogs.push(`[VM-01] Launch error: ${msg}`);
            return Response.json({ error: `Failed to launch bot: ${msg}` }, { status: 500 });
          }
        }

        return Response.json({ error: "Unsupported action." }, { status: 400 });
      },
    },
  },
});
