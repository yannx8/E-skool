// Maps a spreadsheet exported from Excel (any column order, French headers with
// or without accents) to pupil import rows. Pure functions: unit tested.
import { normalizeCameroonPhone } from "@/lib/phone";

export type ImportField =
  | "last_name"
  | "first_name"
  | "full_name"
  | "class_name"
  | "parent_name"
  | "parent_phone"
  | "notes";

const HEADER_ALIASES: Record<ImportField, string[]> = {
  last_name: ["nom", "noms", "nomdefamille", "nomeleve", "nomdeleleve", "lastname"],
  first_name: ["prenom", "prenoms", "prenomeleve", "firstname"],
  full_name: [
    "nometprenom",
    "nometprenoms",
    "nomsetprenoms",
    "nomprenom",
    "nomprenoms",
    "eleve",
    "nomcomplet",
  ],
  class_name: ["classe", "class", "niveau", "salle"],
  parent_name: [
    "parent",
    "nomparent",
    "nomduparent",
    "nomdesparents",
    "tuteur",
    "nomdututeur",
    "parenttuteur",
    "nomparenttuteur",
  ],
  parent_phone: [
    "telephone",
    "tel",
    "telephoneparent",
    "telparent",
    "telephoneduparent",
    "phone",
    "contact",
    "numero",
    "portable",
    "mobile",
  ],
  notes: ["notes", "note", "observation", "observations", "remarque", "remarques"],
};

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Column index for each recognized field, from the header row. */
export function mapHeaders(headers: unknown[]): Partial<Record<ImportField, number>> {
  const map: Partial<Record<ImportField, number>> = {};
  headers.forEach((h, i) => {
    const n = normalizeHeader(h);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [ImportField, string[]][]) {
      if (map[field] === undefined && aliases.includes(n)) {
        map[field] = i;
        return;
      }
    }
  });
  return map;
}

/**
 * "MBA ONDOUA Paul Junior" -> last "MBA ONDOUA", first "Paul Junior". Words in
 * capitals are the family name; without capitals the first word is.
 */
export function splitFullName(full: string): { last_name: string; first_name: string } {
  const words = full.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { last_name: words[0] ?? "", first_name: "" };
  const isUpper = (w: string) => /\p{L}/u.test(w) && w === w.toUpperCase();
  const upper = words.filter(isUpper);
  if (upper.length > 0 && upper.length < words.length) {
    return { last_name: upper.join(" "), first_name: words.filter((w) => !isUpper(w)).join(" ") };
  }
  return { last_name: words[0], first_name: words.slice(1).join(" ") };
}

export type ParsedRow = {
  line: number;
  last_name: string;
  first_name: string;
  class_name: string;
  parent_name: string;
  parent_phone: string;
  notes: string;
  errors: string[];
};

const cell = (row: unknown[], i: number | undefined) =>
  i === undefined ? "" : String(row[i] ?? "").trim();

/** Turns raw rows (first row = headers) into validated import rows. */
export function parseImportRows(
  raw: unknown[][],
  classNames: string[],
): { rows: ParsedRow[]; missingColumns: string[] } {
  const [headers, ...body] = raw;
  const map = mapHeaders(headers ?? []);
  const missingColumns: string[] = [];
  if (map.last_name === undefined && map.full_name === undefined) missingColumns.push("nom");
  if (map.class_name === undefined) missingColumns.push("classe");
  if (missingColumns.length) return { rows: [], missingColumns };

  const known = new Set(classNames.map((c) => normalizeHeader(c)));
  const rows: ParsedRow[] = [];
  body.forEach((r, idx) => {
    if (!r || r.every((c) => String(c ?? "").trim() === "")) return;
    let last = cell(r, map.last_name);
    let first = cell(r, map.first_name);
    if (!last && map.full_name !== undefined) {
      const split = splitFullName(cell(r, map.full_name));
      last = split.last_name;
      first = first || split.first_name;
    }
    const className = cell(r, map.class_name);
    const phoneRaw = cell(r, map.parent_phone);
    const errors: string[] = [];
    if (!last) errors.push("Nom manquant");
    if (!className) errors.push("Classe manquante");
    else if (!known.has(normalizeHeader(className)))
      errors.push(`Classe inconnue « ${className} »`);
    let phone = "";
    if (phoneRaw) {
      const n = normalizeCameroonPhone(phoneRaw);
      if (n) phone = n;
      else errors.push(`Téléphone invalide « ${phoneRaw} »`);
    }
    rows.push({
      line: idx + 2,
      last_name: last.toUpperCase(),
      first_name: first,
      class_name: className,
      parent_name: cell(r, map.parent_name),
      parent_phone: phone,
      notes: cell(r, map.notes),
      errors,
    });
  });
  return { rows, missingColumns };
}
