import { getDb } from "../../core";
import type { Identifier } from "../domain/identifier";
import { phoneEmail } from "../domain/identifier";
import { getAuth } from "./auth";

export type Membership = {
  schoolId: string;
  schoolName: string;
  roles: string[];
  classIds: string[];
  subjectIds: string[];
};

const membershipSelect = {
  schoolId: true,
  roles: true,
  classIds: true,
  subjectIds: true,
  school: { select: { name: true } },
} as const;

function toMembership(row: {
  schoolId: string;
  roles: string[];
  classIds: string[];
  subjectIds: string[];
  school: { name: string };
}): Membership {
  return {
    schoolId: row.schoolId,
    schoolName: row.school.name,
    roles: row.roles,
    classIds: row.classIds,
    subjectIds: row.subjectIds,
  };
}

export async function findUserByIdentifier(identifier: Identifier): Promise<{ id: string; email: string } | null> {
  return getDb().user.findUnique({
    where: identifier.kind === "email" ? { email: identifier.value } : { phoneNumber: identifier.value },
    select: { id: true, email: true },
  });
}

export async function listMemberships(userId: string): Promise<Membership[]> {
  const rows = await getDb().membership.findMany({
    where: { userId },
    select: membershipSelect,
    orderBy: { school: { name: "asc" } },
  });
  return rows.map(toMembership);
}

export async function findMembership(userId: string, schoolId: string): Promise<Membership | null> {
  const row = await getDb().membership.findUnique({
    where: { userId_schoolId: { userId, schoolId } },
    select: membershipSelect,
  });
  return row ? toMembership(row) : null;
}

export async function setActiveSchool(sessionToken: string, schoolId: string): Promise<void> {
  await getDb().session.update({ where: { token: sessionToken }, data: { activeSchoolId: schoolId } });
}

export async function deleteUserSessions(userId: string): Promise<number> {
  const { count } = await getDb().session.deleteMany({ where: { userId } });
  return count;
}

// Hashes with better-auth's own hasher (scrypt) so signInEmail can verify it.
// Used by tests now and by the Director's user screens in entry 1.7.
export async function createStaffUser(input: {
  name: string;
  email?: string;
  phoneNumber?: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const email = input.email?.trim().toLowerCase() ?? (input.phoneNumber ? phoneEmail(input.phoneNumber) : null);
  if (!email) throw new Error("createStaffUser needs an email or a phone number");
  const ctx = await getAuth().$context;
  const hash = await ctx.password.hash(input.password);
  const db = getDb();
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email, phoneNumber: input.phoneNumber ?? null, emailVerified: false },
      select: { id: true, email: true },
    });
    await tx.account.create({
      data: { userId: user.id, accountId: user.id, providerId: "credential", password: hash },
    });
    return user;
  });
}

export async function addMembership(input: {
  userId: string;
  schoolId: string;
  roles: string[];
  classIds?: string[];
  subjectIds?: string[];
}): Promise<void> {
  await getDb().membership.create({
    data: {
      userId: input.userId,
      schoolId: input.schoolId,
      roles: input.roles,
      classIds: input.classIds ?? [],
      subjectIds: input.subjectIds ?? [],
    },
  });
}
