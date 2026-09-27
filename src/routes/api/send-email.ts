import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const schema = z.object({
  to: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(300),
  body: z.string().max(20000),
  html: z.string().max(60000).optional(),
});

const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

function raw(to: string, subject: string, body: string, html?: string) {
  const lines = [`To: ${to}`, `Subject: ${header(subject.replace(/[\r\n]/g, " "))}`, "MIME-Version: 1.0"];
  if (html) {
    const bd = "thread_" + Math.random().toString(36).slice(2);
    lines.push(`Content-Type: multipart/alternative; boundary="${bd}"`, "",
      `--${bd}`, 'Content-Type: text/plain; charset="UTF-8"', "", body, "",
      `--${bd}`, 'Content-Type: text/html; charset="UTF-8"', "", html, "", `--${bd}--`);
  } else {
    lines.push('Content-Type: text/plain; charset="UTF-8"', "", body);
  }
  return b64(lines.join("\r\n")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const Route = createFileRoute("/api/send-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Please enter a valid email address and subject." }, { status: 400 });
        const lovable = process.env["LOVABLE_API_KEY"];
        const gmail = process.env["GOOGLE_MAIL_API_KEY"];
        if (!lovable || !gmail) return Response.json({ error: "Gmail is not connected." }, { status: 500 });
        const { to, subject, body, html } = parsed.data;
        const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": gmail, "Content-Type": "application/json" },
          body: JSON.stringify({ raw: raw(to, subject, body, html) }),
        });
        if (!res.ok) {
          const t = await res.text();
          console.error(`Gmail send failed [${res.status}]: ${t}`);
          return Response.json({ error: `Gmail couldn't send it (${res.status}).` }, { status: res.status });
        }
        const data = (await res.json()) as { id?: string };
        // Delivery check: if it was sent to the connected account itself, confirm it landed in the Inbox.
        let delivered: "inbox" | "sent" = "sent";
        try {
          const h = { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": gmail };
          const prof = (await (await fetch(`${GATEWAY_URL}/users/me/profile`, { headers: h })).json()) as { emailAddress?: string };
          if (prof.emailAddress?.toLowerCase() === to.toLowerCase() && data.id) {
            // Gmail files self-sent API mail under SENT only — place it in the Inbox too.
            await fetch(`${GATEWAY_URL}/users/me/messages/${data.id}/modify`, {
              method: "POST",
              headers: { ...h, "Content-Type": "application/json" },
              body: JSON.stringify({ addLabelIds: ["INBOX", "UNREAD"] }),
            });
            for (let i = 0; i < 4 && delivered === "sent"; i++) {
              const m = (await (await fetch(`${GATEWAY_URL}/users/me/messages/${data.id}?format=minimal`, { headers: h })).json()) as { labelIds?: string[] };
              if (m.labelIds?.includes("INBOX")) delivered = "inbox";
              else await new Promise((r) => setTimeout(r, 1200));
            }
          }
        } catch (e) {
          console.error("Inbox check failed", e);
        }
        return Response.json({ ok: true, id: data.id, delivered, sentAt: new Date().toISOString() });
      },
    },
  },
});
