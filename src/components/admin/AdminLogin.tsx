"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";

export function AdminLogin({
  hint,
}: {
  hint: { email: string; password: string | null };
}) {
  const router = useRouter();
  const [email, setEmail] = useState(hint.email);
  const [password, setPassword] = useState(hint.password ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid credentials.");
        return;
      }
      router.refresh();
    } catch {
      setError("Login service unreachable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="label">Restricted · developer console</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.9]">
          Authorization
          <span className="italic text-ledger"> first</span>.
        </h1>
        <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted">
          Authentication decides who you are. Authorization decides what you may
          change. Both are resolved on the server before a single price row is
          touched — hiding the route in React is not a control we rely on.
        </p>
        <ul className="mt-6 space-y-2 border-t border-rule pt-4 text-sm text-muted">
          <li>· Session is an HMAC-signed, httpOnly cookie</li>
          <li>· Passwords stored as salted scrypt digests</li>
          <li>· Customer role: read published prices only</li>
          <li>· Admin role: edit working prices, publish versions</li>
        </ul>
      </div>

      <div className="lg:col-span-5 lg:col-start-7">
        <form
          onSubmit={submit}
          className="border-t-2 border-ink bg-sheet p-6 shadow-[0_18px_40px_-30px_rgba(23,20,15,0.7)]"
        >
          <div className="flex items-center gap-2 border-b border-rule pb-3">
            <KeyRound className="h-4 w-4 text-stamp" />
            <p className="label">Administrator sign-in</p>
          </div>

          <label className="mt-5 block">
            <span className="label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="focus-ring figure mt-1.5 w-full border-b border-rule bg-transparent pb-1.5 outline-none focus:border-ledger"
            />
          </label>

          <label className="mt-5 block">
            <span className="label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="focus-ring figure mt-1.5 w-full border-b border-rule bg-transparent pb-1.5 outline-none focus:border-ledger"
            />
          </label>

          {error ? (
            <p className="figure mt-4 border-l-2 border-stamp pl-2 text-xs text-stamp">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 bg-ledger px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-ledgerdark disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Open the dashboard
          </button>

          {hint.password ? (
            <p className="figure mt-4 text-[11px] leading-relaxed text-muted">
              Sandbox credentials — {hint.email} / {hint.password}. Set
              ADMIN_EMAIL and ADMIN_PASSWORD to replace them.
            </p>
          ) : (
            <p className="figure mt-4 text-[11px] text-muted">
              Administrator account provisioned from environment variables.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
