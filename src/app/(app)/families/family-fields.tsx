import { Field, inputClass } from "@/components/ui";
import { phoneLabel } from "@/lib/format";

type F = { name?: string; guardian?: string | null; phone?: string | null; phone2?: string | null; address?: string | null; notes?: string | null };

export function FamilyFields({ f = {} }: { f?: F }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Family name" hint="The surname used in lists, e.g. NKENG.">
        <input name="name" required defaultValue={f.name} className={`${inputClass} uppercase`} />
      </Field>
      <Field label="Parent or guardian who pays">
        <input name="guardian" defaultValue={f.guardian ?? ""} placeholder="Mrs Marie Nkeng" className={inputClass} />
      </Field>
      <Field label="WhatsApp phone" hint="Reminders go to this number.">
        <input name="phone" inputMode="tel" defaultValue={f.phone ? phoneLabel(f.phone) : ""} placeholder="677 12 34 56" className={`${inputClass} num`} />
      </Field>
      <Field label="Other phone">
        <input name="phone2" inputMode="tel" defaultValue={f.phone2 ? phoneLabel(f.phone2) : ""} className={`${inputClass} num`} />
      </Field>
      <Field label="Neighbourhood" className="sm:col-span-2">
        <input name="address" defaultValue={f.address ?? ""} placeholder="Bonamoussadi" className={inputClass} />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea name="notes" rows={2} defaultValue={f.notes ?? ""} className={`${inputClass} py-2`} />
      </Field>
    </div>
  );
}
