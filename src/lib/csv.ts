// CSV export tuned for Excel in French locale: semicolon separator and a UTF-8
// BOM so accents display correctly when the file is double-clicked.

export type CsvValue = string | number | boolean | null | undefined;

function escapeCell(value: CsvValue, sep: string): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Neutralize spreadsheet formulas (CSV injection).
  if (/^[=+\-@\t\r]/.test(s) && typeof value === "string") s = `'${s}`;
  if (s.includes(sep) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(headers: string[], rows: CsvValue[][], sep = ";"): string {
  const lines = [headers, ...rows].map((row) => row.map((v) => escapeCell(v, sep)).join(sep));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
