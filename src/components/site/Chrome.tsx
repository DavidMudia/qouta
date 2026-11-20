import Link from "next/link";
import { cache } from "react";
import { getPublishedSnapshot } from "@/services/pricingService";
import { StampSeal } from "@/components/ui/StampSeal";
import { BRAND } from "@/lib/brand";

const getSnapshot = cache(getPublishedSnapshot);

export async function SiteHeader() {
  let version = 1;
  let publishedAt = "";
  try {
    const snapshot = await getSnapshot();
    version = snapshot.version;
    publishedAt = snapshot.publishedAt;
  } catch {
    /* offline shell still renders */
  }

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-sm no-print">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-3 sm:px-8">
        <Link href="/" className="focus-ring group flex items-baseline gap-2">
          <span className="font-display text-2xl leading-none tracking-tight">
            {BRAND.shortName}
          </span>
          <span className="label group-hover:text-ledger">
            by Axylum-Mudia
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-5 text-sm">
          <Link
            href="/calculator"
            className="focus-ring hidden text-ink/80 underline-offset-4 hover:text-ledger hover:underline sm:inline"
          >
            Get an estimate
          </Link>
          <Link
            href="/admin"
            className="focus-ring text-ink/80 underline-offset-4 hover:text-ledger hover:underline"
          >
            Owner
          </Link>
          <StampSeal version={version} publishedAt={publishedAt} />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule no-print">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-10 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-2xl leading-none">{BRAND.name}</p>
          <p className="label mt-2">{BRAND.tagline}</p>
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-muted">
            A personal product by {BRAND.owner}. Direct pricing, no account
            managers, no agency overhead — the person who quotes you is the
            person who builds it.
          </p>
        </div>
        <div className="label space-y-2">
          <p>What&apos;s included</p>
          <p className="text-ink/70">Design, build and launch</p>
          <p className="text-ink/70">A direct line to the developer</p>
          <p className="text-ink/70">Hosting and domain at cost</p>
          <p className="text-ink/70">One published price list</p>
        </div>
        <div className="label space-y-2 sm:text-right">
          <p className="text-ink/70">{BRAND.owner}</p>
          <a
            href={`mailto:${BRAND.email}`}
            className="block underline-offset-4 hover:text-ledger hover:underline"
          >
            {BRAND.email}
          </a>
          <a
            href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
            className="block underline-offset-4 hover:text-ledger hover:underline"
          >
            {BRAND.phone}
          </a>
          <p className="text-stamp pt-1">Estimate, not a final quotation</p>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] border-t border-rule px-5 py-4 sm:px-8">
        <p className="figure text-[10px] uppercase tracking-[0.14em] text-muted">
          {BRAND.name} · designed and run by {BRAND.owner}
        </p>
      </div>
    </footer>
  );
}