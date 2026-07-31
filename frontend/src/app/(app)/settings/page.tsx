"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  BookOpen,
  UserCircle,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  getAiKeys,
  saveAiKey,
  setActiveProvider,
  deleteAiKey,
  type Provider,
  type AiKeysState,
} from "@/lib/settings";
import { guideSections } from "@/lib/guide";

type Tab = "ai-keys" | "guide" | "account";

const PROVIDERS: {
  id: Provider;
  name: string;
  blurb: string;
  placeholder: string;
  defaultModel: string;
}[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    blurb: "Recommended. Powers Memory Chat and agent reasoning.",
    placeholder: "sk-ant-...",
    defaultModel: "claude-sonnet-4-5",
  },
  {
    id: "openai",
    name: "OpenAI",
    blurb: "GPT-4o and compatible models.",
    placeholder: "sk-...",
    defaultModel: "gpt-4o",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    blurb: "Gemini 1.5 Pro and Flash.",
    placeholder: "AIza...",
    defaultModel: "gemini-1.5-pro",
  },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("ai-keys");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "ai-keys", label: "AI Keys", icon: KeyRound },
    { key: "guide", label: "User Guide", icon: BookOpen },
    { key: "account", label: "Account", icon: UserCircle },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your AI keys, read the product guide, and review your account.
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ai-keys" && <AiKeysTab />}
      {tab === "guide" && <GuideTab />}
      {tab === "account" && <AccountTab />}
    </div>
  );
}

/* ── AI Keys (Bring Your Own Key) ─────────────────────────────────── */

function AiKeysTab() {
  const [state, setState] = useState<AiKeysState>({
    providers: [],
    active_provider: null,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setState(await getAiKeys());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function statusFor(id: Provider) {
    return state.providers.find((p) => p.provider === id);
  }

  return (
    <div>
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="text-sm text-emerald-900">
          <div className="font-medium">Bring your own AI key</div>
          <p className="mt-0.5 text-emerald-800">
            Every AI feature — Memory Chat, AIOps agents, and analysis tools —
            runs on your own key. Add a key from Anthropic, OpenAI, or Google,
            then set one as active. Keys are encrypted at rest and used only for
            your tenant. Nothing is billed to Searce.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-4">
          {PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id}
              meta={p}
              status={statusFor(p.id)}
              onSaved={async (msg) => {
                setMessage(msg);
                await refresh();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  meta,
  status,
  onSaved,
}: {
  meta: (typeof PROVIDERS)[number];
  status?: AiKeysState["providers"][number];
  onSaved: (msg: string) => void;
}) {
  const [key, setKey] = useState("");
  const [model, setModel] = useState(status?.model || meta.defaultModel);
  const [busy, setBusy] = useState(false);

  const configured = status?.configured;
  const isActive = status?.is_active;

  async function save() {
    if (key.length < 8) {
      onSaved("That key looks too short.");
      return;
    }
    setBusy(true);
    try {
      await saveAiKey(meta.id, key, model);
      setKey("");
      onSaved(`${meta.name} key saved.`);
    } catch (e) {
      onSaved(e instanceof Error ? e.message : "Failed to save key.");
    } finally {
      setBusy(false);
    }
  }

  async function makeActive() {
    setBusy(true);
    try {
      await setActiveProvider(meta.id);
      onSaved(`${meta.name} is now the active provider.`);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteAiKey(meta.id);
      onSaved(`${meta.name} key removed.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border bg-white p-5 ${
        isActive ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{meta.name}</span>
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            )}
            {configured && !isActive && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                Configured ••••{status?.key_last4}
              </span>
            )}
            {!configured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                <Circle className="h-3 w-3" /> Not configured
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{meta.blurb}</p>
        </div>
        {configured && (
          <button
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div>
          <label className="text-xs font-medium text-slate-500">
            API key {configured && "(paste to replace)"}
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={meta.placeholder}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-searce-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-searce-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-searce-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving…" : configured ? "Update key" : "Save key"}
        </button>
        {configured && !isActive && (
          <button
            onClick={makeActive}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Set active
          </button>
        )}
      </div>
    </div>
  );
}

/* ── User Guide ───────────────────────────────────────────────────── */

function GuideTab() {
  const [open, setOpen] = useState<string | null>(guideSections[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {guideSections.map((section) => {
        const isOpen = open === section.id;
        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <button
              onClick={() => setOpen(isOpen ? null : section.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-semibold text-slate-800">
                {section.title}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="mb-4 text-sm text-slate-500">{section.intro}</p>
                <div className="space-y-3">
                  {section.features.map((f) => (
                    <div key={f.title}>
                      <div className="text-sm font-medium text-slate-700">
                        {f.title}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{f.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Account ──────────────────────────────────────────────────────── */

function AccountTab() {
  const [user, setUser] = useState<{ email?: string; tenant_id?: string } | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
            {(user?.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-slate-800">
              {user?.email ?? "Signed in"}
            </div>
            <div className="text-xs text-slate-400">
              Tenant: {user?.tenant_id ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">
            Two-factor authentication
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Your account is protected with an authenticator app (TOTP). To reset
          your device, contact your Searce CSRE squad.
        </p>
      </div>

      <a
        href="/api/auth/logout"
        className="inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Sign out
      </a>
    </div>
  );
}
