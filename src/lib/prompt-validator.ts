/**
 * EduAI Companion - Prompt Quality Validator
 * Validates AI-generated outputs against quality checklist
 * v4.0 — adds World-Class Standard completeness gates: banned placeholder
 * phrases, leaked chain-of-thought and truncated markup.
 */

import { BANNED_OUTPUT_PATTERNS } from './prompts/world-class-standard';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  suggestions: string[];
  metrics: {
    visualHierarchy: boolean;
    childAppropriate: boolean;
    printReady: boolean;
    accessible: boolean;
    capsAligned: boolean;
    saContext: boolean;
    complete: boolean;
  };
}

export class PromptQualityValidator {
  
  /**
   * Validate HTML output against quality standards
   */
  static validateOutput(html: string, context: any): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // ✅ Visual hierarchy checks
    const hasHeroSection = html.includes('hero-section') || html.includes('hero') || html.includes('header') || html.includes('banner');
    const hasBanner = html.includes('banner') || html.includes('gradient') || html.includes('bg-gradient');
    const hasGradeBadge = html.includes('grade-badge') || html.includes('Grade') || html.includes('grade');
    
    if (!hasHeroSection || !hasBanner) {
      issues.push('Missing required visual hierarchy elements (hero/banner sections)');
    }
    
    // ✅ Child-appropriate font sizing
    const fontSizeMatch = html.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/g) || [];
    // Only check for body text sizing, ignore tiny text like badges/footers by doing a more complex check or just disabling the strict check.
    const hasInappropriateFonts = this.checkFontSizeAppropriateness(fontSizeMatch, context.grade);
    
    if (hasInappropriateFonts.hasIssues) {
      warnings.push(`Font sizes may be too small for Grade ${context.grade}: ${hasInappropriateFonts.issues.join(', ')}`);
    }
    
    // ✅ Color contrast (basic heuristic)
    const hasSubjectColor = this.detectSubjectColor(html, context.subject);
    if (!hasSubjectColor) {
      warnings.push('Subject-aligned color scheme not detected');
    }
    
    // ✅ Print readiness
    const hasPrintStyles = html.includes('@media print') || 
                          html.includes('print:') || 
                          html.includes('page-break');
    if (!hasPrintStyles) {
      warnings.push('Print optimization styles may be missing');
    }
    
    // ✅ Accessibility basics
    const hasSemanticHTML = html.includes('<header>') || 
                           html.includes('<main>') || 
                           html.includes('<section>');
    const hasAltText = !html.includes('<img') || html.includes('alt=');
    
    if (!hasSemanticHTML) {
      suggestions.push('Consider adding semantic HTML elements (header, main, section) for better accessibility');
    }
    if (!hasAltText && html.includes('<img')) {
      issues.push('Image elements missing alt text placeholders');
    }
    
    // ✅ CAPS alignment marker
    const hasCAPSAlignment = html.includes('CAPS') || 
                            html.includes('caps') || 
                            html.toLowerCase().includes('caps');
    if (!hasCAPSAlignment) {
      warnings.push('CAPS alignment not explicitly mentioned in output');
    }
    
    // ✅ South African context
    const hasSAContext = this.detectSAContext(html);
    if (!hasSAContext) {
      suggestions.push('Consider adding South African context (places, names, cultural elements)');
    }
    
    // ✅ Growth mindset language
    const hasGrowthMindset = /success|achieve|learn|grow|improve|can do/i.test(html);
    if (!hasGrowthMindset && ['worksheet', 'test'].includes(context.contentType)) {
      suggestions.push('Add growth mindset language (success indicators, encouraging feedback)');
    }

    // 🏆 World-Class Standard: completeness gates
    const completeness = this.checkCompleteness(html);
    issues.push(...completeness.issues);
    warnings.push(...completeness.warnings);

    // Calculate score
    const score = this.calculateScore(issues.length, warnings.length, suggestions.length);
    
    return {
      isValid: issues.length === 0,
      score,
      issues,
      warnings,
      suggestions,
      metrics: {
        visualHierarchy: hasHeroSection && hasBanner,
        childAppropriate: !hasInappropriateFonts.hasIssues,
        printReady: hasPrintStyles,
        accessible: hasSemanticHTML && hasAltText,
        complete: completeness.issues.length === 0,
        capsAligned: hasCAPSAlignment,
        saContext: hasSAContext
      }
    };
  }
  
  /**
   * Check if font sizes are appropriate for grade level
   */
  private static checkFontSizeAppropriateness(fontClasses: string[], grade: string): { hasIssues: boolean; issues: string[] } {
    const issues: string[] = [];
    const numGrade = parseInt(grade);
    
    // Foundation Phase needs larger fonts
    if ((grade === 'R' || numGrade <= 3) && fontClasses.includes('text-xs')) {
      issues.push('text-xs too small for Foundation Phase');
    }
    
    // Check for very small fonts in early grades
    if ((grade === 'R' || numGrade <= 2) && fontClasses.includes('text-sm')) {
      issues.push('text-sm may be too small for Grade ' + grade);
    }
    
    return { hasIssues: issues.length > 0, issues };
  }
  
  /**
   * Detect if subject-aligned colors are present
   */
  private static detectSubjectColor(html: string, subject: string): boolean {
    const colorMap: Record<string, string[]> = {
      'Mathematics': ['blue', '2563eb', '3b82f6'],
      'Natural Sciences': ['green', '059669', '10b981'],
      'History': ['purple', '8b5cf6', '7c3aed'],
      'Languages': ['purple', '7c3aed', 'a78bfa'],
      'Life Skills': ['orange', 'f97316', 'fb923c']
    };
    
    const colors = colorMap[subject] || ['blue', 'green', 'purple'];
    return colors.some(color => html.toLowerCase().includes(color));
  }
  
  /**
   * Detect South African context in content
   */
  private static detectSAContext(html: string): boolean {
    const saKeywords = [
      'south african', 'caps', 'kruger', 'table mountain', 'drakensberg',
      'springbok', 'rand', 'gauteng', 'western cape', 'kwazulu-natal',
      'mandela', 'robben island', 'township', 'braai', 'ubuntu',
      'zulu', 'xhosa', 'afrikaans', 'sotho', 'tswana'
    ];
    
    const lowerHtml = html.toLowerCase();
    return saKeywords.some(keyword => lowerHtml.includes(keyword));
  }
  
  /**
   * 🏆 World-Class Standard completeness gates.
   * Catches the three failure modes that make output look amateur:
   * placeholder filler, leaked chain-of-thought, and truncated markup.
   */
  private static checkCompleteness(html: string): { issues: string[]; warnings: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const text = String(html || '');
    const lower = text.toLowerCase();

    // 1. Banned placeholder / filler phrases
    const found = BANNED_OUTPUT_PATTERNS.filter((pattern) => lower.includes(pattern.toLowerCase()));
    if (found.length > 0) {
      issues.push(`Placeholder or filler language detected (World-Class Standard §1): ${found.slice(0, 5).join(', ')}`);
    }

    // 2. Leaked reasoning traces from hybrid-thinking models
    if (/<\/?think>|<\/?thinking>|<\/?reasoning>/i.test(text)) {
      issues.push('Chain-of-thought markup leaked into the deliverable (World-Class Standard §6)');
    }
    if (/^\s*(here is|here's|i have created|i've created|sure[,!]|certainly[,!])/i.test(text)) {
      warnings.push('Response opens with conversational preamble instead of the artefact itself');
    }

    // 3. Truncation heuristics
    if (text.includes('<html') && !/<\/html>/i.test(text)) {
      issues.push('HTML document is truncated — no closing </html> tag');
    }
    const openDivs = (text.match(/<div\b/gi) || []).length;
    const closeDivs = (text.match(/<\/div>/gi) || []).length;
    if (openDivs > 0 && openDivs - closeDivs > 2) {
      issues.push(`Markup appears truncated — ${openDivs - closeDivs} unclosed <div> elements`);
    }
    if (/\.\.\.\s*$/.test(text.trim())) {
      warnings.push('Output ends with an ellipsis, which usually indicates truncation');
    }

    return { issues, warnings };
  }

  /**
   * Calculate quality score (0-100)
   */
  private static calculateScore(issues: number, warnings: number, suggestions: number): number {
    const deductions = (issues * 15) + (warnings * 5) + (suggestions * 2);
    return Math.max(0, Math.min(100, 100 - deductions));
  }
  
  /**
   * Generate validation report
   */
  static generateReport(validation: ValidationResult, context: any): string {
    const report = [
      '📊 EDUAI OUTPUT VALIDATION REPORT',
      '='.repeat(50),
      '',
      `Content Type: ${context.contentType}`,
      `Grade: ${context.grade}`,
      `Subject: ${context.subject}`,
      `Topic: ${context.topic}`,
      '',
      `Overall Score: ${validation.score}/100 ${validation.score >= 80 ? '✅' : validation.score >= 60 ? '⚠️' : '❌'}`,
      `Status: ${validation.isValid ? 'PASSED' : 'NEEDS REVISION'}`,
      '',
      '📋 METRICS:',
      ...Object.entries(validation.metrics).map(([key, value]) => 
        `  ${value ? '✅' : '❌'} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`
      ),
      '',
    ];
    
    if (validation.issues.length > 0) {
      report.push('🚨 ISSUES (Must Fix):');
      validation.issues.forEach(issue => report.push(`  • ${issue}`));
      report.push('');
    }
    
    if (validation.warnings.length > 0) {
      report.push('⚠️ WARNINGS (Should Fix):');
      validation.warnings.forEach(warning => report.push(`  • ${warning}`));
      report.push('');
    }
    
    if (validation.suggestions.length > 0) {
      report.push('💡 SUGGESTIONS (Nice to Have):');
      validation.suggestions.forEach(suggestion => report.push(`  • ${suggestion}`));
      report.push('');
    }
    
    report.push('='.repeat(50));
    
    return report.join('\n');
  }
}

export default PromptQualityValidator;