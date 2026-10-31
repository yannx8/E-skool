export const LANGUAGES = ["fr", "en"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "fr";

// Anything other than "fr" or "en" (missing, tampered cookie) falls back to French.
export function parseLanguage(value: unknown): Language {
  return (LANGUAGES as readonly unknown[]).includes(value) ? (value as Language) : DEFAULT_LANGUAGE;
}

export type DocumentRequest =
  | { kind: "receipt" | "whatsapp"; guardianLanguage: Language }
  | { kind: "report_card"; classSubsystem: "francophone" | "anglophone" };

// FR-54: receipts and WhatsApp follow the Guardian; report cards follow the Class subsystem.
export function documentLanguage(doc: DocumentRequest): Language {
  if (doc.kind === "report_card") {
    return doc.classSubsystem === "anglophone" ? "en" : "fr";
  }
  return parseLanguage(doc.guardianLanguage);
}
