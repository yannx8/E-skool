import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { openCharges } from "@/lib/billing";
import { allFamilies, oneFamily } from "@/lib/queries";
import { dayMonth, iso, phoneLabel, today } from "@/lib/format";
import { Amount, Empty, PageHeader, inputClass } from "@/components/ui";
import { receivePayment } from "../actions";
import { PaymentForm } from "./payment-form";

export const metadata = { title: "Receive payment" };

export default async function NewPaymentPage({ searchParams }: { searchParams: Promise<{ family?: string; q?: string }> }) {
  await requireUser("ADMIN", "CASHIER");
  const sp = await searchParams;
  const familyId = Number(sp.family);

  if (!familyId) {
    const q = (sp.q ?? "").trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const families = q
      ? (await allFamilies())
          .filter(
            (f) =>
              f.name.toLowerCase().includes(q) ||
              f.guardian?.toLowerCase().includes(q) ||
              (digits.length >= 3 && f.phone?.includes(digits)) ||
              f.pupils.some((p) => `${p.firstNames} ${p.lastName} ${p.code}`.toLowerCase().includes(q)),
          )
          .slice(0, 20)
      : [];
    return (
      <>
        <PageHeader title="Receive payment" sub="Who is paying? Type a child's name, the parent's name or the phone number." />
        <form className="mb-4 max-w-xl">
          <input name="q" defaultValue={sp.q} autoFocus placeholder="e.g. Nkeng, Grace, 677 12…" className={`${inputClass} min-h-13 text-[18px]`} />
        </form>
        {q && (
          <div className="max-w-3xl overflow-hidden rounded-box border border-line bg-panel">
            {families.length === 0 ? (
              <Empty title={`No family matches “${sp.q}”`}>
                <Link href="/families/new" className="underline">
                  Add a new family
                </Link>
              </Empty>
            ) : (
              <ul className="divide-y divide-line">
                {families.map((f) => (
                  <li key={f.id}>
                    <Link href={`/payments/new?family=${f.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-ground/60">
                      <div>
                        <div className="font-bold">
                          {f.name} <span className="font-normal text-ink-2">{f.guardian}</span>
                        </div>
                        <div className="text-[14px] text-ink-2">
                          {f.pupils.filter((p) => p.className).map((p) => `${p.firstNames.split(" ")[0]} (${p.className})`).join(", ")}
                          {f.phone && <span className="num"> · {phoneLabel(f.phone)}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <Amount value={f.dueNow} late={f.daysLate > 0} muted={!f.dueNow} />
                        <div className="text-[13px] text-ink-3">due now</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </>
    );
  }

  const [f, open, accounts] = await Promise.all([
    oneFamily(familyId),
    db.$transaction((tx) => openCharges(tx, familyId)),
    db.account.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
  ]);
  if (!f) return <Empty title="Family not found" />;
  const now = today();

  return (
    <>
      <PageHeader
        title={
          <>
            Payment from <Link href={`/families/${f.id}`} className="hover:underline">{f.name}</Link>
          </>
        }
        sub={
          <>
            {f.guardian && `${f.guardian} · `}Due now <Amount value={f.dueNow} late={f.daysLate > 0} /> F · Balance for the year <Amount value={f.balance} /> F
            {f.credit > 0 && <> · Credit <Amount value={f.credit} /> F</>}
          </>
        }
        actions={<Link href="/payments/new" className="text-ink-2 underline">Another family</Link>}
      />
      <PaymentForm
        action={receivePayment.bind(null, f.id)}
        accounts={accounts}
        guardian={f.guardian ?? ""}
        today={now}
        dueNow={f.dueNow}
        open={open.map((c) => ({
          id: c.id,
          pupil: `${c.enrollment.pupil.firstNames} · ${c.enrollment.class.name}`,
          label: c.label,
          dueOn: iso(c.dueOn),
          dueLabel: dayMonth(c.dueOn),
          balance: c.balance,
          late: iso(c.dueOn) < now,
        }))}
      />
    </>
  );
}
