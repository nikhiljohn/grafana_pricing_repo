/* ------------------------------------------------------------------ */
/*  Intellicore CMP — API client                                      */
/*  Serves seed data from per-domain mock modules by default so every  */
/*  page has data with no backend. The real pillar endpoints           */
/*  (/command-center, /cloudops, /finops, …) are opt-in: set           */
/*  NEXT_PUBLIC_DATA_SOURCE=api once the backend implements them.       */
/*  NOTE: this is intentionally decoupled from NEXT_PUBLIC_API_URL,     */
/*  which the production image sets to "/api" for the auth proxy — the  */
/*  data layer must NOT hit that until those endpoints exist.           */
/* ------------------------------------------------------------------ */

const USE_REAL_API = process.env.NEXT_PUBLIC_DATA_SOURCE === "api";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type MockModule = { default: Record<string, unknown> };

/**
 * Static import() map keyed by the first path segment of an endpoint.
 * Every domain has its own seed file under ./mock so the pages can be
 * wired independently without touching a shared registry.
 */
const DOMAIN_LOADERS: Record<string, () => Promise<MockModule>> = {
  "command-center": () => import("./mock/command-center"),
  cloudops: () => import("./mock/cloudops"),
  finops: () => import("./mock/finops"),
  secops: () => import("./mock/secops"),
  devops: () => import("./mock/devops"),
  aiops: () => import("./mock/aiops"),
  memory: () => import("./mock/memory"),
  assets: () => import("./mock/assets"),
  alerts: () => import("./mock/alerts"),
};

/**
 * Fetches data for an Intellicore CMP endpoint.
 *
 * @param endpoint  API path, e.g. '/command-center/scores'
 *
 * Real backend (when NEXT_PUBLIC_API_URL is set):
 *   GET `${API_BASE}${endpoint}` with the session cookie.
 *
 * Development / demo (no backend):
 *   Resolves seed data from the matching ./mock/<domain> module.
 */
export async function apiFetch<T>(endpoint: string): Promise<T> {
  if (USE_REAL_API) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as T;
    } catch {
      /* fall through to seed data */
    }
    // real endpoint missing/failed — fall back to seed data
  }

  const domain = endpoint.split("/").filter(Boolean)[0];
  const loader = DOMAIN_LOADERS[domain];
  if (!loader) {
    return [] as unknown as T;
  }
  const mod = await loader();
  return (mod.default[endpoint] ?? []) as T;
}
