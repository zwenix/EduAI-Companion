/**
 * EduAI Companion — <PageOverlay />
 * ------------------------------------------------------------------
 * A luminous HUD layer that sits ON TOP of a page's existing background
 * without hiding it. The trick is `mix-blend-mode: screen`: the tile's
 * dark ground contributes *nothing* (your background shows through at
 * full strength) and only the glowing linework adds light on top — so it
 * reads as a true holographic schematic, not a dimming sheet. If you'd
 * rather have literal 50% transparency instead, pass blend="normal".
 *
 * Usage — the wrapper must be `relative overflow-hidden`, real content
 * sits above the layer at z‑10+:
 *
 *   <section className="relative min-h-screen overflow-hidden">
 *     <PageOverlay route="toolbox" />
 *     <div className="relative z-10">...your existing UI...</div>
 *   </section>
 *
 * The component injects its own ambient‑motion CSS exactly once (SSR‑safe,
 * gated behind prefers‑reduced‑motion), so there is nothing to add to your
 * global stylesheet.
 */

import { useEffect, type CSSProperties } from 'react';
import { resolveOverlay } from '../lib/overlays';

export type OverlayBlend = 'screen' | 'normal' | 'lighten';

export interface PageOverlayProps {
  /** Route id, alias, or free‑form page label (see overlays.ts). */
  route: string;
  /** Glow intensity. With screen‑blend this is how much light the linework
   *  adds; 0.5 ≈ a tasteful glow, raise toward 0.75 for stronger. */
  opacity?: number;
  /** 'screen' keeps the page background fully visible (recommended on dark
   *  themes). 'normal' gives literal transparency. */
  blend?: OverlayBlend;
  /** Slow ambient drift + brightness breathe. Auto‑disabled for users who
   *  prefer reduced motion (handled in the injected CSS). */
  animate?: boolean;
  /** Soft rim vignette that eats any stray generator border and gives the
   *  layer a finished edge. */
  vignette?: boolean;
  /** The tiles are drawn for the dark holo theme. On a light page they are
   *  hidden by default so they can't wash the surface out; pass true to
   *  force a faint watermark anyway. */
  isDarkMode?: boolean;
  forceLight?: boolean;
  className?: string;
}

const STYLE_ID = 'eduai-holo-overlay-styles';

const INJECTED_CSS = `
.eduai-holo-overlay{will-change:transform,filter;}
@media (prefers-reduced-motion:no-preference){
  .eduai-holo-overlay.is-animated{
    animation:eduai-holo-drift 26s ease-in-out infinite alternate,
              eduai-holo-breathe 9s ease-in-out infinite alternate;
  }
}
@keyframes eduai-holo-drift{
  0%{transform:translate3d(0,0,0) scale(1.06);}
  100%{transform:translate3d(-1.2%,-0.8%,0) scale(1.10);}
}
@keyframes eduai-holo-breathe{
  0%{filter:brightness(0.92);}
  100%{filter:brightness(1.12);}
}`;

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = INJECTED_CSS;
  document.head.appendChild(style);
}

// Rim vignette: fully visible across the body, fading only at the outer rim
// so any thin generator frame is masked away and the edge feels intentional.
const RIM_MASK =
  'radial-gradient(135% 135% at 50% 50%, #000 0%, #000 78%, rgba(0,0,0,0.55) 90%, transparent 100%)';

export default function PageOverlay({
  route,
  opacity = 0.5,
  blend = 'screen',
  animate = true,
  vignette = true,
  isDarkMode = true,
  forceLight = false,
  className = '',
}: PageOverlayProps) {
  useEffect(ensureStyles, []);

  const def = resolveOverlay(route);
  if (!def) return null;

  const isJpg = def.src && def.src.endsWith('.jpg');

  // The tiles are dark‑grounded art; on a light surface screen‑blend would
  // blow out to white, so we either hide the layer or drop it to a faint
  // watermark. For JPG overlays, we allow them on all themes.
  if (!isDarkMode && !forceLight && !isJpg) return null;

  const effectiveOpacity = isJpg
    ? (isDarkMode ? 0.55 : 0.25)
    : (isDarkMode ? opacity : Math.min(opacity, 0.14));
    
  const effectiveBlend: OverlayBlend = isJpg ? 'normal' : (isDarkMode ? blend : 'normal');

  const style: CSSProperties = {
    opacity: effectiveOpacity,
    mixBlendMode: effectiveBlend,
    transform: animate ? undefined : 'scale(1.08)',
    WebkitMaskImage: vignette ? RIM_MASK : undefined,
    maskImage: vignette ? RIM_MASK : undefined,
  };

  return (
    <img
      src={def.src}
      alt={def.alt}
      aria-hidden="true"
      draggable={false}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      className={[
        'eduai-holo-overlay',
        animate ? 'is-animated' : '',
        'pointer-events-none select-none absolute inset-0 z-0',
        'h-full w-full object-cover object-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    />
  );
}
