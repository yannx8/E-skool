"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
      <p className="mt-2 text-slate-600">
        La page n&apos;a pas pu s&apos;afficher. Vérifiez votre connexion internet puis réessayez.
      </p>
      {error.digest && <p className="mt-2 text-sm text-slate-500">Code : {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/tableau-de-bord")}>
          Accueil
        </Button>
      </div>
    </main>
  );
}
