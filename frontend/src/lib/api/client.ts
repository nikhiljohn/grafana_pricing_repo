/* ------------------------------------------------------------------ */
/*  Intellicore CMP — API client                                      */
/*  Abstracts data fetching behind a typed interface.  When            */
/*  NEXT_PUBLIC_API_URL is set the client talks to the real backend;   */
/*  otherwise it serves seed data from per-domain mock modules so the  */
/*  entire frontend runs without a backend.                            */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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
  if (API_BASE) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`API ${endpoint} → ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  const domain = endpoint.split("/").filter(Boolean)[0];
  const loader = DOMAIN_LOADERS[domain];
  if (!loader) {
    return [] as unknown as T;
  }
  const mod = await loader();
  return (mod.default[endpoint] ?? []) as T;
}
