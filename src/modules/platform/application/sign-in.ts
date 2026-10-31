import { z } from "zod";
import { type CommandContext, type CommandResult, ROLES, type Role } from "../../core";
import { getAuth } from "../data/auth";
import { isLocked, recordAuthEvent } from "../data/auth-events";
import {
  type Membership,
  deleteUserSessions,
  findMembership,
  findUserByIdentifier,
  listMemberships,
  setActiveSchool,
} from "../data/memberships";
import { hashIdentifier, normaliseIdentifier } from "../domain/identifier";

export type SignInError = "auth.invalid" | "auth.locked";
// `headers` carries the session Set-Cookie (nextCookies also sets it inside a server action).
export type SignInResult =
  | { ok: true; next: "/" | "/choose-school"; headers: Headers }
  | { ok: false; error: SignInError };

// The only sign-in path (the better-auth HTTP handler is not mounted), so lockout always applies.
export async function signIn(input: {
  identifier: string;
  password: string;
  ip: string | null;
  headers: Headers;
}): Promise<SignInResult> {
  const identifier = normaliseIdentifier(input.identifier);
  // Unparseable input is hashed raw so it still counts towards its own lock and the IP cap.
  const identifierHash = hashIdentifier(identifier?.value ?? input.identifier.trim());
  const ip = input.ip;

  if (await isLocked(identifierHash, ip)) {
    await recordAuthEvent({ kind: "locked", identifierHash, ip });
    return { ok: false, error: "auth.locked" };
  }

  const user = identifier ? await findUserByIdentifier(identifier) : null;
  if (!user || !input.password) {
    // Same answer and about the same time as a wrong password: no user enumeration.
    await (await getAuth().$context).password.hash(input.password || "-");
    await recordAuthEvent({ kind: "failure", identifierHash, userId: user?.id, ip });
    return { ok: false, error: "auth.invalid" };
  }

  let signedIn: { headers: Headers; response: { token: string } };
  try {
    signedIn = await getAuth().api.signInEmail({
      body: { email: user.email, password: input.password },
      headers: input.headers,
      returnHeaders: true,
    });
  } catch {
    await recordAuthEvent({ kind: "failure", identifierHash, userId: user.id, ip });
    return { ok: false, error: "auth.invalid" };
  }
  await recordAuthEvent({ kind: "success", identifierHash, userId: user.id, ip });

  const memberships = await listMemberships(user.id);
  if (memberships.length === 1) {
    await setActiveSchool(signedIn.response.token, memberships[0].schoolId);
    return { ok: true, next: "/", headers: signedIn.headers };
  }
  // Several Schools: pick one. None: the picker says there is no School access.
  return { ok: true, next: "/choose-school", headers: signedIn.headers };
}

export type SignedIn = {
  user: { id: string; name: string };
  sessionToken: string;
  memberships: Membership[];
  activeSchool: Membership | null;
};

// An expired or deleted session reads as signed out (getSession returns null).
export async function getSignedIn(headers: Headers): Promise<SignedIn | null> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return null;
  const memberships = await listMemberships(session.user.id);
  const activeId = session.session.activeSchoolId;
  return {
    user: { id: session.user.id, name: session.user.name },
    sessionToken: session.session.token,
    memberships,
    activeSchool: memberships.find((m) => m.schoolId === activeId) ?? null,
  };
}

const schoolIdSchema = z.uuid();
const forbidden = { ok: false, error: { code: "forbidden", messageKey: "errors.forbidden" } } as const;

// The active School is set only where the User has a Membership.
export async function chooseSchool(headers: Headers, schoolId: unknown): Promise<CommandResult<{ schoolId: string }>> {
  const id = schoolIdSchema.safeParse(schoolId);
  if (!id.success) return forbidden;
  const session = await getAuth().api.getSession({ headers });
  if (!session) return forbidden;
  if (!(await findMembership(session.user.id, id.data))) return forbidden;
  await setActiveSchool(session.session.token, id.data);
  return { ok: true, data: { schoolId: id.data } };
}

// Scope ids come only from the Membership, never from the request.
export async function getCommandContext(headers: Headers): Promise<CommandContext | null> {
  const session = await getAuth().api.getSession({ headers });
  const schoolId = session?.session.activeSchoolId;
  if (!session || !schoolId) return null;
  const membership = await findMembership(session.user.id, schoolId);
  if (!membership) return null;
  return {
    schoolId,
    actor: {
      kind: "user",
      id: session.user.id,
      roles: membership.roles.filter((role): role is Role => (ROLES as readonly string[]).includes(role)),
      classIds: membership.classIds,
      subjectIds: membership.subjectIds,
    },
  };
}

export async function signOut(headers: Headers, ip: string | null = null): Promise<void> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return;
  await getAuth().api.signOut({ headers });
  await recordAuthEvent({ kind: "sign_out", userId: session.user.id, ip });
}

// Deletes every session of the User, this device included.
export async function signOutEverywhere(headers: Headers, ip: string | null = null): Promise<void> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return;
  await getAuth().api.signOut({ headers });
  await deleteUserSessions(session.user.id);
  await recordAuthEvent({ kind: "sign_out_all", userId: session.user.id, ip });
}
