"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { chooseSchool } from "@/modules/platform";

export async function chooseSchoolAction(formData: FormData): Promise<void> {
  const result = await chooseSchool(await headers(), formData.get("schoolId"));
  redirect(result.ok ? "/" : "/choose-school?error=forbidden");
}
