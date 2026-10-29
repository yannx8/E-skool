import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Printer } from "lucide-react";
import { can, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentYear, getSchool, oneFamily } from "@/lib/queries";
import { METHOD_LABEL, dateLabel, dayMonth, fmt, phoneLabel, receiptNo, timeLabel, today } from "@/lib/format";
import { reminderText } from "@/lib/reminder";
import { ActionForm } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { ReminderButton } from "@/components/reminder-button";
import { Amount, Avatar, FeeStrip, Field, LinkButton, Panel, StateTag, SummaryCard, Tabs, Tag, buttonClass, inputClass, td, th, tr } from "@/components/ui";
import { addCharge, addPupil, cancelCharge, changeClass, giveDiscount, makePromise, markLeft } from "../actions";

export default async function FamilyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const sp = await searchParams;
  const tab = sp.tab === "payments" || sp.tab === "statement" ? sp.tab : "summary";
  const [f, school, year] = await Promise.all([oneFamily(id), getSchool(), currentYear()]);
  if (!f || !school) notFound();
  const [payments, reminders, classes, optional] = await Promise.all([
    db.payment.findMany({ where: { familyId: id }, orderBy: { id: "desc" }, take: 30, include: { createdBy: true } }),
    db.reminder.findMany({ where: { familyId: id }, orderBy: { id: "desc" }, take: 10, include: { createdBy: true } }),
    db.class.findMany({ where: { active: true }, orderBy: { level: "asc" } }),
    year ? db.feeItem.findMany({ where: { yearId: year.id, optional: true }, orderBy: { position: "asc" } }) : [],
  ]);
  const collect = can.collect(user);
  const admin = can.manage(user);
  const now = today();
  const pastDue = f.pupils.flatMap((p) => p.lines).filter((l) => l.dueOn < now).reduce((s, l) => s + l.balance, 0);

  return (
    <>
      <div className="mb-3 text-[14px] text-ink-3">
        <Link href="/families" className="text-sun hover:underline">
          Families
        </Link>{" "}
        / {f.name}
      </div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={f.name} size="lg" />
          <div className="min-w-0">
            <h1 className="text-[28px] leading-tight font-bold tracking-[-0.02em]">{f.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 text-ink-2">
              {f.guardian && <span>{f.guardian}</span>}
              {f.phone && (
                <a href={`tel:+237${f.phone}`} className="num inline-flex min-h-11 items-center gap-1.5 hover:text-sun">
                  <Phone className="size-4" /> {phoneLabel(f.phone)}
                </a>
              )}
              {f.phone2 && <span className="num">{phoneLabel(f.phone2)}</span>}
              {f.address && <span>{f.address}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {collect && <LinkButton href={`/payments/new?family=${f.id}`} tone="primary">Receive payment</LinkButton>}
          {collect && f.dueNow > 0 && <ReminderButton familyId={f.id} phone={f.phone} amountDue={f.dueNow} text={reminderText(school.reminderTemplate, school.name, f)} />}
          {collect && <LinkButton href={`/families/${f.id}/edit`} tone="quiet">Edit</LinkButton>}
        </div>
      </header>

      <SummaryCard
        className="mb-6"
        title="Account"
        sub={`Paid this year ${fmt(f.paid)} of ${fmt(f.billed)}${f.daysLate > 0 ? ` · ${f.daysLate} days late` : ""}${f.credit > 0 ? ` · credit kept ${fmt(f.credit)}` : ""}`}
        total={f.balance}
        parts={[
          { label: "Past due", value: pastDue, tone: "late" },
          ...(f.dueNow > pastDue ? [{ label: "Due today", value: f.dueNow - pastDue, tone: "action" as const }] : []),
          { label: "Not yet due", value: f.balance - f.dueNow, tone: "later" },
        ]}
      />

      {f.promise && f.promise.state !== "kept" && (
        <div className={`mb-6 rounded-box border px-5 py-3 ${f.promise.state === "broken" ? "border-late/40 bg-late-soft" : "border-line bg-sun-soft"}`}>
          <span className="font-bold">{f.promise.state === "broken" ? "Promise broken: " : "Promise to pay: "}</span>
          <Amount value={f.promise.amount} /> F by {dateLabel(f.promise.dueOn)}
          {f.promise.paidSince > 0 && <> · <Amount value={f.promise.paidSince} /> F paid since</>}
          {f.promise.note && <span className="text-ink-2"> · {f.promise.note}</span>}
        </div>
      )}

      <Tabs
        items={[
          { href: `/families/${f.id}`, label: "Summary", on: tab === "summary" },
          { href: `/families/${f.id}?tab=payments`, label: `Payments (${payments.length})`, on: tab === "payments" },
          { href: `/families/${f.id}?tab=statement`, label: "Statement", on: tab === "statement" },
        ]}
      />

      {tab === "summary" && (
        <div className="space-y-6">
          {f.pupils.map((p) => (
            <Panel
              key={p.id}
              flush
              title={
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    {p.firstNames} <span className="text-ink-2">{p.lastName}</span>
                  </span>
                  <span className="text-[14px] font-medium text-ink-3">
                    {p.className ?? "Not enrolled this year"} · <span className="num">{p.code}</span>
                  </span>
                  {p.status !== "ACTIVE" && <Tag tone="late">{p.status === "LEFT" ? `Left ${p.leftOn ? dayMonth(p.leftOn) : ""}` : "Graduated"}</Tag>}
                </span>
              }
              actions={<FeeStrip segments={p.segments} />}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-[15px]">
                  <thead>
                    <tr>
                      <th className={th}>Fee</th>
                      <th className={th}>Due</th>
                      <th className={`${th} text-right`}>Amount</th>
                      <th className={`${th} text-right`}>Paid</th>
                      <th className={`${th} text-right`}>Left to pay</th>
                      <th className={th}>Status</th>
                      {admin && <th className={th} />}
                    </tr>
                  </thead>
                  <tbody>
                    {p.lines.map((l) => (
                      <tr key={l.id} className={tr}>
                        <td className={td}>
                          {l.label}
                          {l.yearId !== year?.id && <span className="ml-2 text-[13px] text-late">previous year</span>}
                          {l.discount > 0 && (
                            <div className="text-[13px] text-paid">
                              −{fmt(l.discount)} {l.discountReason}
                            </div>
                          )}
                        </td>
                        <td className={`${td} text-ink-2 whitespace-nowrap`}>{dayMonth(l.dueOn)}</td>
                        <td className={`${td} text-right`}>
                          <Amount value={l.net} />
                        </td>
                        <td className={`${td} text-right`}>
                          <Amount value={l.paid} muted={!l.paid} />
                        </td>
                        <td className={`${td} text-right`}>
                          <Amount value={l.balance} late={l.state === "overdue"} muted={!l.balance} />
                        </td>
                        <td className={td}>
                          <StateTag state={l.state} />
                        </td>
                        {admin && (
                          <td className={`${td} text-right`}>
                            {l.balance > 0 && (
                              <Dialog label="Discount" title={`Discount on ${l.label}`} className="text-[14px] text-ink-2 underline hover:text-ink">
                                <ActionForm action={giveDiscount.bind(null, l.id)} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3">
                                    <Field label="Percent">
                                      <input name="percent" inputMode="numeric" placeholder="10" className={inputClass} />
                                    </Field>
                                    <Field label="Or amount (F)">
                                      <input name="amount" inputMode="numeric" defaultValue={l.discount || ""} className={inputClass} />
                                    </Field>
                                  </div>
                                  <Field label="Reason" hint="Shown to the owner in Controls.">
                                    <input name="reason" required defaultValue={l.discountReason ?? ""} placeholder="Sibling discount, staff child, scholarship…" className={inputClass} />
                                  </Field>
                                  <button className={buttonClass("primary", "w-full")}>Save discount</button>
                                </ActionForm>
                              </Dialog>
                            )}
                            {l.oneOff && l.paid === 0 && (
                              <Dialog label="Remove" title={`Remove ${l.label}`} className="ml-3 text-[14px] text-late underline">
                                <ActionForm action={cancelCharge.bind(null, l.id)} className="space-y-4">
                                  <Field label="Reason">
                                    <input name="reason" required className={inputClass} />
                                  </Field>
                                  <button className={buttonClass("danger", "w-full")}>Remove fee</button>
                                </ActionForm>
                              </Dialog>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {!p.lines.length && (
                      <tr className={tr}>
                        <td className={`${td} text-ink-3`} colSpan={7}>
                          No fees billed. Check the fee table for this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {collect && p.enrollmentId && (
                <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
                  <Dialog label="Add a fee" title={`Add a fee for ${p.firstNames}`} tone="quiet">
                    <ActionForm action={addCharge.bind(null, p.id)} className="space-y-4">
                      {optional.length > 0 && (
                        <Field label="Optional fee from the fee table">
                          <select name="feeItemId" className={inputClass} defaultValue="">
                            <option value="">— One-off fee below —</option>
                            {optional.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <Field label="Description">
                        <input name="label" placeholder="Uniform, books, lost library book…" className={inputClass} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Amount (F)">
                          <input name="amount" inputMode="numeric" className={inputClass} />
                        </Field>
                        <Field label="Due">
                          <input name="dueOn" type="date" defaultValue={now} className={inputClass} />
                        </Field>
                      </div>
                      <button className={buttonClass("primary", "w-full")}>Add fee</button>
                    </ActionForm>
                  </Dialog>
                  {admin && (
                    <>
                      <Dialog label="Change class" title={`Change class for ${p.firstNames}`} tone="quiet">
                        <ActionForm action={changeClass.bind(null, p.id)} className="space-y-4">
                          <Field label="New class" hint="The fees follow the new class. Money already paid stays.">
                            <select name="classId" defaultValue={p.classId ?? ""} className={inputClass}>
                              {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <button className={buttonClass("primary", "w-full")}>Change class</button>
                        </ActionForm>
                      </Dialog>
                      {p.status === "ACTIVE" && (
                        <Dialog label="Pupil left" title={`${p.firstNames} left the school`} tone="quiet">
                          <ActionForm action={markLeft.bind(null, p.id)} className="space-y-4">
                            <Field label="Last day" hint="Installments due after this date are cancelled. What was owed before stays owed.">
                              <input name="leftOn" type="date" defaultValue={now} required className={inputClass} />
                            </Field>
                            <button className={buttonClass("danger", "w-full")}>Confirm departure</button>
                          </ActionForm>
                        </Dialog>
                      )}
                    </>
                  )}
                </div>
              )}
            </Panel>
          ))}
          {collect && (
            <Dialog label="+ Enroll another child" title={`New pupil in the ${f.name} family`}>
              <ActionForm action={addPupil.bind(null, f.id)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First names">
                    <input name="firstNames" required className={inputClass} />
                  </Field>
                  <Field label="Surname">
                    <input name="lastName" defaultValue={f.name} className={inputClass} />
                  </Field>
                  <Field label="Class">
                    <select name="classId" required className={inputClass}>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sex">
                    <select name="sex" className={inputClass} defaultValue="">
                      <option value="">—</option>
                      <option value="F">Girl</option>
                      <option value="M">Boy</option>
                    </select>
                  </Field>
                  <Field label="Date of birth">
                    <input name="birthDate" type="date" className={inputClass} />
                  </Field>
                  <Field label="Joined on">
                    <input name="joinedOn" type="date" defaultValue={now} className={inputClass} />
                  </Field>
                </div>
                <button className={buttonClass("primary", "w-full")}>Enroll and bill fees</button>
              </ActionForm>
            </Dialog>
          )}
          {f.notes && <Panel title="Notes">{f.notes}</Panel>}
        </div>
      )}

      {tab === "payments" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0">
          <Panel title="Receipts" flush>
            {payments.length === 0 ? (
              <p className="px-5 py-4 text-ink-3">No payment yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {payments.map((p) => (
                  <li key={p.id}>
                    <Link href={`/payments/${p.id}`} className="flex min-h-11 items-center justify-between gap-3 px-5 py-3 hover:bg-sun-soft/40">
                      <div>
                        <div className={p.voidedAt ? "text-ink-3 line-through" : "font-medium"}>
                          <span className="num">No. {receiptNo(p.number)}</span>
                        </div>
                        <div className="text-[13px] text-ink-3">
                          {dateLabel(p.paidOn)} · {METHOD_LABEL[p.method]} · {p.createdBy.name}
                        </div>
                      </div>
                      {p.voidedAt ? <Tag tone="late">Void</Tag> : <Amount value={p.amount} />}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          </div>
          <div className="min-w-0 space-y-6">
          {collect && f.balance > 0 && (
            <Panel title="Promise to pay">
              <p className="mb-4 text-[14px] text-ink-2">A moratoire: the parent commits to an amount and a date. Reminders pause until then; a missed date shows up in Collections.</p>
              <ActionForm action={makePromise.bind(null, f.id)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount (F)">
                    <input name="amount" inputMode="numeric" required defaultValue={f.dueNow || ""} className={inputClass} />
                  </Field>
                  <Field label="By">
                    <input name="dueOn" type="date" required className={inputClass} />
                  </Field>
                </div>
                <Field label="Note">
                  <input name="note" placeholder="Agreed with the director" className={inputClass} />
                </Field>
                <button className={buttonClass("secondary", "w-full")}>Record promise</button>
              </ActionForm>
            </Panel>
          )}

          <Panel title="Reminders sent" flush>
            {reminders.length === 0 ? (
              <p className="px-5 py-4 text-ink-3">Never reminded.</p>
            ) : (
              <ul className="divide-y divide-line text-[14px]">
                {reminders.map((r) => (
                  <li key={r.id} className="flex justify-between px-5 py-2.5">
                    <span>
                      {dateLabel(r.createdAt)} {timeLabel(r.createdAt)} · {r.channel === "WHATSAPP" ? "WhatsApp" : r.channel === "LETTER" ? "Letter" : "Call"}
                    </span>
                    <span className="text-ink-3">
                      <Amount value={r.amountDue} /> · {r.createdBy.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          </div>
        </div>
      )}

      {tab === "statement" && (
        <Panel title="Statement" sub="What the parent receives: every fee, payment and balance, child by child" actions={<LinkButton href={`/print/statement/${f.id}`} tone="primary"><Printer className="size-4" /> Open statement</LinkButton>} flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[15px]">
              <thead>
                <tr><th className={th}>Pupil</th><th className={`${th} text-right`}>Billed</th><th className={`${th} text-right`}>Paid</th><th className={`${th} text-right`}>Left to pay</th></tr>
              </thead>
              <tbody>
                {f.pupils.map((p) => {
                  const sum = (k: "net" | "paid" | "balance") => p.lines.reduce((s, l) => s + l[k], 0);
                  return (
                    <tr key={p.id} className={tr}>
                      <td className={td}>{p.firstNames} <span className="text-ink-3">· {p.className ?? "old"}</span></td>
                      <td className={`${td} text-right`}><Amount value={sum("net")} /></td>
                      <td className={`${td} text-right`}><Amount value={sum("paid")} /></td>
                      <td className={`${td} text-right`}><Amount value={sum("balance")} late={p.dueNow > 0} muted={!sum("balance")} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
