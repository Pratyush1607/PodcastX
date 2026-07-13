import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { getServerT } from "@/lib/serverTranslate";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const { t } = await getServerT();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("auth.logIn")}</h1>
          <p className="mt-1 text-sm text-muted">{t("auth.welcomeBack")}</p>
        </div>

        {message && <p className="rounded-lg bg-accent/10 p-3 text-sm text-accent">{message}</p>}
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-muted">
              {t("auth.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-muted">
              {t("auth.password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" className="w-full">
            {t("auth.logIn")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          {t("auth.dontHaveAccount")}{" "}
          <Link href="/signup" className="text-accent hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/podcasts" className="text-muted underline hover:text-foreground">
            {t("auth.continueBrowsing")}
          </Link>
        </p>
      </div>
    </div>
  );
}
