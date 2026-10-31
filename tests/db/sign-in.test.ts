import { randomInt, randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseConfig } from "../../src/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { getDb, withSchool } from "../../src/modules/core";
import {
  addMembership,
  chooseSchool,
  createStaffUser,
  getCommandContext,
  getSignedIn,
  hashIdentifier,
  signIn,
  signOut,
  signOutEverywhere,
} from "../../src/modules/platform";

// Sign-in runs as eskool_app through getDb(); the owner seeds, inspects and cleans up.
const { DIRECT_URL } = parseConfig(process.env);
if (!DIRECT_URL) throw new Error("sign-in.test needs DIRECT_URL");
const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: DIRECT_URL }) });

const PASSWORD = "correct horse battery";
const schools: string[] = [];
const users: string[] = [];

// A fresh IP per test so the 20-per-IP cap never leaks between tests.
const newIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

async function newSchool(name: string, subscriptionState = "active"): Promise<string> {
  const id = (await owner.school.create({ data: { name, settings: { create: { subscriptionState } } } })).id;
  schools.push(id);
  return id;
}

async function newUser(input: { email?: string; phoneNumber?: string } = {}) {
  const user = await createStaffUser({
    name: "Test staff",
    email: input.email ?? (input.phoneNumber ? undefined : `${randomUUID()}@school.cm`),
    phoneNumber: input.phoneNumber,
    password: PASSWORD,
  });
  users.push(user.id);
  return user;
}

// Turns the Set-Cookie of a sign-in into the Cookie header of the next request.
function cookieOf(headers: Headers): Headers {
  return new Headers({ cookie: headers.getSetCookie().map((c) => c.split(";")[0]).join("; ") });
}

async function signedInCookie(identifier: string, ip = newIp()) {
  const result = await signIn({ identifier, password: PASSWORD, ip, headers: new Headers() });
  if (!result.ok) throw new Error(`sign-in failed: ${result.error}`);
  return { result, cookie: cookieOf(result.headers) };
}

async function events(identifierHash: string) {
  return owner.$queryRaw<{ kind: string; user_id: string | null; ip: string | null }[]>`
    select kind, user_id::text, ip from auth_events where identifier_hash = ${identifierHash} order by at, id`;
}

let schoolA: string;
let schoolB: string;
let schoolC: string;

beforeAll(async () => {
  schoolA = await newSchool("Ecole A");
  schoolB = await newSchool("Ecole B");
  schoolC = await newSchool("Ecole C");
});

afterAll(async () => {
  // auth_events rejects DELETE by trigger; replica mode (owner, superuser) skips triggers for cleanup only.
  await owner.$transaction(async (tx) => {
    await tx.$executeRaw`set local session_replication_role = replica`;
    await tx.$executeRaw`delete from auth_events where user_id = any(${users}::uuid[]) or ip like '10.%'`;
    await tx.$executeRaw`delete from users where id = any(${users}::uuid[])`;
    await tx.$executeRaw`delete from school_settings where school_id = any(${schools}::uuid[])`;
    await tx.$executeRaw`delete from schools where id = any(${schools}::uuid[])`;
  });
  await owner.$disconnect();
  await getDb().$disconnect();
});

