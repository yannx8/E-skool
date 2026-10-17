// Cameroonian mobile numbers are stored as 2376XXXXXXXX (12 digits), the form
// WhatsApp expects in wa.me links. Mirrors public.normalize_cm_phone in SQL.

export function normalizeCameroonPhone(input: string | null | undefined): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("00237")) digits = digits.slice(5);
  else if (digits.startsWith("237") && digits.length === 12) digits = digits.slice(3);
  return /^6\d{8}$/.test(digits) ? `237${digits}` : null;
}

/** "237677123456" -> "6 77 12 34 56". */
export function formatPhone(stored: string | null | undefined): string {
  if (!stored) return "";
  const local = stored.startsWith("237") ? stored.slice(3) : stored;
  if (!/^\d{9}$/.test(local)) return stored;
  return `${local[0]} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
}
