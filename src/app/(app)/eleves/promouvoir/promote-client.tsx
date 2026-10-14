"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/card";
import { fullName } from "@/lib/format";
import { promotePupils } from "../actions";

type Pupil = { id: string; last_name: string; first_name: string; class_id: string; already: boolean };
type ClassOption = { id: string; name: string; sort_order: number };

const LEAVE = "__leave__";

export function PromoteClient({
  pupils,
  classes,
  toYearId,
  toYearLabel,
}: {
  pupils: Pupil[];
  classes: ClassOption[];
  toYearId: string;
  toYearLabel: string;
}) {
  // Default: next class by order; the last class leaves the school.
  const nextClass = useMemo(() => {
    const sorted = [...classes].sort((a, b) => a.sort_order - b.sort_order);
    const map = new Map<string, string>();
    sorted.forEach((c, i) => map.set(c.id, sorted[i + 1]?.id ?? LEAVE));
    return map;
  }, [classes]);

  const [choice, setChoice] = useState<Record<string, string>>(() =>
    Object.fromEntries(pupils.map((p) => [p.id, nextClass.get(p.class_id) ?? LEAVE])),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ enrolled: number; skipped: number; left: number } | null>(null);

  const groups = classes
    .map((c) => ({ cls: c, pupils: pupils.filter((p) => p.class_id === c.id) }))
    .filter((g) => g.pupils.length > 0);
  const counts = Object.values(choice).reduce(
    (acc, v) => {
      if (v === LEAVE) acc.leave += 1;
      else acc.enroll += 1;
      return acc;
    },
    { enroll: 0, leave: 0 },
  );

  function setGroup(classId: string, value: string) {
    setChoice((prev) => {
      const next = { ...prev };
      for (const p of pupils) if (p.class_id === classId && !p.already) next[p.id] = value;
      return next;
    });
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await promotePupils(
        toYearId,
        pupils
          .filter((p) => !p.already)
          .map((p) => ({ pupil_id: p.id, class_id: choice[p.id] === LEAVE ? null : choice[p.id] })),
      );
      if (!res.ok) setError(res.error);
      else if (res.data) setDone(res.data);
    });
  }

  if (done) {
    return (
      <Alert tone="success" title="Passage de classe terminé">
        {done.enrolled} élève(s) inscrit(s) en {toYearLabel}, {done.left} départ(s), {done.skipped} déjà inscrit(s).{" "}
        <Link href="/eleves" className="font-semibold underline">
          Voir les élèves
        </Link>
      </Alert>
    );
  }

  const options = (
    <>
      {classes.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
      <option value={LEAVE}>Quitte l&apos;école</option>
    </>
  );

  return (
    <div className="space-y-5">
      {groups.map(({ cls, pupils: list }) => (
        <Card key={cls.id}>
          <CardHeader
            title={`${cls.name} (${list.length})`}
            actions={
              <label className="flex items-center gap-2 text-sm">
                Tous vers
                <select
                  className="h-10 rounded-lg border border-slate-300 bg-white px-2"
                  defaultValue={nextClass.get(cls.id) ?? LEAVE}
                  onChange={(e) => setGroup(cls.id, e.target.value)}
                >
                  {options}
                </select>
              </label>
            }
          />
          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0 truncate">{fullName(p)}</span>
                {p.already ? (
                  <span className="text-sm text-slate-500">Déjà inscrit en {toYearLabel}</span>
                ) : (
                  <select
                    aria-label={`Classe ${toYearLabel} pour ${fullName(p)}`}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-2"
                    value={choice[p.id]}
                    onChange={(e) => setChoice((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  >
                    {options}
                  </select>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ))}
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="sticky bottom-20 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg md:bottom-4">
        <p className="text-slate-700">
          {counts.enroll} inscription(s) en {toYearLabel} · {counts.leave} départ(s)
        </p>
        <Button className="ml-auto" onClick={submit} disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Valider le passage
        </Button>
        <Link href="/eleves" className={buttonClasses("ghost")}>
          Annuler
        </Link>
      </div>
    </div>
  );
}
