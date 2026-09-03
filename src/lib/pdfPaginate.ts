// Memory-safe, page-by-page HTML → PDF rendering.
//
// html2pdf.js renders the *entire* document into one canvas and then slices it.
// A full CAPS lesson plan (worksheet + memo + rubric) is easily 15 000–25 000 CSS
// pixels tall, so at scale 2 that single canvas is far beyond the Android WebView
// limits (~4096×4096 / ~16M px on most handsets). The result on device was a blank
// or failed PDF, huge memory spikes, and a renderer that hung — which is exactly
// the "app freezes after Export to PDF" report.
//
// This module renders one page slice at a time instead:
//   • break points are taken from real element boundaries (no text cut mid-line),
//   • each html2canvas call crops to a single A4 page, so the canvas stays small,
//   • the loop yields to the UI thread between pages and honours Cancel, so the
//     app never looks frozen and the teacher can always bail out.
//
// Desktop/web exports keep using html2pdf.js (unchanged output) — see
// `shouldUsePaginatedRenderer()` in `src/lib/printUtils.ts`.

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { isAndroidDevice, isLowMemoryDevice, isNativeApp } from './platform';
import { ExportCancelledError, isExportCancelled } from './exportProgress';
import { patchOklchForHtml2canvas } from './pdfHelper';

export type PdfPageFormat = 'a4' | 'a3' | 'letter';

export interface PaginatedPdfOptions {
  format?: PdfPageFormat;
  orientation?: 'portrait' | 'landscape';
  /** Print margins in inches: top, right, bottom, left. */
  margin?: [number, number, number, number];
  scale?: number;
  jpegQuality?: number;
  backgroundColor?: string;
  /** Progress hook — page numbers are 1-based. */
  onPage?: (page: number, totalPages: number) => void;
  /** Cooperative cancellation. */
  shouldCancel?: () => boolean;
}

export interface PageSlice {
  y: number;
  height: number;
}

/** Conservative canvas ceiling for mobile WebViews. */
export const MOBILE_MAX_CANVAS_SIDE = 4096;
export const MOBILE_MAX_CANVAS_AREA = 16_000_000;
export const DESKTOP_MAX_CANVAS_SIDE = 16_384;

export const isMobileRenderer = (): boolean => isNativeApp() || isAndroidDevice();

export const recommendedScale = (): number => (isMobileRenderer() && isLowMemoryDevice() ? 1.5 : 2);

const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Keep a canvas inside the platform's limits without dropping below 1×. */
export const clampScale = (widthPx: number, heightPx: number, requested: number): number => {
  const maxSide = isMobileRenderer() ? MOBILE_MAX_CANVAS_SIDE : DESKTOP_MAX_CANVAS_SIDE;
  const maxArea = isMobileRenderer() ? MOBILE_MAX_CANVAS_AREA : 268_000_000;
  const w = Math.max(1, widthPx);
  const h = Math.max(1, heightPx);

  let scale = Math.min(Math.max(requested || 1, 0.5), 4);
  scale = Math.min(scale, maxSide / w, maxSide / h);
  scale = Math.min(scale, Math.sqrt(maxArea / (w * h)));
  return Math.max(scale, 0.5);
};

/** Area (in device px²) a single-shot render of this element would need. */
export const estimatedCanvasArea = (element: HTMLElement, scale: number): number => {
  const width = Math.max(1, element.scrollWidth || element.offsetWidth || 1);
  const height = Math.max(1, element.scrollHeight || element.offsetHeight || 1);
  return width * scale * (height * scale);
};

/**
 * Would a one-shot html2pdf render of this element exceed what the device can
 * hold in a single canvas? If so, paginate instead.
 */
export const shouldUsePaginatedRenderer = (element: HTMLElement, scale: number): boolean => {
  if (!element) return false;
  const height = Math.max(1, element.scrollHeight || element.offsetHeight || 1);
  const width = Math.max(1, element.scrollWidth || element.offsetWidth || 1);
  if (isMobileRenderer()) {
    // Mobile WebViews are the ones that die on tall canvases — always paginate
    // anything longer than roughly one page.
    return height > width * 1.6 || estimatedCanvasArea(element, scale) > MOBILE_MAX_CANVAS_AREA;
  }
  return height * scale > DESKTOP_MAX_CANVAS_SIDE || estimatedCanvasArea(element, scale) > 268_000_000;
};

