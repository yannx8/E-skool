// Formatting helpers. Money is always an integer number of FCFA.

export const APP_TIMEZONE = "Africa/Douala";

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 15000 -> "15 000" (narrow no-break spaces, French style). */
export function formatNumber(n: number | null | undefined): string {
  return numberFormat.format(Math.round(n ?? 0));
}

/** 15000 -> "15 000 FCFA". */
export function formatFCFA(n: number | null | undefined): string {
  return `${formatNumber(n)} FCFA`;
}

/** Signed amount for adjustments and differences: "+2 000 FCFA", "-500 FCFA". */
export function formatSignedFCFA(n: number): string {
  if (n > 0) return `+${formatFCFA(n)}`;
  if (n < 0) return `-${formatFCFA(-n)}`;
  return formatFCFA(0);
}

/**
 * Parses what a person typed in an amount field ("15 000", "15.000", "15000 F")
 * into an integer, or null when it holds no digits.
 */
export function parseAmount(input: string | null | undefined): number | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isSafeInteger(n) ? n : null;
}

/** Today's date in Douala as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** First day of the current month in Douala, YYYY-MM-01. */
export function currentMonthISO(now: Date = new Date()): string {
  return `${todayISO(now).slice(0, 7)}-01`;
}

/** "2026-10-14" -> "14/10/2026". Date-only strings are never shifted by timezones. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Timestamp -> "14/10/2026 à 08:10" in Douala time. */
export function formatDateTime(ts: string | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} à ${get("hour")}:${get("minute")}`;
}

/** Relative day label for "Relancé le ..." badges. */
export function formatRelativeDay(ts: string | null | undefined, now: Date = new Date()): string {
  if (!ts) return "";
  const day = todayISO(new Date(ts));
  const today = todayISO(now);
  if (day === today) return "aujourd'hui";
  const yesterday = todayISO(new Date(now.getTime() - 86_400_000));
  if (day === yesterday) return "hier";
  return `le ${formatDate(day)}`;
}

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** "2026-10-01" -> "octobre 2026". */
export function formatMonth(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** Adds n months to a YYYY-MM-01 string. */
export function addMonths(monthIso: string, n: number): string {
  const [y, m] = monthIso.slice(0, 7).split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** Validates a YYYY-MM or YYYY-MM-DD query value and returns YYYY-MM-01. */
export function parseMonthParam(value: string | undefined | null, fallback: string): string {
  if (value && /^\d{4}-\d{2}(-\d{2})?$/.test(value)) return `${value.slice(0, 7)}-01`;
  return fallback;
}

/** Validates a YYYY-MM-DD query value. */
export function parseDateParam(value: string | undefined | null, fallback: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))) return value;
  return fallback;
}

export function fullName(p: { last_name?: string | null; first_name?: string | null }): string {
  return [p.last_name, p.first_name].filter(Boolean).join(" ").trim();
}
