"use client";
import { BRAND } from "@/lib/brand";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Printer, RefreshCw } from "lucide-react";
import { Docket, type DocketData } from "@/components/ui/Docket";
import { DraftStamp } from "@/components/ui/StampSeal";
import { ShareDock } from "@/components/ui/ShareDock";
import { assessRequirements } from "@/engine/assessment";
import { normalise, type Answers } from "@/engine/requirements";
import type { LineItem } from "@/engine/pricing";
import { readLastQuote } from "@/lib/offline";

type ServerShape = {
  ok: boolean;
  row?: {
    ref: string;
    answers: unknown;
    lineItems: LineItem[];
    subtotal: number;
    estimateMin: number;
    estimateMax: number;
    pricingVersion: number;
    createdAt: string;
    name: string;
    company: string;
    assessment: unknown;
    source: string;
  };
  categoryLabel?: string;
  liveVersion?: number | null;
  livePublishedAt?: string;
  error?: string;
};

type LocalShape = {
  ref: string;
  answers: Answers;
  estimate: {
    lineItems: LineItem[];
    subtotal: number;
    estimateMin: number;
    estimateMax: number;
    version: number;
    publishedAt: string;
  };
  assessment: unknown;
  conclusion: string;
  queued: boolean;
  live: boolean;
  contact?: { name?: string; company?: string };
  categoryLabel?: string;
};