describe("signIn", () => {
  it.each(["6 77 12 34 56", "00237677123456"])("signs in by phone written as %s", async (written) => {
    const phone = "+237677123456";
    const user = (await owner.user.findUnique({ where: { phoneNumber: phone } })) ?? (await newUser({ phoneNumber: phone }));
    const ip = newIp();
    const { result, cookie } = await signedInCookie(written, ip);

    expect(result.headers.getSetCookie().join()).toContain("session_token");
    expect((await getSignedIn(cookie))?.user.id).toBe(user.id);
    const logged = (await events(hashIdentifier(phone))).filter((e) => e.ip === ip);
    expect(logged).toEqual([{ kind: "success", user_id: user.id, ip }]);
  });

  it("matches an email case-insensitively", async () => {
    const email = `dir-${randomUUID()}@school.cm`;
    const user = await newUser({ email });
    const { cookie } = await signedInCookie(` ${email.replace("dir", "Dir").replace("school", "School")} `);
    expect((await getSignedIn(cookie))?.user.id).toBe(user.id);
  });

  it("locks after 5 failures, even for the right password, and logs `locked`", async () => {
    const user = await newUser();
    const ip = newIp();
    for (let i = 0; i < 5; i++) {
      expect(await signIn({ identifier: user.email, password: "wrong", ip, headers: new Headers() })).toEqual({
        ok: false,
        error: "auth.invalid",
      });
    }
    expect(await signIn({ identifier: user.email, password: PASSWORD, ip, headers: new Headers() })).toEqual({
      ok: false,
      error: "auth.locked",
    });
    const kinds = (await events(hashIdentifier(user.email))).map((e) => e.kind);
    expect(kinds).toEqual(["failure", "failure", "failure", "failure", "failure", "locked"]);
    const raw = await owner.$queryRaw<{ n: number }[]>`
      select count(*)::int as n from auth_events where identifier_hash = ${user.email}`;
    expect(raw[0].n).toBe(0);
  });

  it("unlocks 15 minutes after the 5th failure", async () => {
    const user = await newUser();
    const hash = hashIdentifier(user.email);
    for (let i = 0; i < 5; i++) {
      await owner.$executeRaw`
        insert into auth_events (kind, identifier_hash, user_id, at)
        values ('failure', ${hash}, ${user.id}::uuid, now() - interval '16 minutes')`;
    }
    expect((await signIn({ identifier: user.email, password: PASSWORD, ip: newIp(), headers: new Headers() })).ok).toBe(true);
  });

  it("caps one IP at 20 failures in 15 minutes", async () => {
    const user = await newUser();
    const ip = newIp();
    await owner.$executeRaw`
      insert into auth_events (kind, identifier_hash, ip)
      select 'failure', md5(g::text) || md5(g::text), ${ip} from generate_series(1, 20) g`;
    expect(await signIn({ identifier: user.email, password: PASSWORD, ip, headers: new Headers() })).toEqual({
      ok: false,
      error: "auth.locked",
    });
  });

  it("answers an unknown identifier like a wrong password and logs the failure", async () => {
    const email = `nobody-${randomUUID()}@school.cm`;
    const ip = newIp();
    expect(await signIn({ identifier: email, password: PASSWORD, ip, headers: new Headers() })).toEqual({
      ok: false,
      error: "auth.invalid",
    });
    expect(await events(hashIdentifier(email))).toEqual([{ kind: "failure", user_id: null, ip }]);
  });
});

