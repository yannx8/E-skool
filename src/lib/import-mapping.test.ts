import { describe, expect, it } from "vitest";
import { mapHeaders, parseImportRows, splitFullName } from "@/lib/import-mapping";

describe("import mapping", () => {
  it("recognizes French headers with accents and spacing", () => {
    expect(mapHeaders(["N°", "Nom", "Prénoms", "Classe", "Nom du parent", "Téléphone"])).toEqual({
      last_name: 1,
      first_name: 2,
      class_name: 3,
      parent_name: 4,
      parent_phone: 5,
    });
  });

  it("splits a combined name column on capitals", () => {
    expect(splitFullName("MBA ONDOUA Paul Junior")).toEqual({
      last_name: "MBA ONDOUA",
      first_name: "Paul Junior",
    });
    expect(splitFullName("Etoa Marc")).toEqual({ last_name: "Etoa", first_name: "Marc" });
    expect(splitFullName("NGONO")).toEqual({ last_name: "NGONO", first_name: "" });
  });

  it("validates rows against known classes and phones", () => {
    const { rows, missingColumns } = parseImportRows(
      [
        ["Nom et prénom", "Classe", "Tel"],
        ["ABENA Sara", "cp", "677 12 34 56"],
        ["BIYA Anne", "CM2", "12"],
        ["", "", ""],
      ],
      ["CP", "CE1"],
    );
    expect(missingColumns).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      line: 2,
      last_name: "ABENA",
      first_name: "Sara",
      parent_phone: "237677123456",
      errors: [],
    });
    expect(rows[1].errors).toEqual(["Classe inconnue « CM2 »", "Téléphone invalide « 12 »"]);
  });

  it("reports missing required columns", () => {
    expect(parseImportRows([["Prénom", "Âge"]], ["CP"]).missingColumns).toEqual(["nom", "classe"]);
  });
});
