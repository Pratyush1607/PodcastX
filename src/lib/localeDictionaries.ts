import en from "@/locales/en.json";
import es from "@/locales/es.json";
import hi from "@/locales/hi.json";
import id from "@/locales/id.json";
import pt from "@/locales/pt.json";
import fr from "@/locales/fr.json";
import de from "@/locales/de.json";
import ar from "@/locales/ar.json";
import ja from "@/locales/ja.json";
import ko from "@/locales/ko.json";
import zh from "@/locales/zh.json";
import ru from "@/locales/ru.json";
import it from "@/locales/it.json";
import tr from "@/locales/tr.json";
import vi from "@/locales/vi.json";
import type { Locale } from "@/lib/locales";

export type Dictionary = typeof en;

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  es,
  hi,
  id,
  pt,
  fr,
  de,
  ar,
  ja,
  ko,
  zh,
  ru,
  it,
  tr,
  vi,
};