describe("Memberships and the active School", () => {
  it("sets the only School as active and builds the CommandContext from the Membership", async () => {
    const user = await newUser();
    const classId = randomUUID();
    await addMembership({ userId: user.id, schoolId: schoolA, roles: ["teacher"], classIds: [classId] });
    const { result, cookie } = await signedInCookie(user.email);

    expect(result.ok && result.next).toBe("/");
    expect(await getCommandContext(cookie)).toEqual({
      schoolId: schoolA,
      actor: { kind: "user", id: user.id, roles: ["teacher"], classIds: [classId], subjectIds: [] },
    });
  });

  it("with two Schools, picks B and a withSchool read sees no School A rows", async () => {
    const user = await newUser();
    await addMembership({ userId: user.id, schoolId: schoolA, roles: ["director"] });
    await addMembership({ userId: user.id, schoolId: schoolB, roles: ["cashier"] });
    const { result, cookie } = await signedInCookie(user.email);

    expect(result.ok && result.next).toBe("/choose-school");
    expect((await getSignedIn(cookie))?.memberships.map((m) => m.schoolId).sort()).toEqual([schoolA, schoolB].sort());
    expect(await getCommandContext(cookie)).toBeNull();

    expect(await chooseSchool(cookie, schoolB)).toEqual({ ok: true, data: { schoolId: schoolB } });
    const ctx = await getCommandContext(cookie);
    expect(ctx).toEqual({
      schoolId: schoolB,
      actor: { kind: "user", id: user.id, roles: ["cashier"], classIds: [], subjectIds: [] },
    });
    const seen = await withSchool(ctx!.schoolId, (tx) => tx.schoolSettings.findMany({ select: { schoolId: true } }));
    expect(seen).toEqual([{ schoolId: schoolB }]);
  });

  it("refuses a forged pick and leaves the active School unchanged", async () => {
    const user = await newUser();
    await addMembership({ userId: user.id, schoolId: schoolA, roles: ["director"] });
    const { cookie } = await signedInCookie(user.email);

    expect(await chooseSchool(cookie, schoolC)).toEqual({
      ok: false,
      error: { code: "forbidden", messageKey: "errors.forbidden" },
    });
    expect(await chooseSchool(cookie, "not-a-uuid")).toMatchObject({ ok: false });
    expect((await getCommandContext(cookie))?.schoolId).toBe(schoolA);
  });

  it("signs in a User without Membership, who has no School and no context", async () => {
    const user = await newUser();
    const { result, cookie } = await signedInCookie(user.email);

    expect(result.ok && result.next).toBe("/choose-school");
    expect(await getSignedIn(cookie)).toMatchObject({ memberships: [], activeSchool: null });
    expect(await getCommandContext(cookie)).toBeNull();
  });

  it("still signs in to a suspended School", async () => {
    const suspended = await newSchool("Ecole suspendue", "suspended");
    const user = await newUser();
    await addMembership({ userId: user.id, schoolId: suspended, roles: ["director"] });
    const { cookie } = await signedInCookie(user.email);
    expect((await getCommandContext(cookie))?.schoolId).toBe(suspended);
  });

  it("returns null without a session", async () => {
    expect(await getCommandContext(new Headers())).toBeNull();
  });
});

describe("sessions", () => {
  it("signs out one device and logs it", async () => {
    const user = await newUser();
    const a = await signedInCookie(user.email);
    const b = await signedInCookie(user.email);

    await signOut(a.cookie);
    expect(await getSignedIn(a.cookie)).toBeNull();
    expect(await getSignedIn(b.cookie)).not.toBeNull();
    const rows = await owner.$queryRaw<{ kind: string }[]>`
      select kind from auth_events where user_id = ${user.id}::uuid and identifier_hash is null`;
    expect(rows).toEqual([{ kind: "sign_out" }]);
  });

  it("signs out everywhere from device A: every session gone, event logged", async () => {
    const user = await newUser();
    const a = await signedInCookie(user.email);
    const b = await signedInCookie(user.email);

    await signOutEverywhere(a.cookie);
    expect(await getSignedIn(a.cookie)).toBeNull();
    expect(await getSignedIn(b.cookie)).toBeNull();
    expect(await owner.session.count({ where: { userId: user.id } })).toBe(0);
    const rows = await owner.$queryRaw<{ kind: string }[]>`
      select kind from auth_events where user_id = ${user.id}::uuid and identifier_hash is null`;
    expect(rows).toEqual([{ kind: "sign_out_all" }]);
  });

  it("treats an expired session as signed out", async () => {
    const user = await newUser();
    await addMembership({ userId: user.id, schoolId: schoolA, roles: ["director"] });
    const { cookie } = await signedInCookie(user.email);

    await owner.$executeRaw`update sessions set expires_at = now() - interval '1 minute' where user_id = ${user.id}::uuid`;
    expect(await getSignedIn(cookie)).toBeNull();
    expect(await getCommandContext(cookie)).toBeNull();
  });

  it("gives eskool_app no way to rewrite auth_events", async () => {
    await expect(getDb().$executeRaw`update auth_events set kind = 'success' where false`).rejects.toThrow();
  });
});

describe("HTTP surface", () => {
  // Not mounted: /api/auth/* has no route, so it 404s and lockout cannot be bypassed.
  it("mounts no better-auth handler", () => {
    expect(existsSync("src/app/api")).toBe(false);
    const sources = readdirSync("src", { recursive: true, encoding: "utf8" })
      .filter((p) => /\.tsx?$/.test(p) && !p.startsWith("generated"))
      .map((p) => readFileSync(`src/${p}`, "utf8"));
    expect(sources.some((s) => s.includes("toNextJsHandler"))).toBe(false);
  });
});
