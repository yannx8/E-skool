"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { parseLanguage } from "@/modules/core";
import { LANGUAGE_COOKIE } from "@/i18n/language-cookie";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setLanguage(formData: FormData): Promise<void> {
  const language = parseLanguage(formData.get("lang"));
  const store = await cookies();
  store.set(LANGUAGE_COOKIE, language, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
  });
  revalidatePath("/", "layout");
}
