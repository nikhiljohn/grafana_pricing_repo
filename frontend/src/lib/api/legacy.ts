/** Client for the Intellicore CMP backend. */

// Server components talk to the backend over the private Docker network;
// the browser goes through the public origin (Caddy strips the /api prefix).
const API_URL =
  typeof window === "undefined"
    ? process.env.API_URL_INTERNAL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type SessionUser = {
  email: string;
  tenant_id: string;
};

/** Server-component-only: identifies the signed-in user for the request
 * that's currently rendering, by forwarding its session cookie to the
 * backend. Never throws — returns null if there's no valid session
 * (the request wouldn't have reached this far without Caddy's edge gate,
 * so null here just means "render a neutral fallback", not "unauthenticated"). */
export async function fetchMe(): Promise<SessionUser | null> {
  if (typeof window !== "undefined") return null;
  const { cookies } = await import("next/headers");
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: cookies().toString() },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

export type TimelineEvent = {
  id: string;
  timestamp: string;
  event_type: string;
  category: "cost" | "security" | "reliability" | "deployment" | "ai";
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  resource_id: string | null;
  resource_type: string | null;
  causes: string[];
  caused: string[];
};

export type Pattern = {
  id: string;
  title: string;
  description: string;
  category: "cost" | "security" | "reliability" | "deployment" | "ai";
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  confidence: number;
  impact_estimate: string;
  evidence_event_ids: string[];
  recommended_action: string;
  guardrail_available: boolean;
};

export type TimelineResponse = {
  events: TimelineEvent[];
  total: number;
  cursor: string | null;
};

export type PatternsResponse = {
  patterns: Pattern[];
  total: number;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`API ${path} → ${response.status}`);
  }
  return response.json();
}

export async function fetchTimeline(params: {
  limit?: number;
  category?: string;
  severity?: string;
} = {}): Promise<TimelineResponse> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.category) qs.set("category", params.category);
  if (params.severity) qs.set("severity", params.severity);

  try {
    return await apiFetch<TimelineResponse>(`/memory/timeline?${qs.toString()}`);
  } catch (e) {
    console.warn("Timeline fetch failed, returning empty:", e);
    return { events: [], total: 0, cursor: null };
  }
}

export async function fetchPatterns(params: {
  minConfidence?: number;
} = {}): Promise<PatternsResponse> {
  const qs = new URLSearchParams();
  if (params.minConfidence !== undefined) {
    qs.set("min_confidence", String(params.minConfidence));
  }

  try {
    return await apiFetch<PatternsResponse>(`/memory/patterns?${qs.toString()}`);
  } catch (e) {
    console.warn("Patterns fetch failed, returning empty:", e);
    return { patterns: [], total: 0 };
  }
}

export async function askMemory(question: string): Promise<{
  answer: string;
  cited_event_ids: string[];
  cited_pattern_ids: string[];
  cypher_used: string | null;
}> {
  return apiFetch("/memory/chat", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