const isRenderable = (el: HTMLElement): boolean => {
  try {
    const rect = el.getBoundingClientRect();
    if (rect.height < 0.5 || rect.width < 0.5) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    // Only treat an explicit opacity of 0 as invisible — an empty string (no
    // computed value) must not hide the block.
    const opacity = style.opacity;
    if (opacity !== '' && opacity != null && Number(opacity) === 0) return false;
    return true;
  } catch {
    return true;
  }
};

/** Displays whose children must not be re-parented onto their own page. */
const ATOMIC_DISPLAYS = /^(flex|inline-flex|grid|inline-grid|table|table-row|table-row-group|table-header-group|table-footer-group|table-cell|contents|inline-block)$/i;

/**
 * Flatten the container into blocks that can each start a new page. Tall blocks
 * are opened up (unless they are flex/grid/table hosts, where moving children
 * would destroy the layout — those get sliced instead).
 */
const collectBreakBlocks = (root: HTMLElement, pageHeightPx: number, maxDepth = 6): HTMLElement[] => {
  const blocks: HTMLElement[] = [];

  const visit = (el: HTMLElement, depth: number) => {
    const children = Array.from(el.children) as HTMLElement[];
    for (const child of children) {
      if (!(child instanceof HTMLElement) || !isRenderable(child)) continue;
      const height = child.getBoundingClientRect().height;
      const display = (() => {
        try {
          return window.getComputedStyle(child).display || '';
        } catch {
          return '';
        }
      })();
      const canOpenUp = !ATOMIC_DISPLAYS.test(display) && child.children.length > 0 && depth < maxDepth;

      if (height > pageHeightPx * 1.02 && canOpenUp) {
        visit(child, depth + 1);
      } else {
        blocks.push(child);
      }
    }
  };

  visit(root, 0);
  return blocks;
};

const blindSlices = (totalHeight: number, pageHeightPx: number): PageSlice[] => {
  const slices: PageSlice[] = [];
  const height = Math.max(1, totalHeight);
  const pieces = Math.max(1, Math.ceil(height / pageHeightPx));
  const pieceHeight = height / pieces;
  for (let i = 0; i < pieces; i += 1) {
    slices.push({ y: i * pieceHeight, height: pieceHeight });
  }
  return slices;
};

/**
 * Work out where the page breaks fall, using element boundaries so lines of text
 * are never cut in half.
 */
export const computePageSlices = (root: HTMLElement, pageHeightPx: number): PageSlice[] => {
  const totalHeight = Math.max(root.scrollHeight, root.getBoundingClientRect().height, 1);
  const blocks = collectBreakBlocks(root, pageHeightPx);
  if (!blocks.length) return blindSlices(totalHeight, pageHeightPx);

  const rootRect = root.getBoundingClientRect();
  const topOf = (el: HTMLElement) => el.getBoundingClientRect().top - rootRect.top + root.scrollTop;

  const slices: PageSlice[] = [];
  const pushSlice = (start: number, end: number) => {
    const y = Math.max(0, start);
    const height = Math.min(Math.max(end - y, 0), pageHeightPx);
    if (height > 1) slices.push({ y, height });
  };

  let currentStart: number | null = null;
  let lastBottom = 0;

  for (const block of blocks) {
    const top = topOf(block);
    const height = block.getBoundingClientRect().height;
    const bottom = top + height;

    if (height > pageHeightPx * 1.02) {
      // Oversized atomic block (a long table, mostly): flush the current page,
      // then split the block into *balanced* page-sized pieces so the last piece
      // is never a two-line sliver on an otherwise empty page.
      if (currentStart !== null) {
        pushSlice(currentStart, lastBottom);
        currentStart = null;
        lastBottom = 0;
      }
      const pieces = Math.max(1, Math.ceil(height / pageHeightPx));
      const pieceHeight = height / pieces;
      for (let i = 0; i < pieces; i += 1) {
        pushSlice(top + i * pieceHeight, top + (i + 1) * pieceHeight);
      }
      continue;
    }

    if (currentStart === null) {
      currentStart = top;
      lastBottom = bottom;
      continue;
    }

    if (bottom - currentStart <= pageHeightPx) {
      lastBottom = bottom;
      continue;
    }

    pushSlice(currentStart, lastBottom);
    currentStart = top;
    lastBottom = bottom;
  }

  if (currentStart !== null) pushSlice(currentStart, lastBottom);

  // Trailing content that is not an element (loose text, injected footers).
  const covered = slices.length ? slices[slices.length - 1].y + slices[slices.length - 1].height : 0;
  const remainder = totalHeight - covered;
  if (remainder > 4) {
    const pieces = Math.max(1, Math.ceil(remainder / pageHeightPx));
    const pieceHeight = remainder / pieces;
    for (let i = 0; i < pieces; i += 1) {
      pushSlice(covered + i * pieceHeight, covered + (i + 1) * pieceHeight);
    }
  }

  return slices.length ? slices : blindSlices(totalHeight, pageHeightPx);
};

