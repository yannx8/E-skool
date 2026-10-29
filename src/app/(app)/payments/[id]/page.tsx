import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { can, requireUser } from "@/lib/auth";
import { getSchool } from "@/lib/queries";
import { receiptData } from "@/lib/receipt-data";
import { METHOD_LABEL, fmt, receiptNo, whatsappLink } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { Receipt } from "@/components/receipt";
import { Field, LinkButton, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { voidReceipt } from "../actions";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const [data, school] = await Promise.all([receiptData(id), getSchool()]);
  if (!data || !school) notFound();
  const { p } = data;
  const text = `${school.name}\nReceipt No. ${receiptNo(p.number)}: ${fmt(p.amount)} F received (${METHOD_LABEL[p.method]}).\n${data.lines.map((l) => `${l.pupil.split(" ")[0]}: ${l.label} ${fmt(l.amount)}`).join("\n")}\n${data.balanceNow > 0 ? `Still to pay this year: ${fmt(data.balanceNow)} F.` : "Fees fully paid. Thank you."}`;

  return (
    <>
      <PageHeader
        title={<span className="num">Receipt {receiptNo(p.number)}</span>}
        sub={
          <Link href={`/families/${p.familyId}`} className="hover:underline">
            {p.family.name} family
          </Link>
        }
        actions={
          <>
            <LinkButton href={`/print/receipt/${p.id}`} tone="primary">
              <Printer className="size-4" /> Print
            </LinkButton>
            {p.family.phone && !p.voidedAt && (
              <a href={whatsappLink(p.family.phone, text)} target="_blank" rel="noopener" className={buttonClass()}>
                Send on WhatsApp
              </a>
            )}
            {can.collect(user) && <LinkButton href="/payments/new">Next payment</LinkButton>}
            {can.manage(user) && !p.voidedAt && (
              <Dialog label="Void" title={`Void receipt ${receiptNo(p.number)}`} tone="danger">
                <ActionForm action={voidReceipt.bind(null, p.id)} className="space-y-4">
                  <p className="text-ink-2">The receipt keeps its number and stays visible, marked VOID. The fees it paid become due again. The owner sees every void.</p>
                  <Field label="Reason">
                    <input name="reason" required minLength={4} placeholder="Wrong amount typed, cheque bounced…" className={inputClass} />
                  </Field>
                  <button className={buttonClass("danger", "w-full")}>Void this receipt</button>
                </ActionForm>
              </Dialog>
            )}
          </>
        }
      />
      <div className="overflow-x-auto rounded-box border border-line bg-panel py-6">
        <Receipt school={school} data={data} />
      </div>
    </>
  );
}
