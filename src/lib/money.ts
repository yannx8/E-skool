// Pure money rules. No database here, so every rule has a unit test.

export type OpenCharge = { id: number; dueOn: string; balance: number };
export type Split = { chargeId: number; amount: number };

/** Apply an amount to open charges, oldest due date first (QuickBooks / Jackrabbit default). */
export function allocate(open: OpenCharge[], amount: number): { splits: Split[]; credit: number } {
  const sorted = [...open].sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.id - b.id);
  const splits: Split[] = [];
  let left = amount;
  for (const c of sorted) {
    if (left <= 0) break;
    if (c.balance <= 0) continue;
    const take = Math.min(left, c.balance);
    splits.push({ chargeId: c.id, amount: take });
    left -= take;
  }
  return { splits, credit: left };
}

export type ChargeState = "paid" | "partial" | "overdue" | "due" | "upcoming";

/** "due" = due today; "overdue" = past its date and not fully paid. */
export function chargeState(net: number, paid: number, dueOn: string, today: string): ChargeState {
  if (paid >= net) return "paid";
  if (dueOn < today) return "overdue";
  if (dueOn === today) return "due";
  return paid > 0 ? "partial" : "upcoming";
}

export const BUCKETS = ["1-30", "31-60", "61-90", "90+"] as const;
export type Bucket = (typeof BUCKETS)[number];

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export function bucketOf(daysLate: number): Bucket {
  if (daysLate <= 30) return "1-30";
  if (daysLate <= 60) return "31-60";
  if (daysLate <= 90) return "61-90";
  return "90+";
}

const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function underThousand(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} hundred`);
  if (r) parts.push(r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? `-${ONES[r % 10]}` : ""));
  return parts.join(" and ");
}

/** 125000 -> "One hundred and twenty-five thousand francs CFA" (printed on receipts). */
export function amountInWords(n: number): string {
  if (n === 0) return "Zero francs CFA";
  const scales: [number, string][] = [[1_000_000_000, "billion"], [1_000_000, "million"], [1_000, "thousand"], [1, ""]];
  const parts: string[] = [];
  let left = n;
  for (const [size, name] of scales) {
    const q = Math.floor(left / size);
    if (q) parts.push(`${underThousand(q)}${name ? ` ${name}` : ""}`);
    left %= size;
  }
  const text = parts.join(" ");
  return `${text[0].toUpperCase()}${text.slice(1)} francs CFA`;
}
