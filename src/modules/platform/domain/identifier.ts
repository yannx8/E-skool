import { createHash } from "node:crypto";

export type Identifier = { kind: "email" | "phone"; value: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cameroon numbers: 9 digits, mobile 6xxxxxxxx or fixed 2xxxxxxxx.
const NATIONAL = /^[26]\d{8}$/;

// Email lowercased, or a Cameroon phone as +237XXXXXXXXX. Anything else is null.
export function normaliseIdentifier(raw: string): Identifier | null {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    return EMAIL.test(email) ? { kind: "email", value: email } : null;
  }
  const digits = trimmed.replace(/[\s.\-()]/g, "");
  const national = digits.replace(/^(?:\+237|00237|237(?=\d{9}$))/, "");
  return NATIONAL.test(national) ? { kind: "phone", value: `+237${national}` } : null;
}

// What auth_events stores instead of the raw identifier.
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Users without an email sign in through better-auth's email path with this reserved address.
export function phoneEmail(phone: string): string {
  return `${phone}@staff.invalid`;
}
