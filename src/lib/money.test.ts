import { describe, expect, it } from "vitest";
import { allocate, amountInWords, bucketOf, chargeState, daysBetween } from "./money";

describe("allocate", () => {
  const open = [
    { id: 3, dueOn: "2026-12-01", balance: 50_000 },
    { id: 1, dueOn: "2026-09-01", balance: 15_000 },
    { id: 2, dueOn: "2026-09-15", balance: 60_000 },
  ];

  it("pays the oldest due charge first", () => {
    expect(allocate(open, 30_000)).toEqual({
      splits: [
        { chargeId: 1, amount: 15_000 },
        { chargeId: 2, amount: 15_000 },
      ],
      credit: 0,
    });
  });

  it("keeps the surplus as family credit", () => {
    const r = allocate(open, 130_000);
    expect(r.splits.reduce((s, x) => s + x.amount, 0)).toBe(125_000);
    expect(r.credit).toBe(5_000);
  });

  it("skips charges already paid", () => {
    expect(allocate([{ id: 1, dueOn: "2026-09-01", balance: 0 }], 1_000)).toEqual({ splits: [], credit: 1_000 });
  });
});

describe("chargeState", () => {
  it("covers each state", () => {
    expect(chargeState(100, 100, "2026-01-01", "2026-10-27")).toBe("paid");
    expect(chargeState(100, 40, "2026-10-01", "2026-10-27")).toBe("overdue");
    expect(chargeState(100, 0, "2026-10-27", "2026-10-27")).toBe("due");
    expect(chargeState(100, 40, "2026-12-01", "2026-10-27")).toBe("partial");
    expect(chargeState(100, 0, "2026-12-01", "2026-10-27")).toBe("upcoming");
  });
});

describe("aging", () => {
  it("counts days and buckets", () => {
    expect(daysBetween("2026-09-15", "2026-10-27")).toBe(42);
    expect(bucketOf(42)).toBe("31-60");
    expect(bucketOf(1)).toBe("1-30");
    expect(bucketOf(91)).toBe("90+");
  });
});

describe("amountInWords", () => {
  it("writes FCFA amounts for receipts", () => {
    expect(amountInWords(125_000)).toBe("One hundred and twenty-five thousand francs CFA");
    expect(amountInWords(1_250_500)).toBe("One million two hundred and fifty thousand five hundred francs CFA");
    expect(amountInWords(15)).toBe("Fifteen francs CFA");
  });
});
