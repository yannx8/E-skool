import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/generated/prisma/client";
import { db } from "./db";

export { hashPassword, verifyPassword } from "./password";

const COOKIE = "eskool_session";
const DAYS = 14;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DAYS * 86_400_000);
  await db.session.create({ data: { id: sha(token), userId, expiresAt } });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  // Not "secure": the app is served over plain http on the school network.
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", expires: expiresAt });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha(token) } });
  jar.delete(COOKIE);
}

export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { id: sha(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || !s.user.active) return null;
  return s.user;
});

export type User = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** Pages and actions call this first. Roles listed are the ones allowed. */
export async function requireUser(...roles: Role[]): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role)) throw new Error("You do not have permission to do this.");
  return user;
}

export const can = {
  collect: (u: User) => u.role !== "OWNER",
  manage: (u: User) => u.role === "ADMIN",
};
