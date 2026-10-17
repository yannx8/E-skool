import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MonthlyReport = {
  month: string;
  locked: boolean;
  fees_by_method: Record<string, number>;
  fees_by_class: { class_name: string; total: number }[];
  fees_total: number;
  payments_count: number;
  other_income_total: number;
  expenses_by_category: { category: string; total: number }[];
  expenses_total: number;
  payroll_total: number;
  adjustments_total: number;
  closings_count: number;
  closings_difference: number;
  in_by_method: Record<string, { in: number; out: number }>;
};

export type CashPosition = {
  date: string;
  since: string | null;
  opening_cash: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
};

export async function getMonthlyReport(month: string): Promise<MonthlyReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("monthly_report", { p_month: month });
  if (error) return null;
  return data as unknown as MonthlyReport;
}

export async function getCashPosition(date: string): Promise<CashPosition | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cash_position", { p_date: date });
  if (error) return null;
  return data as unknown as CashPosition;
}

/** Money in minus money out for the month (fees + other income + adjustments - expenses - salaries). */
export function monthNet(r: MonthlyReport): number {
  return (
    r.fees_total + r.other_income_total + r.adjustments_total - r.expenses_total - r.payroll_total
  );
}
