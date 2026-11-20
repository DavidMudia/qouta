"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, WifiOff } from "lucide-react";
import {
  CATEGORIES,
  CHANNELS,
  OUTCOMES,
  OPERATIONS,
  PAGE_PRESETS,
  TIMELINES,
  normalise,
  type Answers,
  type CategoryCode,
} from "@/engine/requirements";
import { assessRequirements } from "@/engine/assessment";
import { computeEstimate, formatNaira, type PricingSnapshot } from "@/engine/pricing";
import { Docket, type DocketData } from "@/components/ui/Docket";
import { queueSubmission, saveLastQuote } from "@/lib/offline";

function SectionHead({ n, title, note }: { n: string; title: string; note?: string }) {
  return (
    <div className="flex items-baseline gap-4 pt-10 pb-3">
      <span className="figure text-xs font-semibold text-stamp">{n}</span>
      <h2 className="font-display text-[clamp(1.5rem,2.6vw,2.15rem)] leading-none">
        {title}
      </h2>
      {note ? <span className="label ml-auto hidden sm:block">{note}</span> : null}
    </div>
  );
}

function Pick({
  selected,
  label,
  hint,
  onClick,
  multi = false,
}: {
  selected: boolean;
  label: string;
  hint: string;
  onClick: () => void;
  multi?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`focus-ring group grid w-full grid-cols-[1.25rem_1fr] items-start gap-x-4 border-t border-rule py-3.5 pr-3 text-left transition-colors sm:grid-cols-[1.25rem_1fr] ${
        selected ? "bg-ledger/8" : "hover:bg-sheet/70"
      }`}
      style={{
        boxShadow: selected ? "inset 3px 0 0 0 var(--color-ledger)" : undefined,
        paddingLeft: selected ? "0.875rem" : "0.75rem",
      }}
    >
      <span
        className={`mt-1 flex h-4 w-4 items-center justify-center border transition-colors ${
          selected
            ? "border-ledger bg-ledger text-paper"
            : "border-muted/60 bg-paper group-hover:border-ledger"
        } ${multi ? "" : "rounded-full"}`}
      >
        {selected ? (
          <motion.span
            initial={reduce ? false : { scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.16 }}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[1.02rem] leading-snug font-medium">{label}</span>
        <span className="mt-0.5 block text-[0.84rem] leading-snug text-muted">
          {hint}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required ? <span className="text-stamp"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`focus-ring mt-1.5 w-full border-b bg-transparent pb-1.5 text-[1rem] outline-none placeholder:text-muted/50 ${
          error ? "border-stamp" : "border-rule focus:border-ledger"
        }`}
      />
      {error ? <span className="mt-1 block text-xs text-stamp">{error}</span> : null}
    </label>
  );
}

