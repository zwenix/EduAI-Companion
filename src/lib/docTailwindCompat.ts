/**
 * EduAI Companion — static Tailwind-compatible CSS for in-app document previews.
 *
 * WHY THIS FILE EXISTS (issue: "menus are constantly flashing and not visible
 * in the CAPS Template Studio preview")
 *
 * The CAPS preview iframe used to load the Tailwind CDN *runtime*. That caused:
 *   1. Flashing  — the CDN JIT compiled styles after first paint, so every
 *      preview reload (which happened on EVERY streamed generation chunk,
 *      because the iframe srcDoc was replaced while streaming) re-ran the
 *      compiler and the whole document — menus included — visibly snapped.
 *   2. Invisible menus — when the CDN was slow or blocked (school networks,
 *      rate limits), the generated document sat unstyled, and glassmorphic
 *      AI menus "got lost in the background".
 *   3. The "cdn.tailwindcss.com should not be used in production" console spam.
 *
 * This module replaces that runtime with a deterministic, zero-JS utility
 * layer covering the class vocabulary the generators emit. It is generated in
 * memory from the Tailwind colour/space tables at module init (no runtime
 * compiler, no network, no MutationObserver), so documents are styled on the
 * very first paint — even offline.
 *
 * The final block is a ZERO-specificity safety net (`:where(...)`) that keeps
 * navigation menus / tab bars readable even when the AI emits a class this
 * layer does not know. Any real utility class (specificity ≥ (0,1,0)) always
 * wins over the safety net, so deliberate AI styling is never clobbered.
 */

