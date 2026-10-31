import { PrismaPg } from "@prisma/adapter-pg";
import { describe, expect, it } from "vitest";
import { PrismaClient } from "../../src/generated/prisma/client";
import { databaseStatus } from "../../src/modules/core";
import { GET } from "../../src/app/health/route";

describe("databaseStatus", () => {
  it("returns the Postgres version from the real database", async () => {
    const status = await databaseStatus();
    expect(status.ok).toBe(true);
    if (status.ok) {
      expect(status.version).toMatch(/PostgreSQL 17/);
    }
  });

  it("reports unreachable instead of throwing when the database is down", async () => {
    const down = new PrismaClient({
      adapter: new PrismaPg({ connectionString: "postgresql://eskool:eskool@127.0.0.1:1/eskool" }),
    });
    await expect(databaseStatus(down)).resolves.toEqual({ ok: false });
    await down.$disconnect();
  });
});

describe("GET /health", () => {
  it("answers 200 when the database is reachable", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
