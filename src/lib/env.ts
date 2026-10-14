// Environment access in one place. Public values are inlined at build time, so
// they must be read with their literal names.

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, ""),
};

export function assertPublicEnv() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set.",
    );
  }
}

/** Server-only secrets. Call from server code only. */
export function serverEnv() {
  return {
    serviceRoleKey: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    cronSecret: process.env.CRON_SECRET ?? "",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    emailFrom: process.env.EMAIL_FROM ?? "",
    backupEmail: process.env.BACKUP_EMAIL ?? "",
    reportEmails: (process.env.REPORT_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME ?? "",
    whatsappTemplateLang: process.env.WHATSAPP_TEMPLATE_LANG ?? "fr",
    whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? "v23.0",
  };
}
