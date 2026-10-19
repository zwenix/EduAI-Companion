/**
 * Learner fill-in contract — Name / Grade / Date.
 *
 * On every document a LEARNER writes on, the spaces where the learner completes
 * their name, grade and date must be EMPTY:
 *
 *   1. BLANK   — the canonical row carries three empty rules and nothing else.
 *   2. STRIPPED — a value the model invented ("Name: Thabo", "Date: 15/03/2026",
 *                 "Grade: 5") is blanked out before the document is rendered.
 *   3. ONCE    — exactly one fill-in row per document: a model-written
 *                 duplicate is dropped and re-wrapping never stacks a second.
 *   4. SCOPED  — teacher-facing documents (lesson plans, memos, rubrics, admin
 *                 notices, posters) keep their real metadata and get no row.
 *
 * The banner still prints the REAL grade pill for the teacher's reference, and a
 * learner name a teacher typed in the Document Banner Identity panel still wins.
 */
import { describe, expect, it } from 'vitest';
import {
  buildTemplateComplianceBannerHTML,
  metaFromPrintOptions,
  wrapWithTemplate,
} from '../src/lib/contentTemplate';
import {
  FILL_IN_BLANK,
  LEARNER_FILL_IN_CLASS,
  LEARNER_FILL_IN_ROW_HTML,
  blankLearnerFillInValues,
  hasLearnerFillInRow,
  isLearnerFillInContentType,
  stripLearnerFillInRows,
} from '../src/lib/learnerFillIn';
import { ADMIN_TYPES, TEACHING_CATEGORIES, VISUAL_TYPES } from '../src/lib/contentTypes';

/** Visible text of a fragment (tags and entities removed). */
const text = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const countOccurrences = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

const worksheetMeta = {
  title: 'Fractions',
  subject: 'Mathematics',
  grade: '5',
  term: 'Term 3',
  contentType: 'Worksheet',
};

describe('isLearnerFillInContentType — which documents a learner writes on', () => {
  it('is true for worksheets, classroom tasks and activities', () => {
    ['Worksheet', 'Homework Task', 'Classroom Exercise', 'Group Activity',
     'Reading Comprehension', 'Writing Task', 'Research Task', 'Learning Activity']
      .forEach((type) => expect(isLearnerFillInContentType(type), type).toBe(true));
  });

  it('is true for assessments — a test paper always carries a Name/Grade/Date block', () => {
    ['Controlled Test', 'Examination', 'Formal Assessment Task (FAT)',
     'Investigation', 'Practical Task / Experiment', 'Diagnostic Assessment']
      .forEach((type) => expect(isLearnerFillInContentType(type), type).toBe(true));
  });

  it('is true for Foundation Phase packs and learner-handled Visual Lab sheets', () => {
    ['Foundation Phase Activity', 'Interactive Foundation Learning Pack',
     'Cut-out Activity Cards', 'Matching Cards']
      .forEach((type) => expect(isLearnerFillInContentType(type), type).toBe(true));
  });

  it('is FALSE for teacher-facing documents', () => {
    ['Lesson Plan', 'Daily Lesson Notes', 'Weekly Lesson Plan', 'Unit Plan',
     'Study Guide / Learning Notes', 'Revision Pack',
     'Marking Memo', 'Assessment Rubric', 'Analytical Rubric', 'Holistic Rubric',
     'Checklist / Self-Assessment', 'Memorandum Key']
      .forEach((type) => expect(isLearnerFillInContentType(type), type).toBe(false));
  });

  it('is FALSE for admin notices, letters and classroom displays', () => {
    ['Letter to Parents', 'General Notice to Parents', 'Permission Slip',
     'General School Notice', 'Timetable Template', 'Attendance Register',
     'Educational Poster', 'Word Wall', 'Alphabet Chart', 'Certificate Template',
     'Mind Map / Concept Map', 'Infographic']
      .forEach((type) => expect(isLearnerFillInContentType(type), type).toBe(false));
  });

  it('catches free-form worksheet/test types but never a teacher document', () => {
    expect(isLearnerFillInContentType('Worksheet - Fractions')).toBe(true);
    expect(isLearnerFillInContentType('Practical Investigation')).toBe(true);
    expect(isLearnerFillInContentType('Grade 5 Homework')).toBe(true);
    expect(isLearnerFillInContentType('Lesson Plan - Fractions')).toBe(false);
    expect(isLearnerFillInContentType('Marking Memo')).toBe(false);
    expect(isLearnerFillInContentType('')).toBe(false);
    expect(isLearnerFillInContentType(undefined)).toBe(false);
  });

  it('classifies the whole published taxonomy without throwing', () => {
    const all = [
      ...Object.values(TEACHING_CATEGORIES).flat(),
      ...Object.values(VISUAL_TYPES).flat(),
      ...Object.values(ADMIN_TYPES).flat(),
    ];
    expect(all.length).toBeGreaterThan(40);
    all.forEach((type) => expect(typeof isLearnerFillInContentType(type)).toBe('boolean'));
  });
});

