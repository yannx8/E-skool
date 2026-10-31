import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSignedIn } from "@/modules/platform";
import { signInAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSignedIn(await headers())) redirect("/");
  const [{ error }, t] = await Promise.all([searchParams, getTranslations("auth")]);
  const message = error === "locked" ? t("locked") : error === "invalid" ? t("invalid") : null;

  return (
    <main className="mx-auto max-w-sm p-8 text-base">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {message && (
        <p role="alert" className="mt-4">
          {message}
        </p>
      )}
      <form action={signInAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="identifier" className="block font-medium">
            {t("identifier")}
          </label>
          <input
            id="identifier"
            name="identifier"
            required
            autoComplete="username"
            className="mt-1 min-h-11 w-full rounded border px-3"
          />
        </div>
        <div>
          <label htmlFor="password" className="block font-medium">
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 min-h-11 w-full rounded border px-3"
          />
        </div>
        <button type="submit" className="min-h-11 rounded border px-4 py-2 font-medium">
          {t("submit")}
        </button>
      </form>
    </main>
  );
}
