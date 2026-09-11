/**
 * Bilingual classroom label dictionary.
 *
 * Foundation Phase classrooms in the Western Cape (and across SA) are
 * multilingual, so every printed instruction label in the template library can
 * be paired with a short functional label in isiXhosa, isiZulu or Afrikaans.
 *
 * Deliberately a *label* dictionary, not a translation engine: only the short,
 * high-frequency classroom words (Read, Write, Count, Match, Colour …) plus the
 * name/date/marks fields are supplied, so nothing is machine-mistranslated into
 * a full sentence. Schools adapt freely — the values live in one place.
 */

import type { LabelLanguage } from './types';

export type LabelKey =
    | 'name'
    | 'surname'
    | 'date'
    | 'marks'
    | 'score'
    | 'class'
    | 'school'
    | 'teacher'
    | 'principal'
    | 'term'
    | 'week'
    | 'subject'
    | 'topic'
    | 'read'
    | 'write'
    | 'count'
    | 'listen'
    | 'speak'
    | 'look'
    | 'match'
    | 'colour'
    | 'draw'
    | 'add'
    | 'subtract'
    | 'circle'
    | 'tick'
    | 'cross'
    | 'cut'
    | 'paste'
    | 'complete'
    | 'answer'
    | 'sort'
    | 'talk'
    | 'trace'
    | 'order'
    | 'compare'
    | 'homework'
    | 'classwork'
    | 'assessment'
    | 'award'
    | 'certificate'
    | 'congratulations'
    | 'wellDone'
    | 'keepItUp'
    | 'answerKey'
    | 'parentNote'
    | 'teacherNote'
    | 'group'
    | 'pairs'
    | 'individually'
    | 'time'
    | 'total'
    | 'level'
    | 'progress'
    | 'effort'
    | 'bravo'
    | 'signHere'
    | 'minutes'
    | 'readingLog'
    | 'haveFun';

type LabelSet = Record<LabelKey, string>;

const EN: LabelSet = {
    name: 'Name',
    surname: 'Surname',
    date: 'Date',
    marks: 'Marks',
    score: 'Score',
    class: 'Class',
    school: 'School',
    teacher: 'Teacher',
    principal: 'Principal',
    term: 'Term',
    week: 'Week',
    subject: 'Subject',
    topic: 'Topic',
    read: 'Read',
    write: 'Write',
    count: 'Count',
    listen: 'Listen',
    speak: 'Speak',
    look: 'Look',
    match: 'Match',
    colour: 'Colour',
    draw: 'Draw',
    add: 'Add',
    subtract: 'Subtract',
    circle: 'Circle',
    tick: 'Tick',
    cross: 'Cross out',
    cut: 'Cut',
    paste: 'Paste',
    complete: 'Complete',
    answer: 'Answer',
    sort: 'Sort',
    talk: 'Talk',
    trace: 'Trace',
    order: 'Put in order',
    compare: 'Compare',
    homework: 'Homework',
    classwork: 'Classwork',
    assessment: 'Assessment',
    award: 'Award',
    certificate: 'Certificate',
    congratulations: 'Congratulations!',
    wellDone: 'Well done!',
    keepItUp: 'Keep it up!',
    answerKey: 'Answer key (memo)',
    parentNote: 'Note to parents / caregivers',
    teacherNote: 'Teacher notes',
    group: 'Group work',
    pairs: 'Pair work',
    individually: 'On your own',
    time: 'Time',
    total: 'Total',
    level: 'Level',
    progress: 'Progress',
    effort: 'Effort',
    bravo: 'Bravo!',
    signHere: 'Sign here',
    minutes: 'minutes',
    readingLog: 'Reading log',
    haveFun: 'Have fun!',
};

/** isiXhosa — short functional classroom labels. */
const XH: LabelSet = {
    name: 'Igama',
    surname: 'Ifani',
    date: 'Umhla',
    marks: 'Amanqaku',
    score: 'Amanqaku',
    class: 'Iklasi',
    school: 'Isikolo',
    teacher: 'Utitshala',
    principal: 'Umphathi wesikolo',
    term: 'Ithemu',
    week: 'Iveki',
    subject: 'Isifundo',
    topic: 'Umxholo',
    read: 'Funda',
    write: 'Bhala',
    count: 'Bala',
    listen: 'Phulaphula',
    speak: 'Thetha',
    look: 'Khangela',
    match: 'Xhumanisa',
    colour: 'Penda',
    draw: 'Zoba',
    add: 'Dibanisa',
    subtract: 'Thabatha',
    circle: 'Jikelezisa',
    tick: 'Faka uphawu',
    cross: 'Nqamla',
    cut: 'Sika',
    paste: 'Namathisela',
    complete: 'Gqibezela',
    answer: 'Phendula',
    sort: 'Hlela',
    talk: 'Nxibelelana',
    trace: 'Landela emgceni',
    order: 'Beka ngolandelelano',
    compare: 'Thelekisa',
    homework: 'Umsebenzi wasekhaya',
    classwork: 'Umsebenzi weklasi',
    assessment: 'Uvavanyo',
    award: 'Ubhaso',
    certificate: 'Isatifiketi',
    congratulations: 'Umbuliso!',
    wellDone: 'Wenze kakuhle!',
    keepItUp: 'Qhubeka kakuhle!',
    answerKey: 'Iimpendulo',
    parentNote: 'Umyalezo kubazali',
    teacherNote: 'Qaphela kutitshala',
    group: 'Iqela',
    pairs: 'Ngababini',
    individually: 'Wedwa',
    time: 'Ixesha',
    total: 'Zizonke zonke',
    level: 'Umgangatho',
    progress: 'Inkqubela',
    effort: 'Umzamo',
    bravo: 'Bravo!',
    signHere: 'Sayina apha',
    minutes: 'imizuzu',
    readingLog: 'Ilogi yokufunda',
    haveFun: 'Zonwabele!',
};

