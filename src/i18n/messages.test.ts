import { describe, expect, it } from "vitest";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import { ERROR_CODES } from "../modules/core";
import { keyPaths, missingKeys } from "./message-keys";

describe("message catalogs", () => {
  it("have identical key sets in fr and en", () => {
    expect(missingKeys(fr, en)).toEqual([]);
    expect(missingKeys(en, fr)).toEqual([]);
  });

  it("hold a message for every command error code", () => {
    const keys = keyPaths(en);
    for (const code of ERROR_CODES) expect(keys).toContain(`errors.${code}`);
  });

  it("report a planted missing key by name", () => {
    const source = { home: { database: "Base", serverTime: "Heure" } };
    const target = { home: { database: "Database" } };
    expect(missingKeys(source, target)).toEqual(["home.serverTime"]);
    expect(keyPaths(source)).toEqual(["home.database", "home.serverTime"]);
  });
});
