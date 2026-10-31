import type { Actor } from "../domain/permissions";
import type { SchoolTx } from "./with-school";

// What a command changed: ids and field names only, never names or phone numbers (AD-3).
export type AuditEntry = { entity: string; entityId: string; fields: string[] };

export async function writeAudit(
  tx: SchoolTx,
  schoolId: string,
  actor: Actor,
  command: string,
  entry: AuditEntry,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      schoolId,
      actorKind: actor.kind,
      actorId: actor.kind === "user" ? actor.id : null,
      command,
      entity: entry.entity,
      entityId: entry.entityId,
      fields: entry.fields,
    },
  });
}
