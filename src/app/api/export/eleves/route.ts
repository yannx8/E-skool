import { NextResponse, type NextRequest } from "next/server";
import { getActiveYear, getAppUser } from "@/lib/auth";
import { csvResponse, toCSV } from "@/lib/csv";
import { BALANCE_STATUSES } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { loadPupils, readPupilFilters } from "@/app/(app)/eleves/data";

export async function GET(request: NextRequest) {
  const user = await getAppUser();
  if (!user?.role) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const year = await getActiveYear();
  if (!year) return NextResponse.json({ error: "Aucune année scolaire" }, { status: 404 });

  const rows = await loadPupils(
    year.id,
    readPupilFilters(Object.fromEntries(request.nextUrl.searchParams)),
  );
  const csv = toCSV(
    [
      "Nom",
      "Prénom",
      "Classe",
      "Parent",
      "Téléphone",
      "Dû (FCFA)",
      "Payé (FCFA)",
      "Reste (FCFA)",
      "Situation",
      "Présent",
    ],
    rows.map((r) => [
      r.last_name,
      r.first_name,
      r.class_name,
      r.parent_name,
      formatPhone(r.parent_phone),
      r.due,
      r.paid,
      r.remaining,
      BALANCE_STATUSES[r.status],
      r.is_active ? "Oui" : "Non",
    ]),
  );
  return csvResponse(`eleves-${year.label}.csv`, csv);
}
