export { readDatabaseStatus as databaseStatus } from "./data/db";
export { getDb } from "./data/db";
export type { DatabaseStatus } from "./data/db";
export { withSchool } from "./data/with-school";
export type { SchoolTx } from "./data/with-school";
export { checkTenantTables, tenancyProblems } from "./data/tenancy-check";
export { globalTables, tenantTables, tenantManifest } from "./data/tenant-tables";
export type { TenantManifest } from "./data/tenant-tables";
export { BUSINESS_TIME_ZONE, nowInstant, todayDouala } from "./domain/clock";
export { formatDate, formatFcfa } from "./domain/format";
export {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  documentLanguage,
  parseLanguage,
} from "./domain/language";
export type { DocumentRequest, Language } from "./domain/language";
export { MODULES, PERMISSIONS, ROLES, can, isModuleOn, scopeFor } from "./domain/permissions";
export type { Actor, Module, Permission, Resource, Role, Scope } from "./domain/permissions";
export { ERROR_CODES, defineCommand } from "./application/define-command";
export type { CommandContext, CommandDefinition, CommandError, CommandResult, ErrorCode } from "./application/define-command";
export type { AuditEntry } from "./data/audit";
export { setModuleEnabled } from "./application/set-module-enabled";
