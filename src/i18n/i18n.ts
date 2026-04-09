import { createI18n } from "vue-i18n";
import en from "@/i18n/locales/en.yaml";
import fi from "@/i18n/locales/fi.yaml";
import sv from "@/i18n/locales/sv.yaml";

export default createI18n({
  legacy: false,
  globalInjection: true,
  // Prefer a supported language from browser preferences; fall back to English.
  locale:
    navigator.languages.find((l) =>
      ["sv", "fi", "en"].includes(l.split("-")[0]),
    )?.split("-")[0] || "en",
  fallbackLocale: ["en", "sv", "fi"],
  messages: { en, fi, sv },
});

/** Each UI language name, written in that language, keyed by its 2-letter locale id. */
export const languageNames: Record<string, string> = {
  en: "English",
  fi: "Suomi",
  sv: "Svenska",
};
