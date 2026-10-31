import { describe, expect, it } from "vitest";
import { parseConfig } from "./config";

const auth = { BETTER_AUTH_SECRET: "x".repeat(32), BETTER_AUTH_URL: "http://localhost:3000" };

describe("parseConfig", () => {
  it("names DATABASE_URL when it is missing", () => {
    expect(() => parseConfig({ ...auth })).toThrow(/DATABASE_URL/);
  });

  it("accepts a postgres URL", () => {
    const config = parseConfig({ ...auth, DATABASE_URL: "postgresql://u:p@localhost:5432/db" });
    expect(config.DATABASE_URL).toContain("localhost");
  });

  it("rejects a short BETTER_AUTH_SECRET", () => {
    expect(() =>
      parseConfig({ ...auth, DATABASE_URL: "postgresql://u:p@localhost:5432/db", BETTER_AUTH_SECRET: "short" }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });
});
