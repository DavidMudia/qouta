/** Offline submission queue — IndexedDB, flushed when connectivity returns. */

export type QueuedSubmission = {
  localRef: string;
  queuedAt: number;
  payload: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    answers: unknown;
    claimedSubtotal?: number;
    source: "offline";
  };
};

const DB_NAME = "mudia-webquote";
const STORE = "submissions";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no-idb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "localRef" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb-open-failed"));
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb-tx-failed"));
  });
}

export async function queueSubmission(item: QueuedSubmission): Promise<void> {
  try {
    const db = await openDb();
    await tx(db, "readwrite", (s) => s.put(item) as IDBRequest<unknown>);
    db.close();
  } catch {
    /* storage unavailable — the caller still holds the payload in memory */
  }
}

export async function readQueue(): Promise<QueuedSubmission[]> {
  try {
    const db = await openDb();
    const rows = await tx<QueuedSubmission[]>(db, "readonly", (s) =>
      s.getAll() as IDBRequest<QueuedSubmission[]>,
    );
    db.close();
    return rows ?? [];
  } catch {
    return [];
  }
}

export async function removeQueued(localRef: string): Promise<void> {
  try {
    const db = await openDb();
    await tx(db, "readwrite", (s) => s.delete(localRef) as IDBRequest<unknown>);
    db.close();
  } catch {
    /* ignore */
  }
}

export const LAST_QUOTE_KEY = "mwq:lastQuote";

export function saveLastQuote(value: unknown) {
  try {
    localStorage.setItem(LAST_QUOTE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readLastQuote<T>(): T | null {
  try {
    const raw = localStorage.getItem(LAST_QUOTE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** POSTs anything that was saved while offline. Returns how many synced. */
export async function flushQueue(): Promise<number> {
  const rows = await readQueue();
  let synced = 0;
  for (const row of rows) {
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...row.payload, offlineRef: row.localRef }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      await removeQueued(row.localRef);
      const last = readLastQuote<{ ref?: string; localRef?: string }>();
      if (last && last.ref === row.localRef && data.ref) {
        saveLastQuote({ ...last, ref: data.ref, queued: false, live: true });
      }
      synced += 1;
    } catch {
      /* still offline — keep the row */
    }
  }
  return synced;
}
