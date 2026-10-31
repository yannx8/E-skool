import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSignedIn } from "@/modules/platform";
import { signOutAction } from "../sign-in/actions";
import { chooseSchoolAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ChooseSchoolPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const signedIn = await getSignedIn(await headers());
  if (!signedIn) redirect("/sign-in");
  const [{ error }, t, te] = await Promise.all([searchParams, getTranslations("auth"), getTranslations("errors")]);

  return (
    <main className="mx-auto max-w-sm p-8 text-base">
      <h1 className="text-2xl font-semibold">{t("chooseSchool")}</h1>
      {error === "forbidden" && (
        <p role="alert" className="mt-4">
          {te("forbidden")}
        </p>
      )}
      {signedIn.memberships.length === 0 ? (
        <p className="mt-4">{t("noSchool")}</p>
      ) : (
        <form action={chooseSchoolAction} className="mt-6 flex flex-col gap-2">
          {signedIn.memberships.map((m) => (
            <button
              key={m.schoolId}
              type="submit"
              name="schoolId"
              value={m.schoolId}
              aria-pressed={signedIn.activeSchool?.schoolId === m.schoolId}
              className="min-h-11 rounded border px-4 py-2 text-left aria-pressed:font-semibold"
            >
              {m.schoolName}
            </button>
          ))}
        </form>
      )}
      <form action={signOutAction} className="mt-6">
        <button type="submit" className="min-h-11 rounded border px-4 py-2">
          {t("signOut")}
        </button>
      </form>
    </main>
  );
}
