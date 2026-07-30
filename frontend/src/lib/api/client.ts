/* ------------------------------------------------------------------ */
/*  Intellicore CMP — API client                                      */
/*  Abstracts data fetching behind a typed interface.  Swap the        */
/*  implementation from mock → real API without changing consumers.    */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Fetches data from an Intellicore CMP endpoint.
 *
 * In production, this calls the real backend:
 *   const res = await fetch(`${API_BASE}${endpoint}`);
 *   if (!res.ok) throw new Error(`API ${endpoint} → ${res.status}`);
 *   return res.json();
 *
 * During development the function loads mock data instead, so the
 * entire frontend works without a running backend.
 */
export async function apiFetch<T>(endpoint: string): Promise<T> {
  // ---------- Real API (uncomment when backend is ready) ----------
  // const res = await fetch(`${API_BASE}${endpoint}`, {
  //   headers: { 'Content-Type': 'application/json' },
  //   cache: 'no-store',
  // });
  // if (!res.ok) {
  //   throw new Error(`API ${endpoint} → ${res.status}`);
  // }
  // return res.json() as Promise<T>;

  // ---------- Mock data (development) ----------
  const { getMockData } = await import('./mock');
  return getMockData(endpoint) as T;
}
