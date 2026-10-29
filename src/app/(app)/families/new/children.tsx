"use client";

import { useState } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui";

export function Children({ classes }: { classes: { id: number; name: string }[] }) {
  const [rows, setRows] = useState(1);
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid gap-3 rounded-lg border border-line p-4 sm:grid-cols-[1.4fr_1fr_1fr_0.7fr_1fr]">
          <Field label="First names">
            <input name="firstNames" required={i === 0} className={inputClass} />
          </Field>
          <Field label="Surname" hint="Blank = family name">
            <input name="lastName" className={inputClass} />
          </Field>
          <Field label="Class">
            <select name="classId" className={inputClass}>
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
          <Field label="Born">
            <input name="birthDate" type="date" className={inputClass} />
          </Field>
        </div>
      ))}
      <button type="button" className={buttonClass("quiet")} onClick={() => setRows(rows + 1)}>
        + Another child
      </button>
    </div>
  );
}
