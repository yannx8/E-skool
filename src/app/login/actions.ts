"use server";

import { db } from "@/lib/db";
import { act, str } from "@/lib/act";
import { startSession, verifyPassword } from "@/lib/auth";

export async function login(fd: FormData) {
  return act(async () => {
    const username = (str(fd, "username") ?? "").toLowerCase();
    const user = await db.user.findUnique({ where: { username } });
    const ok = user?.active && (await verifyPassword(str(fd, "password") ?? "", user.passwordHash));
    if (!user || !ok) return { error: "Wrong username or password." };
    await startSession(user.id);
    return { go: "/" };
  });
}
