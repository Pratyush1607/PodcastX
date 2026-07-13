"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/lib/locales";

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale"));
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
