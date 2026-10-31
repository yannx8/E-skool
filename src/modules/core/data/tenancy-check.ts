import type { PrismaClient } from "../../../generated/prisma/client";
import { getDb } from "./db";
import { type TenantManifest, tenantManifest } from "./tenant-tables";

export type TableFacts = {
  name: string;
  has_school_id: boolean;
  rls_enabled: boolean;
  rls_forced: boolean;
  // Deparsed USING and WITH CHECK of the tenant_isolation policy; null when absent.
  policy_using: string | null;
  policy_check: string | null;
};

const references = (expr: string | null) => expr !== null && expr.includes("app.school_id");

// Pure: turns catalog facts into problem messages. An empty list means the manifest holds.
export function tenancyProblems(tables: TableFacts[], manifest: TenantManifest): string[] {
  const problems: string[] = [];
  const byName = new Map(tables.map((table) => [table.name, table]));

  for (const table of tables) {
    // A global table may carry school_id as a plain reference (memberships); it is listed on purpose.
    if (table.has_school_id && !manifest.tenant.includes(table.name) && !manifest.global.includes(table.name)) {
      problems.push(`${table.name}: has school_id but is not in the tenant manifest`);
    }
  }

  for (const name of manifest.tenant) {
    const table = byName.get(name);
    if (!table) {
      problems.push(`${name}: tenant table is missing from the database`);
      continue;
    }
    if (!table.has_school_id) {
      problems.push(`${name}: tenant table has no school_id column`);
    }
    if (!table.rls_enabled || !table.rls_forced) {
      problems.push(`${name}: row level security is not enabled and forced`);
    }
    if (!references(table.policy_using) || !references(table.policy_check)) {
      problems.push(`${name}: no tenant_isolation policy`);
    }
  }

  return problems;
}

// Reads the catalog (visible to every role, unlike information_schema) and returns problems.
export async function checkTenantTables(
  db: Pick<PrismaClient, "$queryRaw"> = getDb(),
  manifest: TenantManifest = tenantManifest,
): Promise<string[]> {
  const tables = await db.$queryRaw<TableFacts[]>`
    select
      c.relname as name,
      exists (
        select 1 from pg_attribute a
        where a.attrelid = c.oid and a.attname = 'school_id' and a.attnum > 0 and not a.attisdropped
      ) as has_school_id,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as rls_forced,
      (
        select pg_get_expr(p.polqual, p.polrelid) from pg_policy p
        where p.polrelid = c.oid and p.polname = 'tenant_isolation'
      ) as policy_using,
      (
        select pg_get_expr(p.polwithcheck, p.polrelid) from pg_policy p
        where p.polrelid = c.oid and p.polname = 'tenant_isolation'
      ) as policy_check
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')`;
  return tenancyProblems(tables, manifest);
}
