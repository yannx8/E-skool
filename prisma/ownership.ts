// AD-1: every Prisma model, listed once, with the module that owns it.
// tests/architecture/boundaries.test.ts fails when a schema model is missing here.
export type OwningModule = "platform" | "core" | "fees" | "academics" | "notifications";

export const ownership: Readonly<Record<string, OwningModule>> = {
  School: "platform",
  SchoolSettings: "core",
  AuditLog: "core",
  CommandRequest: "core",
  User: "platform",
  Session: "platform",
  Account: "platform",
  Verification: "platform",
  Membership: "platform",
  AuthEvent: "platform",
};
