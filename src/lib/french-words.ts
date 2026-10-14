// Amount in French words for receipts (traditional spelling, as written on
// Cameroonian receipts): 15000 -> "Quinze mille francs CFA".

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function below100(n: number, pluralEnd: boolean): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    if (t === 7 && u === 1) return "soixante et onze";
    return `${TENS[t]}-${UNITS[10 + u]}`;
  }
  if (u === 0) return t === 8 && pluralEnd ? "quatre-vingts" : TENS[t];
  if (u === 1 && t !== 8) return `${TENS[t]} et un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

/** pluralEnd: false when the group is followed by "mille" (cent/vingt stay invariable). */
function below1000(n: number, pluralEnd: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h === 1) parts.push("cent");
  else if (h > 1) parts.push(`${UNITS[h]} ${r === 0 && pluralEnd ? "cents" : "cent"}`);
  if (r > 0) parts.push(below100(r, pluralEnd));
  return parts.join(" ");
}

export function numberToFrenchWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "zéro";
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor(n / 1_000_000) % 1000;
  const thousands = Math.floor(n / 1000) % 1000;
  const rest = n % 1000;
  const parts: string[] = [];
  if (billions) parts.push(`${below1000(billions, true)} milliard${billions > 1 ? "s" : ""}`);
  if (millions) parts.push(`${below1000(millions, true)} million${millions > 1 ? "s" : ""}`);
  if (thousands) parts.push(thousands === 1 ? "mille" : `${below1000(thousands, false)} mille`);
  if (rest) parts.push(below1000(rest, true));
  return (value < 0 ? "moins " : "") + parts.join(" ");
}

export function amountToFrenchWords(amount: number): string {
  const words = numberToFrenchWords(amount);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} francs CFA`;
}
