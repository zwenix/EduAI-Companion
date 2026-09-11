/**
 * Block renderers for the Foundation Phase template library.
 *
 * Every printable element (tracing lines, counting tasks, cut-and-paste
 * strips, game cards, certificates, memos …) is rendered here once, so a
 * worksheet, a classroom circuit card and a homework mission always look and
 * print the same. All output is plain HTML + `fp-*` classes styled by
 * `./render.ts` (A4 print CSS).
 */

import type { Block, RenderOptions, TaskItem } from './types';
import {
    artImg,
    colourChip,
    confettiStrip,
    cutLine,
    digitBoxes,
    doodlePencil,
    doodleStar,
    numberBadge,
    PALETTE_SWATCHES,
    scallopBand,
    tickBox,
    tracer,
    writingLines,
    escapeHtml as esc,
    PALETTE,
} from './art';
import { bilingualChip } from './labels';

export interface Theme {
    primary: string;
    secondary: string;
    soft: string;
    band: string;
    accent: string;
}

export interface Ctx {
    opts: RenderOptions;
    theme: Theme;
}

const lang = (ctx: Ctx) => ctx.opts.labelLanguage ?? 'en';
const bilingualOn = (ctx: Ctx) => Boolean(ctx.opts.bilingual) && lang(ctx) !== 'en';

/** Bilingual verb chip: "Read · Funda". */
const biChip = (key: Parameters<typeof bilingualChip>[0], ctx: Ctx): string =>
    bilingualOn(ctx) ? `<span class="fp-bi">${bilingualChip(key, lang(ctx))}</span>` : '';

const blockShell = (
    block: Block,
    ctx: Ctx,
    inner: string,
    extraClass = '',
    opts: { badge?: string; forceBi?: string } = {},
): string => {
    const t = ctx.theme;
    const biTitle = opts.forceBi ?? (block.titleXi && bilingualOn(ctx) ? block.titleXi : '');
    const badge = opts.badge ? `<span class="fp-badge" style="background:${t.secondary}">${esc(opts.badge)}</span>` : '';
    const marks = 'marks' in block && (block as { marks?: number }).marks ? (block as { marks: number }).marks : undefined;
    return `<section class="fp-block ${extraClass}" ${block.id ? `id="${esc(block.id)}"` : ''}>
  <header class="fp-block-head" style="border-color:${t.primary}">
    <span class="fp-block-pencil">${doodlePencil(17)}</span>
    <h3 class="fp-block-title">${esc(block.title)}${biTitle ? ` <em>${esc(biTitle)}</em>` : ''}</h3>
    ${badge}
    ${marks ? `<span class="fp-marks" style="background:${t.soft};color:${PALETTE.navy}">${marks} ${bilingualOn(ctx) ? 'marks · amanqaku' : 'marks'}</span>` : ''}
  </header>
  ${block.instruction ? `<p class="fp-instruction">${esc(block.instruction)}${block.instructionLabel && bilingualOn(ctx) ? ` <em>${esc(block.instructionLabel)}</em>` : ''}</p>` : ''}
  ${inner}
</section>`;
};

const answerLines = (count: number, ctx: Ctx): string =>
    writingLines(count, '', ctx.opts.assetMode ?? 'app');

/* ───────────────────────────── task ───────────────────────────── */

const renderTaskItem = (item: TaskItem, index: number, ctx: Ctx): string => {
    const t = ctx.theme;
    const parts = item.parts?.length
        ? `<ol class="fp-parts">${item.parts.map((p, i) => `<li><span>${String.fromCharCode(97 + i)})</span> ${esc(p)}${item.marks ? `<i class="fp-part-marks">(${Math.max(1, Math.round(item.marks / item.parts.length))})</i>` : ''}</li>`).join('')}</ol>`
        : '';
    const options = item.options?.length
        ? `<div class="fp-options">${item.options
              .map(
                  (o, i) =>
                      `<label class="fp-option"><span class="fp-tick" style="border-color:${t.primary}">${''}</span><b>${String.fromCharCode(65 + i)}</b> ${esc(o)}</label>`,
              )
              .join('')}</div>`
        : '';
    const copy = item.copyWords?.length
        ? `<div class="fp-copyrow">${item.copyWords
              .map((w) => `<div class="fp-copycell">${tracer(w, '')}${writingLines(1, '', ctx.opts.assetMode ?? 'app')}</div>`)
              .join('')}</div>`
        : '';
    const lines = item.lines ?? (item.options?.length || item.copyWords?.length ? 0 : 1);
    return `<div class="fp-item">
  <div class="fp-item-head">${item.numbered === false ? '' : numberBadge(index + 1, t.primary)}${item.symbol ? `<span class="fp-item-symbol">${item.symbol}</span>` : ''}
    <p class="fp-item-text">${esc(item.text)}</p>${item.marks ? `<span class="fp-item-marks">[${item.marks}]</span>` : ''}</div>
  ${parts}${options}${copy}
  ${lines > 0 ? `<div class="fp-item-lines">${writingLines(lines, '', ctx.opts.assetMode ?? 'app')}</div>` : ''}
</div>`;
};

