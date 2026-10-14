import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/misc";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Connexion</h1>
      <p className="mb-5 text-slate-600">Accès réservé au personnel de l&apos;école.</p>
      {sp.expire === "1" && (
        <Alert tone="info" className="mb-4">
          Votre session a expiré. Reconnectez-vous.
        </Alert>
      )}
      <LoginForm next={next} />
      <p className="mt-5 text-center">
        <Link href="/mot-de-passe-oublie" className="inline-block min-h-11 py-2 text-primary underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
      </p>
    </>
  );
}
