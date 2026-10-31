// One formatter per kind. Hand-grouped with no-break spaces so fr and en print the same
// and no amount wraps on an 80 mm printer (see plan Design Notes).

const NBSP = " ";

export function formatFcfa(amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`formatFcfa expects an integer FCFA amount, got ${amount}`);
  }
  const sign = amount < 0 ? "-" : "";
  const grouped = Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${sign}${grouped}${NBSP}FCFA`;
}

// Input is a business date string YYYY-MM-DD (AD-7); no Date object, so no timezone can shift the day.
export function formatDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new RangeError(`formatDate expects YYYY-MM-DD, got ${isoDate}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`formatDate expects a real calendar date, got ${isoDate}`);
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
