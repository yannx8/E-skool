import { createHash } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { type AuditEntry, writeAudit } from "../data/audit";
import {
  type RequestOrigin,
  type StoredRequest,
  findCommandRequest,
  isDuplicateRequest,
  saveCommandRequest,
} from "../data/command-requests";
import { readSchoolSettings } from "../data/school-settings";
import { type SchoolTx, withSchool } from "../data/with-school";
import {
  type Actor,
  type Module,
  type Permission,
  type Resource,
  can,
  isModuleOn,
  scopeFor,
} from "../domain/permissions";

export const ERROR_CODES = ["forbidden", "invalid_input", "module_off", "suspended"] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
export type CommandError = { code: ErrorCode; messageKey: `errors.${ErrorCode}`; field?: string };
export type CommandResult<T> = { ok: true; data: T } | { ok: false; error: CommandError };

// Built by platform.getCommandContext() from the session and its Membership (tests may build it directly).
export type CommandContext = { schoolId: string; actor: Actor };

type Handler<S extends z.ZodType, R> = (tx: SchoolTx, input: z.output<S>, ctx: CommandContext) => Promise<R>;

export type CommandDefinition<S extends z.ZodType, T> = {
  name: string;
  permission: Permission;
  module: Module | "core";
  schema: S;
  // Required for permissions scoped to `ownClasses`; without it such actors are refused.
  resource?: (input: z.output<S>) => Resource;
} & (
  | {
      writes: true;
      // `data` must be JSON: a repeated requestId returns it from command_requests.
      // `audit.fields` empty means nothing changed: no Audit row.
      handler: Handler<S, { data: T; audit: AuditEntry }>;
    }
  | { writes: false; handler: Handler<S, { data: T }> }
);

const requestIdSchema = z.object({ requestId: z.uuid() });

// sha256 of the input with object keys sorted, so key order does not change the hash.
function inputHash(input: unknown): string {
  const sort = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sort)
      : value !== null && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((k) => [k, sort((value as Record<string, unknown>)[k])]),
          )
        : value;
  return createHash("sha256")
    .update(JSON.stringify(sort(JSON.parse(JSON.stringify(input ?? null)))))
    .digest("hex");
}

// A requestId replays only for the actor and input that first used it.
function replay<T>(prior: StoredRequest, origin: RequestOrigin): CommandResult<T> {
  if (prior.actorId !== origin.actorId || prior.inputHash !== origin.inputHash) {
    return fail("invalid_input", "requestId");
  }
  return { ok: true, data: prior.result as T };
}

function fail(code: ErrorCode, field?: string): { ok: false; error: CommandError } {
  return { ok: false, error: { code, messageKey: `errors.${code}`, ...(field ? { field } : {}) } };
}

// AD-3: the one write path. Order: permission, input, withSchool, Module and Subscription
// guards, requestId repeat check, handler, command_requests row, Audit row, one transaction.
// Reads (`writes: false`) skip the requestId and the Audit row.
export function defineCommand<S extends z.ZodType, T>(def: CommandDefinition<S, T>) {
  return {
    name: def.name,
    async run(ctx: CommandContext, input: unknown): Promise<CommandResult<T>> {
      if (scopeFor(ctx.actor, def.permission) === null) return fail("forbidden");

      let requestId: string | undefined;
      if (def.writes) {
        const parsedId = requestIdSchema.safeParse(input);
        if (!parsedId.success) return fail("invalid_input", "requestId");
        requestId = parsedId.data.requestId;
      }
      const parsed = def.schema.safeParse(input);
      if (!parsed.success) return fail("invalid_input", parsed.error.issues[0]?.path.join(".") || undefined);
      if (!can(ctx.actor, def.permission, def.resource?.(parsed.data))) return fail("forbidden");

      const key = requestId ? { schoolId: ctx.schoolId, command: def.name, requestId } : null;
      const origin: RequestOrigin = {
        actorId: ctx.actor.kind === "user" ? ctx.actor.id : null,
        inputHash: inputHash(parsed.data),
      };
      try {
        return await withSchool(ctx.schoolId, async (tx): Promise<CommandResult<T>> => {
          const settings = await readSchoolSettings(tx, ctx.schoolId);
          if (!isModuleOn(settings.modules, def.module)) return fail("module_off");
          if (def.writes && settings.subscriptionState === "suspended") return fail("suspended");

          if (def.writes === false || key === null) {
            return { ok: true, data: (await def.handler(tx, parsed.data, ctx)).data };
          }
          const prior = await findCommandRequest(tx, key);
          if (prior) return replay(prior, origin);
          const { data, audit } = await def.handler(tx, parsed.data, ctx);
          await saveCommandRequest(tx, key, origin, data as Prisma.InputJsonValue);
          if (audit.fields.length > 0) await writeAudit(tx, ctx.schoolId, ctx.actor, def.name, audit);
          return { ok: true, data };
        });
      } catch (error) {
        // A concurrent duplicate lost the race on the primary key: replay the winner's result.
        if (key && isDuplicateRequest(error)) {
          const prior = await withSchool(ctx.schoolId, (tx) => findCommandRequest(tx, key));
          if (prior) return replay(prior, origin);
        }
        throw error;
      }
    },
  };
}
