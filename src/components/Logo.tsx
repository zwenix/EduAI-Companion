import React from 'react';
import { motion } from 'motion/react';
import logoUrl from '../assets/logo.png';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

/**
 * EduAI brand mark — uses the real logo asset recovered from origin/main.
 * Falls back to an inline SVG mark if the image ever fails to load, so the
 * logo never renders broken.
 */
export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 2 }}
      animate={{ y: [0, -5, 0] }}
      transition={{
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        rotate: { type: 'spring', stiffness: 300 },
        scale: { type: 'spring', stiffness: 300 }
      }}
      className={cn("relative shrink-0 flex items-center justify-center", className)}
    >
      <img
        src={logoUrl}
        alt="EduAI Companion Logo"
        className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]"
        onError={(e) => {
          const el = e.currentTarget;
          el.onerror = null;
          el.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="24" fill="%2306b6d4"/><polygon points="50,30 78,41 50,52 22,41" fill="%230f172a" stroke="%23fcd34d" stroke-width="2"/><path d="M38 46 L38 58 Q50 65 62 58 L62 46 Z" fill="%231e293b"/></svg>`
          );
        }}
      />
    </motion.div>
  );
}
