import { PrismaPg } from "@prisma/adapter-pg";
import { getConfig } from "../../../config";
import { PrismaClient } from "../../../generated/prisma/client";

export type DatabaseStatus = { ok: true; version: string; now: string } | { ok: false };

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Created on first use, so importing this module never reads the environment.
export function getDb(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: getConfig().DATABASE_URL }),
  });
  return globalForPrisma.prisma;
}

export async function readDatabaseStatus(
  db?: Pick<PrismaClient, "$queryRaw">,
): Promise<DatabaseStatus> {
  try {
    const rows = await (db ?? getDb()).$queryRaw<{ version: string; now: Date }[]>`select version(), now()`;
    return { ok: true, version: rows[0].version, now: rows[0].now.toISOString() };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "database_unreachable",
        error: error instanceof Error ? error.name : "unknown",
      }),
    );
    return { ok: false };
  }
}
