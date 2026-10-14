// Turns Supabase/Postgres errors into short French messages for the UI.
// Business rules raise French messages with errcode P0001 in SQL; those are
// shown as-is. Anything unexpected is logged server-side and hidden.

type PgError =
  | { code?: string; message?: string; details?: string | null; hint?: string | null }
  | null
  | undefined;

export function friendlyError(
  error: PgError,
  fallback = "Une erreur est survenue. Réessayez.",
): string {
  if (!error) return fallback;
  switch (error.code) {
    case "P0001":
      return error.message ?? fallback;
    case "42501":
      return error.message?.startsWith("Action non autorisée")
        ? error.message
        : "Action non autorisée pour votre rôle.";
    case "23505":
      return "Cette valeur existe déjà.";
    case "23503":
      return "Cet élément est utilisé ailleurs : il ne peut pas être supprimé.";
    case "23514":
      return "Une des valeurs saisies n'est pas valide.";
    case "PGRST116":
      return "Élément introuvable.";
    default:
      console.error("[supabase]", error.code, error.message, error.details ?? "");
      return fallback;
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const initialActionState: ActionResult<never> | null = null;

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}
