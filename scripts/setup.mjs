#!/usr/bin/env node
// One-time (and safe to re-run) production setup. Reads .env.local.
//
//   npm run setup
//
// 1. Applies every SQL migration to the Supabase database (supabase db push).
// 2. If SUPABASE_ACCESS_TOKEN is set: disables public sign-up, sets the site
//    URL for password-reset links and, with RESEND_API_KEY + EMAIL_FROM,
//    routes Supabase Auth emails through Resend (Supabase's built-in mailer
//    only delivers to project members).
// 3. Creates the first administrator account (ADMIN_EMAIL / ADMIN_PASSWORD).
// 4. Sets the school name (SCHOOL_NAME) if the settings still hold the default.
// 5. Prints the variables to paste into Vercel.

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const ok = (m) => console.log(`✔ ${m}`);
const warn = (m) => console.log(`! ${m}`);
const die = (m) => {
  console.error(`✘ ${m}`);
  process.exit(1);
};

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = env.SUPABASE_DB_URL;
const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["SUPABASE_SECRET_KEY", secret],
  ["SUPABASE_DB_URL", dbUrl],
  ["ADMIN_EMAIL", env.ADMIN_EMAIL],
  ["ADMIN_PASSWORD", env.ADMIN_PASSWORD],
].filter(([, v]) => !v);
if (missing.length)
  die(`Missing in .env.local: ${missing.map(([k]) => k).join(", ")} (see .env.example)`);
if (env.ADMIN_PASSWORD.length < 10) die("ADMIN_PASSWORD must be at least 10 characters.");

const ref = new URL(url).hostname.split(".")[0];

// 1. Migrations
console.log("Applying database migrations…");
try {
  // Run the CLI through Node itself: spawning "npx" without a shell fails on Windows.
  const cli = createRequire(import.meta.url).resolve("supabase/dist/supabase.js");
  execFileSync(process.execPath, [cli, "db", "push", "--db-url", dbUrl, "--include-all", "--yes"], {
    stdio: "inherit",
  });
  ok("Database schema is up to date");
} catch (e) {
  if (e && e.code === "ENOENT") die(`Cannot launch the Supabase CLI (${e.message}). Run npm install first.`);
  die(
    "Migrations failed. Read the error printed above. If it mentions the connection, check SUPABASE_DB_URL (Session pooler string, password percent-encoded).",
  );
}

// 2. Auth configuration through the Management API
if (env.SUPABASE_ACCESS_TOKEN) {
  const site = (env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const config = { disable_signup: true, external_email_enabled: true };
  if (site) {
    config.site_url = site;
    config.uri_allow_list = `${site}/**`;
  }
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const m = /^(.*?)\s*<([^>]+)>$/.exec(env.EMAIL_FROM);
    Object.assign(config, {
      smtp_host: "smtp.resend.com",
      smtp_port: "465",
      smtp_user: "resend",
      smtp_pass: env.RESEND_API_KEY,
      smtp_admin_email: m ? m[2] : env.EMAIL_FROM,
      smtp_sender_name: m ? m[1] || "E-skool" : "E-skool",
    });
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });
  if (res.ok)
    ok(
      `Auth configured (sign-up disabled${site ? ", site URL set" : ""}${config.smtp_host ? ", emails via Resend" : ""})`,
    );
  else
    warn(
      `Auth configuration failed (${res.status}): ${await res.text()}. Do it by hand: see README, step 4.`,
    );
} else {
  warn(
    "SUPABASE_ACCESS_TOKEN not set: disable sign-ups and set the Site URL by hand (README, step 4).",
  );
}

// 3. First administrator
const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = env.ADMIN_EMAIL.trim().toLowerCase();
let userId;
for (let page = 1; !userId; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) die(`Cannot list users: ${error.message}`);
  userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
  if (data.users.length < 200) break;
}
if (!userId) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: env.ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: env.ADMIN_NAME || "Administration" },
  });
  if (error) die(`Cannot create the admin user: ${error.message}`);
  userId = data.user.id;
  ok(`Admin account created: ${email}`);
} else {
  ok(`Admin account already exists: ${email}`);
}
const { error: roleError } = await admin
  .from("user_roles")
  .upsert({
    user_id: userId,
    role: "admin",
    full_name: env.ADMIN_NAME || "Administration",
    is_active: true,
  });
if (roleError) die(`Cannot grant the admin role: ${roleError.message}`);
ok("Admin role granted");

// 4. School name
if (env.SCHOOL_NAME) {
  const { error } = await admin
    .from("settings")
    .update({ school_name: env.SCHOOL_NAME })
    .eq("id", true)
    .eq("school_name", "Mon école");
  if (error) warn(`School name not set: ${error.message}`);
  else ok("School name checked");
}

// 5. Vercel variables
const vercelVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_SECRET_KEY",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "BACKUP_EMAIL",
  "REPORT_EMAILS",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_TEMPLATE_NAME",
  "WHATSAPP_TEMPLATE_LANG",
];
console.log("\nPaste these into Vercel > Project > Settings > Environment Variables (Production):");
for (const k of vercelVars) {
  console.log(
    `  ${k}${env[k] ? "  (set)" : "  (empty: optional unless marked required in .env.example)"}`,
  );
}
if (!env.CRON_SECRET)
  warn(
    "CRON_SECRET is empty: weekly backups will not run. Generate one with: openssl rand -hex 32",
  );
console.log("\nDone. Sign in with ADMIN_EMAIL and follow the checklist on the dashboard.");
