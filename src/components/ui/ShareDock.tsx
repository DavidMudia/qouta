"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";

export function ShareDock({
  path,
  title,
  text,
}: {
  path: string;
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  function fullUrl() {
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url: fullUrl() });
    } catch {
      // user cancelled — no action needed
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function openWhatsApp() {
    const payload = `${text}\n\n${fullUrl()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(payload)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6 no-print">
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 rounded-full border border-ink bg-paper/95 p-1.5 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={openWhatsApp}
            aria-label="Share on WhatsApp"
            title="Share on WhatsApp"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-[#25D366] transition-colors hover:bg-[#25D366]/10"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          {canNativeShare ? (
            <button
              type="button"
              onClick={nativeShare}
              aria-label="Share"
              title="Share"
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
            >
              <Share2 className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link"
            title="Copy link"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
          >
            {copied ? (
              <Check className="h-5 w-5 text-ledger" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="label text-[10px] text-muted">share this estimate</p>
      </div>
    </div>
  );
}