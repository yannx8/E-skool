"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label } from "@/components/ui/form";
import { MoneyInput, useUnsavedChangesWarning } from "@/components/ui/client";
import { Alert } from "@/components/ui/misc";
import { FEE_TYPES, termName, type FeeType } from "@/lib/labels";
import { formatFCFA } from "@/lib/format";
import { saveFees, type FeeLineInput } from "../actions";

type Schedule = {
  class_id: string;
  fee: FeeType;
  term: number | null;
  amount: number;
  due_date: string;
};
type ClassRow = { id: string; name: string };

const ONE_OFF: FeeType[] = ["registration", "uniform", "books", "exam", "other"];
const key = (classId: string, fee: FeeType, term: number | null) =>
  `${classId}|${fee}|${term ?? ""}`;

export function FeeGrid({
  classes,
  schedules,
  termsCount,
  termLabel,
}: {
  classes: ClassRow[];
  schedules: Schedule[];
  termsCount: number;
  termLabel: string;
}) {
  const router = useRouter();
  const terms = useMemo(() => Array.from({ length: termsCount }, (_, i) => i + 1), [termsCount]);

  const [amounts, setAmounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(schedules.map((s) => [key(s.class_id, s.fee, s.term), s.amount])),
  );
  // One due date per tuition term and per one-off fee type, shared by all classes.
  const [dues, setDues] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const s of schedules) {
      const k = s.fee === "tuition" ? `tuition|${s.term}` : s.fee;
      d[k] ??= s.due_date;
    }
    return d;
  });
  const [enabled, setEnabled] = useState<Set<FeeType>>(
    () => new Set(ONE_OFF.filter((f) => schedules.some((s) => s.fee === f))),
  );
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  useUnsavedChangesWarning(dirty);

  const setAmount = (k: string, v: number | null) => {
    setAmounts((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };
  const setDue = (k: string, v: string) => {
    setDues((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  function fillColumn(fee: FeeType, term: number | null) {
    const first = classes.map((c) => amounts[key(c.id, fee, term)]).find((v) => v != null);
    if (first == null) return;
    setAmounts((prev) => {
      const next = { ...prev };
      for (const c of classes) next[key(c.id, fee, term)] = first;
      return next;
    });
    setDirty(true);
  }

  function buildLines(): FeeLineInput[] | string {
    const lines: FeeLineInput[] = [];
    for (const c of classes) {
      for (const t of terms) {
        const amount = amounts[key(c.id, "tuition", t)];
        if (amount == null) continue;
        const due = dues[`tuition|${t}`];
        if (!due) return `Indiquez l'échéance de la ${termName(t, termLabel).toLowerCase()}.`;
        lines.push({ class_id: c.id, fee: "tuition", term: t, amount, due_date: due });
      }
      for (const f of ONE_OFF) {
        if (!enabled.has(f)) continue;
        const amount = amounts[key(c.id, f, null)];
        if (amount == null) continue;
        if (!dues[f]) return `Indiquez l'échéance des frais « ${FEE_TYPES[f]} ».`;
        lines.push({ class_id: c.id, fee: f, term: null, amount, due_date: dues[f] });
      }
    }
    return lines;
  }

  function save() {
    setError("");
    const lines = buildLines();
    if (typeof lines === "string") {
      setError(lines);
      return;
    }
    startTransition(async () => {
      const res = await saveFees(lines);
      if (!res.ok) setError(res.error);
      else {
        setDirty(false);
        toast.success(res.message ?? "Enregistré.");
        router.refresh();
      }
    });
  }

  const columns: { fee: FeeType; term: number | null; label: string; dueKey: string }[] = [
    ...terms.map((t) => ({
      fee: "tuition" as FeeType,
      term: t,
      label: termName(t, termLabel),
      dueKey: `tuition|${t}`,
    })),
    ...ONE_OFF.filter((f) => enabled.has(f)).map((f) => ({
      fee: f,
      term: null,
      label: FEE_TYPES[f],
      dueKey: f,
    })),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Échéances"
          description="Date limite de paiement, la même pour toutes les classes."
        />
        <CardBody className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.dueKey}>
              <Label htmlFor={`due-${col.dueKey}`}>
                {col.fee === "tuition" ? `Scolarité ${col.label}` : col.label}
              </Label>
              <Input
                id={`due-${col.dueKey}`}
                type="date"
                value={dues[col.dueKey] ?? ""}
                onChange={(e) => setDue(col.dueKey, e.target.value)}
              />
            </div>
          ))}
        </CardBody>
        <CardBody className="border-t border-slate-100">
          <p className="mb-2 text-sm font-medium text-slate-700">Autres frais demandés</p>
          <div className="flex flex-wrap gap-x-6">
            {ONE_OFF.map((f) => (
              <Checkbox
                key={f}
                label={FEE_TYPES[f]}
                checked={enabled.has(f)}
                onChange={(e) => {
                  const next = new Set(enabled);
                  if (e.target.checked) next.add(f);
                  else next.delete(f);
                  setEnabled(next);
                  setDirty(true);
                }}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {classes.map((c, i) => {
          const total = columns.reduce(
            (s, col) => s + (amounts[key(c.id, col.fee, col.term)] ?? 0),
            0,
          );
          return (
            <Card key={c.id}>
              <CardHeader title={c.name} description={`Total de l'année : ${formatFCFA(total)}`} />
              <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {columns.map((col) => {
                  const k = key(c.id, col.fee, col.term);
                  return (
                    <div key={k}>
                      <div className="mb-1 flex items-center justify-between">
                        <Label htmlFor={`amt-${k}`} className="mb-0">
                          {col.fee === "tuition" ? `Scolarité ${col.label}` : col.label}
                        </Label>
                        {i === 0 && classes.length > 1 && (
                          <button
                            type="button"
                            className="min-h-8 text-sm text-primary underline-offset-4 hover:underline"
                            onClick={() => fillColumn(col.fee, col.term)}
                          >
                            Copier partout
                          </button>
                        )}
                      </div>
                      <MoneyInput
                        id={`amt-${k}`}
                        name={`amt-${k}`}
                        value={amounts[k] ?? null}
                        onValueChange={(v) => setAmount(k, v)}
                        placeholder="Vide = non dû"
                      />
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}
      <div className="sticky bottom-20 z-10 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg md:bottom-4">
        <p className="text-sm text-slate-600">
          {dirty ? "Modifications non enregistrées" : "Tout est enregistré"}
        </p>
        <Button className="ml-auto" onClick={save} disabled={pending || !dirty}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Enregistrer les frais
        </Button>
      </div>
    </div>
  );
}
