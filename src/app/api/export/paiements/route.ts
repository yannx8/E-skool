import { NextResponse, type NextRequest } from "next/server";
import { getActiveYear, getAppUser, getSettings } from "@/lib/auth";
import { csvResponse, toCSV } from "@/lib/csv";
import { feeLineName, PAYMENT_METHODS, type FeeType, type PaymentMethod } from "@/lib/labels";
import { getUserNames } from "@/lib/queries";
import { allPayments, readPaymentFilters } from "@/app/(app)/paiements/filters";

type Row = {
  receipt_number: string;
  paid_at: string;
  amount: number;
  method: PaymentMethod;
  fee: FeeType;
  term: number | null;
  reference: string | null;
  voided: boolean;
  void_reason: string | null;
  created_by: string | null;
  pupils: { last_name: string; first_name: string } | null;
};

export async function GET(request: NextRequest) {
  const user = await getAppUser();
  if (!user?.role) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const year = await getActiveYear();
  if (!year) return NextResponse.json({ error: "Aucune année scolaire" }, { status: 404 });

  const sp = Object.fromEntries(request.nextUrl.searchParams);
  const [settings, names, data] = await Promise.all([
    getSettings(),
    getUserNames(),
    allPayments<Row>(
      year.id,
      readPaymentFilters(sp),
      "receipt_number, paid_at, amount, method, fee, term, reference, voided, void_reason, created_by, pupils(last_name, first_name)",
    ),
  ]);

  const rows = data.map((p) => [
    p.receipt_number,
    p.paid_at,
    p.pupils?.last_name ?? "",
    p.pupils?.first_name ?? "",
    feeLineName(p.fee, p.term, settings.term_label),
    PAYMENT_METHODS[p.method],
    p.reference,
    p.amount,
    p.voided ? "Annulé" : "Valide",
    p.void_reason,
    p.created_by ? (names.get(p.created_by) ?? "") : "",
  ]);
  const csv = toCSV(
    [
      "Reçu",
      "Date",
      "Nom",
      "Prénom",
      "Objet",
      "Mode",
      "Référence",
      "Montant (FCFA)",
      "Statut",
      "Motif annulation",
      "Saisi par",
    ],
    rows,
  );
  return csvResponse(`paiements-${year.label}.csv`, csv);
}
