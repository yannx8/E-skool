export { readDatabaseStatus as databaseStatus } from "./data/db";
export type { DatabaseStatus } from "./data/db";
export { withSchool } from "./data/with-school";
export type { SchoolTx } from "./data/with-school";
export { checkTenantTables, tenancyProblems } from "./data/tenancy-check";
export { globalTables, tenantTables, tenantManifest } from "./data/tenant-tables";
export type { TenantManifest } from "./data/tenant-tables";
