"use client";

import { useEffect, useState } from "react";
import { flushQueue } from "@/lib/offline";

/** Pushes any estimates that were completed while offline. */
export function OfflineSync() {
  const [synced, setSynced] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const n = await flushQueue();
      if (!cancelled && n > 0) setSynced(n);
    };
    run();
    window.addEventListener("online", run);
    return () => {
      cancelled = true;
      window.removeEventListener("online", run);
    };
  }, []);

  if (synced === 0) return null;
  return (
    <div className="no-print fixed bottom-20 left-1/2 z-50 -translate-x-1/2 border border-ledger bg-ledger px-4 py-2 text-paper lg:bottom-6">
      <p className="figure text-xs">
        {synced} offline submission{synced > 1 ? "s" : ""} synced
      </p>
    </div>
  );
}
