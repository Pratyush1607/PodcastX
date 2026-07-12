"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect("/podcasts");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  // With email confirmation disabled, signUp returns a live session immediately.
  if (data.session) redirect("/podcasts");

  redirect(`/login?message=${encodeURIComponent("Check your email to confirm your account, then log in.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
