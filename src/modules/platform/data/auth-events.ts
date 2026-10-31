import { getDb } from "../../core";

export type AuthEventKind = "success" | "failure" | "locked" | "sign_out" | "sign_out_all";

export async function recordAuthEvent(event: {
  kind: AuthEventKind;
  identifierHash?: string | null;
  userId?: string | null;
  ip?: string | null;
}): Promise<void> {
  await getDb().authEvent.create({
    data: {
      kind: event.kind,
      identifierHash: event.identifierHash ?? null,
      userId: event.userId ?? null,
      ip: event.ip ?? null,
    },
  });
}

export const IDENTIFIER_FAILURES = 5;
export const IP_FAILURES = 20;

// Windows are computed by Postgres (now()), not the app clock (AD-7).
// Identifier failures count only after the last success; `locked` rows are not failures,
// so a lock lifts once fewer than 5 failures remain in the last 15 minutes.
// ponytail: check-then-act, parallel attempts can slip a few past the cap; add an advisory lock if that matters.
export async function isLocked(identifierHash: string, ip: string | null): Promise<boolean> {
  const rows = await getDb().$queryRaw<{ identifier: number; ip: number }[]>`
    select
      (select count(*)::int from auth_events
        where kind = 'failure' and identifier_hash = ${identifierHash}
          and at > now() - interval '15 minutes'
          and at > coalesce((select max(at) from auth_events
                             where kind = 'success' and identifier_hash = ${identifierHash}), '-infinity')
      ) as identifier,
      (select count(*)::int from auth_events
        where kind = 'failure' and ip = ${ip} and at > now() - interval '15 minutes'
      ) as ip`;
  return rows[0].identifier >= IDENTIFIER_FAILURES || rows[0].ip >= IP_FAILURES;
}
