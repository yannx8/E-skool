import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { parseConfig } from "../../src/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { type Actor, defineCommand, setModuleEnabled, withSchool } from "../../src/modules/core";
import { getDb } from "../../src/modules/core/data/db";

// Commands run through getDb() as eskool_app; the owner only seeds, inspects and cleans up.
const { DIRECT_URL } = parseConfig(process.env);
if (!DIRECT_URL) throw new Error("commands.test needs DIRECT_URL");
const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: DIRECT_URL }) });
const app = getDb();

const director: Actor = { kind: "user", id: randomUUID(), roles: ["director"], classIds: [] };
const cashier: Actor = { kind: "user", id: randomUUID(), roles: ["cashier"], classIds: [] };
const schools: string[] = [];

async function newSchool(): Promise<string> {
  const id = (await owner.school.create({ data: { name: "Commands test" } })).id;
  schools.push(id);
  return id;
}

async function auditCount(schoolId: string): Promise<number> {
  const rows = await owner.$queryRaw<{ n: number }[]>`
    select count(*)::int as n from audit_log where school_id = ${schoolId}::uuid`;
  return rows[0].n;
}

async function modules(schoolId: string): Promise<string[]> {
  const rows = await owner.$queryRaw<{ modules: string[] }[]>`
    select modules from school_settings where school_id = ${schoolId}::uuid`;
  return rows[0]?.modules ?? [];
}

// A test command in the fees Module that touches nothing but its Audit row.
const feesProbe = defineCommand({
  name: "test.feesProbe",
  permission: "payments.record",
  module: "fees",
  writes: true,
  schema: z.object({}),
  async handler(_tx, _input, ctx) {
    return { data: { done: true }, audit: { entity: "school_settings", entityId: ctx.schoolId, fields: ["probe"] } };
  },
});

let school: string;

beforeAll(async () => {
  school = await newSchool();
});

afterAll(async () => {
  // audit_log rejects DELETE by trigger; replica mode (owner, superuser) skips triggers for cleanup only.
  await owner.$transaction(async (tx) => {
    await tx.$executeRaw`set local session_replication_role = replica`;
    await tx.$executeRaw`delete from audit_log where school_id = any(${schools}::uuid[])`;
    await tx.$executeRaw`delete from command_requests where school_id = any(${schools}::uuid[])`;
    await tx.$executeRaw`delete from school_settings where school_id = any(${schools}::uuid[])`;
    await tx.$executeRaw`delete from schools where id = any(${schools}::uuid[])`;
  });
  await owner.$disconnect();
  await app.$disconnect();
});

describe("setModuleEnabled", () => {
  it("lets the Director switch fees off, with one Audit row", async () => {
    const result = await setModuleEnabled.run(
      { schoolId: school, actor: director },
      { module: "fees", enabled: false, requestId: randomUUID() },
    );
    expect(result).toEqual({ ok: true, data: { modules: ["report_cards"] } });
    expect(await modules(school)).toEqual(["report_cards"]);

    const rows = await owner.$queryRaw<Record<string, unknown>[]>`
      select actor_kind, actor_id::text, command, entity, entity_id::text, fields
      from audit_log where school_id = ${school}::uuid`;
    expect(rows).toEqual([
      {
        actor_kind: "user",
        actor_id: director.id,
        command: "core.setModuleEnabled",
        entity: "school_settings",
        entity_id: school,
        fields: ["modules"],
      },
    ]);
  });

  it("refuses a Cashier and writes nothing", async () => {
    const before = await auditCount(school);
    const result = await setModuleEnabled.run(
      { schoolId: school, actor: cashier },
      { module: "fees", enabled: true, requestId: randomUUID() },
    );
    expect(result).toEqual({ ok: false, error: { code: "forbidden", messageKey: "errors.forbidden" } });
    expect(await auditCount(school)).toBe(before);
    expect(await modules(school)).toEqual(["report_cards"]);
  });

  it("rejects an unknown Module with the field name", async () => {
    const result = await setModuleEnabled.run(
      { schoolId: school, actor: director },
      { module: "library", enabled: true, requestId: randomUUID() },
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid_input", messageKey: "errors.invalid_input", field: "module" },
    });
  });

  it("rejects a write without a requestId", async () => {
    const result = await setModuleEnabled.run({ schoolId: school, actor: director }, { module: "fees", enabled: true });
    expect(result).toEqual({
      ok: false,
      error: { code: "invalid_input", messageKey: "errors.invalid_input", field: "requestId" },
    });
  });
});

