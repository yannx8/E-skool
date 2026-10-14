import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Sends an approved WhatsApp template through Meta's Cloud API. The template
 * body must have exactly 5 variables, in this order:
 *   {{1}} parent, {{2}} pupil, {{3}} amount due, {{4}} period, {{5}} school.
 * Returns the provider message id, or throws with the provider's error.
 */
export async function sendWhatsappTemplate(to: string, params: [string, string, string, string, string]): Promise<string> {
  const env = serverEnv();
  if (!env.whatsappToken || !env.whatsappPhoneNumberId || !env.whatsappTemplateName) {
    throw new Error("WhatsApp Cloud API is not configured");
  }
  const res = await fetch(
    `https://graph.facebook.com/${env.whatsappApiVersion}/${encodeURIComponent(env.whatsappPhoneNumberId)}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.whatsappToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: env.whatsappTemplateName,
          language: { code: env.whatsappTemplateLang },
          components: [
            {
              type: "body",
              parameters: params.map((text) => ({ type: "text", text: text.trim() || "-" })),
            },
          ],
        },
      }),
    },
  );
  const body = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
  if (!res.ok || !body.messages?.[0]?.id) {
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return body.messages[0].id;
}

export function whatsappConfigured(): boolean {
  const env = serverEnv();
  return !!(env.whatsappToken && env.whatsappPhoneNumberId && env.whatsappTemplateName);
}
