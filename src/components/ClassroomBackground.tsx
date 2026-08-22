import React, { useMemo } from 'react';
import {
  Atom,
  BookOpen,
  Calculator,
  GraduationCap,
  Pencil,
  FlaskConical,
  Globe2,
  Music,
  Star,
  Lightbulb,
  Rocket,
  Sigma,
  Compass,
  Palette,
  Dna,
  Languages,
} from 'lucide-react';
import classroomBg from '../assets/images/classroom_bg.jpg';

/**
 * Animated landing-page background:
 * a multiracial classroom (small children + chubby well-dressed female
 * teacher at the chalkboard) with educational symbols & icons continuously
 * exploding outwards from the lesson area.
 *
 * The scene gently drifts while a burst of glowing learning icons (atom,
 * books, calculator, beaker, graduation cap, planet, notes...) erupts
 * from the chalkboard, fades, and repeats — powered by pure CSS keyframes.
 */

type Particle = {
  id: number;
  node: React.ReactNode;
  x: string;
  y: string;
  rotate: string;
  scale: number;
  duration: number;
  delay: number;
  size: number;
};

/* Brand palette, resolved to literal hex so the burst never depends on a
   Tailwind arbitrary-value class surviving the JIT scan. Each icon carries
   its own colour AND a matching glow, which is what makes the symbols read
   against the dark classroom plate. */
const ICON_SETS: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}[] = [
  { Icon: Atom, color: '#00B3FF' },
  { Icon: BookOpen, color: '#00FF9F' },
  { Icon: Calculator, color: '#FF00D4' },
  { Icon: GraduationCap, color: '#ffdf40' },
  { Icon: Pencil, color: '#00FF9F' },
  { Icon: FlaskConical, color: '#FF00D4' },
  { Icon: Globe2, color: '#00B3FF' },
  { Icon: Music, color: '#ffdf40' },
  { Icon: Star, color: '#ffdf40' },
  { Icon: Lightbulb, color: '#00B3FF' },
  { Icon: Rocket, color: '#FF00D4' },
  { Icon: Sigma, color: '#00FF9F' },
  { Icon: Compass, color: '#ffdf40' },
  { Icon: Palette, color: '#FF00D4' },
  { Icon: Dna, color: '#00FF9F' },
  { Icon: Languages, color: '#00B3FF' },
];

const EMOJI_SET = ['🎓', '✏️', '📚', '🔬', '🧪', '⭐', '🚀', '🔢', '🌍', '🎨', '🎵', '💡', '⚛️', '📐', '🎹', '🧮'];

/** Respects the OS "reduce motion" accessibility setting. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export default function ClassroomBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = [];
    const total = 40;

    for (let i = 0; i < total; i++) {
      // Even 360° spread with a little jitter, so the burst reads as a true
      // radial explosion instead of a random cloud.
      const angle = (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;

      // Travel far enough to clear the viewport edges — these are `vmax`
      // units measured from the exact centre of the screen, so on every
      // aspect ratio the symbols fly all the way out past the corners
      // rather than dying in the middle of the hero copy.
      const dist = 46 + Math.random() * 44; // vmax
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      const useIcon = i % 3 !== 0; // mix lucide icons with emoji
      const idx = Math.floor(Math.random() * ICON_SETS.length);

      let node: React.ReactNode;
      if (useIcon) {
        const { Icon, color } = ICON_SETS[idx];
        node = (
          <Icon
            style={{
              width: '1em',
              height: '1em',
              color,
              filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 18px ${color}aa)`,
            }}
          />
        );
      } else {
        node = (
          <span
            style={{
              filter:
                'drop-shadow(0 0 6px rgba(255,223,64,0.9)) drop-shadow(0 0 18px rgba(255,223,64,0.55))',
            }}
          >
            {EMOJI_SET[idx % EMOJI_SET.length]}
          </span>
        );
      }

      arr.push({
        id: i,
        node,
        x: `${x.toFixed(2)}vmax`,
        y: `${y.toFixed(2)}vmax`,
        rotate: `${((Math.random() - 0.5) * 300).toFixed(0)}deg`,
        // Symbols grow as they rush towards the viewer.
        scale: 1.5 + Math.random() * 1.1,
        duration: 5.5 + Math.random() * 4.5,
        // Negative delays start every particle mid-flight, so the burst is
        // already in full swing on the very first painted frame instead of
        // leaving the screen empty for the first few seconds.
        delay: -(Math.random() * 10),
        size: 26 + Math.random() * 30,
      });
    }
    return arr;
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Ambient fill: a heavily blurred, zoomed copy of the scene. It only ever
          paints the letterbox/pillarbox margins left over by `object-contain`
          below, so the viewport never shows dead bars on any aspect ratio. */}
      <img
        src={classroomBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-60"
        draggable={false}
        decoding="async"
        aria-hidden="true"
      />

      {/* Classroom scene (African children + chubby well-dressed female teacher).
          `object-contain` guarantees the ENTIRE artwork is visible on every
          screen — phone portrait, tablet and desktop alike — with nothing
          cropped off the sides or the top. The small inset gives the drift
          animation room to move without ever clipping an edge. */}
      <div className={`absolute inset-[10px] ${prefersReducedMotion ? '' : 'eduai-classroom-drift'}`}>
        <img
          src={classroomBg}
          alt=""
          className="w-full h-full object-contain object-center"
          draggable={false}
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {/* Readability overlays — keep the neon-dark brand mood */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030611]/85 via-[#0a0f21]/40 to-[#030611]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_28%,rgba(3,6,17,0.55)_100%)]" />

      {/* Neon scanline sheen (brand consistency) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] opacity-30" />

      {/* Educational symbols & icons exploding outwards from the CENTRE of the
          screen. This lives in `.eduai-burst-layer` (z-index 5) so the symbols
          paint on top of the classroom photo and all of its darkening overlays
          — underneath them the burst was invisible. The layer is still below
          the landing page's own content, which sits at z-20.
          Skipped entirely when the user prefers reduced motion. */}
      {!prefersReducedMotion && (
        <div className="eduai-burst-layer" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2 eduai-explode"
              style={
                {
                  '--ex-x': p.x,
                  '--ex-y': p.y,
                  '--ex-r': p.rotate,
                  '--ex-s': p.scale.toFixed(2),
                  fontSize: `${p.size.toFixed(1)}px`,
                  lineHeight: 1,
                  animationDuration: `${p.duration.toFixed(2)}s`,
                  animationDelay: `${p.delay.toFixed(2)}s`,
                } as React.CSSProperties
              }
            >
              {p.node}
            </div>
          ))}
        </div>
      )}

      {/* Ambient brand glow orbs for depth */}
      <div className="absolute top-[8%] left-[12%] w-[420px] h-[420px] bg-brand-cyan/10 rounded-full blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[6%] right-[8%] w-[440px] h-[440px] bg-brand-pink/10 rounded-full blur-[130px] mix-blend-screen" />
    </div>
  );
}
