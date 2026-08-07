/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Memory Chat client                              */
/*  Tries the real backend (POST /memory/chat) when                    */
/*  NEXT_PUBLIC_DATA_SOURCE=api is set and a session cookie is present;  */
/*  otherwise falls back to the per-tenant canned answers in            */
/*  ./mock/chat so the AIOps "Query Infrastructure" tab is a real,       */
/*  interactive chat in every environment, not a static screenshot.     */
/* ------------------------------------------------------------------ */

import { DEFAULT_ENV_ID, DEFAULT_TENANT_ID } from "@/lib/tenants";
import { mockAskMemory } from "./mock/chat";

const USE_REAL_API = process.env.NEXT_PUBLIC_DATA_SOURCE === "api";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface MemoryChatAnswer {
  answer: string;
  confidence: string | null;
  suggestedFix: string | null;
  citedEventIds: string[];
  /** "live" — answered by the real Memory graph. "seed" — canned demo answer. */
  source: "live" | "seed";
}

export interface AskMemoryChatContext {
  tenantId?: string;
  environment?: string;
}

export async function askMemoryChat(
  question: string,
  ctx?: AskMemoryChatContext,
): Promise<MemoryChatAnswer> {
  const tenantId = ctx?.tenantId ?? DEFAULT_TENANT_ID;
  const environment = ctx?.environment ?? DEFAULT_ENV_ID;

  if (USE_REAL_API) {
    try {
      const qs = new URLSearchParams({ tenant_id: tenantId, environment });
      const res = await fetch(`${API_BASE}/memory/chat?${qs.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          answer: data.answer,
          confidence: null,
          suggestedFix: null,
          citedEventIds: data.cited_event_ids ?? [],
          source: "live",
        };
      }
    } catch {
      /* fall through to seed data */
    }
  }

  const mock = mockAskMemory(question, tenantId);
  return { ...mock, citedEventIds: [], source: "seed" };
}
