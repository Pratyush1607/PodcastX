import { getServerLocale } from "@/lib/getServerLocale";
import { DICTIONARIES } from "@/lib/localeDictionaries";

function resolve(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined),
      obj
    );
}

/** Server Component equivalent of useLocale()'s t() — for pages/layouts that render before any client provider mounts. */
export async function getServerT() {
  const locale = await getServerLocale();
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES.en;

  function t(key: string, vars?: Record<string, string | number>): string {
    const raw = resolve(dictionary, key) ?? resolve(DICTIONARIES.en, key);
    let str = typeof raw === "string" ? raw : key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
    }
    return str;
  }

  return { t, locale };
}