const renderTask = (block: Extract<Block, { kind: 'task' }>, ctx: Ctx): string =>
    blockShell(
        block,
        ctx,
        `<div class="fp-items">${block.items.map((it, i) => renderTaskItem({ numbered: true, ...it }, i, ctx)).join('')}</div>`,
        'fp-task',
        { badge: biChip('answer', ctx) || undefined },
    );

/* ───────────────────────────── trace ───────────────────────────── */

const renderTrace = (block: Extract<Block, { kind: 'trace' }>, ctx: Ctx): string => {
    const rows = block.items
        .map((it) => {
            const repeats = it.repeats ?? 3;
            return `<div class="fp-tracerow">
      <div class="fp-tracemodel ${block.style === 'manuscript' ? 'fp-manuscript' : ''}">${esc(it.model)}</div>
      <div class="fp-tracepractice">${Array.from({ length: repeats })
          .map(() => `<span class="fp-ghost ${block.style === 'manuscript' ? 'fp-manuscript' : ''}">${esc(it.model)}</span>`)
          .join('')}</div>
    </div>`;
        })
        .join('');
    const frames = block.frames?.length
        ? `<div class="fp-frames">${block.frames.map((f) => `<div class="fp-frame">${esc(f)}${writingLines(1, '', ctx.opts.assetMode ?? 'app')}</div>`).join('')}</div>`
        : '';
    return blockShell(block, ctx, `<div class="fp-tracer-grid">${rows}</div>${frames}`, 'fp-trace-block', { badge: 'Fine motor' });
};

/* ───────────────────────────── count ───────────────────────────── */

const renderCount = (block: Extract<Block, { kind: 'count' }>, ctx: Ctx): string => {
    const t = ctx.theme;
    const cards = block.items
        .map(
            (it, i) => `<div class="fp-countcard">
      <div class="fp-countdot-wrap">${Array.from({ length: it.count })
          .map(() => `<span class="fp-countdot">${it.symbol}</span>`)
          .join('')}</div>
      <div class="fp-countanswer"><b>${i + 1}.</b> ${digitBoxes(2, 11)}</div>
      ${it.prompt ? `<p class="fp-countprompt">${esc(it.prompt)}</p>` : ''}
    </div>`,
        )
        .join('');
    const compare =
        block.compare && block.compare !== 'none'
            ? `<p class="fp-extra-task">${esc(
                  block.compare === 'largest-smallest'
                      ? 'Ring the group with the MOST. Put a cross on the group with the LEAST.'
                      : '',
              )}</p>`
            : '';
    return blockShell(block, ctx, `<div class="fp-countgrid">${cards}</div>${compare}`, 'fp-count', { badge: biChip('count', ctx) || undefined });
};

/* ───────────────────────────── match ───────────────────────────── */

const renderMatch = (block: Extract<Block, { kind: 'match' }>, ctx: Ctx): string => {
    const right = [...block.right];
    // Deterministic shuffle so the printed sheet always matches the memo.
    for (let i = right.length - 1; i > 0; i--) {
        const j = (i * 7 + block.right.length * 3 + 5) % (i + 1);
        [right[i], right[j]] = [right[j], right[i]];
    }
    const row = (l: string, r: string, i: number) =>
        `<div class="fp-matchrow"><span class="fp-matchcell fp-match-left">${i + 1}. ${esc(l)}</span><span class="fp-matchline"></span><span class="fp-matchcell fp-match-right">${esc(r)}</span></div>`;
    const rows = block.left.map((l, i) => row(l, right[i] ?? '', i)).join('');
    return blockShell(block, ctx, `<div class="fp-match">${rows}</div>`, 'fp-match-block', { badge: biChip('match', ctx) || undefined });
};

