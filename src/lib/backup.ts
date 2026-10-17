import "server-only";
import { strToU8, zipSync } from "fflate";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { fetchAll } from "@/lib/fetch-all";
import { toCSV, type CsvValue } from "@/lib/csv";
import { todayISO } from "@/lib/format";

type TableName = keyof Database["public"]["Tables"];

// Every business table, with a column giving a stable order for paging.
const TABLES: { name: TableName; order: string }[] = [
  { name: "settings", order: "id" },
  { name: "school_years", order: "id" },
  { name: "classes", order: "id" },
  { name: "fee_schedules", order: "id" },
  { name: "pupils", order: "id" },
  { name: "enrollments", order: "id" },
  { name: "discounts", order: "id" },
  { name: "payments", order: "id" },
  { name: "reminder_log", order: "id" },
  { name: "user_roles", order: "user_id" },
  { name: "staff", order: "id" },
  { name: "staff_salary_history", order: "id" },
  { name: "payroll_entries", order: "id" },
  { name: "expense_categories", order: "id" },
  { name: "expenses", order: "id" },
  { name: "other_income", order: "id" },
  { name: "cash_closings", order: "id" },
  { name: "period_locks", order: "month" },
  { name: "adjustments", order: "id" },
  { name: "enrollment_applications", order: "id" },
  { name: "message_jobs", order: "id" },
  { name: "audit_log", order: "id" },
];

function rowsToCsv(rows: Record<string, unknown>[]): string {
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const values: CsvValue[][] = rows.map((r) =>
    headers.map((h) => {
      const v = r[h];
      if (v === null || v === undefined) return null;
      if (typeof v === "object") return JSON.stringify(v);
      return v as CsvValue;
    }),
  );
  return toCSV(headers, values);
}

/**
 * Zip with one CSV per table (FR-X2, FR-X3). With a user client, RLS limits
 * what is exported; with the service-role client, everything is.
 */
export async function buildBackupZip(
  client: SupabaseClient<Database>,
): Promise<{ zip: Uint8Array; filename: string; counts: Record<string, number> }> {
  const files: Record<string, Uint8Array> = {};
  const counts: Record<string, number> = {};
  for (const t of TABLES) {
    const rows = await fetchAll<Record<string, unknown>>(
      (from, to) =>
        client.from(t.name).select("*").order(t.order).range(from, to) as unknown as PromiseLike<{
          data: Record<string, unknown>[] | null;
          error: { message: string } | null;
        }>,
    );
    counts[t.name] = rows.length;
    files[`${t.name}.csv`] = strToU8(rowsToCsv(rows));
  }
  files["LISEZMOI.txt"] = strToU8(
    [
      "Sauvegarde E-skool",
      `Date : ${todayISO()}`,
      "",
      "Un fichier CSV par table (séparateur point-virgule, encodage UTF-8).",
      "Les montants sont en FCFA entiers. Les dates sont au format AAAA-MM-JJ.",
      "Lignes par table :",
      ...Object.entries(counts).map(([k, v]) => `  ${k} : ${v}`),
    ].join("\r\n"),
  );
  return {
    zip: zipSync(files, { level: 6 }),
    filename: `eskool-sauvegarde-${todayISO()}.zip`,
    counts,
  };
}
