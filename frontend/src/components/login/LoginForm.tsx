"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, Sparkles } from "lucide-react";

type Stage = "credentials" | "totp_setup" | "totp_required";

export function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("rd") || "/";

  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  // Check if Google SSO is configured on the backend
  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((data) => setGoogleEnabled(!!data.enabled))
      .catch(() => setGoogleEnabled(false));
  }, []);

  // Surface OAuth error codes from the redirect query string
  const googleError = params.get("error");

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

        {(error || googleError) && (
          <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error || googleErrorMessage(googleError)}
          </div>
        )}

        {stage === "credentials" && (
          <>
            {googleEnabled && (
              <>
                <a
                  href={`/api/auth/google/login?rd=${encodeURIComponent(redirectTo)}`}
                  className="flex items-center justify-center gap-3 w-full border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors mb-4"
                >
                  <GoogleIcon />
                  Continue with Google
                </a>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </>
            )}
          </>
        )}

        {stage === "credentials" && (
          <form onSubmit={submitCredentials} className="space-y-4">
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

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function googleErrorMessage(code: string | null): string {
  if (!code) return "";
  const messages: Record<string, string> = {
    domain_not_allowed: "Your Google account's domain is not permitted to access this application.",
    email_not_verified: "Your Google account email is not verified.",
    token_exchange_failed: "Could not exchange the Google authorisation code. Please try again.",
    token_invalid: "Google returned an invalid token. Please try again.",
    no_id_token: "Google did not return an ID token. Please try again.",
    state_mismatch: "Login session expired — please try again.",
    user_creation_failed: "Could not create your account. Please contact support.",
    cancelled: "Google sign-in was cancelled.",
  };
  return messages[code] ?? `Google sign-in failed (${code}).`;
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