/* ───────────────────────── colour-circle ───────────────────────── */

const renderColourCircle = (block: Extract<Block, { kind: 'colour-circle' }>, ctx: Ctx): string => {
    const palette = block.palette?.length
        ? block.palette.map(([n, h]) => colourChip(n, h)).join('')
        : PALETTE_SWATCHES.filter(([n]) => (block.actions ?? []).some((a) => a.toLowerCase().includes('colour')) || n !== 'white')
                  .slice(0, 6)
                  .map(([n, h]) => colourChip(n, h))
                  .join('');
    const items = block.items
        .map(
            (it) => `<div class="fp-citem ${block.layout === 'grid' ? 'fp-citem-grid' : ''}">
      <span class="fp-citem-face">${esc(it.text)}</span>
      ${it.caption ? `<span class="fp-citem-cap">${esc(it.caption)}</span>` : ''}
      <span class="fp-citem-actions">${(it.actions ?? block.actions).map((a) => `<i>${esc(a)}</i>`).join('')}</span>
    </div>`,
        )
        .join('');
    return blockShell(
        block,
        ctx,
        `<div class="fp-swatches">${palette}</div><div class="fp-citems ${block.layout === 'grid' ? 'fp-citems-grid' : ''}">${items}</div>`,
        'fp-colour',
    );
};

/* ───────────────────────────── grid ───────────────────────────── */

const renderGrid = (block: Extract<Block, { kind: 'grid' }>, ctx: Ctx): string => {
    const size = block.cellSize ?? 13;
    if (block.variant === 'boxes') {
        const rows = block.rows
            .map((r, ri) => {
                const cells = block.columns
                    .map((_, ci) => {
                        const key = `${ri},${ci}`;
                        const pre = block.filled?.[key];
                        return `<span class="fp-gcell" style="min-height:${size}mm">${pre ? esc(pre) : ''}</span>`;
                    })
                    .join('');
                return `<div class="fp-gboxrow"><b class="fp-glabel">${esc(r)}</b>${cells}</div>`;
            })
            .join('');
        return blockShell(block, ctx, `<div class="fp-gbox">${rows}</div>`, 'fp-grid');
    }
    const head = `<tr><th></th>${block.columns.map((c) => `<th style="background:${ctx.theme.soft}">${esc(c)}</th>`).join('')}</tr>`;
    const body = block.rows
        .map((r, ri) => {
            const cells = block.columns
                .map((_, ci) => {
                    const pre = block.filled?.[`${ri},${ci}`];
                    return `<td class="${pre ? 'fp-prefill' : 'fp-blankcell'}">${pre ? esc(pre) : ''}</td>`;
                })
                .join('');
            return `<tr><th scope="row">${esc(r)}</th>${cells}</tr>`;
        })
        .join('');
    return blockShell(
        block,
        ctx,
        `<table class="fp-table fp-gridtable" style="--cell:${size}mm"><thead>${head}</thead><tbody>${body}</tbody></table>`,
        'fp-grid',
    );
};

/* ──────────────────────────── cut-paste ─────────────────────────── */

const renderCutPaste = (block: Extract<Block, { kind: 'cut-paste' }>, ctx: Ctx): string => {
    const strip = `<div class="fp-strip-wrap">${cutLine('Cut out the boxes, then paste them on the dotted lines')}${block.pieces
        .map(
            (p) =>
                `<span class="fp-piece" style="border-color:${ctx.theme.primary}"><b>${esc(p)}</b><i>cut</i></span>`,
        )
        .join('')}</div>`;
    const slots = `<div class="fp-slotgrid">${block.slots
        .map((s, i) => {
            const ctx2 = block.contexts?.[i];
            return `<div class="fp-slotrow">${ctx2 ? `<span class="fp-slotctx">${esc(ctx2)}</span>` : ''}<span class="fp-slot">${s === '_' ? '' : esc(s)}</span></div>`;
        })
        .join('')}</div>`;
    return blockShell(block, ctx, `${slots}${strip}`, 'fp-cutpaste');
};

/* ──────────────────────────── word-bank ─────────────────────────── */

