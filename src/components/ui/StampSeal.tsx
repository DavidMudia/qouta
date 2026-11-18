export function StampSeal({
  version,
  publishedAt,
  className = "",
}: {
  version: number;
  publishedAt: string;
  className?: string;
}) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <span
      className={`figure inline-flex -rotate-2 items-center gap-2 border-2 border-stamp px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stamp ${className}`}
      title="Currently published price configuration"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-stamp" aria-hidden />
      Published v{version} · {date}
    </span>
  );
}

/** The vermilion rubber stamp that thumps onto a finished estimate. */
export function DraftStamp({ label = "Draft estimate" }: { label?: string }) {
  return (
    <div
      className="pointer-events-none select-none"
      aria-hidden
      style={{ transform: "rotate(-6deg)" }}
    >
      <div className="border-[3px] border-stamp px-4 py-2 text-stamp opacity-90 mix-blend-multiply">
        <div className="figure text-[11px] font-semibold uppercase tracking-[0.3em]">
          {label}
        </div>
        <div className="figure mt-0.5 text-center text-[9px] uppercase tracking-[0.22em] opacity-80">
          Mudia · Lagos · Not a final quotation
        </div>
      </div>
    </div>
  );
}
