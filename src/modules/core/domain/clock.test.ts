import { describe, expect, it } from "vitest";
import { todayDouala } from "./clock";

describe("todayDouala", () => {
  it("uses Douala time (UTC+1) at the day boundary", () => {
    expect(todayDouala(new Date("2026-10-30T23:30:00Z"))).toBe("2026-10-31");
  });

  it("keeps the same day before the boundary", () => {
    expect(todayDouala(new Date("2026-10-30T22:59:00Z"))).toBe("2026-10-30");
  });

  it("returns a YYYY-MM-DD business date", () => {
    expect(todayDouala()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
