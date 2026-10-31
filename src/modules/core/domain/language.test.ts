import { describe, expect, it } from "vitest";
import { documentLanguage, parseLanguage } from "./language";

describe("parseLanguage", () => {
  it("falls back to French when the cookie is missing or unknown", () => {
    expect(parseLanguage(undefined)).toBe("fr");
    expect(parseLanguage("xx")).toBe("fr");
  });

  it("accepts en and fr", () => {
    expect(parseLanguage("en")).toBe("en");
    expect(parseLanguage("fr")).toBe("fr");
  });
});

describe("documentLanguage", () => {
  it("follows the Guardian for receipts and WhatsApp messages", () => {
    expect(documentLanguage({ kind: "receipt", guardianLanguage: "en" })).toBe("en");
    expect(documentLanguage({ kind: "whatsapp", guardianLanguage: "en" })).toBe("en");
    expect(documentLanguage({ kind: "receipt", guardianLanguage: "fr" })).toBe("fr");
  });

  it("follows the Class subsystem for report cards", () => {
    expect(documentLanguage({ kind: "report_card", classSubsystem: "anglophone" })).toBe("en");
    expect(documentLanguage({ kind: "report_card", classSubsystem: "francophone" })).toBe("fr");
  });
});
