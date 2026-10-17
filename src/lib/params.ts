export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export type IdParams = Promise<{ id: string }>;

/** First value of a query parameter, trimmed, or "" when absent. */
export function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export function pageParam(sp: Record<string, string | string[] | undefined>): number {
  const n = Number.parseInt(param(sp, "page"), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: string | null | undefined): v is string {
  return !!v && UUID.test(v);
}

/** Builds "?a=1&b=2" from a record, skipping empty values. */
export function qs(params: Record<string, string | number | null | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : "";
}
