"use server";

import { cookies } from "next/headers";
import { getAppUser, getSchoolYears, YEAR_COOKIE } from "@/lib/auth";

/** Remembers which school year the user is looking at (header switcher). */
export async function setActiveYear(yearId: string) {
  const user = await getAppUser();
  if (!user?.role) return;
  const years = await getSchoolYears();
  if (!years.some((y) => y.id === yearId)) return;
  (await cookies()).set(YEAR_COOKIE, yearId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
