"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveYear, getAppUser, userWithPermission } from "@/lib/auth";
import { fail, friendlyError, type ActionResult } from "@/lib/errors";
import { isUuid } from "@/lib/params";
import { todayISO } from "@/lib/format";
import type { FeeType, PaymentMethod } from "@/lib/labels";

export type PupilHit = {
  pupil_id: string;
  last_name: string;
  first_name: string;
  parent_name: string | null;
  parent_phone: string | null;
  class_name: string;
  is_active: boolean;
  remaining: number;
};

export type BalanceLine = {
  fee: FeeType;
  term: number | null;
  due: number;
  applied: number;
  remaining: number;
  due_date: string;
  status: string;
};

/** Instant search (FR-P2) for the payment screen, scoped to the active year. */
export async function searchPupils(query: string): Promise<PupilHit[]> {
  const user = await getAppUser();
  if (!user?.role) return [];
  const q = query.trim().slice(0, 60);
  if (q.length < 2) return [];
  const year = await getActiveYear();
  if (!year) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_pupils", { p_query: q, p_school_year_id: year.id, p_limit: 10 });
  if (error) {
    friendlyError(error);
    return [];
  }
  return (data ?? []).map((r) => ({
    pupil_id: r.pupil_id,
    last_name: r.last_name,
    first_name: r.first_name,
    parent_name: r.parent_name,
    parent_phone: r.parent_phone,
    class_name: r.class_name,
    is_active: r.is_active,
    remaining: r.remaining,
  }));
}

/** Fee lines of one pupil for the active year, in due order. */
export async function pupilBalance(pupilId: string): Promise<BalanceLine[]> {
  const user = await getAppUser();
  if (!user?.role || !isUuid(pupilId)) return [];
  const year = await getActiveYear();
  if (!year) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("balance_lines")
    .select("fee, term, due, applied, remaining, due_date, status")
    .eq("pupil_id", pupilId)
    .eq("school_year_id", year.id)
    .order("due_date", { ascending: true })
    .order("term", { ascending: true, nullsFirst: true });
  return (data ?? []).map((l) => ({
    fee: l.fee as FeeType,
    term: l.term,
    due: l.due ?? 0,
    applied: l.applied ?? 0,
    remaining: l.remaining ?? 0,
    due_date: l.due_date ?? "",
    status: l.status ?? "",
  }));
}

const uuid = z.string().refine(isUuid, "Identifiant invalide");

const paymentSchema = z.object({
  pupil_id: uuid,
  line: z.string().regex(/^[a-z_]+\|\d*$/, "Choisissez la période à payer."),
  amount: z.coerce.number().int("Montant invalide.").positive("Le montant doit être supérieur à zéro.").max(999_999_999),
  method: z.enum(["cash", "orange_money", "mtn_momo", "bank"], { message: "Choisissez le mode de paiement." }),
  reference: z.string().trim().max(100).optional(),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  note: z.string().trim().max(500).optional(),
  force: z.string().optional(),
});

export type DuplicatePayment = {
  id: string;
  receipt_number: string;
  amount: number;
  paid_at: string;
  method: PaymentMethod;
  reference: string | null;
  pupil_name: string;
};

export type RecordPaymentState =
  | (ActionResult & { duplicates?: undefined })
  | { ok: false; error: string; duplicates: DuplicatePayment[] }
  | null;

export async function recordPayment(_prev: RecordPaymentState, formData: FormData): Promise<RecordPaymentState> {
  const user = await userWithPermission("recordPayment");
  if (!user) return fail("Action non autorisée pour votre rôle.");
  const year = await getActiveYear();
  if (!year) return fail("Aucune année scolaire active.");

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const v = parsed.data;
  if (v.paid_at > todayISO()) return fail("La date du paiement ne peut pas être dans le futur.");

  const [fee, termRaw] = v.line.split("|");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_payment", {
    p_pupil_id: v.pupil_id,
    p_school_year_id: year.id,
    p_fee: fee as FeeType,
    p_term: (termRaw ? Number(termRaw) : null) as number,
    p_amount: v.amount,
    p_method: v.method,
    p_reference: v.reference || undefined,
    p_paid_at: v.paid_at,
    p_note: v.note || undefined,
    p_force: v.force === "1",
  });
  if (error) return fail(friendlyError(error));

  const result = data as { status: string; payment_id?: string; duplicates?: DuplicatePayment[] };
  if (result.status === "duplicate") {
    return {
      ok: false,
      error: "Un paiement identique existe déjà. Vérifiez avant d'enregistrer.",
      duplicates: result.duplicates ?? [],
    };
  }
  revalidatePath("/", "layout");
  redirect(`/recu/${result.payment_id}?nouveau=1`);
}

const voidSchema = z.object({
  payment_id: uuid,
  reason: z.string().trim().min(5, "Indiquez un motif d'au moins 5 caractères.").max(300),
});

export async function voidPayment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await userWithPermission("voidPayment");
  if (!user) return fail("Seul l'administrateur peut annuler un paiement.");
  const parsed = voidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_payment", {
    p_payment_id: parsed.data.payment_id,
    p_reason: parsed.data.reason,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/", "layout");
  return { ok: true, message: "Paiement annulé. Il reste visible, barré, dans l'historique." };
}
