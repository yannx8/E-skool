import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { parseConfig } from "../../src/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { checkTenantTables, globalTables, tenantTables, withSchool } from "../../src/modules/core";
import { getDb } from "../../src/modules/core/data/db";

// The probe is the only tenant table in the db suite. It is created by the owner, then
// the migration helper turns on RLS, exactly as a real module table would.
const probeManifest = { tenant: [...tenantTables, "rls_probe"], global: globalTables };

const { DIRECT_URL, DATABASE_URL } = parseConfig(process.env);
if (!DIRECT_URL) throw new Error("tenancy.test needs DIRECT_URL");
const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: DIRECT_URL }) });
const app = getDb();

let schoolA: string;
let schoolB: string;
let rowB: string;

beforeAll(async () => {
  await owner.$executeRaw`drop table if exists rls_probe`;
  await owner.$executeRaw`drop table if exists rls_planted`;
  await owner.$executeRaw`
    create table rls_probe (
      school_id uuid not null references schools (id),
      id uuid not null default gen_random_uuid(),
      label text not null,
      primary key (school_id, id)
    )`;
  await owner.$executeRaw`do $$ begin perform app_enable_tenant_rls('rls_probe'); end $$`;

  schoolA = (await owner.school.create({ data: { name: "School A" } })).id;
  schoolB = (await owner.school.create({ data: { name: "School B" } })).id;

  await withSchool(schoolA, (tx) => tx.$executeRaw`insert into rls_probe (school_id, label) values (${schoolA}::uuid, 'a-row')`, owner);
  const inserted = await withSchool(
    schoolB,
    (tx) => tx.$queryRaw<{ id: string }[]>`insert into rls_probe (school_id, label) values (${schoolB}::uuid, 'b-row') returning id`,
    owner,
  );
  rowB = inserted[0].id;
});

afterAll(async () => {
  await owner.$executeRaw`drop table if exists rls_planted`;
  await owner.$executeRaw`drop table if exists rls_probe`;
  await owner.school.deleteMany({ where: { id: { in: [schoolA, schoolB] } } });
  await owner.$disconnect();
  await app.$disconnect();
});

describe("app role", () => {
  it("cannot bypass RLS and is not a superuser", async () => {
    const rows = await app.$queryRaw<{ rolbypassrls: boolean; rolsuper: boolean }[]>`
      select rolbypassrls, rolsuper from pg_roles where rolname = current_user`;
    expect(rows).toEqual([{ rolbypassrls: false, rolsuper: false }]);
    expect(DATABASE_URL).toContain("eskool_app");
  });
});

describe("withSchool isolation", () => {
  it("returns only the School's own rows", async () => {
    const rows = await withSchool(schoolA, (tx) => tx.$queryRaw<{ label: string }[]>`select label from rls_probe`);
    expect(rows.map((row) => row.label)).toEqual(["a-row"]);
  });

  it("hides another School's row even when its id is known", async () => {
    const rows = await withSchool(schoolA, (tx) =>
      tx.$queryRaw`select id from rls_probe where id = ${rowB}::uuid`,
    );
    expect(rows).toEqual([]);
  });

  it("rejects an insert that points at another School", async () => {
    await expect(
      withSchool(schoolA, (tx) =>
        tx.$executeRaw`insert into rls_probe (school_id, label) values (${schoolB}::uuid, 'intruder')`,
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("updates and deletes no row of another School", async () => {
    const updated = await withSchool(schoolA, (tx) =>
      tx.$executeRaw`update rls_probe set label = 'hijacked' where id = ${rowB}::uuid`,
    );
    const deleted = await withSchool(schoolA, (tx) =>
      tx.$executeRaw`delete from rls_probe where id = ${rowB}::uuid`,
    );
    expect(updated).toBe(0);
    expect(deleted).toBe(0);
  });

  it("sees zero rows when app.school_id is set to an empty string", async () => {
    const rows = await app.$transaction(async (tx) => {
      await tx.$queryRaw`select set_config('app.school_id', '', true)`;
      return tx.$queryRaw<{ n: number }[]>`select count(*)::int as n from rls_probe`;
    });
    expect(rows[0].n).toBe(0);
  });

  it("sees zero rows outside withSchool", async () => {
    const rows = await app.$queryRaw<{ n: number }[]>`select count(*)::int as n from rls_probe`;
    expect(rows[0].n).toBe(0);
  });

  it("does not leak context to the next transaction on a pool of one", async () => {
    const pool = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL, max: 1 }),
    });
    try {
      await withSchool(schoolA, (tx) => tx.$queryRaw`select 1`, pool);
      const rows = await pool.$queryRaw<{ n: number }[]>`select count(*)::int as n from rls_probe`;
      expect(rows[0].n).toBe(0);
    } finally {
      await pool.$disconnect();
    }
  });

  it("throws on a malformed School id before any SQL runs", async () => {
    const fn = vi.fn();
    await expect(withSchool("x", fn, app)).rejects.toThrow();
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("checkTenantTables", () => {
  it("passes on the real schema with the probe declared", async () => {
    await expect(checkTenantTables(app, probeManifest)).resolves.toEqual([]);
  });

  it("reports exactly the probe when checked against the production manifest", async () => {
    await expect(checkTenantTables(app)).resolves.toEqual([
      "rls_probe: has school_id but is not in the tenant manifest",
    ]);
  });

  it("reports a planted school_id table that is not in the manifest", async () => {
    // Planted: a school_id table that nobody declared and nobody protected.
    await owner.$executeRaw`create table rls_planted (school_id uuid not null, id uuid primary key default gen_random_uuid())`;
    try {
      const problems = await checkTenantTables(app, probeManifest);
      expect(problems.some((problem) => problem.startsWith("rls_planted:"))).toBe(true);
    } finally {
      await owner.$executeRaw`drop table if exists rls_planted`;
    }
  });
});
