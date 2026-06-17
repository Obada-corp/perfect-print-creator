import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import type { DailyEntry } from "@/lib/store";
import {
  EnvelopeSticker,
  ArchiveSticker,
} from "@/components/stickers/Stickers";
import {
  ENVELOPE_W,
  ENVELOPE_H,
  ARCHIVE_W,
  ARCHIVE_H,
  type StickerSettings,
} from "@/components/stickers/fields";

export type { StickerSettings } from "@/components/stickers/fields";
export type StickerKind = "envelope" | "archive";

/* --------------------- offscreen render + snapshot --------------------- */

let fontsReady: Promise<void> | null = null;
function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      try {
        // Force the browser to load Cairo at the weights we use before snapshot.
        const fontApi = (document as Document & {
          fonts?: { load: (s: string) => Promise<unknown>; ready: Promise<unknown> };
        }).fonts;
        if (fontApi) {
          await Promise.all([
            fontApi.load('700 16px "Cairo"'),
            fontApi.load('800 24px "Cairo"'),
            fontApi.load('600 12px "Cairo"'),
          ]);
          await fontApi.ready;
        } else {
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch {
        /* noop */
      }
    })();
  }
  return fontsReady;
}

interface StageHandle {
  container: HTMLDivElement;
  root: Root;
  destroy: () => void;
}

function createStage(width: number, height: number): StageHandle {
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "top:0",
    "left:-100000px",
    `width:${width}px`,
    `height:${height}px`,
    "background:#ffffff",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(container);
  const root = createRoot(container);
  return {
    container,
    root,
    destroy: () => {
      try {
        root.unmount();
      } catch {
        /* noop */
      }
      container.remove();
    },
  };
}

async function snapshotSticker(
  kind: StickerKind,
  entry: Partial<DailyEntry>,
  settings: StickerSettings,
): Promise<string> {
  await ensureFonts();
  const width = kind === "envelope" ? ENVELOPE_W : ARCHIVE_W;
  const height = kind === "envelope" ? ENVELOPE_H : ARCHIVE_H;
  const stage = createStage(width, height);
  try {
    flushSync(() => {
      stage.root.render(
        kind === "envelope" ? (
          <EnvelopeSticker entry={entry} settings={settings} />
        ) : (
          <ArchiveSticker entry={entry} settings={settings} />
        ),
      );
    });
    // Allow layout/paint + late font ready.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await ensureFonts();
    const target = stage.container.firstElementChild as HTMLElement | null;
    if (!target) throw new Error("Sticker stage is empty");
    // Make sure background image (and any other <img>) is fully decoded.
    const imgs = Array.from(target.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }),
      ),
    );
    const dataUrl = await toJpeg(target, {
      quality: 0.95,
      pixelRatio: 3,
      backgroundColor: "#ffffff",
      width,
      height,
      cacheBust: true,
      skipFonts: false,
    });
    return dataUrl;
  } finally {
    stage.destroy();
  }
}

/* ------------------------------- PDF API ------------------------------- */

function pageDimsPt(kind: StickerKind): { w: number; h: number } {
  return kind === "envelope"
    ? { w: ENVELOPE_W, h: ENVELOPE_H }
    : { w: ARCHIVE_W, h: ARCHIVE_H };
}

function newPdf(kind: StickerKind): jsPDF {
  const { w, h } = pageDimsPt(kind);
  return new jsPDF({
    orientation: kind === "envelope" ? "landscape" : "portrait",
    unit: "pt",
    format: [w, h],
  });
}

export async function buildStickerPdfBytes(
  entry: Partial<DailyEntry>,
  kind: StickerKind,
  settings: StickerSettings,
): Promise<Uint8Array> {
  const blob = await buildStickerPdfBlob(entry, kind, settings);
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

export async function buildStickerPdfBlob(
  entry: Partial<DailyEntry>,
  kind: StickerKind,
  settings: StickerSettings,
): Promise<Blob> {
  const dataUrl = await snapshotSticker(kind, entry, settings);
  const pdf = newPdf(kind);
  const { w, h } = pageDimsPt(kind);
  pdf.addImage(dataUrl, "JPEG", 0, 0, w, h, undefined, "FAST");
  return pdf.output("blob");
}

export async function buildStickerPdfUrl(
  entry: Partial<DailyEntry>,
  kind: StickerKind,
  settings: StickerSettings,
): Promise<string> {
  const blob = await buildStickerPdfBlob(entry, kind, settings);
  return URL.createObjectURL(blob);
}

function defaultFilename(
  entry: Partial<DailyEntry>,
  kind: StickerKind,
): string {
  const base = kind === "envelope" ? "envelope" : "archive";
  return `${base}_${entry.courseCode || "sticker"}_${entry.hall || ""}.pdf`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadStickerPdf(
  entry: Partial<DailyEntry>,
  kind: StickerKind,
  settings: StickerSettings,
  filename?: string,
): Promise<void> {
  const blob = await buildStickerPdfBlob(entry, kind, settings);
  triggerDownload(blob, filename || defaultFilename(entry, kind));
}

export async function buildCombinedPdfBlob(
  entries: Partial<DailyEntry>[],
  kind: StickerKind,
  settings: StickerSettings,
  onProgress?: (i: number, total: number) => void,
): Promise<Blob> {
  if (entries.length === 0) {
    const empty = newPdf(kind);
    return empty.output("blob");
  }
  const pdf = newPdf(kind);
  const { w, h } = pageDimsPt(kind);
  for (let i = 0; i < entries.length; i++) {
    const dataUrl = await snapshotSticker(kind, entries[i], settings);
    if (i > 0)
      pdf.addPage([w, h], kind === "envelope" ? "landscape" : "portrait");
    pdf.addImage(dataUrl, "JPEG", 0, 0, w, h, undefined, "FAST");
    onProgress?.(i + 1, entries.length);
  }
  return pdf.output("blob");
}

export async function downloadCombinedPdf(
  entries: Partial<DailyEntry>[],
  kind: StickerKind,
  settings: StickerSettings,
  filename?: string,
  onProgress?: (i: number, total: number) => void,
): Promise<void> {
  const blob = await buildCombinedPdfBlob(entries, kind, settings, onProgress);
  triggerDownload(
    blob,
    filename || `${kind === "envelope" ? "envelopes" : "archive"}-all.pdf`,
  );
}

/* ----------------------------- print helpers ---------------------------- */

export function printPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  iframe.src = url;
  const cleanup = () => {
    setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        /* noop */
      }
      URL.revokeObjectURL(url);
    }, 60_000);
  };
  let printed = false;
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        printed = true;
      } catch {
        window.open(url, "_blank");
      }
      cleanup();
    }, 400);
  };
  document.body.appendChild(iframe);
  setTimeout(() => {
    if (!printed) {
      try {
        iframe.contentWindow?.print();
      } catch {
        window.open(url, "_blank");
      }
      cleanup();
    }
  }, 4000);
}

export async function printStickerPdf(
  entry: Partial<DailyEntry>,
  kind: StickerKind,
  settings: StickerSettings,
): Promise<void> {
  const blob = await buildStickerPdfBlob(entry, kind, settings);
  printPdfBlob(blob);
}

export async function printCombinedPdf(
  entries: Partial<DailyEntry>[],
  kind: StickerKind,
  settings: StickerSettings,
  onProgress?: (i: number, total: number) => void,
): Promise<void> {
  const blob = await buildCombinedPdfBlob(entries, kind, settings, onProgress);
  printPdfBlob(blob);
}
