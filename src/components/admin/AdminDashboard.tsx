"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, LogOut, UploadCloud } from "lucide-react";
import type { PricingSnapshot } from "@/engine/pricing";
import { formatNaira } from "@/engine/pricing";
import { StampSeal } from "@/components/ui/StampSeal";

type VersionRow = {
  version: number;
  note: string;
  publishedAt: string;
  publishedBy: string;
};

type SubmissionRow = {
  ref: string;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  categoryCode: string;
  pages: number;
  subtotal: number;
  estimateMin: number;
  estimateMax: number;
  claimedSubtotal: number | null;
  pricingVersion: number;
  mismatch: boolean;
  source: string;
  status: string;
  outcomeCount: number;
};

type EditKey = `category:${number}` | `feature:${number}`;

export function AdminDashboard({
  admin,
  working,
  published,
  versions,
  submissions,
}: {
  admin: string;
  working: PricingSnapshot;
  published: PricingSnapshot;
  versions: VersionRow[];
  submissions: SubmissionRow[];
}) {
  const router = useRouter();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const pending = useMemo(() => {
    const keys: string[] = [];
    working.categories.forEach((c) => {
      const live = published.categories.find((p) => p.code === c.code);
      if (live && live.startingPrice !== c.startingPrice) keys.push(`category:${c.code}`);
      const edited = edits[`category:${c.id}`];
      if (edited !== undefined && live && edited !== live.startingPrice)
        keys.push(`category:${c.code}`);
    });
    working.features.forEach((f) => {
      const live = published.features.find((p) => p.code === f.code);
      if (live && live.price !== f.price) keys.push(`feature:${f.code}`);
      const edited = edits[`feature:${f.id}`];
      if (edited !== undefined && live && edited !== live.price) keys.push(`feature:${f.code}`);
    });
    return Array.from(new Set(keys));
  }, [working, published, edits]);

  async function save(kind: "category" | "feature", id: number) {
    const key: EditKey = `${kind}:${id}`;
    const price = edits[key];
    if (price === undefined) return;
    setSaving(key);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id, price }),
      });
      if (!res.ok) throw new Error();
      setMessage(`Saved working price for ${kind} #${id}. Customers still see v${published.version}.`);
      router.refresh();
    } catch {
      setMessage("Could not save — check authorization session.");
    } finally {
      setSaving(null);
    }
  }

  async function publish() {
    setPublishing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Published v${data.snapshot.version}. Customer calculators pick it up on next load.`);
      setNote("");
      router.refresh();
    } catch (err) {
      setMessage(`Publish failed: ${String(err)}`);
    } finally {
      setPublishing(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const priceInput = (
    key: string,
    base: number,
    onSave: () => void,
    disabled?: boolean,
  ) => {
    const value = edits[key] ?? base;
    const dirty = value !== base;
    return (
      <span className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={500}
          value={value}
          disabled={disabled}
          onChange={(e) =>
            setEdits((prev) => ({ ...prev, [key]: Math.max(0, Number(e.target.value)) }))
          }
          className="figure focus-ring w-32 border-b border-rule bg-transparent pb-1 text-right outline-none focus:border-ledger disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving !== null}
          className={`focus-ring figure border px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
            dirty
              ? "border-ledger bg-ledger text-paper hover:bg-ledgerdark"
              : "border-rule text-muted"
          }`}
        >
          {saving === key ? "…" : dirty ? "Save" : "Saved"}
        </button>
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-10 sm:px-8">
      {/* head */}
      <div className="flex flex-wrap items-end justify-between gap-5 border-b-2 border-ink pb-4">
        <div>
          <p className="label">Developer console · authorization granted</p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.9]">
            The price book
          </h1>
          <p className="figure mt-2 text-xs text-muted">
            signed in as {admin}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StampSeal version={published.version} publishedAt={published.publishedAt} />
          <button
            type="button"
            onClick={logout}
            className="focus-ring inline-flex items-center gap-2 border border-ink px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {message ? (
        <p className="figure mt-4 border-l-2 border-ledger bg-ledger/8 px-3 py-2 text-xs text-ledgerdark">
          {message}
        </p>
      ) : null}

      {/* publish bar */}
      <section className="mt-8 border border-rule bg-sheet p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[16rem] flex-1">
            <p className="label">Publish a new version</p>
            <p className="mt-1 text-sm text-muted">
              {pending.length > 0
                ? `${pending.length} working price${pending.length > 1 ? "s differ" : " differs"} from v${published.version}.`
                : `Working prices match the published v${published.version}.`}
            </p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Change note — e.g. backend +₦5,000"
              className="focus-ring mt-3 w-full border-b border-rule bg-transparent pb-1.5 text-sm outline-none focus:border-ledger"
            />
          </div>
          <button
            type="button"
            onClick={publish}
            disabled={publishing}
            className="focus-ring inline-flex items-center gap-2 bg-ledger px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-ledgerdark disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4" />
            {publishing ? "Publishing…" : `Publish v${published.version + 1}`}
          </button>
        </div>
      </section>

      {/* editors */}
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <p className="label">pricing_categories</p>
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="label py-2 text-left">Site type</th>
                <th className="label py-2 text-right">Working price</th>
                <th className="label py-2 text-right">Published</th>
              </tr>
            </thead>
            <tbody>
              {working.categories.map((c) => {
                const live = published.categories.find((p) => p.code === c.code);
                const differs = live && live.startingPrice !== c.startingPrice;
                return (
                  <tr key={c.code} className="border-b border-rule">
                    <td className="py-3 pr-3">
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="label">{c.code}</span>
                    </td>
                    <td className="py-3 text-right align-middle">
                      {priceInput(`category:${c.id ?? 0}`, c.startingPrice, () =>
                        save("category", c.id ?? 0),
                      )}
                    </td>
                    <td
                      className={`figure py-3 text-right text-sm tabular-nums ${
                        differs ? "text-stamp" : "text-muted"
                      }`}
                    >
                      {live ? formatNaira(live.startingPrice) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <p className="label">pricing_features</p>
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="label py-2 text-left">Feature</th>
                <th className="label py-2 text-right">Working price</th>
                <th className="label py-2 text-right">Published</th>
              </tr>
            </thead>
            <tbody>
              {working.features.map((f) => {
                const live = published.features.find((p) => p.code === f.code);
                const differs = live && live.price !== f.price;
                return (
                  <tr key={f.code} className="border-b border-rule">
                    <td className="py-3 pr-3">
                      <span className="block text-sm font-medium">{f.name}</span>
                      <span className="label">
                        {f.code} · group {f.billableGroup}
                      </span>
                    </td>
                    <td className="py-3 text-right align-middle">
                      {priceInput(`feature:${f.id ?? 0}`, f.price, () =>
                        save("feature", f.id ?? 0),
                      )}
                    </td>
                    <td
                      className={`figure py-3 text-right text-sm tabular-nums ${
                        differs ? "text-stamp" : "text-muted"
                      }`}
                    >
                      {live ? formatNaira(live.price) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      {/* submissions */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">customer_submissions</p>
            <h2 className="mt-1 font-display text-3xl leading-none">
              Requests inbox
            </h2>
          </div>
          <p className="figure text-xs text-muted">
            server-recomputed against the published snapshot ·{" "}
            {submissions.length} record{submissions.length === 1 ? "" : "s"}
          </p>
        </div>

        {submissions.length === 0 ? (
          <p className="mt-4 border-t border-rule py-8 text-center text-sm text-muted">
            No submissions yet. Complete the calculator and it lands here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="label py-2 text-left">Ref</th>
                  <th className="label py-2 text-left">Customer</th>
                  <th className="label py-2 text-left">Type</th>
                  <th className="label py-2 text-right">Server</th>
                  <th className="label py-2 text-right">Claimed</th>
                  <th className="label py-2 text-right">Range</th>
                  <th className="label py-2 text-right">Flags</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.ref} className="border-b border-rule align-top">
                    <td className="py-3 pr-3">
                      <a
                        href={`/quote/${s.ref}`}
                        className="figure text-sm text-ledger underline-offset-4 hover:underline"
                      >
                        {s.ref}
                      </a>
                      <span className="label block">
                        {new Date(s.createdAt).toLocaleString("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-sm">
                      <span className="block font-medium">{s.name}</span>
                      <span className="label break-all">{s.email}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm">
                      {s.categoryCode}
                      <span className="label block">{s.outcomeCount} outcomes</span>
                    </td>
                    <td className="figure py-3 text-right text-sm tabular-nums">
                      {formatNaira(s.subtotal)}
                      <span className="label block">v{s.pricingVersion}</span>
                    </td>
                    <td
                      className={`figure py-3 text-right text-sm tabular-nums ${
                        s.mismatch ? "text-stamp" : "text-muted"
                      }`}
                    >
                      {s.claimedSubtotal === null
                        ? "—"
                        : formatNaira(s.claimedSubtotal)}
                    </td>
                    <td className="figure py-3 text-right text-xs tabular-nums text-muted">
                      {formatNaira(s.estimateMin)}
                      <span className="block">– {formatNaira(s.estimateMax)}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="flex flex-wrap justify-end gap-1">
                        {s.mismatch ? (
                          <span className="figure inline-flex items-center gap-1 border border-stamp px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-stamp">
                            <AlertTriangle className="h-3 w-3" /> mismatch
                          </span>
                        ) : (
                          <span className="figure inline-flex items-center gap-1 border border-ledger/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ledgerdark">
                            <Check className="h-3 w-3" /> verified
                          </span>
                        )}
                        {s.source === "offline" ? (
                          <span className="figure border border-rule px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                            offline
                          </span>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* versions */}
      <section className="mt-14">
        <p className="label">pricing_versions</p>
        <div className="mt-3 border-t-2 border-ink">
          {versions.map((v) => (
            <div
              key={v.version}
              className="grid gap-1 border-b border-rule py-3 sm:grid-cols-[6rem_1fr_10rem]"
            >
              <p className="figure text-sm font-semibold">v{v.version}</p>
              <p className="text-sm">
                {v.note}
                <span className="label ml-2">by {v.publishedBy}</span>
              </p>
              <p className="figure text-xs text-muted sm:text-right">
                {new Date(v.publishedAt).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
