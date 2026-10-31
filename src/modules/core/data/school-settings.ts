import type { SchoolTx } from "./with-school";

export type SchoolSettings = { modules: string[]; subscriptionState: string };

// Creates the row with the column defaults on first read, so defaults live only in SQL.
// `forUpdate` locks the row until the transaction ends (read-modify-write commands).
export async function readSchoolSettings(
  tx: SchoolTx,
  schoolId: string,
  { forUpdate = false }: { forUpdate?: boolean } = {},
): Promise<SchoolSettings> {
  await tx.$executeRaw`
    insert into school_settings (school_id) values (${schoolId}::uuid) on conflict do nothing`;
  const rows = forUpdate
    ? await tx.$queryRaw<SchoolSettings[]>`
        select modules, subscription_state as "subscriptionState"
        from school_settings where school_id = ${schoolId}::uuid for update`
    : await tx.$queryRaw<SchoolSettings[]>`
        select modules, subscription_state as "subscriptionState"
        from school_settings where school_id = ${schoolId}::uuid`;
  return rows[0];
}

export async function writeSchoolModules(tx: SchoolTx, schoolId: string, modules: string[]): Promise<void> {
  await tx.$executeRaw`
    update school_settings set modules = ${modules}::text[], updated_at = now()
    where school_id = ${schoolId}::uuid`;
}