const renderWordBank = (block: Extract<Block, { kind: 'word-bank' }>, ctx: Ctx): string => {
    const bank = `<div class="fp-bank" style="border-color:${ctx.theme.primary}">${block.words
        .map((w) => `<span class="fp-bankword" style="background:${ctx.theme.soft}">${esc(w)}</span>`)
        .join('')}</div>`;
    const sents = block.sentences
        .map(
            (s, i) =>
                `<div class="fp-sent"><span class="fp-sentno">${i + 1}.</span><span class="fp-senttext">${s
                    .split('___')
                    .map((part, idx) => (idx === 0 ? esc(part) : `<span class="fp-gap"></span>${esc(part)}`))
                    .join('')}</span></div>`,
        )
        .join('');
    return blockShell(block, ctx, `${bank}<div class="fp-sents">${sents}</div>`, 'fp-wordbank', { badge: biChip('complete', ctx) || undefined });
};

/* ────────────────────────── comprehension ───────────────────────── */

const renderComprehension = (block: Extract<Block, { kind: 'comprehension' }>, ctx: Ctx): string => {
    const body = block.passage
        .map((line, i) => {
            const isTitle = i === 0;
            return isTitle
                ? `<h4 class="fp-passage-title">${esc(line)}</h4>`
                : `<p class="fp-passage-line">${esc(line)}</p>`;
        })
        .join('');
    const art = block.passageArt ? artImg(block.passageArt, ctx.opts.assetMode ?? 'app', { size: 46, float: 'right' }) : '';
    const vocab = block.vocabulary?.length
        ? `<div class="fp-vocab"><h5>${bilingualOn(ctx) ? 'Word study · Funda' : 'Word study'}</h5><ol>${block.vocabulary
              .map((v) => `<li><b>${esc(v.word)}</b> — ${esc(v.ask)}</li>`)
              .join('')}</ol></div>`
        : '';
    const qs = block.questions.map((q, i) => renderTaskItem({ numbered: true, ...q }, i, ctx)).join('');
    return blockShell(
        block,
        ctx,
        `<div class="fp-passage">${art}${body}</div>${vocab}<div class="fp-items">${qs}</div>`,
        'fp-comp',
        { badge: biChip('read', ctx) || undefined },
    );
};

/* ──────────────────────────── checklist ─────────────────────────── */

const renderChecklist = (block: Extract<Block, { kind: 'checklist' }>, ctx: Ctx): string => {
    const mark = (i: number): string => {
        if (block.style === 'star') return doodleStar(ctx.theme.secondary, 15, 'fp-mark-star');
        if (block.style === 'heart') return `<span class="fp-heart">♡</span>`;
        return tickBox(9);
    };
    const items = block.items
        .map((it, i) => `<li>${mark(i)}<span>${esc(it)}</span></li>`)
        .join('');
    return blockShell(
        block,
        ctx,
        `<ul class="fp-checklist">${items}</ul>${block.footer ? `<p class="fp-checkfoot">${esc(block.footer)}</p>` : ''}`,
        'fp-check',
    );
};

/* ───────────────────────────── reward ───────────────────────────── */

const renderReward = (block: Extract<Block, { kind: 'reward' }>, ctx: Ctx): string => {
    const slots = Array.from({ length: block.slots ?? 5 })
        .map(() => `<span class="fp-stickerslot">${doodleStar('#ffffff', 16, 'fp-slot-star')}</span>`)
        .join('');
    return blockShell(
        block,
        ctx,
        `<div class="fp-praise">${block.praise.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
     <div class="fp-stickerrow">${slots}</div>
     <div class="fp-signrow"><span class="fp-signline">${bilingualOn(ctx) ? 'Parent / caregiver · Umzali' : 'Parent / caregiver'} sign</span><span class="fp-signline">Date</span></div>`,
        'fp-reward',
        { badge: bilingualOn(ctx) ? 'Ixabiso' : 'Praise' },
    );
};

/* ───────────────────────────── callout ──────────────────────────── */

const CALLOUT_META: Record<string, { emoji: string; title: string }> = {
    tip: { emoji: '💡', title: 'Teaching tip' },
    parent: { emoji: '👪', title: 'Note to parents / caregivers' },
    teacher: { emoji: '', title: 'Teacher notes' },
    inclusion: { emoji: '🤝', title: 'Inclusive education — barriers to learning' },
    safety: { emoji: '🦺', title: 'Safety first' },
};

