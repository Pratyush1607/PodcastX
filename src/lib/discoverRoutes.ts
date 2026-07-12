const DISCOVER_HOME_ROUTES = ["/podcasts", "/interviews"];

/** True only for the exact /podcasts or /interviews home routes, which render the fixed right-hand side panel. */
export function isDiscoverHomeRoute(pathname: string | null): boolean {
  return DISCOVER_HOME_ROUTES.includes(pathname ?? "");
}
