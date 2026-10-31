import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { BUSINESS_TIME_ZONE, parseLanguage, type Language } from "@/modules/core";
import { LANGUAGE_COOKIE } from "./language-cookie";

const catalogs: Record<Language, () => Promise<{ default: Record<string, unknown> }>> = {
  fr: () => import("../../messages/fr.json"),
  en: () => import("../../messages/en.json"),
};

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = parseLanguage(store.get(LANGUAGE_COOKIE)?.value);
  const catalog = await catalogs[locale]();
  return {
    locale,
    messages: catalog.default,
    timeZone: BUSINESS_TIME_ZONE,
  };
});
