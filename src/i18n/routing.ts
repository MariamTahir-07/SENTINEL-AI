import { defineRouting } from "next-intl/routing";

export const locales = [
  "en", "ur", "ar", "hi", "bn", "es", "fr", "de", "pt", "zh", "ja", "ko", "tr", "it", "id", "vi", "ru",
] as const;

export const rtlLocales = ["ur", "ar"] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export function isRtlLocale(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

export const localeNames: Record<string, string> = {
  en: "English",
  ur: "اردو",
  ar: "العربية",
  hi: "हिन्दी",
  bn: "বাংলা",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  tr: "Türkçe",
  it: "Italiano",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
  ru: "Русский",
};
