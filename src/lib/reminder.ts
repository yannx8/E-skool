// WhatsApp reminder message rendering (click-to-send, FR-B4).

export const REMINDER_VARIABLES = [
  { key: "parent", label: "Nom du parent" },
  { key: "eleve", label: "Nom de l'élève" },
  { key: "classe", label: "Classe" },
  { key: "montant", label: "Montant restant" },
  { key: "tranche", label: "Tranche" },
  { key: "echeance", label: "Échéance" },
  { key: "ecole", label: "Nom de l'école" },
  { key: "telephone_ecole", label: "Téléphone de l'école" },
  { key: "lien", label: "Lien de suivi parent" },
] as const;

export type ReminderVars = Partial<Record<(typeof REMINDER_VARIABLES)[number]["key"], string>>;

/** Replaces {variable} placeholders; unknown placeholders are left as typed. */
export function renderReminderMessage(template: string, vars: ReminderVars): string {
  return template
    .replace(/\{(\w+)\}/g, (match, key: string) => {
      const value = (vars as Record<string, string | undefined>)[key];
      return value === undefined ? match : value;
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** wa.me link that opens WhatsApp with the message prefilled. */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
