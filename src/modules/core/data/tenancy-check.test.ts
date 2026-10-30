import { describe, expect, it } from "vitest";
import { type TableFacts, tenancyProblems } from "./tenancy-check";

const USING = "(school_id = NULLIF(current_setting('app.school_id'::text, true), ''::text)::uuid)";

const protectedTable = (name: string): TableFacts => ({
  name,
  has_school_id: true,
  rls_enabled: true,
  rls_forced: true,
  policy_using: USING,
  policy_check: USING,
});

const globalTable: TableFacts = {
  name: "schools",
  has_school_id: false,
  rls_enabled: false,
  rls_forced: false,
  policy_using: null,
  policy_check: null,
};

const manifest = { tenant: ["pupils"], global: ["schools"] };

describe("tenancyProblems", () => {
  it("passes when every tenant table is protected and nothing is planted", () => {
    expect(tenancyProblems([protectedTable("pupils"), globalTable], manifest)).toEqual([]);
  });

  it("reports a school_id table missing from the manifest", () => {
    const problems = tenancyProblems([protectedTable("pupils"), protectedTable("rls_planted")], manifest);
    expect(problems).toEqual(["rls_planted: has school_id but is not in the tenant manifest"]);
  });

  it("reports a manifest table that does not exist", () => {
    expect(tenancyProblems([globalTable], manifest)).toEqual(["pupils: tenant table is missing from the database"]);
  });

  it("reports a manifest table without a school_id column", () => {
    const table = { ...protectedTable("pupils"), has_school_id: false };
    expect(tenancyProblems([table], manifest)).toEqual(["pupils: tenant table has no school_id column"]);
  });

  it("reports a manifest table without RLS forced", () => {
    const table = { ...protectedTable("pupils"), rls_forced: false };
    expect(tenancyProblems([table], manifest)).toEqual(["pupils: row level security is not enabled and forced"]);
  });

  it("reports a manifest table without the tenant policy", () => {
    const table = { ...protectedTable("pupils"), policy_using: null, policy_check: null };
    expect(tenancyProblems([table], manifest)).toEqual(["pupils: no tenant_isolation policy"]);
  });

  it("reports a tenant policy that does not filter by app.school_id", () => {
    const table = { ...protectedTable("pupils"), policy_using: "(true)" };
    expect(tenancyProblems([table], manifest)).toEqual(["pupils: no tenant_isolation policy"]);
  });

  it("reports a tenant policy whose WITH CHECK is missing", () => {
    const table = { ...protectedTable("pupils"), policy_check: null };
    expect(tenancyProblems([table], manifest)).toEqual(["pupils: no tenant_isolation policy"]);
  });
});