describe("defineCommand guards", () => {
  it("refuses a command of a switched-off Module and writes nothing", async () => {
    const s = await newSchool();
    await setModuleEnabled.run({ schoolId: s, actor: director }, { module: "fees", enabled: false, requestId: randomUUID() });
    const before = await auditCount(s);
    const result = await feesProbe.run({ schoolId: s, actor: director }, { requestId: randomUUID() });
    expect(result).toEqual({ ok: false, error: { code: "module_off", messageKey: "errors.module_off" } });
    expect(await auditCount(s)).toBe(before);
  });

  it("refuses writes of a suspended School and still allows reads", async () => {
    const s = await newSchool();
    await setModuleEnabled.run({ schoolId: s, actor: director }, { module: "fees", enabled: true, requestId: randomUUID() });
    await owner.$executeRaw`update school_settings set subscription_state = 'suspended' where school_id = ${s}::uuid`;

    const write = await feesProbe.run({ schoolId: s, actor: director }, { requestId: randomUUID() });
    expect(write).toEqual({ ok: false, error: { code: "suspended", messageKey: "errors.suspended" } });

    const read = defineCommand({
      name: "test.read",
      permission: "reports.view",
      module: "fees",
      writes: false,
      schema: z.object({}),
      async handler() {
        return { data: { read: true } };
      },
    });
    const before = await auditCount(s);
    await expect(read.run({ schoolId: s, actor: director }, {})).resolves.toEqual({ ok: true, data: { read: true } });
    expect(await auditCount(s)).toBe(before);
  });

  it("returns the first result for a repeated requestId and audits once", async () => {
    const s = await newSchool();
    const input = { module: "whatsapp", enabled: true, requestId: randomUUID() };
    const first = await setModuleEnabled.run({ schoolId: s, actor: director }, input);
    await setModuleEnabled.run({ schoolId: s, actor: director }, { module: "report_cards", enabled: false, requestId: randomUUID() });
    const again = await setModuleEnabled.run({ schoolId: s, actor: director }, input);

    expect(first).toEqual({ ok: true, data: { modules: ["fees", "report_cards", "whatsapp"] } });
    expect(again).toEqual(first);
    expect(await auditCount(s)).toBe(2);
  });

  it("refuses a repeated requestId from another actor or with another input", async () => {
    const s = await newSchool();
    const requestId = randomUUID();
    await setModuleEnabled.run({ schoolId: s, actor: director }, { module: "whatsapp", enabled: true, requestId });
    const refused = {
      ok: false,
      error: { code: "invalid_input", messageKey: "errors.invalid_input", field: "requestId" },
    };
    const otherDirector: Actor = { kind: "user", id: randomUUID(), roles: ["director"], classIds: [] };
    await expect(
      setModuleEnabled.run({ schoolId: s, actor: otherDirector }, { module: "whatsapp", enabled: true, requestId }),
    ).resolves.toEqual(refused);
    await expect(
      setModuleEnabled.run({ schoolId: s, actor: director }, { module: "fees", enabled: false, requestId }),
    ).resolves.toEqual(refused);
    expect(await modules(s)).toEqual(["fees", "report_cards", "whatsapp"]);
  });

  it("records no Audit row and keeps the order for a no-op toggle", async () => {
    const s = await newSchool();
    const result = await setModuleEnabled.run(
      { schoolId: s, actor: director },
      { module: "fees", enabled: true, requestId: randomUUID() },
    );
    expect(result).toEqual({ ok: true, data: { modules: ["fees", "report_cards"] } });
    expect(await auditCount(s)).toBe(0);
    expect(await modules(s)).toEqual(["fees", "report_cards"]);
  });

  it("returns the stored result to a concurrent duplicate", async () => {
    const s = await newSchool();
    await setModuleEnabled.run({ schoolId: s, actor: director }, { module: "fees", enabled: true, requestId: randomUUID() });
    const before = await auditCount(s);
    const input = { requestId: randomUUID() };
    const [a, b] = await Promise.all([
      feesProbe.run({ schoolId: s, actor: director }, input),
      feesProbe.run({ schoolId: s, actor: director }, input),
    ]);
    expect(a).toEqual({ ok: true, data: { done: true } });
    expect(b).toEqual(a);
    expect(await auditCount(s)).toBe(before + 1);
  });

  it("rolls back and rethrows when the handler throws", async () => {
    const s = await newSchool();
    await setModuleEnabled.run({ schoolId: s, actor: director }, { module: "fees", enabled: true, requestId: randomUUID() });
    const before = await auditCount(s);
    const broken = defineCommand({
      name: "test.broken",
      permission: "settings.manage",
      module: "core",
      writes: true,
      schema: z.object({}),
      async handler(tx) {
        await tx.$executeRaw`update school_settings set modules = '{}' where school_id = ${s}::uuid`;
        throw new Error("boom");
      },
    });
    await expect(broken.run({ schoolId: s, actor: director }, { requestId: randomUUID() })).rejects.toThrow("boom");
    expect(await auditCount(s)).toBe(before);
    expect(await modules(s)).toEqual(["fees", "report_cards"]);
  });

  it("refuses a Teacher on a Class outside the Membership", async () => {
    const classId = randomUUID();
    const teacher: Actor = { kind: "user", id: randomUUID(), roles: ["teacher"], classIds: [randomUUID()] };
    const enterMark = defineCommand({
      name: "test.enterMark",
      permission: "marks.enter",
      module: "report_cards",
      writes: true,
      schema: z.object({ classId: z.uuid() }),
      resource: (input) => ({ classId: input.classId }),
      async handler(_tx, input) {
        return { data: {}, audit: { entity: "class", entityId: input.classId, fields: [] } };
      },
    });
    const result = await enterMark.run({ schoolId: school, actor: teacher }, { classId, requestId: randomUUID() });
    expect(result).toEqual({ ok: false, error: { code: "forbidden", messageKey: "errors.forbidden" } });
  });
});

describe("audit_log", () => {
  it("rejects UPDATE and DELETE from the app role", async () => {
    await expect(
      withSchool(school, (tx) => tx.$executeRaw`update audit_log set command = 'x' where school_id = ${school}::uuid`),
    ).rejects.toThrow(/permission denied/);
    await expect(
      withSchool(school, (tx) => tx.$executeRaw`delete from audit_log where school_id = ${school}::uuid`),
    ).rejects.toThrow(/permission denied/);
  });

  it("rejects UPDATE and DELETE even from the owner", async () => {
    await expect(owner.$executeRaw`update audit_log set command = 'x' where school_id = ${school}::uuid`).rejects.toThrow(
      /insert-only/,
    );
    await expect(owner.$executeRaw`delete from audit_log where school_id = ${school}::uuid`).rejects.toThrow(/insert-only/);
  });
});