describe('BLANK — the canonical row is empty', () => {
  it('carries the three labels and no value at all', () => {
    expect(text(LEARNER_FILL_IN_ROW_HTML)).toBe('Name: Grade: Date:');
  });

  it('draws three dashed rules the learner writes on', () => {
    expect(countOccurrences(LEARNER_FILL_IN_ROW_HTML, 'border-bottom:2px dashed')).toBe(3);
  });

  it('contains no letters or digits inside any blank', () => {
    const blanks = LEARNER_FILL_IN_ROW_HTML.match(/<span style="display:inline-block[^>]*>[\s\S]*?<\/span>/g) || [];
    expect(blanks).toHaveLength(3);
    blanks.forEach((blank) => {
      const inner = blank.replace(/^<span[^>]*>/, '').replace(/<\/span>$/, '');
      // Only the invisible spacer that keeps the dashed rule visible — once it
      // is decoded there is not a single glyph for the learner to read.
      const decoded = inner.replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&');
      expect(decoded.trim()).toBe('');
    });
  });
});

describe('wrapWithTemplate — the row on a learner-facing document', () => {
  it('injects exactly one empty Name / Grade / Date row under the banner', () => {
    const doc = wrapWithTemplate('<article class="card"><h2>Task 1</h2><p>Half of 8 is …</p></article>', worksheetMeta);
    expect(countOccurrences(doc, LEARNER_FILL_IN_CLASS)).toBe(1);
    expect(doc).toContain('Name:');
    expect(doc).toContain('Grade:');
    expect(doc).toContain('Date:');
  });

  it('places the row AFTER the banner and BEFORE the content', () => {
    const doc = wrapWithTemplate('<p>Half of 8 is …</p>', worksheetMeta);
    const bannerAt = doc.indexOf('eduai-compliance-banner');
    const rowAt = doc.indexOf(LEARNER_FILL_IN_CLASS);
    const bodyAt = doc.indexOf('Half of 8 is');
    expect(bannerAt).toBeGreaterThan(-1);
    expect(rowAt).toBeGreaterThan(bannerAt);
    expect(bodyAt).toBeGreaterThan(rowAt);
  });

  it('STILL prints the real grade pill in the banner for the teacher', () => {
    const doc = wrapWithTemplate('<p>Half of 8 is …</p>', worksheetMeta);
    const banner = doc.match(/<div class="eduai-compliance-banner"[\s\S]*?<\/div>\s*(?=<div class="eduai-learner-fillin)/)?.[0]
      ?? buildTemplateComplianceBannerHTML(worksheetMeta);
    expect(banner).toContain('Grade 5');
    expect(banner).toContain('Mathematics');
  });

  it('adds NO row to a teacher-facing document', () => {
    ['Lesson Plan', 'Marking Memo', 'Assessment Rubric'].forEach((contentType) => {
      const doc = wrapWithTemplate('<p>Phase 1: introduce the concept.</p>', { ...worksheetMeta, contentType });
      expect(hasLearnerFillInRow(doc), contentType).toBe(false);
    });
  });

  it('honours an explicit opt-out and opt-in', () => {
    const optedOut = wrapWithTemplate('<p>Half of 8 is …</p>', { ...worksheetMeta, leaveLearnerFieldsBlank: false });
    expect(hasLearnerFillInRow(optedOut)).toBe(false);

    const forced = wrapWithTemplate('<p>Phase 1: introduce the concept.</p>', {
      ...worksheetMeta, contentType: 'Lesson Plan', leaveLearnerFieldsBlank: true,
    });
    expect(hasLearnerFillInRow(forced)).toBe(true);
  });

  it('is idempotent — wrapping twice never stacks a second row', () => {
    const once = wrapWithTemplate('<p>Half of 8 is …</p>', worksheetMeta);
    const twice = wrapWithTemplate(once, worksheetMeta);
    expect(twice).toBe(once);
    expect(countOccurrences(twice, LEARNER_FILL_IN_CLASS)).toBe(1);
  });

  it('lets a teacher-supplied learner name win over the blank banner pill', () => {
    const banner = buildTemplateComplianceBannerHTML({ ...worksheetMeta, leaveDateBlank: true, learner: 'Thabo Mokoena' });
    expect(banner).toContain('Learner: Thabo Mokoena');
    expect(banner).not.toContain('Name: ______');
    // The body row stays empty regardless — the learner still writes on it.
    const doc = wrapWithTemplate('<p>Half of 8 is …</p>', { ...worksheetMeta, leaveDateBlank: true, learner: 'Thabo Mokoena' });
    expect(countOccurrences(doc, LEARNER_FILL_IN_CLASS)).toBe(1);
  });
});

describe('STRIPPED — hallucinated values are blanked', () => {
  it('blanks a pre-filled learner name', () => {
    expect(blankLearnerFillInValues('<p>Name: Thabo Mokoena</p>')).toContain(`Name: ${FILL_IN_BLANK}`);
    expect(blankLearnerFillInValues('<p>Naam: Lerato</p>')).toContain(`Naam: ${FILL_IN_BLANK}`);
  });

  it('blanks a hardcoded date in every SA shape', () => {
    ['Date: 15/03/2026', 'Date: 15 March 2026', 'Date: 15 March, 2026', 'Datum: 2026-03-15']
      .forEach((line) => expect(blankLearnerFillInValues(`<p>${line}</p>`), line).toContain(FILL_IN_BLANK));
  });

  it('blanks a pre-filled grade', () => {
    ['Grade: 5', 'Grade: Grade 5', 'Grade: 7A', 'Grade: R', 'Graad: 4']
      .forEach((line) => expect(blankLearnerFillInValues(`<p>${line}</p>`), line).toContain(FILL_IN_BLANK));
  });

  it('leaves prose that merely mentions these words alone', () => {
    const prose = '<p>Write your full name in cursive handwriting below the title.</p>';
    expect(blankLearnerFillInValues(prose)).toBe(prose);
    const sentence = '<p>The grade of the slope is calculated as rise over run.</p>';
    expect(blankLearnerFillInValues(sentence)).toBe(sentence);
  });

  it('leaves an already-blank line alone', () => {
    const blank = '<p>Name: __________</p>';
    expect(blankLearnerFillInValues(blank)).toBe(blank);
  });

  it('removes a hallucinated learner name from a wrapped worksheet', () => {
    const doc = wrapWithTemplate(
      '<article class="card"><h2>Task 1</h2><p>Name: Sipho Ndlovu</p><p>Half of 8 is …</p></article>',
      worksheetMeta,
    );
    // The invented name never reaches the printed sheet…
    expect(doc).not.toContain('Sipho Ndlovu');
    // …and the invented fill-in row is dropped in favour of the ONE canonical
    // empty row, so the learner still has a clean space to write in.
    expect(countOccurrences(doc, LEARNER_FILL_IN_CLASS)).toBe(1);
    expect(doc).toContain('Half of 8 is');
  });

  it('blanks a hallucinated value that sits inside real content', () => {
    // Not a standalone fill-in row, so it is emptied IN PLACE rather than removed.
    const doc = wrapWithTemplate(
      '<article class="card"><h2>Task 1</h2>' +
      '<p>Complete this section. Name: Amina Petersen</p>' +
      '<p>Answer all the questions. Grade: 6</p></article>',
      worksheetMeta,
    );
    expect(doc).not.toContain('Amina Petersen');
    expect(doc).toContain('Complete this section.');
    expect(doc).toContain('Answer all the questions.');
    expect(countOccurrences(doc, FILL_IN_BLANK)).toBe(2);
  });
});

describe('ONCE — no duplicate fill-in row', () => {
  it('drops a model-written Name/Date row that duplicates the canonical one', () => {
    const stripped = stripLearnerFillInRows('<p>Name: ______ Date: ______</p><p>Question 1</p>');
    expect(stripped).not.toContain('Name:');
    expect(stripped).toContain('Question 1');
  });

  it('drops the dashed-span variant too', () => {
    const model = '<p><strong>Name:</strong> <span class="border-b-2">&nbsp;</span></p><p>Q1</p>';
    expect(stripLearnerFillInRows(model)).not.toContain('Name:');
    expect(stripLearnerFillInRows(model)).toContain('Q1');
  });

  it('never removes a block that carries real content', () => {
    const real = '<p>Name the three states of matter.</p>';
    expect(stripLearnerFillInRows(real)).toBe(real);
    const mixed = '<div><p>Name: ____</p><p>Answer the questions below.</p></div>';
    expect(stripLearnerFillInRows(mixed)).toContain('Answer the questions below.');
  });

  it('leaves the canonical row untouched', () => {
    expect(stripLearnerFillInRows(LEARNER_FILL_IN_ROW_HTML)).toBe(LEARNER_FILL_IN_ROW_HTML);
  });

  it('keeps exactly one row when the model wrote its own', () => {
    const doc = wrapWithTemplate(
      '<article class="card"><p>Name: ______ Date: ______</p><h2>Task 1</h2><p>Half of 8 is …</p></article>',
      worksheetMeta,
    );
    expect(countOccurrences(doc, LEARNER_FILL_IN_CLASS)).toBe(1);
  });
});

describe('print / PDF metadata carries the flags through', () => {
  it('passes leaveLearnerFieldsBlank and leaveDateBlank to the template meta', () => {
    const meta = metaFromPrintOptions({
      subject: 'Mathematics', grade: '5', contentType: 'Worksheet',
      leaveLearnerFieldsBlank: true, leaveDateBlank: true,
    });
    expect(meta.leaveLearnerFieldsBlank).toBe(true);
    expect(meta.leaveDateBlank).toBe(true);
  });

  it('derives the row from the content type when no flag is supplied', () => {
    const doc = wrapWithTemplate('<p>Half of 8 is …</p>', metaFromPrintOptions(
      { subject: 'Mathematics', grade: '5', contentType: 'Worksheet' }, 'Fractions',
    ));
    expect(hasLearnerFillInRow(doc)).toBe(true);
  });
});
