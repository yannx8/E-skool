"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";
import { toast } from "sonner";
import { buttonClass, inputClass, td, th, tr } from "@/components/ui";
import { fmt, normalizePhone } from "@/lib/format";
import { importRows, type ImportRow } from "./actions";

// Column names people actually use, in English and French.
const COLS: [keyof ImportRow, RegExp][] = [
  ["family", /^(family|famille|nom de famille|surname|nom)$/i],
  ["guardian", /parent|guardian|tuteur/i],
  ["phone", /phone|t[ée]l|whatsapp/i],
  ["firstNames", /first|pr[ée]nom|pupil|[ée]l[èe]ve|child/i],
  ["lastName", /^(last ?name|nom de l'[ée]l[èe]ve)$/i],
  ["className", /class/i],
  ["sex", /^(sex|sexe|gender)$/i],
  ["birthDate", /birth|naissance|born|n[ée] le/i],
  ["paid", /paid|pay[ée]|vers[ée]|already/i],
];

type Parsed = ImportRow & { error?: string };

function toIso(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
}

export function Importer({ classes }: { classes: string[] }) {
  const [rows, setRows] = useState<Parsed[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();
  const known = new Set(classes.map((c) => c.toLowerCase().replace(/\s+/g, "")));

  async function load(file: File) {
    const table: unknown[][] = /\.csv$/i.test(file.name) ? (Papa.parse<string[]>(await file.text(), { skipEmptyLines: true }).data as unknown[][]) : ((await readXlsxFile(file))[0].data as unknown[][]);
    const [head, ...body] = table;
    const idx = Object.fromEntries(COLS.map(([k, re]) => [k, (head ?? []).findIndex((h) => re.test(String(h ?? "").trim()))])) as Record<keyof ImportRow, number>;
    if (idx.family < 0 || idx.firstNames < 0 || idx.className < 0) return void toast.error("The sheet needs at least the columns Family, First names and Class. Use the template.");
    const get = (r: unknown[], k: keyof ImportRow) => (idx[k] >= 0 ? r[idx[k]] : undefined);
    setRows(
      body.map((r) => {
        const row: Parsed = {
          family: String(get(r, "family") ?? "").trim(),
          guardian: String(get(r, "guardian") ?? "").trim() || undefined,
          phone: String(get(r, "phone") ?? "").trim() || undefined,
          firstNames: String(get(r, "firstNames") ?? "").trim(),
          lastName: String(get(r, "lastName") ?? "").trim() || undefined,
          className: String(get(r, "className") ?? "").trim(),
          sex: String(get(r, "sex") ?? "").trim().toUpperCase().replace(/^G.*|^FILLE$/, "F").replace(/^B.*|^GAR.*/, "M").slice(0, 1) || undefined,
          birthDate: toIso(get(r, "birthDate")),
          paid: Number(String(get(r, "paid") ?? "0").replace(/\D/g, "")) || undefined,
        };
        if (!row.family || !row.firstNames) row.error = "Family name and first names are needed";
        else if (!known.has(row.className.toLowerCase().replace(/\s+/g, ""))) row.error = `Unknown class "${row.className}". Classes: ${classes.join(", ")}`;
        else if (row.phone && !normalizePhone(row.phone)) row.error = `Phone "${row.phone}" is not 9 digits`;
        return row;
      }),
    );
  }

  const bad = rows.filter((r) => r.error);
  return (
    <div className="space-y-4">
      <input type="file" accept=".xlsx,.csv" className={`${inputClass} py-2`} onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      {rows.length > 0 && (
        <>
          <p className={bad.length ? "text-late" : "text-paid"}>
            {rows.length} rows read · {bad.length ? `${bad.length} rows to fix in your sheet before importing` : "no error"}
          </p>
          <div className="max-h-[420px] overflow-auto rounded-box border border-line bg-panel">
            <table className="w-full text-[14px]">
              <thead className="sticky top-0 bg-panel">
                <tr><th className={th}>#</th><th className={th}>Family</th><th className={th}>Pupil</th><th className={th}>Class</th><th className={th}>Phone</th><th className={`${th} text-right`}>Already paid</th><th className={th}>Check</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`${tr} ${r.error ? "bg-late-soft" : ""}`}>
                    <td className={`${td} num text-ink-3`}>{i + 2}</td>
                    <td className={td}>{r.family}</td>
                    <td className={td}>{r.firstNames}</td>
                    <td className={td}>{r.className}</td>
                    <td className={`${td} num`}>{r.phone}</td>
                    <td className={`${td} num text-right`}>{r.paid ? fmt(r.paid) : ""}</td>
                    <td className={`${td} ${r.error ? "text-late" : "text-paid"}`}>{r.error ?? "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            disabled={pending || bad.length > 0}
            className={buttonClass("primary")}
            onClick={() =>
              start(async () => {
                const r = await importRows(rows); // import is blocked while any row has an error
                if (r?.error) toast.error(r.error);
                else {
                  toast.success(r?.ok ?? "Imported.");
                  router.push("/families");
                }
              })
            }
          >
            {pending ? "Importing…" : `Import ${rows.length} pupils`}
          </button>
        </>
      )}
    </div>
  );
}
