/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Settings client (Bring Your Own Key)            */
/*  Talks to the backend /settings API through Caddy (/api prefix).    */
/*  Falls back to localStorage in pure-frontend demo mode so the       */
/*  Settings UI is usable without a running backend.                   */
/* ------------------------------------------------------------------ */

export type Provider = "anthropic" | "openai" | "gemini";

export interface ProviderStatus {
  provider: Provider;
  configured: boolean;
  key_last4?: string | null;
  model?: string | null;
  is_active: boolean;
  updated_at?: string | null;
}

export interface AiKeysState {
  providers: ProviderStatus[];
  active_provider: Provider | null;
}

const API = "/api/settings";
const LS_KEY = "intellicore.ai-keys";

/** Whether we appear to have a backend (best-effort; falls back on error). */
async function backendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/ai-keys`, { credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getAiKeys(): Promise<AiKeysState> {
  try {
    const res = await fetch(`${API}/ai-keys`, { credentials: "include" });
    if (res.ok) return (await res.json()) as AiKeysState;
  } catch {
    /* fall through to localStorage */
  }
  return readLocal();
}

export async function saveAiKey(
  provider: Provider,
  apiKey: string,
  model?: string,
): Promise<void> {
  if (await backendAvailable()) {
    const res = await fetch(`${API}/ai-keys`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider, api_key: apiKey, model: model || null }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Failed to save key");
    return;
  }
  // Demo fallback — never store the raw key, only a masked record.
  const state = readLocal();
  const existing = state.providers.find((p) => p.provider === provider);
  const record: ProviderStatus = {
    provider,
    configured: true,
    key_last4: apiKey.slice(-4),
    model: model || null,
    is_active: state.providers.length === 0 || existing?.is_active || false,
  };
  state.providers = [
    ...state.providers.filter((p) => p.provider !== provider),
    record,
  ];
  if (!state.active_provider) state.active_provider = provider;
  writeLocal(state);
}

export async function setActiveProvider(provider: Provider): Promise<void> {
  if (await backendAvailable()) {
    const res = await fetch(`${API}/ai-keys/active`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider }),
    });
    if (!res.ok) throw new Error("Failed to set active provider");
    return;
  }
  const state = readLocal();
  state.providers = state.providers.map((p) => ({
    ...p,
    is_active: p.provider === provider,
  }));
  state.active_provider = provider;
  writeLocal(state);
}

export async function deleteAiKey(provider: Provider): Promise<void> {
  if (await backendAvailable()) {
    const res = await fetch(`${API}/ai-keys/${provider}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to remove key");
    return;
  }
  const state = readLocal();
  state.providers = state.providers.filter((p) => p.provider !== provider);
  if (state.active_provider === provider) {
    state.active_provider = state.providers[0]?.provider ?? null;
    if (state.active_provider) {
      state.providers = state.providers.map((p) => ({
        ...p,
        is_active: p.provider === state.active_provider,
      }));
    }
  }
  writeLocal(state);
}

function readLocal(): AiKeysState {
  if (typeof window === "undefined") {
    return { providers: [], active_provider: null };
  }
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as AiKeysState;
  } catch {
    /* ignore */
  }
  return { providers: [], active_provider: null };
}

function writeLocal(state: AiKeysState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(state));
}