const PALETTES: Record<string, Record<string, string>> = {
  slate:  { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a',950:'#020617' },
  gray:   { 50:'#f9fafb',100:'#f3f4f6',200:'#e5e7eb',300:'#d1d5db',400:'#9ca3af',500:'#6b7280',600:'#4b5563',700:'#374151',800:'#1f2937',900:'#111827',950:'#030712' },
  zinc:   { 50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',800:'#27272a',900:'#18181b',950:'#09090b' },
  blue:   { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a',950:'#172554' },
  sky:    { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e',950:'#082f49' },
  cyan:   { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490',800:'#155e75',900:'#164e63',950:'#083344' },
  teal:   { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a',950:'#042f2e' },
  emerald:{ 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b9',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22' },
  green:  { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d',950:'#052e16' },
  lime:   { 50:'#f7fee7',100:'#ecfccb',200:'#d9f99d',300:'#bef264',400:'#a3e635',500:'#84cc16',600:'#65a30d',700:'#4d7c0f',800:'#3f6212',900:'#365314',950:'#1a2e05' },
  yellow: { 50:'#fefce8',100:'#fef9c3',200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12',950:'#422006' },
  amber:  { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03' },
  orange: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12',950:'#431407' },
  red:    { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a' },
  rose:   { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337',950:'#4c0519' },
  pink:   { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d',800:'#9d174d',900:'#831843',950:'#500724' },
  fuchsia:{ 50:'#fdf4ff',100:'#fae8ff',200:'#f5d0fe',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3',700:'#a21caf',800:'#86198f',900:'#701a75',950:'#4a044e' },
  purple: { 50:'#faf5ff',100:'#f3e8ff',200:'#e9d5ff',300:'#d8b4fe',400:'#c084fc',500:'#a855f7',600:'#9333ea',700:'#7e22ce',800:'#6b21a8',900:'#581c87',950:'#3b0764' },
  violet: { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95',950:'#2e1065' },
  indigo: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',950:'#1e1b4b' },
};

const SPACING: Record<string, string> = {
  '0':'0px', '0.5':'2px', '1':'4px', '1.5':'6px', '2':'8px', '2.5':'10px', '3':'12px',
  '3.5':'14px', '4':'16px', '5':'20px', '6':'24px', '7':'28px', '8':'32px', '10':'40px',
  '12':'48px', '14':'56px', '16':'64px', '20':'80px', '24':'96px'
};

const OPAQUE_PALETTES = { ...PALETTES, white: { DEFAULT: '#ffffff' }, black: { DEFAULT: '#000000' } };

/** "#rrggbb" + alpha (0..1) → compact rgba(). */
function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const escClass = (c: string) =>
  c
    .replace(/:/g, '\\:')
    .replace(/\//g, '\\/')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');

function build(): string {
  const out: string[] = [];
  const rule = (cls: string, decls: string) => {
    out.push(`.${escClass(cls)}{${decls}}`);
  };

  // ── Colours: text / bg / border (+ white, black) ────────────────────────
  for (const [name, steps] of Object.entries(OPAQUE_PALETTES)) {
    for (const [step, hex] of Object.entries(steps)) {
      const base = step === 'DEFAULT' ? name : `${name}-${step}`;
      rule(`text-${base}`, `color:${hex}`);
      rule(`bg-${base}`, `background-color:${hex}`);
      rule(`border-${base}`, `border-color:${hex}`);
      // Alpha variants (the generator's favourite for banners and menus).
      for (const a of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
        const tag = String(Math.round(a * 100));
        rule(`bg-${base}/${tag}`, `background-color:${rgba(hex, a)}`);
        rule(`border-${base}/${tag}`, `border-color:${rgba(hex, a)}`);
      }
      for (const a of [0.5, 0.6, 0.7, 0.8]) {
        const tag = String(Math.round(a * 100));
        rule(`text-${base}/${tag}`, `color:${rgba(hex, a)}`);
      }
    }
  }
  rule('text-transparent', 'color:transparent');
  rule('bg-transparent', 'background-color:transparent');
  rule('border-transparent', 'border-color:transparent');

  // ── Spacing: margin / padding / gap ─────────────────────────────────────
  for (const [n, v] of Object.entries(SPACING)) {
    rule(`m-${n}`, `margin:${v}`);
    rule(`mx-${n}`, `margin-left:${v};margin-right:${v}`);
    rule(`my-${n}`, `margin-top:${v};margin-bottom:${v}`);
    rule(`mt-${n}`, `margin-top:${v}`);
    rule(`mb-${n}`, `margin-bottom:${v}`);
    rule(`ml-${n}`, `margin-left:${v}`);
    rule(`mr-${n}`, `margin-right:${v}`);
    rule(`p-${n}`, `padding:${v}`);
    rule(`px-${n}`, `padding-left:${v};padding-right:${v}`);
    rule(`py-${n}`, `padding-top:${v};padding-bottom:${v}`);
    rule(`pt-${n}`, `padding-top:${v}`);
    rule(`pb-${n}`, `padding-bottom:${v}`);
    rule(`pl-${n}`, `padding-left:${v}`);
    rule(`pr-${n}`, `padding-right:${v}`);
    rule(`gap-${n}`, `gap:${v}`);
    rule(`gap-x-${n}`, `column-gap:${v}`);
    rule(`gap-y-${n}`, `row-gap:${v}`);
  }
  rule('m-auto', 'margin:auto');
  rule('mx-auto', 'margin-left:auto;margin-right:auto');
  rule('ml-auto', 'margin-left:auto');
  rule('mr-auto', 'margin-right:auto');
  rule('space-y-2 > * + *', 'margin-top:8px');
  rule('space-y-3 > * + *', 'margin-top:12px');
  rule('space-y-4 > * + *', 'margin-top:16px');
  rule('space-y-6 > * + *', 'margin-top:24px');
  rule('space-x-2 > * + *', 'margin-left:8px');
  rule('space-x-3 > * + *', 'margin-left:12px');
  rule('space-x-4 > * + *', 'margin-left:16px');

  // ── Display & layout ────────────────────────────────────────────────────
  for (const d of ['block','inline-block','inline','flex','inline-flex','grid','hidden','contents']) rule(d, `display:${d === 'inline-flex' ? 'inline-flex' : d}`);
  rule('flex-row', 'flex-direction:row');
  rule('flex-col', 'flex-direction:column');
  rule('flex-wrap', 'flex-wrap:wrap');
  rule('flex-nowrap', 'flex-wrap:nowrap');
  rule('flex-1', 'flex:1 1 0%');
  rule('flex-none', 'flex:none');
  rule('grow', 'flex-grow:1');
  rule('grow-0', 'flex-grow:0');
  rule('shrink', 'flex-shrink:1');
  rule('shrink-0', 'flex-shrink:0');
  for (const a of ['start','center','end','baseline','stretch']) rule(`items-${a}`, `align-items:${a === 'end' ? 'flex-end' : a}`);
  for (const a of ['start','center','end','between','around','evenly']) rule(`justify-${a}`, `justify-content:${a === 'between' ? 'space-between' : a === 'around' ? 'space-around' : a === 'evenly' ? 'space-evenly' : a === 'end' ? 'flex-end' : a}`);
  for (const a of ['start','center','end','between','around','evenly']) rule(`justify-items-${a}`, `justify-items:${a}`);
  for (let i = 1; i <= 6; i++) rule(`order-${i}`, `order:${i}`);
  rule('col-span-2', 'grid-column:span 2 / span 2');
  rule('col-span-3', 'grid-column:span 3 / span 3');
  rule('col-span-full', 'grid-column:1 / -1');
  rule('row-span-2', 'grid-row:span 2 / span 2');

  // ── Sizing ──────────────────────────────────────────────────────────────
  rule('w-full', 'width:100%');
  rule('w-auto', 'width:auto');
  rule('w-screen', 'width:100vw');
  rule('w-1/2', 'width:50%');
  rule('w-1/3', 'width:33.333%');
  rule('w-2/3', 'width:66.667%');
  rule('w-1/4', 'width:25%');
  rule('w-3/4', 'width:75%');
  rule('w-fit', 'width:fit-content');
  rule('h-full', 'height:100%');
  rule('h-auto', 'height:auto');
  rule('h-screen', 'height:100vh');
  for (const [n, v] of Object.entries(SPACING)) {
    rule(`w-${n}`, `width:${v}`);
    rule(`h-${n}`, `height:${v}`);
  }
  rule('min-w-0', 'min-width:0');
  rule('min-w-full', 'min-width:100%');
  rule('min-h-0', 'min-height:0');
  rule('min-h-full', 'min-height:100%');
  rule('min-h-screen', 'min-height:100vh');
  for (const [k, v] of Object.entries({ sm:'24rem', md:'28rem', lg:'32rem', xl:'36rem', '2xl':'42rem', '3xl':'48rem', full:'100%', none:'none' })) {
    rule(`max-w-${k}`, `max-width:${v}`);
  }
  for (const [k, v] of Object.entries({ '240px':'240px', '280px':'280px', '320px':'320px', '360px':'360px', '420px':'420px', '480px':'480px', full:'100%' })) {
    rule(`max-h-${k}`, `max-height:${v}`);
  }
  for (const [k, v] of Object.entries({ '1/1':'1 / 1', '4/3':'4 / 3', '3/4':'3 / 4', '16/9':'16 / 9', '9/16':'9 / 16', '3/2':'3 / 2', '2/3':'2 / 3' })) {
    rule(`aspect-[${k}]`, `aspect-ratio:${v}`);
  }
  // Grid columns
  for (let i = 1; i <= 12; i++) rule(`grid-cols-${i}`, `grid-template-columns:repeat(${i},minmax(0,1fr))`);

  // ── Position ────────────────────────────────────────────────────────────
  for (const p of ['static','relative','absolute','fixed','sticky']) rule(p, `position:${p}`);
  rule('inset-0', 'inset:0');
  for (const [n, v] of Object.entries(SPACING)) {
    rule(`top-${n}`, `top:${v}`);
    rule(`bottom-${n}`, `bottom:${v}`);
    rule(`left-${n}`, `left:${v}`);
    rule(`right-${n}`, `right:${v}`);
  }
  rule('top-1/2', 'top:50%');
  rule('left-1/2', 'left:50%');
  for (const z of [0, 10, 20, 30, 40, 50, 'auto']) rule(`z-${z}`, `z-index:${z}`);

  // ── Typography ──────────────────────────────────────────────────────────
  for (const [s, f, l] of [
    ['xs', '0.75rem', '1rem'], ['sm', '0.875rem', '1.25rem'], ['base', '1rem', '1.5rem'],
    ['lg', '1.125rem', '1.75rem'], ['xl', '1.25rem', '1.75rem'], ['2xl', '1.5rem', '2rem'],
    ['3xl', '1.875rem', '2.25rem'], ['4xl', '2.25rem', '2.5rem'], ['5xl', '3rem', '1'],
    ['6xl', '3.75rem', '1']
  ] as const) rule(`text-${s}`, `font-size:${f};line-height:${l}`);
  for (const [s, f, l] of [['8px','8px','1.2'],['9px','9px','1.2'],['10px','10px','1.4'],['11px','11px','1.4'],['12px','12px','1.4'],['13px','13px','1.5'],['14px','14px','1.5'],['15px','15px','1.5'],['16px','16px','1.6'],['18px','18px','1.5'],['20px','20px','1.4'],['24px','24px','1.3'],['28px','28px','1.2'],['32px','32px','1.2']] as const) {
    rule(`text-[${s}]`, `font-size:${f};line-height:${l}`);
  }
  for (const [w, v] of [['thin','100'],['extralight','200'],['light','300'],['normal','400'],['medium','500'],['semibold','600'],['bold','700'],['extrabold','800'],['black','900']] as const) {
    rule(`font-${w}`, `font-weight:${v}`);
  }
  rule('font-sans', "font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif");
  rule('font-serif', "font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif");
  rule('font-mono', "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace");
  for (const a of ['left','center','right','justify']) rule(`text-${a}`, `text-align:${a}`);
  rule('uppercase', 'text-transform:uppercase');
  rule('lowercase', 'text-transform:lowercase');
  rule('capitalize', 'text-transform:capitalize');
  rule('italic', 'font-style:italic');
  rule('not-italic', 'font-style:normal');
  rule('underline', 'text-decoration:underline');
  rule('line-through', 'text-decoration:line-through');
  rule('no-underline', 'text-decoration:none');
  for (const [t, v] of [['tighter','-0.05em'],['tight','-0.025em'],['normal','0'],['wide','0.025em'],['wider','0.05em'],['widest','0.1em']] as const) {
    rule(`tracking-${t}`, `letter-spacing:${v}`);
  }
  for (const [t, v] of [['none','1'],['tight','1.25'],['snug','1.375'],['normal','1.5'],['relaxed','1.625'],['loose','2']] as const) {
    rule(`leading-${t}`, `line-height:${v}`);
  }
  rule('whitespace-nowrap', 'white-space:nowrap');
  rule('break-words', 'overflow-wrap:break-word');
  rule('break-all', 'word-break:break-all');
  rule('truncate', 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
  rule('antialiased', '-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale');

  // ── Borders & radius ────────────────────────────────────────────────────
  rule('border', 'border-width:1px;border-style:solid');
  rule('border-0', 'border-width:0');
  rule('border-2', 'border-width:2px;border-style:solid');
  rule('border-4', 'border-width:4px;border-style:solid');
  rule('border-t', 'border-top-width:1px;border-top-style:solid');
  rule('border-b', 'border-bottom-width:1px;border-bottom-style:solid');
  rule('border-l', 'border-left-width:1px;border-left-style:solid');
  rule('border-r', 'border-right-width:1px;border-right-style:solid');
  rule('border-solid', 'border-style:solid');
  rule('border-dashed', 'border-style:dashed');
  rule('border-dotted', 'border-style:dotted');
  rule('border-none', 'border-style:none');
  for (const [r, v] of [['','4px'],['sm','2px'],['md','6px'],['lg','8px'],['xl','12px'],['2xl','16px'],['3xl','24px'],['full','9999px']] as const) {
    rule(r === '' ? 'rounded' : `rounded-${r}`, `border-radius:${v}`);
    rule(r === '' ? 'rounded-t' : `rounded-t-${r}`, `border-top-left-radius:${v};border-top-right-radius:${v}`);
    rule(r === '' ? 'rounded-b' : `rounded-b-${r}`, `border-bottom-left-radius:${v};border-bottom-right-radius:${v}`);
    rule(r === '' ? 'rounded-l' : `rounded-l-${r}`, `border-top-left-radius:${v};border-bottom-left-radius:${v}`);
    rule(r === '' ? 'rounded-r' : `rounded-r-${r}`, `border-top-right-radius:${v};border-bottom-right-radius:${v}`);
  }
  for (const [r, v] of [['1rem','16px'],['1.25rem','20px'],['1.5rem','24px'],['1.75rem','28px'],['1.8rem','28.8px'],['2rem','32px'],['2.5rem','40px'],['3rem','48px'],['2.5rem/3.5rem','40px/56px']] as const) {
    rule(`rounded-[${r}]`, `border-radius:${v}`);
  }
  rule('ring-1', 'box-shadow:0 0 0 1px rgba(37,99,235,0.4)');
  rule('ring-2', 'box-shadow:0 0 0 2px rgba(37,99,235,0.45)');
  rule('ring-4', 'box-shadow:0 0 0 4px rgba(37,99,235,0.35)');
  rule('outline-none', 'outline:2px solid transparent;outline-offset:2px');
  rule('appearance-none', 'appearance:none');

  // ── Effects ─────────────────────────────────────────────────────────────
  rule('shadow-none', 'box-shadow:none');
  rule('shadow-sm', 'box-shadow:0 1px 2px 0 rgba(0,0,0,0.05)');
  rule('shadow', 'box-shadow:0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px -1px rgba(0,0,0,0.1)');
  rule('shadow-md', 'box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)');
  rule('shadow-lg', 'box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)');
  rule('shadow-xl', 'box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1)');
  rule('shadow-2xl', 'box-shadow:0 25px 50px -12px rgba(0,0,0,0.25)');
  rule('shadow-inner', 'box-shadow:inset 0 2px 4px 0 rgba(0,0,0,0.05)');
  for (const a of [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 95, 100]) rule(`opacity-${a}`, `opacity:${a / 100}`);
  rule('backdrop-blur', 'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)');
  rule('backdrop-blur-sm', 'backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)');
  rule('backdrop-blur-md', 'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)');
  rule('backdrop-blur-xl', 'backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)');
  rule('blur-sm', 'filter:blur(4px)');
  rule('blur', 'filter:blur(8px)');
  rule('blur-md', 'filter:blur(12px)');
  rule('blur-xl', 'filter:blur(24px)');
  rule('blur-2xl', 'filter:blur(40px)');
  rule('blur-3xl', 'filter:blur(64px)');
  rule('transition', 'transition:color,background-color,border-color,box-shadow,opacity,transform 150ms ease');
  rule('transition-all', 'transition:all 150ms ease');
  rule('transition-colors', 'transition:color,background-color,border-color 150ms ease');
  rule('transition-transform', 'transition:transform 150ms ease');
  for (const d of [150, 200, 300, 500, 700]) rule(`duration-${d}`, `transition-duration:${d}ms`);
  rule('ease-in', 'transition-timing-function:cubic-bezier(0.4,0,1,1)');
  rule('ease-out', 'transition-timing-function:cubic-bezier(0,0,0.2,1)');
  rule('ease-in-out', 'transition-timing-function:cubic-bezier(0.4,0,0.2,1)');
  rule('cursor-pointer', 'cursor:pointer');
  rule('cursor-default', 'cursor:default');
  rule('cursor-not-allowed', 'cursor:not-allowed');
  rule('select-none', 'user-select:none;-webkit-user-select:none');
  rule('select-text', 'user-select:text');
  rule('pointer-events-none', 'pointer-events:none');

  // ── Overflow / misc ─────────────────────────────────────────────────────
  for (const o of ['hidden', 'auto', 'scroll', 'visible', 'clip']) rule(`overflow-${o}`, `overflow:${o === 'clip' ? 'clip' : o}`);
  rule('overflow-x-hidden', 'overflow-x:hidden');
  rule('overflow-y-auto', 'overflow-y:auto');
  rule('overflow-x-auto', 'overflow-x:auto');
  for (const o of ['cover', 'contain', 'fill', 'none', 'scale-down']) rule(`object-${o}`, `object-fit:${o}`);
  rule('list-none', 'list-style:none');
  rule('list-decimal', 'list-style:decimal');
  rule('list-inside', 'list-position:inside');
  rule('table-auto', 'table-layout:auto');
  rule('table-fixed', 'table-layout:fixed');
  rule('table-w-full', 'width:100%');
  rule('table', 'display:table');
  rule('table-row', 'display:table-row');
  rule('table-cell', 'display:table-cell');
  rule('collapse', 'border-collapse:collapse');
  rule('divide-y > * + *', 'border-top-width:1px;border-top-style:solid');
  rule('caption-top', 'caption-side:top');
  rule('bg-cover', 'background-size:cover');
  rule('bg-center', 'background-position:center');
  rule('bg-no-repeat', 'background-repeat:no-repeat');
  rule('bg-gradient-to-r', 'background-image:linear-gradient(to right,var(--tw-gradient-stops))');
  rule('bg-gradient-to-b', 'background-image:linear-gradient(to bottom,var(--tw-gradient-stops))');
  rule('bg-gradient-to-br', 'background-image:linear-gradient(to bottom right,var(--tw-gradient-stops))');
  rule('bg-gradient-to-l', 'background-image:linear-gradient(to left,var(--tw-gradient-stops))');
  // Gradient stops (from- / via- / to- use the same palette).
  for (const [name, steps] of Object.entries(OPAQUE_PALETTES)) {
    for (const [step, hex] of Object.entries(steps)) {
      const base = step === 'DEFAULT' ? name : `${name}-${step}`;
      rule(`from-${base}`, `--tw-gradient-from:${hex};--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,transparent)`);
      rule(`to-${base}`, `--tw-gradient-to:${hex};--tw-gradient-stops:var(--tw-gradient-from,transparent),var(--tw-gradient-to)`);
    }
  }
  rule('via-white', '--tw-gradient-via:#fff');
  rule('via-black', '--tw-gradient-via:#000');

  // ── Interactions (hover / active / focus) ───────────────────────────────
  // The variant colon belongs to the CLASS (escaped); the pseudo-class colon
  // is real CSS (not escaped).
  const pseudoRule = (cls: string, pseudo: string, decls: string) =>
    out.push(`.${escClass(cls)}${pseudo}{${decls}}`);
  pseudoRule('hover:scale-105', ':hover', 'transform:scale(1.05)');
  pseudoRule('hover:scale-110', ':hover', 'transform:scale(1.1)');
  pseudoRule('hover:scale-95', ':hover', 'transform:scale(0.95)');
  pseudoRule('active:scale-95', ':active', 'transform:scale(0.95)');
  pseudoRule('active:scale-90', ':active', 'transform:scale(0.9)');
  for (const [c, hex] of [['white','#fff'],['slate-50','#f8fafc'],['slate-100','#f1f5f9'],['slate-200','#e2e8f0'],['blue-50','#eff6ff'],['cyan-50','#ecfeff'],['indigo-50','#eef2ff'],['emerald-50','#ecfdf5'],['amber-50','#fffbeb'],['red-50','#fef2f2']]) {
    pseudoRule(`hover:bg-${c}`, ':hover', `background-color:${hex}`);
  }
  // hover:bg-<accent>/10|/20 — the AI's default hover affordance on menu tabs.
  for (const name of Object.keys(PALETTES)) {
    const hex = PALETTES[name]['500'];
    if (!hex) continue;
    for (const a of [0.1, 0.2]) {
      pseudoRule(`hover:bg-${name}-500/${String(Math.round(a * 100))}`, ':hover', `background-color:${rgba(hex, a)}`);
    }
  }
  for (const [c, hex] of [['slate-900','#0f172a'],['slate-800','#1e293b'],['white','#fff'],['blue-700','#1d4ed8'],['cyan-700','#0e7490']]) {
    pseudoRule(`hover:text-${c}`, ':hover', `color:${hex}`);
  }
  for (const [c, hex] of [['slate-300','#cbd5e1'],['slate-400','#94a3b8'],['cyan-400','#22d3ee'],['blue-400','#60a5fa'],['emerald-400','#34d399'],['amber-400','#fbbf24']]) {
    pseudoRule(`hover:border-${c}`, ':hover', `border-color:${hex}`);
  }
  pseudoRule('hover:shadow-md', ':hover', 'box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)');
  pseudoRule('hover:shadow-lg', ':hover', 'box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)');
  pseudoRule('focus:ring-2', ':focus', 'box-shadow:0 0 0 2px rgba(37,99,235,0.45)');
  pseudoRule('focus:outline-none', ':focus', 'outline:none');
  rule('focus:ring-2', 'box-shadow:0 0 0 2px rgba(37,99,235,0.45)');

  // ── Print variants (worksheet / letter export fidelity) ─────────────────
  const printRules = [
    'print:hidden{display:none!important}',
    'print:block{display:block!important}',
    'print:inline-block{display:inline-block!important}',
    'print:flex{display:flex!important}',
    'print:table{display:table!important}',
    'print:shadow-none{box-shadow:none!important}',
    'print:rounded-none{border-radius:0!important}',
    'print:border-none{border:none!important}',
    'print:p-0{padding:0!important}',
    'print:m-0{margin:0!important}',
    'print:mx-0{margin-left:0!important;margin-right:0!important}',
    'print:my-0{margin-top:0!important;margin-bottom:0!important}',
    'print:w-full{width:100%!important}',
    'print:break-inside-avoid{break-inside:avoid;page-break-inside:avoid}',
    'print:page-break-before{page-break-before:always}',
    'print:page-break-after{page-break-after:always}',
    'print:opacity-100{opacity:1!important}',
    'print:invisible{visibility:hidden}'
  ].map(r => r.replace(/^\S+/, m => '.' + escClass(m.slice(0, m.indexOf('{'))) + '{' + m.slice(m.indexOf('{') + 1)));
  out.push(`@media print{${printRules.join('')}}`);

  // ── Responsive variants (curated set the generator actually uses) ───────
  const sm = [
    'sm:flex-row{flex-direction:row}', 'sm:flex-col{flex-direction:column}', 'sm:block{display:block}', 'sm:inline-block{display:inline-block}',
    'sm:flex{display:flex}', 'sm:grid{display:grid}', 'sm:hidden{display:none}', 'sm:w-full{width:100%}', 'sm:h-full{height:100%}',
    'sm:max-w-none{max-width:none}', 'sm:items-start{align-items:flex-start}', 'sm:items-center{align-items:center}',
    'sm:justify-between{justify-content:space-between}', 'sm:justify-center{justify-content:center}',
    'sm:text-xs{font-size:0.75rem;line-height:1rem}', 'sm:text-sm{font-size:0.875rem;line-height:1.25rem}', 'sm:text-base{font-size:1rem;line-height:1.5rem}',
    'sm:text-lg{font-size:1.125rem;line-height:1.75rem}', 'sm:text-xl{font-size:1.25rem;line-height:1.75rem}', 'sm:text-2xl{font-size:1.5rem;line-height:2rem}',
    'sm:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}', 'sm:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}', 'sm:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}',
    'sm:gap-2{gap:8px}', 'sm:gap-3{gap:12px}', 'sm:gap-4{gap:16px}', 'sm:gap-6{gap:24px}',
    'sm:p-4{padding:16px}', 'sm:p-6{padding:24px}', 'sm:p-8{padding:32px}', 'sm:px-4{padding-left:16px;padding-right:16px}',
    'sm:px-6{padding-left:24px;padding-right:24px}', 'sm:py-2{padding-top:8px;padding-bottom:8px}', 'sm:py-4{padding-top:16px;padding-bottom:16px}',
    'sm:mb-4{margin-bottom:16px}', 'sm:mb-6{margin-bottom:24px}', 'sm:mt-4{margin-top:16px}', 'sm:rounded-2xl{border-radius:16px}',
    'sm:shadow-lg{box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)}', 'sm:col-span-2{grid-column:span 2/span 2}', 'sm:col-span-1{grid-column:span 1/span 1}'
  ].map(r => r.replace(/^\S+/, m => '.' + escClass(m.slice(0, m.indexOf('{'))) + '{' + m.slice(m.indexOf('{') + 1)));
  const md = [
    'md:flex-row{flex-direction:row}', 'md:block{display:block}', 'md:flex{display:flex}', 'md:grid{display:grid}', 'md:hidden{display:none}',
    'md:w-full{width:100%}', 'md:max-w-none{max-width:none}', 'md:items-start{align-items:flex-start}', 'md:justify-between{justify-content:space-between}',
    'md:text-sm{font-size:0.875rem;line-height:1.25rem}', 'md:text-base{font-size:1rem;line-height:1.5rem}', 'md:text-lg{font-size:1.125rem;line-height:1.75rem}', 'md:text-xl{font-size:1.25rem;line-height:1.75rem}',
    'md:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}', 'md:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}', 'md:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}',
    'md:gap-4{gap:16px}', 'md:gap-6{gap:24px}', 'md:p-6{padding:24px}', 'md:p-8{padding:32px}', 'md:px-6{padding-left:24px;padding-right:24px}',
    'md:rounded-3xl{border-radius:24px}', 'md:col-span-2{grid-column:span 2/span 2}', 'md:col-span-1{grid-column:span 1/span 1}', 'md:space-y-0>*+*{margin-top:0}'
  ].map(r => r.replace(/^\S+/, m => '.' + escClass(m.slice(0, m.indexOf('{'))) + '{' + m.slice(m.indexOf('{') + 1)));
  const lg = [
    'lg:flex-row{flex-direction:row}', 'lg:flex-col{flex-direction:column}', 'lg:block{display:block}', 'lg:flex{display:flex}', 'lg:grid{display:grid}',
    'lg:w-full{width:100%}', 'lg:items-start{align-items:flex-start}', 'lg:justify-between{justify-content:space-between}',
    'lg:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}', 'lg:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}', 'lg:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}',
    'lg:gap-4{gap:16px}', 'lg:gap-6{gap:24px}', 'lg:p-8{padding:32px}', 'lg:px-8{padding-left:32px;padding-right:32px}', 'lg:mb-0{margin-bottom:0}'
  ].map(r => r.replace(/^\S+/, m => '.' + escClass(m.slice(0, m.indexOf('{'))) + '{' + m.slice(m.indexOf('{') + 1)));
  out.push(`@media (min-width:640px){${sm.join('')}}`);
  out.push(`@media (min-width:768px){${md.join('')}}`);
  out.push(`@media (min-width:1024px){${lg.join('')}}`);

  // ── MENU / NAV SAFETY NET ───────────────────────────────────────────────
  // Zero-specificity on purpose (:where() resets specificity to 0): this only
  // ever fills gaps. If the AI styled a menu with utility classes, those win;
  // if a class is missing or unknown, menus still get a solid, high-contrast
  // surface instead of "getting lost in the background".
  const navSel = 'nav,[role="tablist"],.menu,.tabbar,.tabs,.navbar';
  const linkSel = 'nav a,nav button,[role="tablist"] a,[role="tablist"] button,.menu a,.menu button,.tabbar a,.tabs a';
  const safe = [
    `:where(${navSel}){display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}`,
    `:where(${linkSel}){display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:9px;font-weight:600;font-size:13.5px;line-height:1.2;color:#1e3a5f;text-decoration:none;border:1px solid transparent;cursor:pointer;white-space:nowrap}`,
    `:where(${linkSel}):hover{background:#e2e8f0}`,
    `:where(${linkSel}[aria-current],${linkSel}.active,${linkSel}[aria-selected="true"],${linkSel}[aria-pressed="true"],${linkSel}.is-active,${linkSel}.selected){background:#2563eb;border-color:#1d4ed8;color:#ffffff}`,
    `:where(${linkSel}[aria-current] *,${linkSel}.active *,${linkSel}[aria-selected="true"] *){color:#ffffff}`
  ];
  out.push(`/* Menu safety net (zero-specificity — utilities always win) */\n${safe.join('\n')}`);

  return out.join('\n');
}

/** Generated once at module init; safe to embed verbatim in any <style>. */
export const EDUAI_DOC_TAILWIND_CSS: string = build();

export default EDUAI_DOC_TAILWIND_CSS;
