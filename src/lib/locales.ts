export const SUPPORTED_LOCALES = [
  "en",
  "es",
  "hi",
  "id",
  "pt",
  "fr",
  "de",
  "ar",
  "ja",
  "ko",
  "zh",
  "ru",
  "it",
  "tr",
  "vi",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  ru: "Русский",
  it: "Italiano",
  tr: "Türkçe",
  vi: "Tiếng Việt",
};

/** English names of each language, for use in Gemini translation prompts (not shown in the UI). */
export const LOCALE_ENGLISH_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
  hi: "Hindi",
  id: "Indonesian",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  ar: "Arabic",
  ja: "Japanese",
  ko: "Korean",
  zh: "Simplified Chinese",
  ru: "Russian",
  it: "Italian",
  tr: "Turkish",
  vi: "Vietnamese",
};

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "podcastx_locale";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
