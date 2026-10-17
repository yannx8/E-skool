import { requireUser } from "@/lib/auth";

// Printable documents (receipts, payslips, reports): no navigation chrome.
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="min-h-dvh bg-slate-100 py-4 print:bg-white print:py-0">{children}</div>;
}
