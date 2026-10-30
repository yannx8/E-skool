// The tenancy manifest (AD-2). Every table is either tenant or global.
// Tenant tables get school_id, the RLS policy from app_enable_tenant_rls, and a row here.
// The checker in tenancy-check.ts fails when a table with school_id is missing from this list.

export type TenantManifest = { tenant: readonly string[]; global: readonly string[] };

export const tenantTables: readonly string[] = [];

export const globalTables: readonly string[] = ["schools"];

export const tenantManifest: TenantManifest = { tenant: tenantTables, global: globalTables };
