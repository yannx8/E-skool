// Display helpers shared by server and client code.

const num = new Intl.NumberFormat("en-US");

/** 85000 -> "85,000" */
export const fmt = (n: number) => num.format(n);

/** 85000 -> "85,000 F" */
export const money = (n: number) => `${num.format(n)} F`;

/** Today in Douala (UTC+1, no DST), never the server clock's zone. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" }).format(new Date());
}

/** The Douala date n days before today, as "YYYY-MM-DD". */
export function daysAgo(n: number): string {
  const d = day(today());
  d.setUTCDate(d.getUTCDate() - n);
  return iso(d);
}

/** Date column -> "2026-10-27" */
export const iso = (d: Date) => d.toISOString().slice(0, 10);

/** "2026-10-27" -> Date at UTC midnight, the form @db.Date expects */
export const day = (s: string) => new Date(`${s}T00:00:00.000Z`);

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-10-27" or Date -> "27 Oct 2026" */
export const dateLabel = (d: string | Date) => longDate.format(typeof d === "string" ? day(d) : d);
export const dayMonth = (d: string | Date) => shortDate.format(typeof d === "string" ? day(d) : d);

export const timeLabel = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" }).format(d);

/** Keep the 9 national digits of a Cameroon number: "+237 6 77-12-34-56" -> "677123456" */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00237")) d = d.slice(5);
  else if (d.startsWith("237") && d.length === 12) d = d.slice(3);
  return d.length === 9 ? d : null;
}

/** "677123456" -> "677 12 34 56" */
export const phoneLabel = (p: string) => `${p.slice(0, 3)} ${p.slice(3, 5)} ${p.slice(5, 7)} ${p.slice(7)}`;

export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/237${phone}?text=${encodeURIComponent(text)}`;

export const METHOD_LABEL = {
  CASH: "Cash",
  MTN_MOMO: "MTN MoMo",
  ORANGE_MONEY: "Orange Money",
  BANK: "Bank",
  OPENING: "Paid before E-skool",
} as const;

export const receiptNo = (n: number) => String(n).padStart(6, "0");

/** Fill {placeholders} in a message template. */
export const fillTemplate = (t: string, vars: Record<string, string>) =>
  t.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
