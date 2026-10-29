import { redirect } from "next/navigation";
import { getSchool } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { STANDARD_CLASSES } from "@/lib/bootstrap";
import { setup } from "./actions";

export const metadata = { title: "Set up your school" };

export default async function SetupPage() {
  if (await getSchool()) redirect("/login");
  const y = new Date().getFullYear();
  const start = new Date().getMonth() >= 6 ? y : y - 1;
  return (
    <div className="min-h-dvh bg-rail px-4 py-10 text-ink">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-6 text-rail-ink">
          <div className="text-[13px] font-bold tracking-[0.08em] text-rail-muted">E-SKOOL</div>
          <h1 className="mt-2 text-[32px] leading-tight font-bold tracking-[-0.02em]">Set up your school</h1>
          <p className="mt-2 text-rail-muted">Everything stays on this computer. You can change all of it later in Settings.</p>
        </div>
        <ActionForm action={setup} className="space-y-8 rounded-box bg-panel p-6 sm:p-8">
          <section className="space-y-4">
            <h2 className="text-[17px] font-bold">School</h2>
            <Field label="School name">
              <input name="school" required className={inputClass} placeholder="Les Bambins Bilingual School" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address">
                <input name="address" className={inputClass} placeholder="Bonamoussadi, Douala" />
              </Field>
              <Field label="Phone">
                <input name="phone" className={inputClass} placeholder="677 00 00 00" />
              </Field>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-[17px] font-bold">School year</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Name">
                <input name="yearName" required defaultValue={`${start}-${start + 1}`} className={inputClass} />
              </Field>
              <Field label="Starts">
                <input name="startsOn" type="date" required defaultValue={`${start}-09-01`} className={inputClass} />
              </Field>
              <Field label="Ends">
                <input name="endsOn" type="date" required defaultValue={`${start + 1}-06-30`} className={inputClass} />
              </Field>
            </div>
            <Field label="Classes" hint="One per line, youngest first. Fee items (registration and 3 installments) are created for you.">
              <textarea name="classes" rows={5} defaultValue={STANDARD_CLASSES.join("\n")} className={`${inputClass} py-2`} />
            </Field>
          </section>
          <section className="space-y-4">
            <h2 className="text-[17px] font-bold">Your administrator account</h2>
            <Field label="Your name">
              <input name="adminName" required className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Username">
                <input name="username" required autoCapitalize="none" className={inputClass} />
              </Field>
              <Field label="Password" hint="At least 8 characters.">
                <input name="password" type="password" required minLength={8} className={inputClass} />
              </Field>
            </div>
          </section>
          <button className={buttonClass("primary", "w-full")}>Create school</button>
        </ActionForm>
      </div>
    </div>
  );
}
