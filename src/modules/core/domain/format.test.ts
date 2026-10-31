import { describe, expect, it } from "vitest";
import { formatDate, formatFcfa } from "./format";

const NBSP = " ";

describe("formatFcfa", () => {
  it("groups thousands with no-break spaces before FCFA", () => {
    expect(formatFcfa(45000)).toBe(`45${NBSP}000${NBSP}FCFA`);
  });

  it("formats large, zero and negative amounts", () => {
    expect(formatFcfa(1250000)).toBe(`1${NBSP}250${NBSP}000${NBSP}FCFA`);
    expect(formatFcfa(0)).toBe(`0${NBSP}FCFA`);
    expect(formatFcfa(-5000)).toBe(`-5${NBSP}000${NBSP}FCFA`);
  });

  it("refuses non-integer amounts and names the value", () => {
    expect(() => formatFcfa(12.5)).toThrow(/12\.5/);
  });
});

describe("formatDate", () => {
  it("prints DD/MM/YYYY", () => {
    expect(formatDate("2027-03-05")).toBe("05/03/2027");
  });

  it("accepts 29 February only in leap years", () => {
    expect(formatDate("2028-02-29")).toBe("29/02/2028");
    expect(() => formatDate("2027-02-29")).toThrow(/2027-02-29/);
    expect(() => formatDate("2100-02-29")).toThrow();
  });

  it("throws on an invalid string", () => {
    expect(() => formatDate("05/03/2027")).toThrow(/05\/03\/2027/);
    expect(() => formatDate("2027-13-01")).toThrow();
  });
});
