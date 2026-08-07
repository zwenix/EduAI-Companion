// src/components/PageOverlay.tsx
import { useMemo } from 'react';
import { resolveOverlay } from '../lib/overlays';

type Blend = 'normal' | 'screen';

interface PageOverlayProps {
  /** current route / page id, e.g. "message-collaborate" or a legacy alias */
  route?: string | null;
  /** 'normal' = your spec, a literal 50% veil.
   *  'screen' = additive: the near-black navy base contributes almost nothing,
   *  so the existing background shows at full strength and only the glows land. */
  blend?: Blend;
  opacity?: number;     // default 0.5
  vignette?: boolean;   // default true — keeps the centre quiet for your cards
  /** slow ambient drift of the plate; off by default (tasteful, motion-safe) */
  drift?: boolean;
  className?: string;
}

const KEYFRAMES = `
@keyframes ov-ignite {
  from { opacity: 0; filter: blur(6px); transform: scale(1.03); }
  to   { opacity: 1; filter: blur(0);   transform: scale(1); }
}
@keyframes ov-drift {
  0%   { transform: translate3d(0,0,0) scale(1.06); }
  50%  { transform: translate3d(-1.2%,-0.8%,0) scale(1.1); }
  100% { transform: translate3d(0,0,0) scale(1.06); }
}`;

export default function PageOverlay({
  route,
  blend = 'normal',
  opacity = 0.85,
  vignette = false,
  drift = false,
  className = '',
}: PageOverlayProps) {
  const src = useMemo(() => resolveOverlay(route), [route]);

  // Keep plate strong enough that transparent PNG edges never read as white canvas
  const imgOpacity = blend === 'screen' ? Math.min(1, opacity + 0.1) : Math.min(1, Math.max(0.55, opacity));

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        aria-hidden="true"
        className={`page-overlay pointer-events-none absolute inset-0 z-0 select-none overflow-hidden ${className}`}
      >
        {/* Solid navy fill — paints full area before/under the image */}
        <div className="page-overlay-fallback absolute inset-0" />

        {/* key={src} remounts on route change → the new constellation ignites */}
        <div
          key={src}
          className="absolute inset-0 overflow-hidden"
          style={{
            opacity: imgOpacity,
            mixBlendMode: blend === 'screen' ? 'screen' : 'normal',
            animation: 'ov-ignite 700ms ease-out both' + (drift ? ', ov-drift 48s ease-in-out infinite' : ''),
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="page-overlay-img"
          />
        </div>

        {/* Soft top/bottom veil so header/footer seams never look like a white strip */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(9,18,37,0.55) 0%, transparent 14%, transparent 86%, rgba(9,18,37,0.65) 100%)',
          }}
        />

        {vignette && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(10,15,33,0.35) 100%)',
            }}
          />
        )}
      </div>
    </>
  );
}
