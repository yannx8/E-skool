import { z } from "zod";
import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { getDb } from "./db";

export type SchoolTx = Prisma.TransactionClient;

const schoolIdSchema = z.uuid();

// The only tenant entry point (AD-2). The id is validated before any SQL runs.
// set_config(..., true) is transaction-local, so the context cannot leak to the next
// transaction on the same pooled connection.
export async function withSchool<T>(
  schoolId: string,
  fn: (tx: SchoolTx) => Promise<T>,
  db: Pick<PrismaClient, "$transaction"> = getDb(),
): Promise<T> {
  const id = schoolIdSchema.parse(schoolId);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`select set_config('app.school_id', ${id}, true)`;
    return fn(tx);
  });
}
