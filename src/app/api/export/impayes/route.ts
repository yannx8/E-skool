import { NextResponse, type NextRequest } from "next/server";
import { getActiveYear, getAppUser, getSettings } from "@/lib/auth";
import { csvResponse, toCSV } from "@/lib/csv";
import { BALANCE_STATUSES, termName } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { loadUnpaid, readUnpaidFilters } from "@/app/(app)/impayes/data";

export async function GET(request: NextRequest) {
  const user = await getAppUser();
  if (!user?.role) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const year = await getActiveYear();
  if (!year) return NextResponse.json({ error: "Aucune année scolaire" }, { status: 404 });

  const [settings, rows] = await Promise.all([
    getSettings(),
    loadUnpaid(year.id, readUnpaidFilters(Object.fromEntries(request.nextUrl.searchParams))),
  ]);
  const csv = toCSV(
    ["Nom", "Prénom", "Classe", "Période", "Échéance", "Dû (FCFA)", "Payé (FCFA)", "Reste (FCFA)", "Situation", "Parent", "Téléphone", "Dernière relance"],
    rows.map((r) => [
      r.last_name,
      r.first_name,
      r.class_name,
      r.term == null ? "Plusieurs / frais uniques" : termName(r.term, settings.term_label),
      r.due_date,
      r.due,
      r.applied,
      r.remaining,
      BALANCE_STATUSES[r.status],
      r.parent_name,
      formatPhone(r.parent_phone),
      r.last_reminded_at?.slice(0, 10),
    ]),
  );
  return csvResponse(`impayes-${year.label}.csv`, csv);
}
