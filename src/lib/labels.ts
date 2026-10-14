// French labels for database enums and statuses. Keep in sync with the enums
// in supabase/migrations.
import type { Database } from "@/lib/database.types";

type Enums = Database["public"]["Enums"];
export type PaymentMethod = Enums["payment_method"];
export type FeeType = Enums["fee_type"];
export type AppRole = Enums["app_role"];
export type ContractType = Enums["contract_type"];
export type ApplicationStatus = Enums["application_status"];
export type BalanceStatus = "solvable" | "partiel" | "insolvable" | "pas_encore_du";

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  bank: "Banque",
};

export const FEE_TYPES: Record<FeeType, string> = {
  tuition: "Scolarité",
  registration: "Inscription",
  uniform: "Tenue",
  books: "Livres et fournitures",
  exam: "Examens",
  other: "Autres frais",
};

export const ROLES: Record<AppRole, string> = {
  admin: "Administrateur",
  owner: "Fondateur (lecture seule)",
  secretary: "Secrétaire",
};

export const CONTRACT_TYPES: Record<ContractType, string> = {
  permanent: "CDI",
  fixed_term: "CDD",
  part_time: "Temps partiel",
  volunteer: "Bénévole",
};

export const APPLICATION_STATUSES: Record<ApplicationStatus, string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  visit: "Visite prévue",
  accepted: "Acceptée",
  enrolled: "Inscrite",
  rejected: "Refusée",
};

export const BALANCE_STATUSES: Record<BalanceStatus, string> = {
  solvable: "Solvable",
  partiel: "Partiel",
  insolvable: "Insolvable",
  pas_encore_du: "Pas encore dû",
};

export function isBalanceStatus(v: unknown): v is BalanceStatus {
  return typeof v === "string" && v in BALANCE_STATUSES;
}

/** "Tranche 2", or "Frais uniques" for one-off fees (term null). */
export function termName(term: number | null | undefined, termLabel = "Tranche"): string {
  return term == null ? "Frais uniques" : `${termLabel} ${term}`;
}

/** Fee line label: "Scolarité - Tranche 1", "Inscription". */
export function feeLineName(fee: FeeType, term: number | null | undefined, termLabel = "Tranche"): string {
  return term == null ? FEE_TYPES[fee] : `${FEE_TYPES[fee]} - ${termName(term, termLabel)}`;
}
