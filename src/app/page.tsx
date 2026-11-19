import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedSnapshot } from "@/services/pricingService";
import { assessRequirements } from "@/engine/assessment";
import { computeEstimate, formatNaira } from "@/engine/pricing";
import type { Answers } from "@/engine/requirements";
import { DraftStamp, StampSeal } from "@/components/ui/StampSeal";

export const dynamic = "force-dynamic";

const EXAMPLE: Answers = {
  category: "business",
  pages: 5,
  outcomes: ["readInfo", "contactForm", "accounts", "payments"],
  operations: ["staffRoles"],
  channels: ["whatsapp"],
  timeline: "standard",
};

const STEPS: [string, string][] = [
  [
    "1. See your estimate instantly",
    "Answer a few plain questions and get a clear price in under two minutes. No sign-up, no sales call, no obligation.",
  ],
  [
    "2. We review your answers",
    "A real person reads through what you need within 24 hours. If anything changes the price, we tell you before you commit.",
  ],
  [
    "3. We build and launch",
    "Design, development and go-live — with you at every stage. Most sites go live within 4–6 weeks.",
  ],
];

export default async function HomePage() {
  const snapshot = await getPublishedSnapshot();
  const { assessment, trace, conclusion } = assessRequirements(EXAMPLE);
  const estimate = computeEstimate(EXAMPLE, snapshot);

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden border-b border-rule">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/pad.jpg"
            alt=""
            className="h-full w-full object-cover object-left"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-paper/75 via-paper/85 to-paper sm:from-paper/20 sm:via-paper/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent sm:from-paper/50" />
        </div>

        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pt-16 pb-14 sm:px-8 lg:grid-cols-12 lg:pt-24 lg:pb-20">
          <div className="lg:col-span-6 lg:col-start-5">
            <p className="label">Free instant estimate · No sign-up needed</p>
            <h1 className="mt-4 font-display leading-[0.86] tracking-[-0.02em] text-[clamp(3.25rem,10vw,7.5rem)]">
              Beautiful websites.
              <br />
              <span className="italic text-ledger">Honest prices.</span>
              <br />
              No surprises.
            </h1>
            <p className="mt-6 max-w-[48ch] text-[1.05rem] leading-relaxed text-ink/85">
              We build websites that look great, load fast, and work on every
              screen — for businesses and creators who want clarity up front.
              Answer a few questions, see your exact estimate, and we'll take
              it from there.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/calculator"
                className="focus-ring group inline-flex items-center gap-3 bg-ledger px-8 py-4 text-base font-bold text-paper shadow-lg shadow-ledgerdark/20 transition-all hover:bg-ledgerdark hover:shadow-xl hover:shadow-ledgerdark/30"
              >
                Start your estimate
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <StampSeal version={snapshot.version} publishedAt={snapshot.publishedAt} />
            </div>

            <p className="mt-6 max-w-[44ch] border-l-2 border-stamp pl-3 text-sm leading-relaxed text-muted">
              An estimate, not a final quote — we'll confirm the price with
              you before any work begins.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- price list */}
      <section className="mx-auto max-w-[1400px] px-5 pt-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Our prices, in full</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3.25rem)] leading-none">
              What each part of your site costs
            </h2>
          </div>
          <p className="figure max-w-[40ch] text-xs leading-relaxed text-muted">
            Version {snapshot.version} · updated{" "}
            {new Date(snapshot.publishedAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {snapshot.note ? ` · ${snapshot.note}` : ""}
          </p>
        </div>

        <table className="mt-8 w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="label py-2 text-left">Site type</th>
              <th className="label hidden py-2 text-left sm:table-cell">Includes</th>
              <th className="label py-2 text-right">From</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.categories.map((c) => (
              <tr key={c.code} className="border-b border-rule align-top">
                <td className="py-3.5 pr-4 font-display text-xl">{c.name}</td>
                <td className="hidden py-3.5 pr-4 text-sm text-muted sm:table-cell">
                  {c.blurb}
                </td>
                <td className="figure py-3.5 text-right text-lg tabular-nums">
                  {formatNaira(c.startingPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.features.map((f) => (
            <div
              key={f.code}
              className="flex items-baseline justify-between gap-3 border-b border-rule py-2"
            >
              <span className="text-sm">
                {f.name}
                {f.billing === "per_unit" ? (
                  <span className="label ml-2">each</span>
                ) : null}
              </span>
              <span className="figure text-sm tabular-nums text-ledgerdark">
                {formatNaira(f.price)}
              </span>
            </div>
          ))}
        </div>

        <p className="figure mt-5 text-xs text-muted">
          Every base price includes {snapshot.includedPages} pages · final
          estimates range from the subtotal up to {snapshot.rangeFactor}×,
          depending on the final scope · need it faster? Rush delivery adds{" "}
          {Math.round(snapshot.rushRates.rush)}%.
        </p>
      </section>

      {/* ------------------------------------------------ real example */}
      <section className="mt-20 border-y border-rule bg-sheet/70">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label">See exactly how we build a price</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-[0.95]">
              Nothing hidden.
              <span className="italic"> Here's a real one.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              You tell us what visitors and staff should be able to do. We
              translate that into the actual features your site needs, and show
              you how each part contributes to the price.
            </p>
            <blockquote className="mt-6 border-l-2 border-ledger pl-4 text-[0.95rem] leading-relaxed">
              “Visitors can register and pay. Staff manage registrations, and
              different staff see different things.”
            </blockquote>

            <div className="mt-8 w-fit">
              <DraftStamp />
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="border-t-2 border-ink">
              <div className="grid gap-2 border-b border-rule py-2 sm:grid-cols-[1.1fr_1.4fr_1fr] sm:gap-5">
                <p className="label">What you tell us</p>
                <p className="label">What it means</p>
                <p className="label">What's included</p>
              </div>
              {trace.map((step) => (
                <div
                  key={step.from}
                  className="grid gap-2 border-b border-rule py-3 sm:grid-cols-[1.1fr_1.4fr_1fr] sm:gap-5"
                >
                  <p className="text-sm font-medium">{step.from}</p>
                  <p className="text-sm text-muted italic">{step.because}</p>
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
                </div>
              ))}
            </div>

            <p className="mt-5 border-l-2 border-stamp pl-3 text-sm leading-relaxed">
              {conclusion}
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="label">Line by line</p>
                <ul className="mt-2">
                  {estimate.lineItems.map((i) => (
                    <li
                      key={i.code}
                      className="flex items-baseline justify-between gap-4 border-b border-rule py-1.5 text-sm"
                    >
                      <span>{i.label}</span>
                      <span className="figure tabular-nums">
                        {formatNaira(i.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <p className="label">Their estimate</p>
                  <p className="figure mt-2 text-3xl font-semibold text-ledger">
                    {formatNaira(estimate.estimateMin)}
                    <span className="text-muted"> – </span>
                    {formatNaira(estimate.estimateMax)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    subtotal {formatNaira(estimate.subtotal)} · priced on
                    version {snapshot.version}
                  </p>
                </div>
                <Link
                  href="/calculator"
                  className="focus-ring inline-flex w-fit items-center gap-2 border border-ink px-5 py-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
                >
                  Get your own estimate
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------- what happens next */}
      <section className="mx-auto max-w-[1400px] px-5 pt-16 pb-20 sm:px-8">
        <p className="label">From estimate to launch</p>
        <h2 className="mt-2 max-w-[24ch] font-display text-[clamp(2rem,4vw,3.25rem)] leading-[0.95]">
          What happens after you see your price
        </h2>

        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {STEPS.map(([title, body]) => (
            <div key={title} className="border-t-2 border-ink pt-5">
              <p className="font-display text-xl leading-tight">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 border-y border-rule bg-sheet/60 px-6 py-12 text-center sm:px-10">
          <h3 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[0.95]">
            Ready to see what your website will cost?
          </h3>
          <p className="mt-3 text-sm text-muted">
            Takes about 2 minutes. No sign-up. No sales calls. No obligation.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/calculator"
              className="focus-ring group inline-flex items-center gap-3 bg-ledger px-8 py-4 text-base font-bold text-paper shadow-lg shadow-ledgerdark/20 transition-all hover:bg-ledgerdark hover:shadow-xl hover:shadow-ledgerdark/30"
            >
              Start your estimate
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}