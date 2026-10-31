import { describe, expect, it } from "vitest";
import { hashIdentifier, normaliseIdentifier } from "./identifier";

describe("normaliseIdentifier", () => {
  it.each(["6 77 12 34 56", "00237677123456", "+237 677-12-34-56", "237677123456", "677123456"])(
    "normalises the phone %s",
    (raw) => {
      expect(normaliseIdentifier(raw)).toEqual({ kind: "phone", value: "+237677123456" });
    },
  );

  it("lowercases an email", () => {
    expect(normaliseIdentifier("  Dir@School.cm ")).toEqual({ kind: "email", value: "dir@school.cm" });
  });

  it.each(["", "12345", "+33612345678", "77123456", "not an email@", "a@b"])("rejects %s", (raw) => {
    expect(normaliseIdentifier(raw)).toBeNull();
  });
});

describe("hashIdentifier", () => {
  it("is sha256 hex, stable per value", () => {
    const hash = hashIdentifier("+237677123456");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIdentifier("+237677123456")).toBe(hash);
  });
});