export default function QuotePage() {
  const params = useParams<{ ref: string }>();
  const ref = params?.ref ?? "";
  const reduce = useReducedMotion();

  const docketRef = useRef<HTMLDivElement>(null);

  const [server, setServer] = useState<ServerShape | null>(null);
  const [local, setLocal] = useState<LocalShape | null>(null);
  const [liveVersion, setLiveVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/quotes/${encodeURIComponent(ref)}`);
        const data: ServerShape = await res.json();
        if (!cancelled) {
          if (data.ok && data.row) {
            setServer(data);
            setLiveVersion(data.liveVersion ?? null);
          } else {
            const cached = readLastQuote<LocalShape>();
            if (cached && cached.ref === ref) setLocal(cached);
            else setMissing(true);
            if (typeof data.liveVersion === "number") setLiveVersion(data.liveVersion);
          }
        }
      } catch {
        const cached = readLastQuote<LocalShape>();
        if (!cancelled) {
          if (cached && cached.ref === ref) setLocal(cached);
          else setMissing(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  const view = useMemo(() => {
    if (server?.row) {
      const answers = normalise(server.row.answers as Partial<Answers>);
      const { assessment, trace, conclusion } = assessRequirements(answers);
      const data: DocketData = {
        ref: server.row.ref,
        lineItems: server.row.lineItems ?? [],
        subtotal: server.row.subtotal,
        estimateMin: server.row.estimateMin,
        estimateMax: server.row.estimateMax,
        version: server.row.pricingVersion,
        publishedAt: server.row.createdAt,
        assessment: assessment as DocketData["assessment"],
        conclusion,
        live: true,
        contact: { name: server.row.name, company: server.row.company },
        categoryLabel: server.categoryLabel,
      };
      return { data, trace, answers, queued: false };
    }
    if (local) {
      const answers = normalise(local.answers);
      const { assessment, trace, conclusion } = assessRequirements(answers);
      const data: DocketData = {
        ref: local.ref,
        lineItems: local.estimate.lineItems,
        subtotal: local.estimate.subtotal,
        estimateMin: local.estimate.estimateMin,
        estimateMax: local.estimate.estimateMax,
        version: local.estimate.version,
        publishedAt: local.estimate.publishedAt,
        assessment: assessment as DocketData["assessment"],
        conclusion: local.conclusion || conclusion,
        queued: local.queued,
        live: local.live,
        contact: local.contact,
        categoryLabel: local.categoryLabel,
      };
      return { data, trace, answers, queued: local.queued };
    }
    return null;
  }, [server, local]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-24 sm:px-8">
        <RefreshCw className="h-4 w-4 animate-spin text-muted" />
        <p className="label">Fetching docket {ref}</p>
      </div>
    );
  }

  if (missing || !view) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8">
        <p className="label">Docket not found</p>
        <h1 className="mt-3 font-display text-5xl leading-none">
          That sheet is not in the book.
        </h1>
        <p className="mt-4 max-w-[50ch] text-muted">
          Reference <span className="figure text-ink">{ref}</span> has no stored
          estimate. If you completed it on another device, ask us to look it up
          by email.
        </p>
        <Link
          href="/calculator"
          className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-semibold text-paper"
        >
          Start a new estimate
        </Link>
      </div>
    );
  }

  const stale =
    view.queued &&
    liveVersion !== null &&
    liveVersion !== view.data.version;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b-2 border-ink pb-4">
        <div>
          <p className="label">Estimate docket</p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.9]">
            {view.data.ref}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {view.data.categoryLabel ?? "Website estimate"}
            {view.data.contact?.name ? ` · ${view.data.contact.name}` : ""}
            {view.data.contact?.company ? ` · ${view.data.contact.company}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-5 no-print">
          <motion.div
            initial={reduce ? false : { scale: 1.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 480, damping: 15, delay: 0.15 }}
          >
            <DraftStamp label={view.queued ? "Queued offline" : "Draft estimate"} />
          </motion.div>
          <button
            type="button"
            onClick={() => window.print()}
            className="focus-ring inline-flex items-center gap-2 border border-ink px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      {stale ? (
        <div className="mt-5 flex items-start gap-3 border-l-4 border-stamp bg-stamp/8 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-stamp" />
          <p className="text-sm leading-relaxed">
            This docket was priced offline against{" "}
            <span className="figure">v{view.data.version}</span>. The published
            list is now <span className="figure">v{liveVersion}</span> — we will
            re-price the queued submission against the current list before it
            becomes a quotation.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          {/* Capturable region — this is what gets exported as a PNG */}
<div ref={docketRef} className="bg-paper p-5 sm:p-6">
  {/* Letterhead — appears on screen, in print, and in the shared PNG */}
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink pb-4">
    <div>
      <p className="font-display text-2xl leading-none tracking-tight">
        {BRAND.name}
      </p>
      <p className="figure mt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">
        {BRAND.tagline}
      </p>
    </div>
    <div className="figure text-right text-[10px] leading-relaxed">
      <p className="text-ink">{BRAND.phone}</p>
      <p className="break-all text-muted">{BRAND.email}</p>
    </div>
  </div>

  <Docket data={view.data} animate={!reduce} />

  {/* Footer — ref echoes the document id */}
  <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-3 figure text-[10px] uppercase tracking-[0.12em] text-muted">
    <span>Ref · {view.data.ref}</span>
    <span>{BRAND.name}</span>
  </div>
</div>

          <p className="mt-4 text-xs leading-relaxed text-muted no-print">
            An estimate, not a final quotation. Prices include the currently
            published configuration only; third-party fees (payment gateway,
            SMS, hosting) are billed at cost.
          </p>

          {/* Running costs — not part of the estimate */}
          <div className="mt-6 border-t border-rule pt-4 no-print">
            <p className="label">Annual running costs — not in the estimate above</p>
            <ul className="mt-3 space-y-0 text-sm">
              <li className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
                <span>Hosting</span>
                <span className="figure text-muted">₦0 – 150,000 / year</span>
              </li>
              <li className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
                <span>Domain (.com or .ng)</span>
                <span className="figure text-muted">₦15,000 – 45,000 / year</span>
              </li>
              <li className="flex items-baseline justify-between gap-3 py-2">
                <span>Payment gateway (if applicable)</span>
                <span className="figure text-muted">~1.5% per transaction</span>
              </li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Billed at cost — we don&apos;t mark these up. We&apos;ll confirm
              exact figures before any work begins.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="label">Why these lines exist · reasoning trail</p>
          <div className="mt-4 border-t-2 border-ink">
            {view.trace.map((step) => (
              <motion.div
                key={step.from}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid gap-1.5 border-b border-rule py-3 sm:grid-cols-[1.05fr_1.3fr_1fr] sm:gap-5"
              >
                <p className="text-sm font-medium">{step.from}</p>
                <p className="text-sm italic text-muted">{step.because}</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.produced.map((p) => (
                    <span
                      key={p}
                      className="figure border border-ledger/40 bg-ledger/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ledgerdark"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="border-t border-rule pt-3">
              <p className="label">Subtotal</p>
              <p className="figure mt-1 text-xl font-semibold">
                ₦{view.data.subtotal.toLocaleString("en-NG")}
              </p>
            </div>
            <div className="border-t border-rule pt-3">
              <p className="label">Estimate floor</p>
              <p className="figure mt-1 text-xl font-semibold text-ledger">
                ₦{view.data.estimateMin.toLocaleString("en-NG")}
              </p>
            </div>
            <div className="border-t border-rule pt-3">
              <p className="label">Likely ceiling</p>
              <p className="figure mt-1 text-xl font-semibold text-ledger">
                ₦{view.data.estimateMax.toLocaleString("en-NG")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 no-print">
            <Link
              href="/calculator"
              className="focus-ring inline-flex items-center gap-2 border border-ink px-5 py-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              Adjust the answers
            </Link>
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-muted underline-offset-4 hover:text-ledger hover:underline"
            >
              Back to the price list
            </Link>
          </div>
        </div>
      </div>

      {/* Floating share dock — only for real, server-resolvable refs */}
      {!view.queued ? (
        <ShareDock
          targetRef={docketRef}
          path={`/quote/${view.data.ref}`}
          title={`Qouta estimate ${view.data.ref}`}
          text="Instant website estimate from Qouta — see what yours would cost:"
        />
      ) : null}
    </div>
  );
}