const renderCallout = (block: Extract<Block, { kind: 'callout' }>, ctx: Ctx): string => {
    const meta = CALLOUT_META[block.tone] ?? CALLOUT_META.tip;
    const t = ctx.theme;
    return `<aside class="fp-callout fp-callout-${block.tone}" style="border-left-color:${t.primary};background:${t.soft}">
  <h4>${meta.emoji} ${esc(block.title || meta.title)}${block.titleXi && bilingualOn(ctx) ? ` <em>${esc(block.titleXi)}</em>` : ''}</h4>
  <ul>${block.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  ${confettiStrip(6, block.tone.length * 13 + 3)}
</aside>`;
};

/* ──────────────────────────── certificate ───────────────────────── */

const renderCertificate = (block: Extract<Block, { kind: 'certificate' }>, ctx: Ctx): string => {
    const f = ctx.opts.fields ?? {};
    const fill = (token: string | undefined, fallback: string) => (token && token.trim() ? esc(token) : fallback);
    const learnerName = fill(f.learner, '________________________________');
    const resolve = (text: string): string =>
        text
            .replace(/\{learner\}/g, `<b class="fp-learner">${learnerName}</b>`)
            .replace(/\{school\}/g, fill(f.school, '____________________'))
            .replace(/\{class\}/g, fill(f.class, '____'))
            .replace(/\{term\}/g, fill(f.term, 'Term ____'))
            .replace(/\{marks\}/g, fill(f.marks, '____'))
            .replace(/\{date\}/g, fill(f.date, '____ / ____ / 2026'))
            .replace(/\{teacher\}/g, fill(f.teacher, '____________________'))
            .replace(/\{principal\}/g, fill(f.principal, '____________________'))
            .replace(/\{reason\}/g, fill(f.awardReason, '________________________________'))
            .replace(/\{message\}/g, fill(f.message, 'Keep shining — we are proud of you!'));
    const signatures = block.signatures
        .map((s) => {
            const labelMap: Record<string, string> = {
                teacher: 'Class teacher',
                principal: 'Principal',
                chairperson: 'SGB chairperson',
                parent: 'Parent / caregiver',
            };
            const pre = s === 'teacher' ? f.teacher : s === 'principal' ? f.principal : undefined;
            return `<div class="fp-signblock"><span class="fp-signname">${pre ? esc(pre) : ''}</span><span class="fp-signrule"></span><span class="fp-signlabel">${esc(labelMap[s])}${bilingualOn(ctx) ? ` · ${s === 'teacher' ? 'Utitshala' : s === 'principal' ? 'Umphathi wesikolo' : 'Umzali'}` : ''}</span></div>`;
        })
        .join('');
    const stickers =
        block.stickers && block.stickers > 0
            ? `<div class="fp-cert-stickers">${Array.from({ length: block.stickers })
                  .map((_, i) => doodleStar([PALETTE.yellow, PALETTE.pink, PALETTE.cyan, PALETTE.green, PALETTE.purple][i % 5], 20))
                  .join('')}</div>`
            : '';
    return `<div class="fp-cert">
  <div class="fp-cert-medal" aria-hidden="true">${artImg('medal-star', ctx.opts.assetMode ?? 'app', { size: 34 })}</div>
  <p class="fp-cert-eyebrow">${bilingualOn(ctx) ? 'Ubhaso lwenkqubela · ' : ''}Award for outstanding achievement</p>
  <h2 class="fp-cert-award">${esc(block.awardTitle)}</h2>
  ${block.levelRibbon ? `<p class="fp-cert-ribbon" style="background:${ctx.theme.secondary}">${esc(block.levelRibbon)}</p>` : ''}
  <p class="fp-cert-line">${resolve(block.citation)}</p>
  <div class="fp-cert-reason"><span class="fp-cert-reason-label">${bilingualOn(ctx) ? 'Ngenxa ka · For' : 'For'}</span><span class="fp-cert-reason-text">${resolve(block.reason)}</span></div>
  <div class="fp-cert-meta">
    <span><b>${bilingualOn(ctx) ? 'Iklasi · Class' : 'Class'}</b> ${fill(f.class, '____')}</span>
    <span><b>${bilingualOn(ctx) ? 'Ithemu · Term' : 'Term'}</b> ${fill(f.term, 'Term ____')}</span>
    <span><b>${bilingualOn(ctx) ? 'Amanqaku · Marks' : 'Marks'}</b> ${fill(f.marks, '____ / ____')}</span>
    <span><b>${bilingualOn(ctx) ? 'Umhla · Date' : 'Date'}</b> ${fill(f.date, '____ / ____ / 2026')}</span>
  </div>
  ${stickers}
  <p class="fp-cert-message">${resolve((block as { message?: string }).message ?? "We are proud of you — keep reaching for the stars!")}</p>
  <div class="fp-signrow fp-cert-signs">${signatures}</div>
</div>`;
};

