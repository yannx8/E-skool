import { describe, expect, it } from "vitest";
import { parseConfig } from "./config";

describe("parseConfig", () => {
  it("names DATABASE_URL when it is missing", () => {
    expect(() => parseConfig({})).toThrow(/DATABASE_URL/);
  });

  it("accepts a postgres URL", () => {
    const config = parseConfig({ DATABASE_URL: "postgresql://u:p@localhost:5432/db" });
    expect(config.DATABASE_URL).toContain("localhost");
  });
});
