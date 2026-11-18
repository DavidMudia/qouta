"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LineItem } from "@/engine/pricing";
import type { TechnicalAssessment } from "@/engine/assessment";

export type DocketData = {
  ref?: string;
  lineItems: LineItem[];
  subtotal: number;
  estimateMin: number;
  estimateMax: number;
  version: number;
  publishedAt: string;
  assessment?: TechnicalAssessment | null;
  conclusion?: string;
  queued?: boolean;
  live?: boolean;
  contact?: { name?: string; company?: string };
  pages?: number;
  categoryLabel?: string;
};

function Row({
  item,
  index,
  animate,
}: {
  item: LineItem;
  index: number;
  animate: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={animate && !reduce ? { opacity: 0, x: 14 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, delay: animate ? index * 0.06 : 0, ease: [0.2, 0.8, 0.3, 1] }}
      className="grid grid-cols-[1fr_auto] items-start gap-4 border-t border-rule py-2.5 first:border-t-0"
    >
      <div className="min-w-0">
        <p className="text-[0.95rem] leading-snug font-medium text-ink">{item.label}</p>
        <p className="mt-0.5 text-[0.78rem] leading-snug text-muted">{item.detail}</p>
        {item.qty ? (
          <p className="label mt-1">
            {item.qty} × {item.unitPrice?.toLocaleString("en-NG")}
          </p>
        ) : null}
      </div>
      <p className="figure whitespace-nowrap pt-0.5 text-[0.95rem] tabular-nums">
        ₦{item.amount.toLocaleString("en-NG")}
      </p>
    </motion.li>
  );
}

const TAGS: Record<string, string> = {
  backend: "Backend",
  database: "Database",
  auth: "Authentication",
  payments: "Payments",
  rbac: "RBAC",
  fileStorage: "File storage",
  bookings: "Booking engine",
  orderTracking: "Order tracking",
  cms: "CMS",
};

export function Docket({
  data,
  animate = true,
  compact = false,
}: {
  data: DocketData;
  animate?: boolean;
  compact?: boolean;
}) {
  const fmt = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  return (
    <div className="print-sheet bg-sheet text-ink shadow-[0_18px_40px_-28px_rgba(23,20,15,0.6)]">
      {/* docket head */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-ink px-5 py-4">
        <div>
          <p className="label">Estimate docket</p>
          <p className="figure mt-1 text-sm font-semibold">
            {data.ref ?? "DRAFT"}
          </p>
        </div>
        <div className="text-right">
          <p className="label">Price list</p>
          <p className="figure mt-1 text-sm">v{data.version}</p>
          <p className="figure text-[10px] text-muted">
            {data.publishedAt
              ? new Date(data.publishedAt).toLocaleDateString("en-GB")
              : "—"}
          </p>
        </div>
      </div>

      {/* line items */}
      <div className="px-5 py-4">
        <p className="label mb-2">Line items</p>
        {data.lineItems.length === 0 ? (
          <p className="border-t border-rule py-6 text-center text-sm text-muted">
            Choose a site type to start the docket.
          </p>
        ) : (
          <ul>
            {data.lineItems.map((item, i) => (
              <Row key={item.code + i} item={item} index={i} animate={animate} />
            ))}
          </ul>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3 border-t-2 border-ink pt-3">
          <div>
            <p className="label">Subtotal</p>
            <p className="figure mt-1 text-lg font-semibold">{fmt(data.subtotal)}</p>
          </div>
          <div className="text-right">
            <p className="label">Estimate range</p>
            <p className="figure mt-1 text-lg font-semibold text-ledger">
              {fmt(data.estimateMin)}
            </p>
            <p className="figure text-xs text-muted">up to {fmt(data.estimateMax)}</p>
          </div>
        </div>
      </div>

      {!compact && data.assessment ? (
        <div className="border-t border-rule bg-paper/60 px-5 py-4">
          <p className="label mb-2">Derived architecture</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TAGS) as string[])
              .filter((k) => (data.assessment as unknown as Record<string, unknown>)[k] === true)
              .map((k) => (
                <span
                  key={k}
                  className="figure border border-ledger/40 bg-ledger/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-ledgerdark"
                >
                  {TAGS[k]}
                </span>
              ))}
            {data.assessment.thirdPartyServices.length > 0 && (
              <span className="figure border border-rule px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
                {data.assessment.thirdPartyServices.join(" · ")}
              </span>
            )}
          </div>
          {data.conclusion ? (
            <p className="mt-3 border-l-2 border-stamp pl-3 text-[0.82rem] leading-relaxed text-ink/90">
              {data.conclusion}
            </p>
          ) : null}
        </div>
      ) : null}

      {(data.queued || data.live) && (
        <div className="border-t border-rule px-5 py-3">
          <p className="label leading-relaxed">
            {data.queued
              ? "Queued offline — will sync when the connection returns"
              : "Recomputed on the server from the published price list"}
          </p>
        </div>
      )}
    </div>
  );
}