/* ───────────────────────────── cards ────────────────────────────── */

const renderCards = (block: Extract<Block, { kind: 'cards' }>, ctx: Ctx): string => {
    const perRow = block.perRow ?? 4;
    const cards = block.cards
        .map(
            (c) => `<div class="fp-card fp-card-${block.cut ?? 'dashed'}" style="border-color:${ctx.theme.primary};flex:1 1 ${Math.floor(170 / perRow)}mm">
      ${c.symbol ? `<span class="fp-card-symbol">${c.symbol}</span>` : ''}
      <span class="fp-card-face">${esc(c.face)}</span>
      ${c.caption ? `<span class="fp-card-cap">${esc(c.caption)}</span>` : ''}
      ${(block.cardFields ?? [])
          .map((cf) => `<span class="fp-cardfield">${esc(cf.label)}${cf.dotted === false ? ': ' + '&nbsp;' : '<i class="fp-cardrule"></i>'}</span>`)
          .join('')}
      ${c.note ? `<span class="fp-card-note">${esc(c.note)}</span>` : ''}
    </div>`,
        )
        .join('');
    return blockShell(
        block,
        ctx,
        `${cutLine('Cut along the dashed lines') || ''}<div class="fp-cardgrid">${cards}</div>`,
        'fp-cards',
    );
};

/* ───────────────────────────── movement ─────────────────────────── */

const renderMovement = (block: Extract<Block, { kind: 'movement' }>, ctx: Ctx): string => {
    const steps = block.steps
        .map(
            (s, i) => `<li><span class="fp-stepno" style="background:${ctx.theme.primary}">${i + 1}</span><span class="fp-steptext">${s.symbol ? `${s.symbol} ` : ''}${esc(s.text)}</span>${s.reps ? `<span class="fp-stepreps">${esc(s.reps)}</span>` : ''}</li>`,
        )
        .join('');
    return blockShell(
        block,
        ctx,
        `<ol class="fp-movement">${steps}</ol>${block.space ? `<p class="fp-space">🏃 Space: ${esc(block.space)}</p>` : ''}`,
        'fp-movement',
        { badge: bilingualOn(ctx) ? 'Physical' : 'Kinesthetic' },
    );
};

/* ───────────────────────────── oral-pairs ───────────────────────── */

