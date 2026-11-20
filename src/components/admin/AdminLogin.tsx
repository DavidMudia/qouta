"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <p className="label">Private · owner sign-in</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.9]">
          Just <span className="italic text-ledger">you</span> here.
        </h1>
        <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted">
          {BRAND.shortName} is a one-person product by {BRAND.owner} of{" "}
          {BRAND.name.split(" by ")[1] ?? "Axylum-Mudia"}. No sign-up, no team
          invitations, no admin roles to configure — just one password for the
          person who runs it.
        </p>
    
      </div>

      <div className="lg:col-span-5 lg:col-start-7">
        <form
          onSubmit={submit}
          className="border-t-2 border-ink bg-sheet p-6 shadow-[0_18px_40px_-30px_rgba(23,20,15,0.7)]"
        >
          <div className="flex items-center gap-2 border-b border-rule pb-3">
            <KeyRound className="h-4 w-4 text-stamp" />
            <p className="label">Owner sign-in</p>
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
            Open Sesame ✨
          </button>
        </form>
    </div>
      </div>
  );
}