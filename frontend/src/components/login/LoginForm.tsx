"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, Sparkles } from "lucide-react";

const GOOGLE_OAUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

type Stage = "credentials" | "totp_setup" | "totp_required";

export function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("rd") || "/";
  const oauthError = params.get("error");

  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid email or password");

      if (data.stage === "totp_setup") {
        setQrCode(data.qr_code);
        setSecret(data.secret);
        setStage("totp_setup");
      } else {
        setStage("totp_required");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, remember }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Incorrect code");
      window.location.href = redirectTo;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-searce-navy to-searce-blue px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 text-searce-blue mb-1">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs uppercase tracking-widest font-medium text-slate-500">
            Intellicore CMP
          </span>
        </div>
        <h1 className="text-2xl font-light text-searce-navy mb-6">
          {stage === "credentials" ? "Sign in" : "Verify it's you"}
        </h1>

        {(error || oauthError) && (
          <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error || (oauthError === "access_denied" ? "Sign-in was cancelled." : `Sign-in error: ${oauthError}`)}
          </div>
        )}

        {stage === "credentials" && (
          <form onSubmit={submitCredentials} className="space-y-4">
            {GOOGLE_OAUTH_ENABLED && (
              <>
                <a
                  href={`/api/auth/oauth/google?rd=${encodeURIComponent(redirectTo)}`}
                  className="flex items-center justify-center gap-3 w-full border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <GoogleIcon />
                  Sign in with Google
                </a>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-medium text-slate-500">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-searce-blue"
                placeholder="you@searce.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-searce-blue"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-searce-blue text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {stage === "totp_setup" && (
          <form onSubmit={submitCode} className="space-y-4">
            <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                First sign-in — set up an authenticator app (Google Authenticator, Authy, 1Password)
                to protect this account.
              </div>
            </div>
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="Scan with your authenticator app" className="w-40 h-40" />
              </div>
            )}
            {secret && (
              <div className="text-center text-xs text-slate-500">
                Can&apos;t scan?{" "}
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{secret}</span>
              </div>
            )}
            <TotpCodeInput code={code} setCode={setCode} />
            <RememberToggle remember={remember} setRemember={setRemember} />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full bg-searce-blue text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Verify & finish setup"}
            </button>
          </form>
        )}

        {stage === "totp_required" && (
          <form onSubmit={submitCode} className="space-y-4">
            <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3">
              <KeyRound className="w-4 h-4 text-searce-blue mt-0.5 shrink-0" />
              <div>Enter the 6-digit code from your authenticator app.</div>
            </div>
            <TotpCodeInput code={code} setCode={setCode} />
            <RememberToggle remember={remember} setRemember={setRemember} />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full bg-searce-blue text-white rounded-lg py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function TotpCodeInput({
  code,
  setCode,
}: {
  code: string;
  setCode: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">Authentication code</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        autoFocus
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm tracking-[0.3em] text-center font-mono focus:outline-none focus:border-searce-blue"
        placeholder="000000"
      />
    </div>
  );
}

function RememberToggle({
  remember,
  setRemember,
}: {
  remember: boolean;
  setRemember: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <input
        type="checkbox"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
        className="rounded border-slate-300"
      />
      Remember this device for 30 days
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
