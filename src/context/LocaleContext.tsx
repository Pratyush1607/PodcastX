"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/lib/locales";
import { DICTIONARIES } from "@/lib/localeDictionaries";

interface LocaleContextValue {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolve(obj: unknown, path: string): unknown {
  if (typeof path !== "string") return undefined;
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined),
      obj
    );
}

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<LocaleContextValue>(() => {
    const dictionary = DICTIONARIES[locale] ?? DICTIONARIES.en;
    return {
      locale,
      t: (key, vars) => {
        const raw = resolve(dictionary, key) ?? resolve(DICTIONARIES.en, key);
        let str = typeof raw === "string" ? raw : (key ?? "");
        if (vars) {
          for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
        }
        return str;
      },
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
