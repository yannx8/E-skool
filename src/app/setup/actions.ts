"use server";

import { db } from "@/lib/db";
import { act, need, str } from "@/lib/act";
import { hashPassword, startSession } from "@/lib/auth";
import { bootstrapSchool } from "@/lib/bootstrap";
import { normalizePhone } from "@/lib/format";

export async function setup(fd: FormData) {
  return act(async () => {
    if (await db.school.findUnique({ where: { id: 1 } })) return { error: "This school is already set up.", go: "/login" };
    const password = need(str(fd, "password"), "Password");
    if (password.length < 8) return { error: "The password needs at least 8 characters." };
    const classes = (str(fd, "classes") ?? "").split("\n").map((c) => c.trim()).filter(Boolean);
    if (!classes.length) return { error: "Add at least one class." };
    const { admin } = await bootstrapSchool(db, {
      school: need(str(fd, "school"), "School name"),
      address: str(fd, "address"),
      phone: normalizePhone(str(fd, "phone")),
      adminName: need(str(fd, "adminName"), "Your name"),
      username: need(str(fd, "username"), "Username"),
      passwordHash: await hashPassword(password),
      yearName: need(str(fd, "yearName"), "Year name"),
      startsOn: need(str(fd, "startsOn"), "Start date"),
      endsOn: need(str(fd, "endsOn"), "End date"),
      classes,
    });
    await startSession(admin.id);
    return { ok: "School created. Now fill in the fee table.", go: "/settings/fees" };
  });
}
