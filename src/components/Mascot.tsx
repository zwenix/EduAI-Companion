import React from 'react';

/**
 * Elly 2.0 — redesigned mascot for the AI Tutor experience.
 *
 * Inspired by the EduAI Companion logo: a circular glowing emblem badge,
 * cyan → blue → purple gradient, a friendly smiling face, sparkle accents
 * and a soft holographic glow. Keeps Elly's signature personality (flappy
 * elephant ears + graduation cap) so she still feels like the same buddy,
 * now wearing the brand's visual identity.
 */
export default function EllyMascot({
  className = 'w-16 h-16',
  animated = true,
}: {
  className?: string;
  /** Set false to render Elly perfectly still (print/export views). */
  animated?: boolean;
}) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gid = (name: string) => `${name}_${uid}`;
  const anim = animated ? '' : ' eduai-elly-static';

  return (
    <svg
      viewBox="-6 -6 132 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}${anim} shrink-0 drop-shadow-[0_6px_18px_rgba(56,189,248,0.45)]`}
      role="img"
      aria-label="Elly, the EduAI Companion mascot"
    >
      <defs>
        {/* Brand emblem gradient (cyan → blue → purple, matches the logo) */}
        <linearGradient id={gid('headGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="35%" stopColor="#38bdf8" />
          <stop offset="70%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>

        <linearGradient id={gid('ringGrad')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>

        <linearGradient id={gid('earGrad')} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a5e3ff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <radialGradient id={gid('faceGlow')} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Logo-style emblem orbit ring + electron dots (dots orbit the emblem) */}
      <circle cx="60" cy="62" r="40" stroke={`url(#${gid('ringGrad')})`} strokeWidth="2.5" opacity="0.5" />
      <g className="eduai-elly-orbit" style={{ transformOrigin: '60px 62px' }}>
        <circle cx="20" cy="62" r="3" fill="#22d3ee" opacity="0.9" />
        <circle cx="100" cy="62" r="3" fill="#e879f9" opacity="0.9" />
      </g>

      {/* Left & Right flappy elephant ears */}
      <path
        d="M22 46 C4 40 -2 68 11 81 C22 92 38 78 39 61 C39.5 52 31 48 22 46 Z"
        fill={`url(#${gid('earGrad')})`}
        fillOpacity="0.95"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <path
        d="M98 46 C116 40 122 68 109 81 C98 92 82 78 81 61 C80.5 52 89 48 98 46 Z"
        fill={`url(#${gid('earGrad')})`}
        fillOpacity="0.95"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      {/* inner ear accents */}
      <path d="M22 52 C11 49 8 66 16 76 C23 83 32 73 33 61 C33 55 28 53 22 52 Z" fill="#0284c7" opacity="0.35" />
      <path d="M98 52 C109 49 112 66 104 76 C97 83 88 73 87 61 C87 55 92 53 98 52 Z" fill="#0284c7" opacity="0.35" />

      {/* Main emblem head */}
      <circle cx="60" cy="62" r="29" fill={`url(#${gid('headGrad')})`} />
      {/* soft top highlight, like the logo's gloss */}
      <circle cx="60" cy="62" r="29" fill={`url(#${gid('faceGlow')})`} />

      {/* Friendly eyes with logo-style sparkle highlights (they blink) */}
      <g className="eduai-elly-blink" style={{ transformOrigin: '60px 57px' }}>
        <ellipse cx="49" cy="57" rx="6.5" ry="8" fill="#ffffff" />
        <ellipse cx="71" cy="57" rx="6.5" ry="8" fill="#ffffff" />
        <circle cx="49.5" cy="59" r="3.6" fill="#0b1b4d" />
        <circle cx="71.5" cy="59" r="3.6" fill="#0b1b4d" />
        <circle cx="47.6" cy="56.6" r="1.5" fill="#ffffff" />
        <circle cx="69.6" cy="56.6" r="1.5" fill="#ffffff" />
      </g>

      {/* Cheek blushes */}
      <ellipse cx="40" cy="67" rx="4" ry="2.6" fill="#f472b6" opacity="0.55" />
      <ellipse cx="80" cy="67" rx="4" ry="2.6" fill="#f472b6" opacity="0.55" />

      {/* Big happy smile (the logo's wide smile, Elly's warmth) */}
      <path d="M49 68 Q60 82 71 68" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M55.5 72.5 Q60 77.5 64.5 72.5" stroke="#a5e3ff" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Graduation cap (mortarboard) */}
      <polygon points="60,17 91,26 60,35 29,26" fill="#0f172a" stroke="#fcd34d" strokeWidth="2" strokeLinejoin="round" />
      <path d="M38 30 L38 40 Q60 47 82 40 L82 30 Z" fill="#1e293b" />
      <path d="M60 26 L78 32 L78 46" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="78" cy="48" r="3" fill="#fcd34d" />

      {/* Sparkle accents around the emblem (logo sparkles) */}
      <path d="M17 16 L19.2 21.8 L25 24 L19.2 26.2 L17 32 L14.8 26.2 L9 24 L14.8 21.8 Z" fill="#ffdf40" />
      <path d="M104 20 L105.8 24.6 L110.4 26.4 L105.8 28.2 L104 32.8 L102.2 28.2 L97.6 26.4 L102.2 24.6 Z" fill="#f0abfc" />
      <path d="M101 88 L102.3 91.7 L106 93 L102.3 94.3 L101 98 L99.7 94.3 L96 93 L99.7 91.7 Z" fill="#ffdf40" />
    </svg>
  );
}
