import Link from "next/link";
import { getPublishedSnapshot } from "@/services/pricingService";
import { StampSeal } from "@/components/ui/StampSeal";

export async function SiteHeader() {
  let version = 1;
  let publishedAt = "";
  try {
    const snapshot = await getPublishedSnapshot();
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
            Mudia
          </span>
          <span className="label group-hover:text-ledger">WebQuote</span>
        </Link>

        <nav className="ml-auto flex items-center gap-5 text-sm">
          <Link
            href="/calculator"
            className="focus-ring hidden text-ink/80 underline-offset-4 hover:text-ledger hover:underline sm:inline"
          >
            Calculator
          </Link>
          <Link
            href="/admin"
            className="focus-ring text-ink/80 underline-offset-4 hover:text-ledger hover:underline"
          >
            Admin
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
          <p className="font-display text-3xl leading-none">Mudia WebQuote</p>
          <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-muted">
            Estimates produced by a rule-based engine from your answers, then
            re-computed on the server against the published price list.
          </p>
        </div>
        <div className="label space-y-2">
          <p>Engine · React + TypeScript</p>
          <p>Data · PostgreSQL, versioned prices</p>
          <p>Access · server-side authorization</p>
          <p>Offline · service worker + IndexedDB</p>
        </div>
        <div className="label space-y-2 sm:text-right">
          <p>Lagos, Nigeria</p>
          <p>hello@mudia.ng</p>
          <p className="text-stamp">Estimate, not a final quotation</p>
        </div>
      </div>
    </footer>
  );
}
