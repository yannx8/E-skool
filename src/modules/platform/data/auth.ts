import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getConfig } from "../../../config";
import { getDb } from "../../core";

const DAY_SECONDS = 60 * 60 * 24;

function createAuth() {
  const config = getConfig();
  return betterAuth({
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    // Staff accounts are created by the Director (entry 1.7); nobody signs up.
    emailAndPassword: { enabled: true, disableSignUp: true },
    session: {
      expiresIn: 30 * DAY_SECONDS,
      updateAge: DAY_SECONDS,
      additionalFields: { activeSchoolId: { type: "string", required: false, input: false } },
    },
    user: {
      additionalFields: { phoneNumber: { type: "string", required: false, input: false } },
    },
    // audit_log.actor_id and memberships.user_id are uuid columns.
    advanced: { database: { generateId: "uuid" } },
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let cached: Auth | undefined;

// Created on first use, so importing never reads the environment (build time).
// No HTTP handler is mounted: every call goes through auth.api from platform/application.
export function getAuth(): Auth {
  cached ??= createAuth();
  return cached;
}
