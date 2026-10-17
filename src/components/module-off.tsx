import { PowerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

/** Shown when a page belongs to a module switched off in Configuration > Modules. */
export function ModuleOff({ name, canEnable }: { name: string; canEnable: boolean }) {
  return (
    <Card>
      <EmptyState
        icon={<PowerOff aria-hidden />}
        title={`Le module ${name} est désactivé`}
        description={
          canEnable
            ? "Activez-le dans Configuration > Modules."
            : "Demandez à l'administrateur de l'activer."
        }
        action={
          canEnable ? (
            <LinkButton href="/configuration/modules">Gérer les modules</LinkButton>
          ) : undefined
        }
      />
    </Card>
  );
}
