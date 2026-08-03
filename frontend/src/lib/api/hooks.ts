/* ------------------------------------------------------------------ */
/*  Intellicore CMP — React hooks for data fetching                   */
/*  Thin wrappers around apiFetch that manage loading / error state.   */
/* ------------------------------------------------------------------ */

'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from './client';
import { useOrg } from '@/lib/org-context';

/**
 * Generic hook that fetches data from an Intellicore CMP endpoint, scoped to
 * whichever customer + environment is currently selected in the org switcher.
 *
 * @param endpoint  API path, e.g. '/command-center/scores'
 * @param initialData  Value to use while the request is in flight
 * @returns  `{ data, loading, error }`
 *
 * Example:
 * ```tsx
 * const { data: scores, loading } = useApiData<OpsScore[]>('/command-center/scores', []);
 * ```
 */
export function useApiData<T>(
  endpoint: string,
  initialData: T,
): { data: T; loading: boolean; error: string | null } {
  const { tenantId, environment } = useOrg();
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiFetch<T>(endpoint, { tenantId, environment })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, tenantId, environment]);

  return { data, loading, error };
}
