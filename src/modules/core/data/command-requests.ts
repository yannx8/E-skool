import type { Prisma } from "../../../generated/prisma/client";
import type { SchoolTx } from "./with-school";

type Key = { schoolId: string; command: string; requestId: string };
// Who sent the request and what it contained; a repeat must match both.
export type RequestOrigin = { actorId: string | null; inputHash: string };
export type StoredRequest = RequestOrigin & { result: unknown };

export async function findCommandRequest(tx: SchoolTx, key: Key): Promise<StoredRequest | null> {
  return tx.commandRequest.findUnique({
    where: { schoolId_command_requestId: key },
    select: { actorId: true, inputHash: true, result: true },
  });
}

// A concurrent duplicate fails here on the primary key and rolls the whole command back.
export async function saveCommandRequest(
  tx: SchoolTx,
  key: Key,
  origin: RequestOrigin,
  result: Prisma.InputJsonValue,
): Promise<void> {
  await tx.commandRequest.create({ data: { ...key, ...origin, result } });
}

// Only a unique violation on command_requests is a duplicate request; any other P2002 is a bug.
export function isDuplicateRequest(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, meta } = error as { code?: unknown; meta?: { modelName?: unknown } };
  return code === "P2002" && meta?.modelName === "CommandRequest";
}
