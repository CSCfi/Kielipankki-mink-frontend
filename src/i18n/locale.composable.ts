import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { filesize } from "filesize";
import { useStorage } from "@vueuse/core";
import { once } from "es-toolkit";
import type { Ref } from "vue";
import type { ByLang } from "@/util.types";

/** Map ISO 639-1 locale codes to ISO 639-3 codes. */
const LOCALE_TO_ISO3: Record<string, string> = {
  sv: "swe",
  en: "eng",
  fi: "fin",
};

const storedLocale = useStorage<string>("locale", "");

/** Set up locale sync */
const setupLocale = once((locale: Ref<string>) => {
  // Sync from storage once, if present
  if (storedLocale.value) {
    locale.value = storedLocale.value;
  }
  exportLocale(locale.value);

  // Then sync from switcher continually
  watch(locale, () => {
    storedLocale.value = locale.value || "";
    exportLocale(locale.value);
  });
});

const exportLocale = (lang: string) =>
  document.querySelector("html")?.setAttribute("lang", lang);

/** Set up locale sync and provide helpers */
export default function useLocale() {
  const { locale } = useI18n();

  setupLocale(locale);

  // The ISO 639-3 code is used in many parts of the Språkbanken infrastructure.
  const locale3 = computed<string>(() =>
    LOCALE_TO_ISO3[locale.value] || locale.value,
  );

  /** Translate here - picks the best available language from a strings-by-language object. */
  function th(map?: ByLang | string): string | undefined {
    if (!map) return undefined;
    if (typeof map == "string") return map;
    // Prefer the current UI language, fall back to first available value.
    return map[locale3.value] ?? Object.values(map)[0];
  }

  /** Wrap the filesize lib with some sane defaults and avoiding exponential notation. */
  function myFilesize(bytes: number, precision = 2) {
    // Default precision is 0 which means up until 2 decimals?
    const str = filesize(bytes, { precision, base: 2, locale: locale.value });
    // Convert exponential notation to ordinary.
    return str.replace(/[\d.]+e[+\d]+/, (numStr) => String(parseFloat(numStr)));
  }

  return {
    locale,
    locale3,
    th,
    filesize: myFilesize,
  };
}