/** isiZulu — short functional classroom labels. */
const ZU: LabelSet = {
    name: 'Igama',
    surname: 'Isibongo',
    date: 'Usuku',
    marks: 'Amamaki',
    score: 'Amamaki',
    class: 'Iklasi',
    school: 'Isikole',
    teacher: 'Uthisha',
    principal: 'Umqondisi',
    term: 'Ithemu',
    week: 'Iviki',
    subject: 'Isifundo',
    topic: 'Isihloko',
    read: 'Funda',
    write: 'Bhala',
    count: 'Bala',
    listen: 'Lalela',
    speak: 'Khuluma',
    look: 'Bheka',
    match: 'Xhumanisa',
    colour: 'Penda',
    draw: 'Dweba',
    add: 'Hlanganisa',
    subtract: 'Susa',
    circle: 'Zungeza',
    tick: 'Maka',
    cross: 'Nqamula',
    cut: 'Gxivita',
    paste: 'Namathisela',
    complete: 'Qedela',
    answer: 'Phendula',
    sort: 'Hlela',
    talk: 'Xoxa',
    trace: 'Landela emugqeni',
    order: 'Hlela ngokulandelana',
    compare: 'Qhathanisa',
    homework: 'Umsebenzi wasekhaya',
    classwork: 'Umsebenzi weklasi',
    assessment: 'Ukuhlola',
    award: 'Umklomelo',
    certificate: 'Isitifiketi',
    congratulations: 'Halala!',
    wellDone: 'Wenze kahle!',
    keepItUp: 'Qhubeka kahle!',
    answerKey: 'Izimpendulo',
    parentNote: 'Umlayezo kubazali',
    teacherNote: 'Qaphela kuthisha',
    group: 'Iqembu',
    pairs: 'Ababili',
    individually: 'Wedwa',
    time: 'Isikhathi',
    total: 'Sewulilonke',
    level: 'Izinga',
    progress: 'Inqubekelaphambili',
    effort: 'Umzamo',
    bravo: 'Bravo!',
    signHere: 'Sayina lapha',
    minutes: 'imizuzu',
    readingLog: 'Ilogi yokufunda',
    haveFun: 'Zijabulise!',
};

/** Afrikaans — short functional classroom labels. */
const AF: LabelSet = {
    name: 'Naam',
    surname: 'Van',
    date: 'Datum',
    marks: 'Punte',
    score: 'Telling',
    class: 'Klas',
    school: 'Skool',
    teacher: 'Onderwyser',
    principal: 'Prinsipaol',
    term: 'Termyn',
    week: 'Week',
    subject: 'Vak',
    topic: 'Onderwerp',
    read: 'Lees',
    write: 'Skryf',
    count: 'Tel',
    listen: 'Luister',
    speak: 'Praat',
    look: 'Kyk',
    match: 'Koppel',
    colour: 'Kleur',
    draw: 'Teken',
    add: 'Optel',
    subtract: 'Aftrek',
    circle: 'Omring',
    tick: 'Hakie',
    cross: 'Kruis uit',
    cut: 'Sny',
    paste: 'Gly',
    complete: 'Voltooi',
    answer: 'Beantwoord',
    sort: 'Sorteer',
    talk: 'Gesels',
    trace: 'Volg die lyn',
    order: 'Sit in volgorde',
    compare: 'Vergelyk',
    homework: 'Huistakings',
    classwork: 'Klaswerk',
    assessment: 'Assessering',
    award: 'Toekenning',
    certificate: 'Sertifikaat',
    congratulations: 'Baie geluk!',
    wellDone: 'Goed gedoen!',
    keepItUp: 'Hou vol!',
    answerKey: 'Antwoorde (memo)',
    parentNote: 'Nota vir ouers',
    teacherNote: 'Onderwyser se notas',
    group: 'Groepswerk',
    pairs: 'Paarwerk',
    individually: 'Alleen',
    time: 'Tyd',
    total: 'Totaal',
    level: 'Vlak',
    progress: 'Vordering',
    effort: 'Inspanning',
    bravo: 'Bravo!',
    signHere: 'Teken hier',
    minutes: 'minute',
    readingLog: 'Leesdaeboek',
    haveFun: 'Kry pret!',
};

const SETS: Record<LabelLanguage, LabelSet> = { en: EN, xh: XH, zu: ZU, af: AF };

export const label = (key: LabelKey, lang: LabelLanguage = 'en'): string => SETS[lang]?.[key] ?? EN[key];

/**
 * Bilingual pair as printed on a document: `Read · Funda`.
 * Returns the English word alone when bilingual mode is off or English is picked.
 */
export const pair = (key: LabelKey, lang: LabelLanguage, bilingual = true): string =>
    !bilingual || lang === 'en' ? EN[key] : `${EN[key]} · ${SETS[lang][key]}`;

/** Chip list used by the Studio and the standalone index header. */
export const bilingualChip = (key: LabelKey, lang: LabelLanguage): string => pair(key, lang, lang !== 'en');

export const LABEL_KEYS = Object.keys(EN) as LabelKey[];
