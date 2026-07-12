/** Shared bearer-token check for pipeline-management endpoints (manual runs, cron) — not user-facing. */
export function isAdminAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
