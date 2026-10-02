/**
 * Foundation Phase (Grade R–3) printable template library.
 *
 * `README.md` and `FOUNDATION_PHASE_TEMPLATES.md` promise 28 CAPS-aligned
 * printables split 6 awards / 10 worksheets / 6 classroom / 6 homework, each
 * rendering clean A4 HTML. A content edit that breaks that promise fails here.
 */
import { describe, expect, it } from 'vitest';
import {
  FOUNDATION_LIBRARY_STATS,
  FOUNDATION_TEMPLATES,
  getFoundationTemplate,
  filterFoundationTemplates,
  renderFoundationTemplate,
} from '../src/lib/templates/foundation';

describe('library composition', () => {
  it('ships the documented 28 templates', () => {
    expect(FOUNDATION_TEMPLATES).toHaveLength(28);
    expect(FOUNDATION_LIBRARY_STATS.total).toBe(28);
  });

  it('splits them 6 / 10 / 6 / 6 across the four families', () => {
    expect(FOUNDATION_LIBRARY_STATS.awards).toBe(6);
    expect(FOUNDATION_LIBRARY_STATS.worksheets).toBe(10);
    expect(FOUNDATION_LIBRARY_STATS.classroom).toBe(6);
    expect(FOUNDATION_LIBRARY_STATS.homework).toBe(6);
  });

  it('uses unique ids', () => {
    const ids = FOUNDATION_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('titles and CAPS skills are authored, never placeholders', () => {
    for (const tpl of FOUNDATION_TEMPLATES) {
      expect(tpl.title.trim().length, `title for ${tpl.id}`).toBeGreaterThan(3);
      expect(tpl.caps.skills.length, `skills for ${tpl.id}`).toBeGreaterThan(0);
      expect(tpl.caps.capsNote, `CAPS note for ${tpl.id}`).toBeTruthy();
      expect(tpl.blocks.length, `blocks for ${tpl.id}`).toBeGreaterThan(0);
      expect(tpl.title).not.toMatch(/lorem|tbd|placeholder/i);
    }
  });

  it('only targets Foundation Phase grades', () => {
    for (const tpl of FOUNDATION_TEMPLATES) {
      for (const grade of tpl.grades) {
        expect(grade, `grades for ${tpl.id}`).toMatch(/^(R|[1-3]|R-1|2-3|1-3|R-3)$/);
      }
    }
  });
});

describe('lookup and filtering', () => {
  it('finds a template by id and returns undefined for unknown ids', () => {
    const first = FOUNDATION_TEMPLATES[0];
    expect(getFoundationTemplate(first.id)).toBe(first);
    expect(getFoundationTemplate('does-not-exist')).toBeUndefined();
  });

  it('filters by kind', () => {
    expect(filterFoundationTemplates({ kind: 'award' })).toHaveLength(6);
    expect(filterFoundationTemplates({ kind: 'worksheet' })).toHaveLength(10);
    expect(filterFoundationTemplates({ kind: 'all' })).toHaveLength(28);
  });

  it('filters by grade, including range scopes', () => {
    for (const grade of ['R', '1', '2', '3'] as const) {
      const results = filterFoundationTemplates({ grade });
      expect(results.length, `templates for grade ${grade}`).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(28);
    }
  });

  it('returns nothing for a query that matches no template', () => {
    expect(filterFoundationTemplates({ query: 'zzzz-not-a-real-topic' })).toHaveLength(0);
  });

  it('memo filter returns a consistent subset', () => {
    const withMemo = filterFoundationTemplates({ withMemoOnly: true });
    expect(withMemo.length).toBeGreaterThan(0);
    expect(withMemo.length).toBeLessThanOrEqual(28);
    for (const tpl of withMemo) {
      const hasMemo =
        tpl.blocks.some((b) => b.kind === 'memo') || Boolean(tpl.caps.memo?.length);
      expect(hasMemo).toBe(true);
    }
  });
});

describe('rendering', () => {
  const sample = FOUNDATION_TEMPLATES[0];

  it('renders a fragment and a standalone HTML document', () => {
    const { fragment, standalone } = renderFoundationTemplate(sample);
    expect(fragment.length).toBeGreaterThan(200);
    expect(standalone).toMatch(/^<!DOCTYPE html>/i);
    expect(standalone).toContain('</html>');
    expect(standalone).toContain(sample.title);
  });

  it('renders every template without throwing', () => {
    for (const tpl of FOUNDATION_TEMPLATES) {
      const { standalone } = renderFoundationTemplate(tpl);
      expect(standalone.length, `render ${tpl.id}`).toBeGreaterThan(200);
      expect(standalone).not.toContain('undefined');
    }
  });

  it('supports the bilingual label mode', () => {
    const bilingual = renderFoundationTemplate(sample, { labelLanguage: 'xh', bilingual: true });
    expect(bilingual.standalone.length).toBeGreaterThan(200);
  });
});
