import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-slate-600">Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link href="/tableau-de-bord" className={buttonClasses("primary", "default", "mt-6")}>
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
