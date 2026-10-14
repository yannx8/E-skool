import { describe, expect, it } from "vitest";
import { amountToFrenchWords, numberToFrenchWords } from "@/lib/french-words";
import {
  addMonths,
  formatDate,
  formatDateTime,
  formatFCFA,
  formatMonth,
  formatSignedFCFA,
  parseAmount,
  parseMonthParam,
  todayISO,
} from "@/lib/format";
import { formatPhone, normalizeCameroonPhone } from "@/lib/phone";
import { renderReminderMessage, whatsappUrl } from "@/lib/reminder";
import { toCSV } from "@/lib/csv";
import { can } from "@/lib/permissions";
import { feeLineName, termName } from "@/lib/labels";

const nbsp = (s: string) => s.replace(/[  ]/g, " ");

describe("numberToFrenchWords", () => {
  it.each([
    [0, "zéro"],
    [1, "un"],
    [16, "seize"],
    [17, "dix-sept"],
    [21, "vingt et un"],
    [70, "soixante-dix"],
    [71, "soixante et onze"],
    [72, "soixante-douze"],
    [80, "quatre-vingts"],
    [81, "quatre-vingt-un"],
    [91, "quatre-vingt-onze"],
    [99, "quatre-vingt-dix-neuf"],
    [100, "cent"],
    [101, "cent un"],
    [180, "cent quatre-vingts"],
    [200, "deux cents"],
    [201, "deux cent un"],
    [1000, "mille"],
    [1001, "mille un"],
    [2000, "deux mille"],
    [15000, "quinze mille"],
    [21000, "vingt et un mille"],
    [80000, "quatre-vingt mille"],
    [200000, "deux cent mille"],
    [225500, "deux cent vingt-cinq mille cinq cents"],
    [1_000_000, "un million"],
    [2_500_000, "deux millions cinq cent mille"],
    [200_000_000, "deux cents millions"],
    [1_000_000_000, "un milliard"],
  ])("%i -> %s", (n, words) => {
    expect(numberToFrenchWords(n)).toBe(words);
  });

  it("formats receipt amounts", () => {
    expect(amountToFrenchWords(15000)).toBe("Quinze mille francs CFA");
    expect(amountToFrenchWords(25500)).toBe("Vingt-cinq mille cinq cents francs CFA");
  });
});

describe("money and dates", () => {
  it("formats FCFA with French grouping", () => {
    expect(nbsp(formatFCFA(15000))).toBe("15 000 FCFA");
    expect(nbsp(formatFCFA(1250000))).toBe("1 250 000 FCFA");
    expect(nbsp(formatSignedFCFA(-500))).toBe("-500 FCFA");
    expect(nbsp(formatSignedFCFA(2000))).toBe("+2 000 FCFA");
  });

  it("parses typed amounts", () => {
    expect(parseAmount("15 000")).toBe(15000);
    expect(parseAmount("15.000 F")).toBe(15000);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("uses Douala time for today", () => {
    // 23:30 UTC on Oct 14 is 00:30 on Oct 15 in Douala (UTC+1).
    expect(todayISO(new Date("2026-10-14T23:30:00Z"))).toBe("2026-10-15");
    expect(formatDateTime("2026-10-14T07:10:00Z")).toBe("14/10/2026 à 08:10");
  });

  it("formats dates and months without timezone shifts", () => {
    expect(formatDate("2026-01-01")).toBe("01/01/2026");
    expect(formatMonth("2026-10-01")).toBe("octobre 2026");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
    expect(parseMonthParam("2026-09", "x")).toBe("2026-09-01");
    expect(parseMonthParam("bad", "2026-10-01")).toBe("2026-10-01");
  });
});

describe("phones", () => {
  it.each([
    ["6 77 12 34 56", "237677123456"],
    ["+237 677-12-34-56", "237677123456"],
    ["00237677123456", "237677123456"],
    ["237677123456", "237677123456"],
    ["222123456", null],
    ["67712345", null],
    ["", null],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeCameroonPhone(input)).toBe(expected);
  });

  it("formats for display", () => {
    expect(formatPhone("237677123456")).toBe("6 77 12 34 56");
  });
});

describe("reminders", () => {
  it("renders known variables and keeps unknown ones", () => {
    const msg = renderReminderMessage("Bonjour {parent}, reste {montant} pour {eleve}. {inconnu}", {
      parent: "Mme Mba",
      montant: "10 000 FCFA",
      eleve: "MBA Élodie",
    });
    expect(msg).toBe("Bonjour Mme Mba, reste 10 000 FCFA pour MBA Élodie. {inconnu}");
  });

  it("collapses gaps left by empty variables", () => {
    expect(renderReminderMessage("Bonjour {parent} , merci", { parent: "" })).toBe("Bonjour , merci");
  });

  it("builds a wa.me link", () => {
    expect(whatsappUrl("237677123456", "Bonjour & merci")).toBe(
      "https://wa.me/237677123456?text=Bonjour%20%26%20merci",
    );
  });
});

describe("csv", () => {
  it("escapes separators, quotes and formulas", () => {
    const csv = toCSV(["a", "b"], [["x;y", 'say "hi"'], ["=1+1", 5]]);
    expect(csv).toBe('﻿a;b\r\n"x;y";"say ""hi"""\r\n\'=1+1;5\r\n');
  });
});

describe("permissions and labels", () => {
  it("keeps the owner read-only", () => {
    expect(can("owner", "viewFinance")).toBe(true);
    expect(can("owner", "recordPayment")).toBe(false);
    expect(can("secretary", "viewHr")).toBe(false);
    expect(can("secretary", "recordPayment")).toBe(true);
    expect(can("secretary", "voidPayment")).toBe(false);
    expect(can(null, "recordPayment")).toBe(false);
  });

  it("names fee lines", () => {
    expect(termName(2)).toBe("Tranche 2");
    expect(termName(null)).toBe("Frais uniques");
    expect(feeLineName("tuition", 1, "Trimestre")).toBe("Scolarité - Trimestre 1");
    expect(feeLineName("registration", null)).toBe("Inscription");
  });
});
