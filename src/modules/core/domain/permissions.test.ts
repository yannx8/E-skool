import { describe, expect, it } from "vitest";
import { type Actor, PERMISSIONS, ROLES, type Role, can, isModuleOn, scopeFor } from "./permissions";

const user = (roles: Role[], classIds: string[] = []): Actor => ({
  kind: "user",
  id: "00000000-0000-4000-8000-000000000001",
  roles,
  classIds,
});

describe("permission matrix", () => {
  it("only grants known Roles", () => {
    for (const grants of Object.values(PERMISSIONS)) {
      for (const role of Object.keys(grants)) expect(ROLES).toContain(role);
    }
  });

  it("keeps Void, Discounts, delays, send-home confirm, closing approval and phone edits Director-only", () => {
    for (const permission of [
      "payments.void",
      "discounts.manage",
      "paymentDelays.manage",
      "sendHome.confirm",
      "cashClosing.approve",
      "guardians.editPhone",
      "settings.manage",
    ] as const) {
      expect(Object.keys(PERMISSIONS[permission])).toEqual(["director"]);
    }
  });

  it("lets a Cashier record Payments but not void them or see the Audit log", () => {
    const cashier = user(["cashier"]);
    expect(can(cashier, "payments.record")).toBe(true);
    expect(can(cashier, "payments.void")).toBe(false);
    expect(can(cashier, "audit.view")).toBe(false);
  });

  it("never gives a Teacher money permissions", () => {
    const teacher = user(["teacher"], ["c1"]);
    for (const permission of ["payments.record", "discounts.read", "paymentDelays.read", "reports.view"] as const) {
      expect(scopeFor(teacher, permission)).toBeNull();
    }
  });

  it("limits a Teacher to own Classes", () => {
    const teacher = user(["teacher"], ["c1"]);
    expect(can(teacher, "marks.enter", { classId: "c1" })).toBe(true);
    expect(can(teacher, "marks.enter", { classId: "c2" })).toBe(false);
    expect(can(teacher, "marks.enter")).toBe(false);
  });

  it("limits a Teacher to own Subjects when the resource names one", () => {
    const teacher: Actor = { ...user(["teacher"], ["c1"]), subjectIds: ["s1"] } as Actor;
    expect(can(teacher, "marks.enter", { classId: "c1", subjectId: "s1" })).toBe(true);
    expect(can(teacher, "marks.enter", { classId: "c1", subjectId: "s2" })).toBe(false);
    expect(can(user(["teacher"], ["c1"]), "marks.enter", { classId: "c1", subjectId: "s1" })).toBe(false);
  });

  it("ignores a role that is a prototype key", () => {
    const tampered = user(["constructor" as Role], ["c1"]);
    expect(scopeFor(tampered, "marks.enter")).toBeNull();
    expect(can(tampered, "marks.enter", { classId: "c1" })).toBe(false);
  });

  it("takes the widest scope across Roles", () => {
    expect(can(user(["teacher", "director"]), "marks.enter", { classId: "c9" })).toBe(true);
  });

  it("gives the system actor every permission", () => {
    expect(can({ kind: "system" }, "payments.void")).toBe(true);
  });
});

describe("isModuleOn", () => {
  it("treats core as always on and WhatsApp as needing Fees", () => {
    expect(isModuleOn([], "core")).toBe(true);
    expect(isModuleOn(["whatsapp"], "whatsapp")).toBe(false);
    expect(isModuleOn(["fees", "whatsapp"], "whatsapp")).toBe(true);
    expect(isModuleOn(["report_cards"], "fees")).toBe(false);
  });
});
