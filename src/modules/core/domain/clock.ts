// The only clock in business code (AD-7). Lint forbids `new Date()` and `Date.now()` elsewhere in src/modules.

export const BUSINESS_TIME_ZONE = "Africa/Douala";

export function nowInstant(): Date {
  return new Date();
}

// "Today" in Douala as a business date, YYYY-MM-DD (Postgres `date` shape).
export function todayDouala(at: Date = nowInstant()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