/**
 * Never clone the rest of the app into the render iframe — only the export
 * container matters. This alone removes most of the per-page cost.
 */
const buildIgnorePredicate = (target: HTMLElement) => (node: Element): boolean => {
  try {
    if (!(node instanceof Element)) return false;
    if (node === target || target.contains(node)) return false; // our document
    if (node.contains(target)) return false; // <html> / <body>
    if (node.parentNode !== document.body) return false; // <head>: styles, fonts
    return true; // app chrome: sidebar, dashboards, overlays…
  } catch {
    return false;
  }
};

const renderSlice = async (
  element: HTMLElement,
  slice: PageSlice,
  options: Required<Pick<PaginatedPdfOptions, 'backgroundColor' | 'jpegQuality'>> & { scale: number; widthPx: number }
): Promise<HTMLCanvasElement> => {
  const scale = clampScale(options.widthPx, slice.height, options.scale);
  return html2canvas(element, {
    scale,
    backgroundColor: options.backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 10_000,
    removeContainer: true,
    foreignObjectRendering: false, // breaks on many Android WebViews
    scrollX: 0,
    scrollY: 0,
    windowWidth: Math.max(options.widthPx, document.documentElement.clientWidth || options.widthPx),
    x: 0,
    y: Math.round(slice.y),
    width: Math.round(options.widthPx),
    height: Math.round(slice.height),
    ignoreElements: buildIgnorePredicate(element),
  });
};

/**
 * Render `element` into a multi-page PDF Blob, one page at a time.
 */
export const renderElementToPdfBlob = async (
  element: HTMLElement,
  options: PaginatedPdfOptions = {}
): Promise<Blob> => {
  const {
    format = 'a4',
    orientation = 'portrait',
    margin = [0.4, 0.4, 0.6, 0.4],
    jpegQuality = 0.95,
    backgroundColor = '#ffffff',
    onPage,
    shouldCancel,
  } = options;

  const pdf = new jsPDF({ unit: 'in', format, orientation, compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const [marginTop, marginRight, marginBottom, marginLeft] = margin;
  const contentWidthIn = Math.max(0.5, pageWidth - marginLeft - marginRight);
  const contentHeightIn = Math.max(0.5, pageHeight - marginTop - marginBottom);

  const widthPx = Math.max(1, element.scrollWidth || element.offsetWidth || 800);
  const pxPerInch = widthPx / contentWidthIn;
  const pageHeightPx = contentHeightIn * pxPerInch;

  const slices = computePageSlices(element, pageHeightPx);
  const totalPages = slices.length;
  const scale = options.scale ?? recommendedScale();

  // Tailwind v4 emits oklch() colours, which html2canvas cannot parse. The shim
  // is reference-counted, so nesting it with a caller's own patch is safe, and it
  // is always restored below.
  const restoreComputedStyle = patchOklchForHtml2canvas();

  try {
    for (let index = 0; index < slices.length; index += 1) {
      if (shouldCancel?.() || isExportCancelled()) throw new ExportCancelledError();

      const slice = slices[index];
      if (index > 0) pdf.addPage();

      const canvas = await renderSlice(element, slice, { scale, backgroundColor, jpegQuality, widthPx });
      try {
        const drawnScale = canvas.width / Math.max(1, widthPx);
        let imageHeightIn = canvas.height / Math.max(0.1, drawnScale) / pxPerInch;
        if (imageHeightIn > contentHeightIn) imageHeightIn = contentHeightIn;
        pdf.addImage(canvas, 'JPEG', marginLeft, marginTop, contentWidthIn, imageHeightIn, undefined, 'FAST');
      } finally {
        // Release the page bitmap before the next slice is rasterised.
        try {
          canvas.width = 0;
          canvas.height = 0;
        } catch {
          /* ignore */
        }
      }

      onPage?.(index + 1, totalPages);
      await yieldToUi();
    }
  } finally {
    restoreComputedStyle();
  }

  const blob = pdf.output('blob') as Blob;
  if (!blob || blob.size === 0) throw new Error('PDF rendering produced an empty file');
  return blob;
};

export default renderElementToPdfBlob;
