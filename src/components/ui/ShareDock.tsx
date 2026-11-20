"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { toPng } from "html-to-image";

export function ShareDock({
  targetRef,
  path,
  title,
  text,
  shareLabel,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>;
  path: string;
  title: string;
  text: string;
  shareLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  function fullUrl() {
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
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

  async function shareAsImage() {
    if (!targetRef.current || capturing) return;
    setCapturing(true);
    try {
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }
      // let framer-motion animations settle
      await new Promise((r) => setTimeout(r, 150));

      const dataUrl = await toPng(targetRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f6f1e7",
      });

      const blob = await (await fetch(dataUrl)).blob();
      const filename = `${title.replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase()}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // Mobile: native share sheet (WhatsApp, iMessage, Mail, etc.)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title, text });
          setImageReady(true);
          setTimeout(() => setImageReady(false), 2000);
          return;
        } catch {
          // User cancelled — fall through to download
        }
      }

      // Desktop fallback: download the PNG
      const link = document.createElement("a");
      link.download = file.name;
      link.href = dataUrl;
      link.click();
      setImageReady(true);
      setTimeout(() => setImageReady(false), 2000);
    } catch (err) {
      console.error("[ShareDock] image capture failed", err);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6 no-print">
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 rounded-full border border-ink bg-paper/95 p-1.5 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={shareAsImage}
            disabled={capturing}
            aria-label="Share quote as image"
            title="Share quote as image"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 disabled:opacity-50"
          >
            {capturing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : imageReady ? (
              <Check className="h-5 w-5 text-ledger" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={openWhatsApp}
            aria-label="Share link on WhatsApp"
            title="Share link on WhatsApp"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-[#25D366] transition-colors hover:bg-[#25D366]/10"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

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
        <p className="label text-[10px] text-muted">
          {shareLabel ?? "share this estimate"}
        </p>
      </div>
    </div>
  );
}