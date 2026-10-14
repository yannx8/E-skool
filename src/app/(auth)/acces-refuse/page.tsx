import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Accès refusé" };

export default function AccessDeniedPage() {
  return (
    <>
      <h1 className="mb-2 text-xl font-semibold">Accès non autorisé</h1>
      <p className="mb-5 text-slate-600">
        Votre compte n&apos;a pas de rôle actif dans l&apos;école. Demandez à l&apos;administrateur de vous donner accès.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="secondary" className="w-full">
          Se déconnecter
        </Button>
      </form>
    </>
  );
}