export function Calculator({ snapshot }: { snapshot: PricingSnapshot }) {
  const router = useRouter();
  const [cat, setCat] = useState<CategoryCode | null>(null);
  const [pages, setPages] = useState(5);
  const [outcomes, setOutcomes] = useState<string[]>(["readInfo", "contactForm"]);
  const [operations, setOperations] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<Answers["timeline"]>("standard");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  const answers: Answers = useMemo(
    () =>
      normalise({
        category: cat ?? "business",
        pages,
        outcomes: outcomes as Answers["outcomes"],
        operations: operations as Answers["operations"],
        channels: channels as Answers["channels"],
        timeline,
      }),
    [cat, pages, outcomes, operations, channels, timeline],
  );

  const ready = cat !== null;
  const { assessment, conclusion } = useMemo(() => assessRequirements(answers), [answers]);
  const estimate = useMemo(
    () => (ready ? computeEstimate(answers, snapshot) : null),
    [answers, snapshot, ready],
  );

  const toggle = (list: string[], set: (v: string[]) => void, code: string) =>
    set(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);

  const docketData: DocketData = {
    ref: "DRAFT",
    lineItems: estimate?.lineItems ?? [],
    subtotal: estimate?.subtotal ?? 0,
    estimateMin: estimate?.estimateMin ?? 0,
    estimateMax: estimate?.estimateMax ?? 0,
    version: snapshot.version,
    publishedAt: snapshot.publishedAt,
    assessment,
    conclusion,
    pages,
    categoryLabel: snapshot.categories.find((c) => c.code === answers.category)?.name,
  };

  async function submit() {
    const next: Record<string, string> = {};
    if (!/^\p{L}[\p{L}\p{M} .,'-]{1,80}$/u.test(name.trim()))
      next.name = "Tell us who this is for.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next.email = "A working email address, please.";
    if (!ready) next.category = "Choose a site type first.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !estimate) return;

    setBusy(true);
    setOffline(false);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      answers,
      claimedSubtotal: estimate.subtotal,
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      saveLastQuote({
        ref: data.ref,
        answers,
        estimate: data.estimate,
        assessment,
        conclusion,
        queued: false,
        live: true,
        contact: { name: payload.name, company: payload.company },
        categoryLabel: docketData.categoryLabel,
      });
      router.push(`/quote/${data.ref}`);
    } catch {
      // Offline (or API down): keep the whole estimate locally and queue it.
      const localRef = `MWQ-OFF-${Date.now().toString(36).toUpperCase()}`;
      const record = {
        localRef,
        queuedAt: Date.now(),
        payload: { ...payload, source: "offline" as const },
      };
      await queueSubmission(record);
      saveLastQuote({
        ref: localRef,
        answers,
        estimate: {
          lineItems: estimate.lineItems,
          subtotal: estimate.subtotal,
          estimateMin: estimate.estimateMin,
          estimateMax: estimate.estimateMax,
          version: estimate.version,
          publishedAt: estimate.publishedAt,
        },
        assessment,
        conclusion,
        queued: true,
        live: false,
        contact: { name: payload.name, company: payload.company },
        categoryLabel: docketData.categoryLabel,
      });
      setOffline(true);
      router.push(`/quote/${localRef}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-32 pt-10 sm:px-8 lg:pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <p className="label">Estimate book · section A</p>
          <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.9]">
            Tell us what it should <span className="italic text-ledger">do</span>.
          </h1>
        </div>
        <p className="max-w-[38ch] text-sm leading-relaxed text-muted">
          Six sections. No jargon — the engine derives the servers, databases
          and permissions from your answers afterwards.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* ------------------------------------------------ the form pad */}
        <div className="lg:col-span-7 xl:col-span-8">
          <SectionHead n="01" title="What kind of website" note="Pick one" />
          <div className="border-b border-rule">
            {CATEGORIES.map((c) => (
              <Pick
                key={c.code}
                selected={cat === c.code}
                label={c.label}
                hint={c.hint}
                onClick={() => setCat(c.code)}
              />
            ))}
          </div>
          {errors.category ? (
            <p className="mt-2 text-xs text-stamp">{errors.category}</p>
          ) : null}
          <p className="figure mt-2 text-xs text-muted">
            Base price{" "}
            {cat
              ? formatNaira(
                  snapshot.categories.find((c) => c.code === cat)?.startingPrice ?? 0,
                )
              : "—"}{" "}
            · first {snapshot.includedPages} pages included
          </p>

          <SectionHead n="02" title="How much there is to say" note="Page count" />
          <div className="flex flex-wrap gap-2 border-b border-rule pb-4">
            {PAGE_PRESETS.map((p) => (
              <button
                key={p.pages}
                type="button"
                onClick={() => setPages(p.pages)}
                className={`focus-ring figure border px-3.5 py-2 text-sm transition-colors ${
                  pages === p.pages
                    ? "border-ledger bg-ledger text-paper"
                    : "border-rule hover:border-ledger"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* NEW — what a "page" means */}
          <details className="group mt-2">
            <summary className="focus-ring inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
              <span className="inline-block transition-transform group-open:rotate-90">
                ▸
              </span>
              How we count pages
            </summary>
            <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-muted">
              Each distinct layout counts as one page — Home, About, Contact
              = 3. A blog with 100 posts that share the same template counts as
              2 pages (the list page and the post page), not 100. Most sites
              land between 5 and 12.
            </p>
          </details>

          {pages > snapshot.includedPages ? (
            <p className="figure mt-2 text-xs text-ledgerdark">
              +{pages - snapshot.includedPages} page
              {pages - snapshot.includedPages > 1 ? "s" : ""} ×{" "}
              {formatNaira(
                snapshot.features.find((f) => f.code === "additionalPage")?.price ?? 0,
              )}
            </p>
          ) : null}

          <SectionHead
            n="03"
            title="What visitors should be able to do"
            note="Select all"
          />
          <div className="border-b border-rule">
            {OUTCOMES.map((o) => (
              <Pick
                key={o.code}
                multi
                selected={outcomes.includes(o.code)}
                label={o.label}
                hint={o.hint}
                onClick={() => toggle(outcomes, setOutcomes, o.code)}
              />
            ))}
          </div>

          <SectionHead n="04" title="How you run it behind the scenes" note="Select all" />
          <div className="border-b border-rule">
            {OPERATIONS.map((o) => (
              <Pick
                key={o.code}
                multi
                selected={operations.includes(o.code)}
                label={o.label}
                hint={o.hint}
                onClick={() => toggle(operations, setOperations, o.code)}
              />
            ))}
          </div>

          <SectionHead n="05" title="Contact channels and timing" />
          <div className="border-b border-rule">
            {CHANNELS.map((o) => (
              <Pick
                key={o.code}
                multi
                selected={channels.includes(o.code)}
                label={o.label}
                hint={
                  o.code === "whatsappApi"
                    ? `${o.hint} · replaces the plain button`
                    : o.hint
                }
                onClick={() => toggle(channels, setChannels, o.code)}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TIMELINES.map((t) => (
              <button
                key={t.code}
                type="button"
                onClick={() => setTimeline(t.code)}
                title={t.hint}
                className={`focus-ring border px-3.5 py-2 text-left text-sm transition-colors ${
                  timeline === t.code
                    ? "border-ledger bg-ledger text-paper"
                    : "border-rule hover:border-ledger"
                }`}
              >
                <span className="block font-medium">{t.label}</span>
                <span
                  className={`figure block text-[10px] uppercase tracking-[0.12em] ${
                    timeline === t.code ? "text-paper/70" : "text-muted"
                  }`}
                >
                  {t.hint}
                </span>
              </button>
            ))}
          </div>

          <SectionHead n="06" title="Where do we send the docket?" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Your name"
              value={name}
              onChange={setName}
              placeholder="Adaeze Okonkwo"
              required
              error={errors.name}
            />
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@company.com"
              required
              error={errors.email}
            />
            <Field
              label="Phone / WhatsApp"
              value={phone}
              onChange={setPhone}
              placeholder="+234 ..."
            />
            <Field
              label="Company"
              value={company}
              onChange={setCompany}
              placeholder="Optional"
            />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 border-t-2 border-ink pt-5">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="focus-ring inline-flex items-center gap-2 bg-ink px-6 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-ledger disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Tear off the estimate docket
            </button>
            <p className="figure max-w-[36ch] text-xs leading-relaxed text-muted">
              We re-compute this figure on the server against price list v
              {snapshot.version}. Your browser&apos;s arithmetic is a claim, not a
              quotation.
            </p>
            {offline ? (
              <p className="figure inline-flex items-center gap-2 text-xs text-stamp">
                <WifiOff className="h-3.5 w-3.5" /> Saved locally — it will sync
                when you are back online.
              </p>
            ) : null}
          </div>
        </div>

        {/* -------------------------------------------------- the docket */}
        <aside className="hidden lg:col-span-5 lg:block xl:col-span-4">
          <div className="sticky top-24">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Carbon copy · customer</p>
              <p className="figure text-[10px] text-muted">live</p>
            </div>
            <motion.div
              initial={false}
              className="max-h-[calc(100vh-9rem)] overflow-y-auto"
            >
              <Docket data={docketData} />
            </motion.div>
          </div>
        </aside>
      </div>

      {/* mobile receipt strip */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-sheet px-5 py-3 lg:hidden no-print">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label">
              Estimate {estimate ? `· v${snapshot.version}` : "· choose a site type"}
            </p>
            <p className="figure text-lg font-semibold leading-tight">
              {estimate ? formatNaira(estimate.subtotal) : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="focus-ring bg-ink px-4 py-2.5 text-sm font-semibold text-paper"
          >
            {busy ? "…" : "Get docket"}
          </button>
        </div>
      </div>
    </div>
  );
}