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
import classroomBg from '../assets/images/classroom_bg.png';

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
  duration: number;
  delay: number;
  size: number;
};

const ICON_SETS: { Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; cls: string }[] = [
  { Icon: Atom, cls: 'text-brand-cyan' },
  { Icon: BookOpen, cls: 'text-brand-green' },
  { Icon: Calculator, cls: 'text-brand-pink' },
  { Icon: GraduationCap, cls: 'text-brand-yellow' },
  { Icon: Pencil, cls: 'text-brand-green' },
  { Icon: FlaskConical, cls: 'text-brand-pink' },
  { Icon: Globe2, cls: 'text-brand-cyan' },
  { Icon: Music, cls: 'text-brand-yellow' },
  { Icon: Star, cls: 'text-brand-yellow' },
  { Icon: Lightbulb, cls: 'text-brand-cyan' },
  { Icon: Rocket, cls: 'text-brand-pink' },
  { Icon: Sigma, cls: 'text-brand-green' },
  { Icon: Compass, cls: 'text-brand-yellow' },
  { Icon: Palette, cls: 'text-brand-pink' },
  { Icon: Dna, cls: 'text-brand-green' },
  { Icon: Languages, cls: 'text-brand-cyan' },
];

const EMOJI_SET = ['🎓', '✏️', '📚', '🔬', '🧪', '⭐', '🚀', '🔢', '🌍', '🎨', '🎵', '💡', '⚛️', '📐', '🎹', '🧮'];

export default function ClassroomBackground() {
  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = [];
    const total = 26;
    for (let i = 0; i < total; i++) {
      // Random direction — icons burst outwards in a full 360° circle
      const angle = (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = 16 + Math.random() * 42; // vmin
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist * 0.8;
      const useIcon = i % 3 !== 0; // mix lucide icons with emoji
      const idx = Math.floor(Math.random() * ICON_SETS.length);

      let node: React.ReactNode;
      if (useIcon) {
        const { Icon, cls } = ICON_SETS[idx];
        node = <Icon className={`${cls} drop-shadow-[0_0_10px_rgba(0,210,255,0.55)]`} style={{ width: '1em', height: '1em' }} />;
      } else {
        node = <span className="drop-shadow-[0_0_10px_rgba(255,223,64,0.5)]">{EMOJI_SET[idx % EMOJI_SET.length]}</span>;
      }

      arr.push({
        id: i,
        node,
        x: `${x.toFixed(2)}vmin`,
        y: `${y.toFixed(2)}vmin`,
        rotate: `${(Math.random() - 0.5) * 260}deg`,
        duration: 3.8 + Math.random() * 3.6,
        delay: Math.random() * 4,
        size: 16 + Math.random() * 26,
      });
    }
    return arr;
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Classroom scene (multiracial children + chubby well-dressed female teacher) */}
      <div className="absolute inset-0 eduai-classroom-drift">
        <img
          src={classroomBg}
          alt=""
          className="w-full h-full object-cover object-[50%_42%]"
          draggable={false}
        />
      </div>

      {/* Readability overlays — keep the neon-dark brand mood */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030611]/85 via-[#0a0f21]/40 to-[#030611]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_28%,rgba(3,6,17,0.55)_100%)]" />

      {/* Neon scanline sheen (brand consistency) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] opacity-30" />

      {/* Educational symbols & icons exploding outwards from the lesson area */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute left-1/2 top-[38%] eduai-explode"
          style={
            {
              '--ex-x': p.x,
              '--ex-y': p.y,
              '--ex-r': p.rotate,
              fontSize: `${p.size}px`,
              animationDuration: `${p.duration.toFixed(2)}s`,
              animationDelay: `${p.delay.toFixed(2)}s`,
            } as React.CSSProperties
          }
        >
          {p.node}
        </div>
      ))}

      {/* Ambient brand glow orbs for depth */}
      <div className="absolute top-[8%] left-[12%] w-[420px] h-[420px] bg-brand-cyan/10 rounded-full blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[6%] right-[8%] w-[440px] h-[440px] bg-brand-pink/10 rounded-full blur-[130px] mix-blend-screen" />
    </div>
  );
}
