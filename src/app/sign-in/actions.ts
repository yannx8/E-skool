"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut, signOutEverywhere } from "@/modules/platform";

// Set by the Vercel edge; locally absent, so the IP cap does not apply.
function clientIp(requestHeaders: Headers): string | null {
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export async function signInAction(formData: FormData): Promise<void> {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const result = await signIn({
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
    ip,
    headers: requestHeaders,
  });
  // nextCookies() has already set the session cookie on success.
  if (!result.ok) redirect(`/sign-in?error=${result.error === "auth.locked" ? "locked" : "invalid"}`);
  redirect(result.next);
}

export async function signOutAction(): Promise<void> {
  const requestHeaders = await headers();
  await signOut(requestHeaders, clientIp(requestHeaders));
  redirect("/sign-in");
}

export async function signOutEverywhereAction(): Promise<void> {
  const requestHeaders = await headers();
  await signOutEverywhere(requestHeaders, clientIp(requestHeaders));
  redirect("/sign-in");
}
