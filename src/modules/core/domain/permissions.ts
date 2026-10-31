// AD-5: the one permission matrix (PRD FR-15, addendum §A). Server-side; UI reads it too.

export const ROLES = ["promoter", "director", "cashier", "teacher"] as const;
export type Role = (typeof ROLES)[number];

// Switchable Modules (FR-3). `core` is not one: it is always on.
export const MODULES = ["fees", "report_cards", "whatsapp"] as const;
export type Module = (typeof MODULES)[number];

// AD-12: WhatsApp messages requires Fees.
export function isModuleOn(enabled: readonly string[], module: Module | "core"): boolean {
  if (module === "core") return true;
  if (module === "whatsapp" && !enabled.includes("fees")) return false;
  return enabled.includes(module);
}

// `ownClasses`: only Classes listed on the actor's Membership (never from request input).
export type Scope = "school" | "ownClasses";

type Grants = Partial<Record<Role, Scope>>;
const director: Grants = { director: "school" };

// One row per addendum §A capability; "read" columns are separate `.read` permissions.
// Field limits (teacher: names only, no amounts; cashier: no phone edits) are enforced by
// the queries that return those fields, on top of this matrix.
export const PERMISSIONS = {
  "reports.view": { promoter: "school", director: "school" },
  "audit.view": { promoter: "school", director: "school" },
  "settings.manage": director, // School year, key dates, structure, Fee plans, Modules, rules, Users
  "pupils.read": { promoter: "school", director: "school", cashier: "school", teacher: "ownClasses" },
  "pupils.manage": director, // Pupils, Guardians, import, promotion
  "guardians.editPhone": director,
  "payments.record": { director: "school", cashier: "school" }, // and Receipts, own Cash session
  "payments.void": director,
  "discounts.read": { promoter: "school", director: "school" },
  "discounts.manage": director,
  "paymentDelays.read": { promoter: "school", director: "school", cashier: "school" },
  "paymentDelays.manage": director,
  "sendHome.read": { promoter: "school", director: "school" },
  "sendHome.confirm": director, // confirm, exclude
  "sendHome.viewConfirmed": { promoter: "school", director: "school", cashier: "school", teacher: "ownClasses" },
  "cashClosing.approve": director,
  "marks.enter": { director: "school", teacher: "ownClasses" }, // and comments
  "reportCards.manage": director, // sign off, reopen, hold, print
  "whatsapp.read": { promoter: "school", director: "school", cashier: "school" },
  "whatsapp.manage": director, // send wa.me fallback, edit wording
} as const satisfies Record<string, Grants>;

export type Permission = keyof typeof PERMISSIONS;

export type Actor =
  | {
      kind: "user";
      id: string;
      roles: readonly Role[];
      classIds: readonly string[];
      subjectIds?: readonly string[];
    }
  | { kind: "system" };

export type Resource = { classId?: string; subjectId?: string };

// Widest scope any of the actor's Roles grants, or null. `system` (imports, cron) has every permission.
export function scopeFor(actor: Actor, permission: Permission): Scope | null {
  if (actor.kind === "system") return "school";
  const grants: Grants = PERMISSIONS[permission];
  // Object.hasOwn: a tampered role such as "constructor" must not hit the prototype.
  const scopes = actor.roles.filter((role) => Object.hasOwn(grants, role)).map((role) => grants[role]);
  if (scopes.includes("school")) return "school";
  return scopes.length > 0 ? "ownClasses" : null;
}

// An `ownClasses` grant needs a resource whose Class (and Subject, when given) is on the Membership.
export function can(actor: Actor, permission: Permission, resource?: Resource): boolean {
  const scope = scopeFor(actor, permission);
  if (scope === "school") return true;
  if (scope === null || actor.kind === "system") return false;
  if (resource?.classId === undefined || !actor.classIds.includes(resource.classId)) return false;
  return resource.subjectId === undefined || (actor.subjectIds ?? []).includes(resource.subjectId);
}
