// What each role may do in the UI. The database (RLS + role-checked functions)
// enforces the same rules; this file only decides what to show.
import type { AppRole } from "@/lib/labels";

const RULES = {
  recordPayment: ["admin", "secretary"],
  voidPayment: ["admin"],
  editPupils: ["admin", "secretary"],
  importPupils: ["admin", "secretary"],
  promotePupils: ["admin"],
  manageDiscounts: ["admin"],
  sendReminders: ["admin", "secretary"],
  manageSetup: ["admin"],
  manageUsers: ["admin"],
  viewAudit: ["admin", "owner"],
  viewHr: ["admin", "owner"],
  manageHr: ["admin"],
  viewFinance: ["admin", "owner"],
  manageFinance: ["admin"],
  viewEnrollment: ["admin", "owner", "secretary"],
  manageEnrollment: ["admin", "secretary"],
  exportData: ["admin", "owner"],
} as const satisfies Record<string, readonly AppRole[]>;

export type Permission = keyof typeof RULES;

export function can(role: AppRole | null | undefined, permission: Permission): boolean {
  return !!role && (RULES[permission] as readonly AppRole[]).includes(role);
}

export function rolesFor(permission: Permission): readonly AppRole[] {
  return RULES[permission];
}
