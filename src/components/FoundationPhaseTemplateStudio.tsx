import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Printer,
    Download,
    Search,
    Sparkles,
    X,
    ClipboardCopy,
    Filter,
    Eye,
    RotateCcw,
    BookOpen,
    Trophy,
    Dices,
    Backpack,
    Languages,
    Moon,
    SunMedium,
    AlignJustify,
    CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import {
    FOUNDATION_LIBRARY_STATS,
    FOUNDATION_TEMPLATES,
    KIND_META,
    buildBundleDocument,
    buildStandaloneDocument,
    estimatePageCount,
    filterFoundationTemplates,
    getFoundationTemplate,
    themeFor,
    type FoundationGrade,
    type FoundationTemplate,
    type LabelLanguage,
    type TemplateFieldValues,
    type TemplateKind,
} from '../lib/templates/foundation';
import { LEARNING_AREAS, LABEL_LANGUAGES, FOUNDATION_GRADES } from '../lib/templates/foundation/caps';
import { artSrc } from '../lib/templates/foundation/art';
import { notify } from '../lib/nativeExport';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const KIND_SHORT: Record<TemplateKind | 'all', string> = {
    all: 'All',
    award: 'Awards',
    worksheet: 'Worksheets',
    classroom: 'Classroom',
    homework: 'Homework',
};

const KIND_ICONS: Record<TemplateKind, any> = {
    award: Trophy,
    worksheet: BookOpen,
    classroom: Dices,
    homework: Backpack,
};

const BLANKS: TemplateFieldValues = {
    learner: '',
    class: '',
    school: '',
    teacher: '',
    principal: '',
    date: '',
    term: '',
    marks: '',
    awardReason: '',
    message: '',
};

/** Read the school branding the Settings page already stores, to pre-fill sheets. */
const readSchoolDefaults = (): Partial<TemplateFieldValues> => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem('eduai_school_branding');
        const parsed = raw ? JSON.parse(raw) : {};
        const today = new Date().toLocaleDateString('en-ZA');
        const month = new Date().getMonth();
        const term = month <= 2 ? 1 : month <= 5 ? 2 : month <= 9 ? 3 : 4;
        return {
            school: parsed.name || parsed.school || '',
            principal: parsed.principal || '',
            teacher: parsed.teacher || '',
            date: today,
            term: `Term ${term} · Week ___`,
        };
    } catch {
        return {};
    }
};

/**
 * Fetch the PNG art and inline it as data URIs so a downloaded .html file is a
 * single portable artefact (classroom printers, USB sticks, WhatsApp drafts).
 * Images are cached per session, so bundling 20 sheets costs one image set.
 */
