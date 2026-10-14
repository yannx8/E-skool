/* eslint-disable @next/next/no-img-element -- school logo from Supabase Storage */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { createAnonClient } from "@/lib/supabase/server";
import { formatDate, formatFCFA } from "@/lib/format";
import { formatPhone, normalizeCameroonPhone } from "@/lib/phone";
import {
  FEE_TYPES,
  feeLineName,
  PAYMENT_METHODS,
  type FeeType,
  type PaymentMethod,
} from "@/lib/labels";
import { logoUrl } from "@/lib/storage";
import { whatsappUrl } from "@/lib/reminder";

export const metadata: Metadata = {
  title: "Suivi des paiements",
  robots: { index: false, follow: false },
};

type Portal = {
  school: {
    name: string;
    phone: string | null;
    address: string | null;
    term_label: string;
    logo_path: string | null;
  };
  pupil: { last_name: string; first_name: string; is_active: boolean };
  school_year: string | null;
  class_name: string | null;
  lines: {
    fee: FeeType;
    term: number | null;
    due_date: string;
    due: number;
    applied: number;
    remaining: number;
    status: string;
  }[];
  credit: number;
  payments: {
    paid_at: string;
    receipt_number: string;
    amount: number;
    method: PaymentMethod;
    fee: FeeType;
    term: number | null;
  }[];
};

// V2 parent portal: read-only, reachable only with the unguessable token
// shared by the school. No login, no personal contact data exposed.
export default async function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) notFound();
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("parent_portal", { p_token: token });
  if (!data) notFound();
  const p = data as unknown as Portal;
  const remaining = p.lines.reduce((s, l) => s + l.remaining, 0);
  const schoolWhatsapp = normalizeCameroonPhone(p.school.phone);
  const logo = logoUrl(p.school.logo_path);
  const childName = `${p.pupil.last_name} ${p.pupil.first_name}`.trim();

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        {logo && <img src={logo} alt="" className="size-14 rounded-lg object-contain" />}
        <div>
          <p className="text-lg font-bold text-primary">{p.school.name}</p>
          {p.school.address && <p className="text-sm text-slate-600">{p.school.address}</p>}
        </div>
      </header>

      <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
        <p className="text-sm text-slate-500">Élève</p>
        <h1 className="text-2xl font-bold">{childName}</h1>
        <p className="text-slate-600">
          {p.class_name ?? "-"} · {p.school_year ?? ""}
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-sm text-slate-600">Reste à payer</p>
          <p
            className={`tabular text-3xl font-black ${remaining > 0 ? "text-warning" : "text-success"}`}
          >
            {formatFCFA(remaining)}
          </p>
          {p.credit > 0 && (
            <p className="mt-1 text-sm text-success">
              Crédit en votre faveur : {formatFCFA(p.credit)}
            </p>
          )}
        </div>
      </section>

      <section className="mb-5 rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">Échéances</h2>
        <ul className="divide-y divide-slate-100">
          {p.lines.map((l) => (
            <li
              key={`${l.fee}-${l.term}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">{feeLineName(l.fee, l.term, p.school.term_label)}</p>
                <p className="text-sm text-slate-500">
                  Avant le {formatDate(l.due_date)} · {formatFCFA(l.due)}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular font-semibold">
                  {l.remaining > 0 ? formatFCFA(l.remaining) : "Payé"}
                </p>
                <StatusBadge status={l.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <h2 className="border-b border-slate-100 px-4 py-3 font-semibold">Paiements reçus</h2>
        {p.payments.length === 0 ? (
          <p className="px-4 py-3 text-slate-500">Aucun paiement enregistré.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {p.payments.map((pay) => (
              <li
                key={pay.receipt_number}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">Reçu {pay.receipt_number}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(pay.paid_at)} · {PAYMENT_METHODS[pay.method]} ·{" "}
                    {pay.term == null
                      ? FEE_TYPES[pay.fee]
                      : feeLineName(pay.fee, pay.term, p.school.term_label)}
                  </p>
                </div>
                <p className="tabular font-semibold">{formatFCFA(pay.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {p.school.phone && (
        <div className="flex flex-wrap gap-2">
          {schoolWhatsapp && (
            <a
              href={whatsappUrl(schoolWhatsapp, `Bonjour, je suis le parent de ${childName}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("whatsapp")}
            >
              <MessageCircle aria-hidden /> Écrire à l&apos;école
            </a>
          )}
          <a
            href={`tel:${schoolWhatsapp ? `+${schoolWhatsapp}` : p.school.phone}`}
            className={buttonClasses("secondary")}
          >
            <Phone aria-hidden /> {formatPhone(schoolWhatsapp) || p.school.phone}
          </a>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">
        Page personnelle : ne la partagez pas.
      </p>
    </main>
  );
}
