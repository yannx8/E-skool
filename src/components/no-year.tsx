import { CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

/** Shown by pages that need a school year before anything else. */
export function NoYear({ canSetup }: { canSetup: boolean }) {
  return (
    <Card>
      <EmptyState
        icon={<CalendarPlus aria-hidden />}
        title="Aucune année scolaire"
        description={
          canSetup
            ? "Commencez par créer l'année scolaire en cours, puis les classes et les frais."
            : "L'administrateur doit d'abord créer l'année scolaire."
        }
        action={
          canSetup ? (
            <LinkButton href="/configuration/annees">Créer l&apos;année scolaire</LinkButton>
          ) : undefined
        }
      />
    </Card>
  );
}
