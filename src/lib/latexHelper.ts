import katex from 'katex';

/**
 * Parses a string and replaces LaTeX mathematical equations with rendered KaTeX HTML strings.
 * Built to be highly compatible with both standard LaTeX blocks/inlines and LLM outputs
 * under CAPS (Curriculum Assessment Policy Statements) mathematical context.
 */
export function renderMathInHtml(htmlText: string): string {
  if (!htmlText) return htmlText;

  let formatted = htmlText;

  // 1. Block mathematical formulas: $$ ... $$ or \[ ... \]
  formatted = formatted.replace(/\$\$([\s\S]+?)\$\$/g, (match, equation) => {
    try {
      const rendered = katex.renderToString(equation.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-block-wrapper my-4 py-2 flex justify-center text-center overflow-x-auto w-full max-w-full">${rendered}</div>`;
    } catch (e) {
      console.error("KaTeX block rendering error:", e);
      return match;
    }
  });

  formatted = formatted.replace(/\\\[([\s\S]+?)\\\]/g, (match, equation) => {
    try {
      const rendered = katex.renderToString(equation.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-block-wrapper my-4 py-2 flex justify-center text-center overflow-x-auto w-full max-w-full">${rendered}</div>`;
    } catch (e) {
      console.error("KaTeX block rendering error:", e);
      return match;
    }
  });

  // 2. Inline mathematical formulas: $ ... $ (ensuring we don't pick up currency like $100 or R100) or \( ... \)
  // Match single characters or equations between $...$, with no surrounding spaces at edges to distinguish from currencies
  formatted = formatted.replace(/\$([^\s\$][^$]*?[^\s\$])\$/g, (match, equation) => {
    try {
      return katex.renderToString(equation, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      console.error("KaTeX inline rendering error:", e);
      return match;
    }
  });

  formatted = formatted.replace(/\$([^\s\$])\$/g, (match, equation) => {
    try {
      return katex.renderToString(equation, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      console.error("KaTeX inline rendering error:", e);
      return match;
    }
  });

  formatted = formatted.replace(/\\\\\(([\s\S]+?)\\\\\)/g, (match, equation) => {
    try {
      return katex.renderToString(equation.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      console.error("KaTeX inline rendering error:", e);
      return match;
    }
  });

  formatted = formatted.replace(/\\\(([\s\S]+?)\\\)/g, (match, equation) => {
    try {
      return katex.renderToString(equation.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      console.error("KaTeX inline rendering error:", e);
      return match;
    }
  });

  return formatted;
}
