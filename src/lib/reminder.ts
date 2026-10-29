import { fillTemplate, fmt } from "./format";
import type { FamilySummary } from "./queries";

/** The WhatsApp text for a family, from the school's template. */
export function reminderText(template: string, school: string, f: Pick<FamilySummary, "guardian" | "name" | "dueNow" | "pupils">) {
  const owing = f.pupils.filter((p) => p.dueNow > 0).map((p) => p.firstNames.split(" ")[0]);
  return fillTemplate(template, {
    guardian: f.guardian ?? `${f.name} family`,
    school,
    amount: fmt(f.dueNow),
    pupils: owing.length ? owing.join(" and ") : "your children",
  });
}
