import { getLocale, getTranslations } from "next-intl/server";
import { databaseStatus, formatDate, todayDouala } from "@/modules/core";
import { setLanguage } from "./language-action";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [status, t, tl, locale] = await Promise.all([
    databaseStatus(),
    getTranslations("home"),
    getTranslations("language"),
    getLocale(),
  ]);

  const languages = [
    { code: "fr", label: tl("fr") },
    { code: "en", label: tl("en") },
  ] as const;

  return (
    <main className="mx-auto max-w-2xl p-8 text-base">
      <h1 className="text-2xl font-semibold">E-skool</h1>
      {status.ok ? (
        <dl className="mt-4 space-y-2">
          <div>
            <dt className="font-medium">{t("database")}</dt>
            <dd>{status.version}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("serverTime")}</dt>
            <dd>{status.now}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("today")}</dt>
            <dd>{formatDate(todayDouala())}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4">{t("databaseUnreachable")}</p>
      )}
      <form action={setLanguage} className="mt-6">
        <fieldset>
          <legend className="font-medium">{tl("label")}</legend>
          <div className="mt-2 flex gap-2">
            {languages.map(({ code, label }) => (
              <button
                key={code}
                type="submit"
                name="lang"
                value={code}
                lang={code}
                aria-pressed={locale === code}
                className="min-h-11 min-w-11 rounded border px-4 py-2 aria-pressed:font-semibold aria-pressed:underline"
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </main>
  );
}