const renderOralPairs = (block: Extract<Block, { kind: 'oral-pairs' }>, ctx: Ctx): string => {
    const frames = block.frames.map((f, i) => `<div class="fp-bubble ${i % 2 ? 'fp-bubble-b' : ''}">${esc(f)}</div>`).join('');
    const prompts = block.prompts.map((p, i) => `<li>${tickBox(7)}<span>${esc(p)}</span></li>`).join('');
    return blockShell(
        block,
        ctx,
        `<div class="fp-bubbles">${frames}</div>
     <div class="fp-pairtalk">
       <div class="fp-paircol"><h5>Ask your partner</h5><ul class="fp-minichack">${prompts}</ul></div>
       ${block.listenFor ? `<div class="fp-paircol fp-pairlisten"><h5>Listener's job</h5><p>${esc(block.listenFor)}</p></div>` : ''}
     </div>`,
        'fp-oral',
        { badge: biChip('talk', ctx) || undefined },
    );
};

/* ──────────────────────────── data-table ────────────────────────── */

const renderDataTable = (block: Extract<Block, { kind: 'data-table' }>, ctx: Ctx): string => {
    const head = `<tr>${block.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
    const body = block.rows
        .map(
            (r, ri) =>
                `<tr>${r
                    .map((cell, ci) => {
                        if (block.pictogram && ci === r.length - 1 && cell === '') {
                            return `<td class="fp-pic">${Array.from({ length: 0 }).join('')}</td>`;
                        }
                        const isAnswer = cell === '';
                        return `<td class="${isAnswer ? 'fp-blankcell' : ''}" ${isAnswer && ri === 0 ? `style="min-height:10mm"` : ''}>${isAnswer ? '' : block.pictogram ? cell.split(' ').map(() => block.pictogram).join(' ') : esc(cell)}</td>`;
                    })
                    .join('')}</tr>`,
        )
        .join('');
    const qs = block.questions?.length
        ? `<div class="fp-items">${block.questions.map((q, i) => renderTaskItem({ numbered: true, ...q }, i, ctx)).join('')}</div>`
        : '';
    return blockShell(block, ctx, `<table class="fp-table"><thead>${head}</thead><tbody>${body}</tbody></table>${qs}`, 'fp-data');
};

/* ──────────────────────────────── rubric ────────────────────────── */

const renderRubric = (block: Extract<Block, { kind: 'rubric' }>, ctx: Ctx): string => {
    const t = ctx.theme;
    const head = `<tr><th class="fp-rubric-crit">Criterion</th>${block.levels.map((l) => `<th style="background:${t.soft}">${esc(l)}</th>`).join('')}</tr>`;
    const body = block.criteria
        .map(
            (c, ci) =>
                `<tr><th scope="row">${esc(c)}</th>${block.levels
                    .map((_, li) => `<td>${esc(block.cells[li]?.[ci] ?? '')}</td>`)
                    .join('')}</tr>`,
        )
        .join('');
    return blockShell(block, ctx, `<table class="fp-table fp-rubric"><thead>${head}</thead><tbody>${body}</tbody></table>`, 'fp-rubric-block');
};

/* ───────────────────────────────── memo ─────────────────────────── */

const renderMemo = (block: Extract<Block, { kind: 'memo' }>, ctx: Ctx): string => {
    const rows = block.items
        .map(
            (m) => `<tr><td class="fp-memo-ref">${esc(m.ref)}</td><td>${esc(m.answer)}${m.note ? ` <i>— ${esc(m.note)}</i>` : ''}</td><td class="fp-memo-marks">${m.marks ?? ''}</td></tr>`,
        )
        .join('');
    return `<section class="fp-memo">
  <header class="fp-memo-head"><h3>${bilingualOn(ctx) ? 'Iimpendulo · Memorandum' : 'Memorandum / answer key'}</h3>${block.total ? `<span class="fp-memo-total">${bilingualOn(ctx) ? 'Zizonke · Total' : 'Total'}: ${block.total}</span>` : ''}</header>
  <table class="fp-table fp-memo-table"><thead><tr><th>Ref</th><th>Expected answer</th><th>Marks</th></tr></thead><tbody>${rows}</tbody></table>
</section>`;
};

/* ─────────────────────────────── dispatcher ─────────────────────── */

export const renderBlock = (block: Block, ctx: Ctx): string => {
    switch (block.kind) {
        case 'task':
            return renderTask(block, ctx);
        case 'trace':
            return renderTrace(block, ctx);
        case 'count':
            return renderCount(block, ctx);
        case 'match':
            return renderMatch(block, ctx);
        case 'colour-circle':
            return renderColourCircle(block, ctx);
        case 'grid':
            return renderGrid(block, ctx);
        case 'cut-paste':
            return renderCutPaste(block, ctx);
        case 'word-bank':
            return renderWordBank(block, ctx);
        case 'comprehension':
            return renderComprehension(block, ctx);
        case 'checklist':
            return renderChecklist(block, ctx);
        case 'reward':
            return renderReward(block, ctx);
        case 'callout':
            return renderCallout(block, ctx);
        case 'certificate':
            return renderCertificate(block, ctx);
        case 'cards':
            return renderCards(block, ctx);
        case 'movement':
            return renderMovement(block, ctx);
        case 'oral-pairs':
            return renderOralPairs(block, ctx);
        case 'data-table':
            return renderDataTable(block, ctx);
        case 'rubric':
            return renderRubric(block, ctx);
        case 'memo':
            return renderMemo(block, ctx);
        default:
            return '';
    }
};

export { blockShell, answerLines };