const dataUriCache = new Map<string, string>();
const inlineArtAsDataUris = async (html: string): Promise<string> => {
    const urls = Array.from(new Set(Array.from(html.matchAll(/src="(\/illustrations\/[^"]+)"/g)).map((m) => m[1])));
    let out = html;
    for (const url of urls) {
        try {
            let dataUri = dataUriCache.get(url);
            if (!dataUri) {
                const res = await fetch(url);
                if (!res.ok) continue;
                const blob = await res.blob();
                dataUri = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                dataUriCache.set(url, dataUri);
            }
            out = out.split(`"${url}"`).join(`"${dataUri}"`);
        } catch {
            /* keep the URL — the pack still renders online */
        }
    }
    return out;
};

const downloadHtml = (filename: string, html: string) => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
};

interface StudioProps {
    isDarkMode?: boolean;
    teacherName?: string;
    onBack?: () => void;
    /** Opened from the Foundation Hub / Helpdesk deep link. */
    initialKind?: TemplateKind | 'all';
    initialGrade?: FoundationGrade | 'all';
}

export default function FoundationPhaseTemplateStudio({
    isDarkMode = true,
    teacherName,
    onBack,
    initialKind = 'all',
    initialGrade = 'all',
}: StudioProps) {
    const [kind, setKind] = useState<TemplateKind | 'all'>(initialKind);
    const [grade, setGrade] = useState<FoundationGrade | 'all'>(initialGrade);
    const [learningArea, setLearningArea] = useState<string>('all');
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string>(FOUNDATION_TEMPLATES[0].id);
    const [fields, setFields] = useState<TemplateFieldValues>(() => ({ ...BLANKS, ...readSchoolDefaults(), teacher: teacherName || '' }));
    const [bilingual, setBilingual] = useState(true);
    const [labelLanguage, setLabelLanguage] = useState<LabelLanguage>('xh');
    const [largePrint, setLargePrint] = useState(false);
    const [inkSaver, setInkSaver] = useState(false);
    const [showMemo, setShowMemo] = useState(true);
    const [showFields, setShowFields] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const previewRef = useRef<HTMLIFrameElement>(null);

    const templates = useMemo(
        () =>
            filterFoundationTemplates({
                kind,
                grade,
                learningArea: learningArea as any,
                query,
            }),
        [kind, grade, learningArea, query],
    );

    const selected: FoundationTemplate = useMemo(
        () => getFoundationTemplate(selectedId) ?? templates[0] ?? FOUNDATION_TEMPLATES[0],
        [selectedId, templates],
    );

    // Keep the preview selection inside the filtered list when filters change.
    useEffect(() => {
        if (templates.length && !templates.some((t) => t.id === selectedId)) setSelectedId(templates[0].id);
    }, [templates, selectedId]);

    const renderOptions = useMemo(
        () => ({
            assetMode: 'app' as const,
            bilingual,
            labelLanguage: bilingual ? labelLanguage : ('en' as LabelLanguage),
            largePrint,
            inkSaver,
            showMemo,
            fields,
            brand: 'EduAI Companion · CAPS Compliant Foundation Phase Resource',
        }),
        [bilingual, labelLanguage, largePrint, inkSaver, showMemo, fields],
    );

    const previewDoc = useMemo(() => buildStandaloneDocument(selected, renderOptions), [selected, renderOptions]);

    const printPreview = useCallback(() => {
        const frame = previewRef.current;
        const win = frame?.contentWindow;
        if (!win) return;
        try {
            win.focus();
            win.print();
        } catch {
            // Android WebView / sandboxed context: fall back to a print window.
            const w = window.open('', '_blank');
            if (!w) {
                notify('Printing was blocked — open the sheet from the download button instead.', 'error');
                return;
            }
            w.document.write(previewDoc);
            w.document.close();
            setTimeout(() => {
                w.focus();
                w.print();
            }, 400);
        }
    }, [previewDoc]);

    const downloadOne = useCallback(async () => {
        setIsBusy(true);
        try {
            const html = await inlineArtAsDataUris(buildStandaloneDocument(selected, renderOptions));
            downloadHtml(`${selected.id}.html`, html);
            notify(`${selected.title} downloaded with the cartoon art embedded.`, 'success');
        } catch (e) {
            console.error(e);
            notify('Download failed — try the Print / Save as PDF button instead.', 'error');
        } finally {
            setIsBusy(false);
        }
    }, [selected, renderOptions]);

    const downloadSelection = useCallback(async () => {
        setIsBusy(true);
        try {
            const list = templates.length ? templates : FOUNDATION_TEMPLATES;
            let html = buildBundleDocument(
                list,
                renderOptions,
                'EduAI Companion — CAPS Foundation Phase selection',
            );
            // Embedding art for a 20-sheet bundle is heavy; keep it lean and
            // only inline when the selection is small enough to stay portable.
            if (list.length <= 6) html = await inlineArtAsDataUris(html);
            else html = html.split('src="/illustrations/').join('src="../../illustrations/');
            downloadHtml('eduai-foundation-templates-selection.html', html);
            notify(`${list.length} templates bundled for printing.`, 'success');
        } catch (e) {
            console.error(e);
            notify('Could not bundle that selection.', 'error');
        } finally {
            setIsBusy(false);
        }
    }, [templates, renderOptions]);

    const copyHtml = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(buildStandaloneDocument(selected, renderOptions));
            notify('Template HTML copied — paste it into any editor or LMS.', 'success');
        } catch {
            notify('Your browser blocked clipboard access.', 'error');
        }
    }, [selected, renderOptions]);

    const resetFields = () => setFields({ ...BLANKS, ...readSchoolDefaults(), teacher: teacherName || '' });

    const theme = themeFor(selected.theme);
    const cards = (
        <>
            <FilterBar />
            <GalleryList />
        </>
    );

    function FilterBar() {
        return (
            <div className={cn('rounded-[26px] p-3 md:p-4', isDarkMode ? 'glass' : 'bg-white border border-slate-200 shadow-sm')}>
                <div className="flex flex-wrap items-center gap-2">
                    {(['all', 'award', 'worksheet', 'classroom', 'homework'] as const).map((k) => {
                        const Icon = k === 'all' ? Sparkles : KIND_ICONS[k];
                        const active = kind === k;
                        const color = k === 'all' ? '#06b6d4' : KIND_META[k].color;
                        return (
                            <button
                                key={k}
                                onClick={() => setKind(k)}
                                className={cn(
                                    'flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-extrabold uppercase tracking-wider transition-all duration-200',
                                    active ? 'text-slate-900 shadow-md scale-[1.03]' : isDarkMode ? 'text-slate-300 bg-white/5 hover:bg-white/10' : 'text-slate-600 bg-slate-100 hover:bg-slate-200',
                                )}
                                style={active ? { background: color } : undefined}
                            >
                                <Icon size={14} />
                                {k === 'all' ? `All ${FOUNDATION_LIBRARY_STATS.total}` : KIND_META[k].label.split(' ')[0]}
                            </button>
                        );
                    })}
                    <div className="ml-auto flex items-center gap-2">
                        <div className={cn('flex items-center gap-1 rounded-full px-2 py-1', isDarkMode ? 'bg-white/5' : 'bg-slate-100')}>
                            <Search size={14} className="text-slate-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search CAPS topic, skill, tag…"
                                className={cn('w-40 md:w-56 bg-transparent text-[13px] font-semibold outline-none', isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-700')}
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="text-slate-400 hover:text-rose-500">
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-cyan-500">Grade</span>
                    {(['all', ...FOUNDATION_GRADES] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => setGrade(g as any)}
                            className={cn(
                                'h-8 min-w-8 rounded-xl px-2.5 text-[12px] font-extrabold transition-all',
                                grade === g ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md' : isDarkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                            )}
                        >
                            {g === 'all' ? 'R–3' : g === 'R' ? 'R' : `G${g}`}
                        </button>
                    ))}
                    <select
                        value={learningArea}
                        onChange={(e) => setLearningArea(e.target.value)}
                        className={cn(
                            'h-8 rounded-xl px-2 text-[12px] font-bold outline-none',
                            isDarkMode ? 'bg-slate-900/60 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-700 border border-slate-200',
                        )}
                    >
                        <option value="all">All learning areas</option>
                        {LEARNING_AREAS.filter((a) => a !== 'General').map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                        <option value="General">General / whole school</option>
                    </select>
                    <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        <ToggleChip on={bilingual} onClick={() => setBilingual((v) => !v)} icon={Languages} label="Bilingual labels" />
                        {bilingual && (
                            <select
                                value={labelLanguage}
                                onChange={(e) => setLabelLanguage(e.target.value as LabelLanguage)}
                                className={cn('h-7 rounded-lg px-1.5 text-[11px] font-bold', isDarkMode ? 'bg-slate-900/60 text-slate-200 border border-white/10' : 'bg-slate-50 text-slate-700 border border-slate-200')}
                            >
                                {LABEL_LANGUAGES.filter((l) => l.id !== 'en').map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <ToggleChip on={showMemo} onClick={() => setShowMemo((v) => !v)} icon={CheckCircle2} label="Print memo" />
                        <ToggleChip on={largePrint} onClick={() => setLargePrint((v) => !v)} icon={AlignJustify} label="Large print" />
                        <ToggleChip on={inkSaver} onClick={() => setInkSaver((v) => !v)} icon={inkSaver ? Moon : SunMedium} label="Ink saver" />
                    </div>
                </div>
            </div>
        );
    }

    function ToggleChip({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: any; label: string }) {
        return (
            <button
                onClick={onClick}
                className={cn(
                    'flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-extrabold transition-all',
                    on ? 'bg-emerald-400 text-emerald-950 shadow' : isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
                title={label}
            >
                <Icon size={12} />
                {label}
            </button>
        );
    }

    function GalleryList() {
        return (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <AnimatePresence mode="popLayout">
                    {templates.map((tpl) => {
                        const t = themeFor(tpl.theme);
                        const active = tpl.id === selected.id;
                        const Icon = KIND_ICONS[tpl.kind];
                        return (
                            <motion.button
                                layout
                                key={tpl.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                onClick={() => setSelectedId(tpl.id)}
                                className={cn(
                                    'group relative overflow-hidden rounded-[22px] border-2 p-3 text-left transition-all duration-200 kid-shadow',
                                    active ? 'scale-[1.01] shadow-xl' : isDarkMode ? 'border-white/10 bg-white/[.04] hover:border-white/25' : 'border-slate-200 bg-white hover:border-slate-300',
                                )}
                                style={active ? { borderColor: t.primary, background: `${t.soft}` } : undefined}
                            >
                                <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: t.band }} />
                                <div className="flex items-start gap-2.5 pl-2">
                                    {tpl.art ? (
                                        <img
                                            src={artSrc(tpl.art, 'app')}
                                            alt=""
                                            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-white/70"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: t.primary }}>
                                            <Icon size={20} />
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-[.14em]" style={{ color: t.band }}>
                                            <span>{KIND_META[tpl.kind].emoji}</span>
                                            {tpl.learningArea}
                                        </p>
                                        <h4 className={cn('truncate text-[14px] font-extrabold leading-tight', isDarkMode ? 'text-white' : 'text-slate-900')}>{tpl.title}</h4>
                                        <p className={cn('mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{tpl.blurb}</p>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {tpl.grades.map((g) => (
                                                <span key={g} className={cn('rounded-md px-1.5 py-0.5 text-[9.5px] font-black', isDarkMode ? 'bg-cyan-400/20 text-cyan-300' : 'bg-cyan-500/15 text-cyan-700')}>
                                                    Gr {g}
                                                </span>
                                            ))}
                                            <span className={cn('rounded-md px-1.5 py-0.5 text-[9.5px] font-black', pageOf(tpl) > 1 ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-400/20 text-amber-600')}>
          ≈{pageOf(tpl)} × A4 · {tpl.caps.timeOnTask}
        </span>
                                            {typeof tpl.caps.marks === 'number' && (
                                                <span className="rounded-md bg-fuchsia-500/15 px-1.5 py-0.5 text-[9.5px] font-black text-fuchsia-600">{tpl.caps.marks} marks</span>
                                            )}
                                            {(tpl.caps.memo?.length ?? 0) > 0 && (
                                                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-black text-emerald-600">memo</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
                {!templates.length && (
                    <div className={cn('col-span-full rounded-[22px] border-2 border-dashed p-8 text-center', isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
                        <Filter size={22} className="mx-auto mb-2 opacity-60" />
                        <p className="text-sm font-bold">No template matches that filter yet.</p>
                        <p className="text-xs">Try a different learning area, or clear the search box.</p>
                    </div>
                )}
            </div>
        );
    }

    const fieldRows = (selected.fields ?? []).slice();
    const pageOf = (tpl: FoundationTemplate) =>
        estimatePageCount(tpl, { includeMemo: showMemo && !tpl.options?.hideMemo });

    return (
        <div className="space-y-4">
            {/* Hero strip */}
            <div className="relative overflow-hidden rounded-[30px] border-2 border-white/10 bg-gradient-to-br from-cyan-400 via-sky-500 to-fuchsia-500 p-5 text-white shadow-[0_18px_50px_-12px_rgba(6,182,212,.55)]">
                <img src={artSrc('elly-trophy', 'app')} alt="" className="pointer-events-none absolute -right-3 -top-4 h-36 w-36 rounded-3xl object-cover opacity-90 shadow-2xl" />
                <div className="relative max-w-3xl">
                    <p className="text-[11px] font-black uppercase tracking-[.28em] text-white/80">EduAI Companion · Foundation Hub</p>
                    <h2 className="font-display text-2xl leading-tight md:text-[30px]">CAPS Template Studio — Grade R–3</h2>
                    <p className="mt-1 text-[13px] font-semibold text-white/90 md:text-sm">
                        {FOUNDATION_LIBRARY_STATS.total} ready-to-print documents: 🏆 {FOUNDATION_LIBRARY_STATS.awards} awards for good academic achievement · ✏️ {FOUNDATION_LIBRARY_STATS.worksheets} worksheets · 🎲 {FOUNDATION_LIBRARY_STATS.classroom} classroom exercises · 🎒 {FOUNDATION_LIBRARY_STATS.homework} homework. Bright, cartoon-styled, and each one carries its CAPS content area, ATP placement, marks and memo.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-black">
                        <span className="rounded-full bg-white/20 px-2.5 py-1">A4 · colour print</span>
                        <span className="rounded-full bg-white/20 px-2.5 py-1">{FOUNDATION_LIBRARY_STATS.withMemo} with memoranda</span>
                        <span className="rounded-full bg-white/20 px-2.5 py-1">Bilingual labels</span>
                        <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-amber-900">No AI call needed — works offline</span>
                        <button onClick={downloadSelection} disabled={isBusy} className="ml-auto rounded-full bg-white px-3 py-1 text-[11px] font-black text-cyan-700 shadow hover:bg-yellow-300 hover:text-amber-900 disabled:opacity-60">
                            {isBusy ? 'Bundling…' : ` Print-pack this selection (${templates.length})`}
                        </button>
                        <button onClick={() => setShowHelp((v) => !v)} className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black hover:bg-white/30">
                            {showHelp ? 'Hide how-to' : 'How to use →'}
                        </button>
                        {onBack && (
                            <button onClick={onBack} className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black hover:bg-white/30">
                                ← Back
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {showHelp && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className={cn('grid gap-2 rounded-[24px] border p-3 text-[12px] font-semibold md:grid-cols-2', isDarkMode ? 'border-white/10 bg-white/[.04] text-slate-300' : 'border-slate-200 bg-white text-slate-600')}>
                            {[
                                ['1 · Pick a sheet', 'Filter by family (award / worksheet / classroom / homework), grade and learning area. The gallery shows time on task, marks and whether a memo is included.'],
                                ['2 · Fill in the names', 'Type the learner, class, school, date and marks in the Fill-in panel — it prints straight onto the sheet, including certificate signature lines.'],
                                ['3 · Adapt the print', 'Bilingual labels (isiXhosa / isiZulu / Afrikaans), Large print for Grade R and dyslexia-friendly reading, and Ink saver for black-and-white photocopiers.'],
                                ['4 · Print or export', 'Print / Save as PDF prints only the A4 sheet. Download embeds the cartoon art into one portable HTML file; the pack folder in public/templates/foundation-phase needs no app at all.'],
                                ['Award etiquette', 'Name the behaviour you are praising on the reason line, read the citation aloud, and file a photo of the signed award in the portfolio of evidence.'],
                                ['Marking', 'Every marked sheet prints its own memo with mark allocations. Turn Print memo off when you photocopy a class set for a formal task.'],
                            ].map(([t, b]) => (
                                <div key={t as string}>
                                    <p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-500">{t as string}</p>
                                    <p className="mt-0.5 leading-snug">{b as string}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(300px,380px)_1fr]">
                <div className="space-y-3">{cards}</div>

                {/* Preview + controls */}
                <div className={cn('rounded-[28px] p-3 md:p-4', isDarkMode ? 'glass' : 'bg-white border border-slate-200 shadow-sm')}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: theme.band }}>
                                {KIND_META[selected.kind].emoji} {KIND_META[selected.kind].label}
                            </p>
                            <h3 className={cn('truncate font-display text-lg leading-tight', isDarkMode ? 'text-white' : 'text-slate-900')}>{selected.title}</h3>
                            <p className={cn('truncate text-[11.5px] font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>{selected.subtitle}</p>
                        </div>
                        <button onClick={printPreview} className="flex items-center gap-1.5 rounded-full bg-cyan-500 px-3.5 py-2 text-[12px] font-black text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400">
                            <Printer size={14} /> Print / Save as PDF
                        </button>
                        <button onClick={downloadOne} disabled={isBusy} className="flex items-center gap-1.5 rounded-full bg-fuchsia-500 px-3 py-2 text-[12px] font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:bg-fuchsia-400 disabled:opacity-60">
                            <Download size={14} /> {isBusy ? '…' : 'Download'}
                        </button>
                        <button onClick={copyHtml} className={cn('flex h-9 w-9 items-center justify-center rounded-full transition', isDarkMode ? 'bg-white/5 text-slate-300 hover:bg-white/15' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')} title="Copy template HTML">
                            <ClipboardCopy size={14} />
                        </button>
                        <button onClick={() => setShowFields((v) => !v)} className={cn('flex h-9 w-9 items-center justify-center rounded-full transition', showFields ? 'bg-yellow-300 text-amber-900' : isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600')} title="Fill in names, dates and marks">
                            <Eye size={14} />
                        </button>
                    </div>

                    <AnimatePresence initial={false}>
                        {showFields && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className={cn('mb-3 rounded-[20px] border p-3', isDarkMode ? 'border-white/10 bg-slate-950/40' : 'border-slate-200 bg-slate-50')}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-500">Fill in — prints straight onto the sheet</p>
                                        <button onClick={resetFields} className="flex items-center gap-1 text-[10.5px] font-bold text-slate-400 hover:text-rose-500">
                                            <RotateCcw size={11} /> Reset
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                                        {fieldRows.map((spec) => (
                                            <label key={spec.key} className="block">
                                                <span className={cn('mb-0.5 block text-[10px] font-extrabold uppercase tracking-wider', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                                                    {spec.label}
                                                    {spec.labelXi && bilingual && <em className="ml-1 font-black not-italic text-fuchsia-500">· {spec.labelXi}</em>}
                                                </span>
                                                {spec.multiline ? (
                                                    <textarea
                                                        rows={2}
                                                        value={(fields as any)[spec.key] ?? ''}
                                                        placeholder={spec.placeholder}
                                                        onChange={(e) => setFields((f) => ({ ...f, [spec.key]: e.target.value }))}
                                                        className={cn('w-full rounded-xl border px-2 py-1.5 text-[12px] font-semibold outline-none focus:border-cyan-400', isDarkMode ? 'border-white/10 bg-slate-900/60 text-slate-100 placeholder:text-slate-600' : 'border-slate-200 bg-white text-slate-700')}
                                                    />
                                                ) : (
                                                    <input
                                                        value={(fields as any)[spec.key] ?? ''}
                                                        placeholder={spec.placeholder}
                                                        onChange={(e) => setFields((f) => ({ ...f, [spec.key]: e.target.value }))}
                                                        className={cn('w-full rounded-xl border px-2 py-1.5 text-[12px] font-semibold outline-none focus:border-cyan-400', isDarkMode ? 'border-white/10 bg-slate-900/60 text-slate-100 placeholder:text-slate-600' : 'border-slate-200 bg-white text-slate-700')}
                                                    />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={cn('overflow-hidden rounded-[20px] border-2', isDarkMode ? 'border-white/10 bg-slate-950/40' : 'border-slate-200 bg-slate-100')}>
                        <iframe
                            ref={previewRef}
                            title={`Preview — ${selected.title}`}
                            srcDoc={previewDoc}
                            className="h-[70vh] w-full border-0 bg-white"
                        />
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <InfoPill title="CAPS content area" body={selected.caps.contentArea} color={theme.primary} />
                        <InfoPill title="ATP placement" body={selected.caps.terms.join(' · ')} color={theme.band} />
                        <InfoPill title="Working time / marks" body={`${selected.caps.timeOnTask}${selected.caps.marks ? ` · ${selected.caps.marks} marks` : ''}`} color="#9b59b6" />
                        <InfoPill title="Skills practised" body={selected.caps.skills.join(' · ')} color="#2ed573" />
                        <InfoPill title="Bloom's levels" body={selected.caps.blooms.join(' → ')} color="#ff8a3d" />
                        <InfoPill title="Why this is CAPS-compliant" body={selected.caps.capsNote} color="#06b6d4" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoPill({ title, body, color }: { title: string; body: string; color: string }) {
    return (
        <div className="rounded-[18px] border-l-4 bg-white/5 p-2.5" style={{ borderColor: color }}>
            <p className="text-[9.5px] font-black uppercase tracking-[.16em]" style={{ color }}>
                {title}
            </p>
            <p className="mt-0.5 text-[11.5px] font-semibold leading-snug text-slate-600">{body}</p>
        </div>
    );
}
