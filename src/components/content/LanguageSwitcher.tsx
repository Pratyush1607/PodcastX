"use client";

import { setLocale } from "@/app/actions/locale";
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/locales";
import { useLocale } from "@/context/LocaleContext";

export function LanguageSwitcher() {
  const { locale } = useLocale();

  return (
    <form action={setLocale}>
      <select
        name="locale"
        defaultValue={locale}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </form>
  );
}
