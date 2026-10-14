import "server-only";
import { serverEnv } from "@/lib/env";

type Attachment = { filename: string; content: Uint8Array };

/** Sends an email through Resend's HTTP API. Returns false when not configured or on failure. */
export async function sendEmail(input: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Attachment[];
}): Promise<boolean> {
  const { resendApiKey, emailFrom } = serverEnv();
  if (!resendApiKey || !emailFrom || input.to.length === 0) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: emailFrom,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString("base64"),
        })),
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}
