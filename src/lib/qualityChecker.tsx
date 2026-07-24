import React from 'react';

/**
 * EduAI Companion - Content Quality Rating System
 * Evaluates CAPS compliance and overall content quality
 */

export interface QualityRating {
  overall: number; // 0-100
  capsCompliance: number; // 0-100
  pedagogicalQuality: number; // 0-100
  accessibility: number; // 0-100
  culturalRelevance: number; // 0-100
  technicalQuality: number; // 0-100
  feedback: string[];
  strengths: string[];
  improvements: string[];
  capsAlignment: {
    hasLearningObjectives: boolean;
    hasAssessmentCriteria: boolean;
    hasTimeAllocation: boolean;
    hasDifferentiation: boolean;
    hasInclusiveEd: boolean;
    hasICTIntegration: boolean;
    bloomTaxonomy: string[];
  };
}

export interface QualityCheckOptions {
  contentType: string;
  grade: string;
  subject: string;
  topic: string;
  content: string;
  language?: string;
  term?: string;
}

/**
 * Check content quality using AI analysis
 */
export const checkContentQuality = async (
  options: QualityCheckOptions
): Promise<QualityRating> => {
  const { contentType, grade, subject, topic, content, language = 'English' } = options;

  try {
    // Use AI to evaluate content quality
    const qualityPrompt = buildQualityCheckPrompt(options);
    
    const response = await fetch('/api/gemini/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quality-check',
        input: {
          prompt: qualityPrompt,
          contentType,
          grade,
          subject,
          topic
        }
      })
    });

    if (!response.ok) {
      throw new Error('Quality check API failed');
    }

    const data = await response.json();
    
    // Parse the quality rating from AI response
    return parseQualityRating(data.text || data.content || '', options);
  } catch (error) {
    console.error('Quality check failed:', error);
    // Return a basic quality check if AI fails
    return performBasicQualityCheck(options);
  }
};

/**
 * Build prompt for quality evaluation
 */
const buildQualityCheckPrompt = (options: QualityCheckOptions): string => {
  const { contentType, grade, subject, topic, content, language } = options;

  return `You are an expert South African CAPS curriculum quality assessor.

Evaluate the following educational content for CAPS compliance and quality:

CONTENT TYPE: ${contentType}
GRADE: ${grade}
SUBJECT: ${subject}
TOPIC: ${topic}
LANGUAGE: ${language}

CONTENT TO EVALUATE:
${content}

Provide a comprehensive quality rating in JSON format with the following structure:
{
  "overall": number (0-100),
  "capsCompliance": number (0-100),
  "pedagogicalQuality": number (0-100),
  "accessibility": number (0-100),
  "culturalRelevance": number (0-100),
  "technicalQuality": number (0-100),
  "feedback": string[],
  "strengths": string[],
  "improvements": string[],
  "capsAlignment": {
    "hasLearningObjectives": boolean,
    "hasAssessmentCriteria": boolean,
    "hasTimeAllocation": boolean,
    "hasDifferentiation": boolean,
    "hasInclusiveEd": boolean,
    "hasICTIntegration": boolean,
    "bloomTaxonomy": string[]
  }
}

Evaluation Criteria:
1. CAPS Compliance (25%):
   - Alignment with South African CAPS curriculum standards
   - Clear learning objectives and outcomes
   - Appropriate time allocation
   - Assessment criteria included
   - Bloom's taxonomy levels appropriate for grade

2. Pedagogical Quality (25%):
   - Age-appropriate language and complexity
   - Clear instructional sequence
   - Engaging activities and examples
   - Scaffolding and progression
   - Assessment alignment

3. Accessibility (20%):
   - Readable fonts and sizes
   - Clear visual hierarchy
   - Inclusive language
   - Accommodations for diverse learners
   - Multiple means of representation

4. Cultural Relevance (15%):
   - South African context and examples
   - Diverse representation
   - Culturally appropriate content
   - Local references and scenarios

5. Technical Quality (15%):
   - Professional formatting
   - Error-free content
   - Consistent styling
   - Print-ready quality
   - Digital accessibility

Be specific, constructive, and honest in your evaluation. DO NOT write anything other than the raw JSON output.`;
};

/**
 * Parse AI response into QualityRating object
 */
const parseQualityRating = (aiResponse: string, options: QualityCheckOptions): QualityRating => {
  try {
    // Try to extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        overall: parsed.overall || 0,
        capsCompliance: parsed.capsCompliance || 0,
        pedagogicalQuality: parsed.pedagogicalQuality || 0,
        accessibility: parsed.accessibility || 0,
        culturalRelevance: parsed.culturalRelevance || 0,
        technicalQuality: parsed.technicalQuality || 0,
        feedback: parsed.feedback || [],
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        capsAlignment: parsed.capsAlignment || {
          hasLearningObjectives: false,
          hasAssessmentCriteria: false,
          hasTimeAllocation: false,
          hasDifferentiation: false,
          hasInclusiveEd: false,
          hasICTIntegration: false,
          bloomTaxonomy: []
        }
      };
    }
  } catch (error) {
    console.error('Failed to parse quality rating:', error);
  }

  return performBasicQualityCheck(options);
};

/**
 * Perform basic quality check (fallback)
 */
export const performBasicQualityCheck = (options: QualityCheckOptions): QualityRating => {
  const { content } = options;
  const contentLower = content.toLowerCase();
  
  const checks = {
    hasContent: content.length > 100,
    hasHtml: content.includes('<') && content.includes('>'),
    hasStructure: content.includes('<h') || content.includes('<div'),
    hasAssessment: contentLower.includes('question') || contentLower.includes('activity') || contentLower.includes('task'),
    hasInstructions: contentLower.includes('instruction') || contentLower.includes('direction') || contentLower.includes('guideline'),
    length: content.length
  };

  const capsAlignment = {
    hasLearningObjectives: contentLower.includes('objective') || contentLower.includes('outcome') || contentLower.includes('aim') || contentLower.includes('skills'),
    hasAssessmentCriteria: contentLower.includes('mark') || contentLower.includes('score') || contentLower.includes('grade') || contentLower.includes('rubric') || contentLower.includes('memo') || contentLower.includes('teacher note') || contentLower.includes('formal assessment'),
    hasTimeAllocation: contentLower.includes('minute') || contentLower.includes('hour') || contentLower.includes('time') || contentLower.includes('duration') || contentLower.includes('time allocation'),
    hasDifferentiation: contentLower.includes('differentiat') || contentLower.includes('adapt') || contentLower.includes('support') || contentLower.includes('barrier') || contentLower.includes('extension') || contentLower.includes('eal') || contentLower.includes('fal'),
    hasInclusiveEd: contentLower.includes('inclusive') || contentLower.includes('all learner') || contentLower.includes('diverse') || contentLower.includes('remedial') || contentLower.includes('scaffolding'),
    hasICTIntegration: contentLower.includes('technology') || contentLower.includes('digital') || contentLower.includes('online') || contentLower.includes('ict') || contentLower.includes('illustration') || contentLower.includes('print description'),
    bloomTaxonomy: extractBloomTaxonomy(content)
  };

  // Calculate scores based on checks
  const capsScore = Math.round(Object.values(capsAlignment).filter((v) => typeof v === 'boolean' && v).length / 6 * 100);
  const technicalScore = Math.round(Object.values(checks).filter((v) => typeof v === 'boolean' && v).length / 5 * 100);
  
  return {
    overall: Math.round((capsScore + technicalScore) / 2),
    capsCompliance: Math.round(capsScore),
    pedagogicalQuality: Math.round(checks.hasStructure ? 75 : 45),
    accessibility: Math.round(checks.hasHtml ? 70 : 40),
    culturalRelevance: 70, // Default moderate score
    technicalQuality: Math.round(technicalScore),
    feedback: generateFeedback(checks, capsAlignment),
    strengths: generateStrengths(checks, capsAlignment),
    improvements: generateImprovements(checks, capsAlignment),
    capsAlignment
  };
};

/**
 * Extract Bloom's taxonomy verbs from content
 */
const extractBloomTaxonomy = (content: string): string[] => {
  const bloomVerbs: Record<string, string[]> = {
    'Remembering': ['list', 'define', 'identify', 'name', 'recall', 'recognize'],
    'Understanding': ['explain', 'describe', 'discuss', 'summarize', 'paraphrase'],
    'Applying': ['apply', 'use', 'demonstrate', 'solve', 'implement'],
    'Analyzing': ['analyze', 'compare', 'contrast', 'categorize', 'examine'],
    'Evaluating': ['evaluate', 'judge', 'critique', 'assess', 'justify'],
    'Creating': ['create', 'design', 'develop', 'construct', 'produce']
  };

  const foundLevels: string[] = [];
  const lowerContent = content.toLowerCase();

  for (const [level, verbs] of Object.entries(bloomVerbs)) {
    if (verbs.some(verb => lowerContent.includes(verb))) {
      foundLevels.push(level);
    }
  }

  return foundLevels.length > 0 ? foundLevels : ['Understanding', 'Applying'];
};

/**
 * Generate feedback based on checks
 */
const generateFeedback = (checks: any, capsAlignment: any): string[] => {
  const feedback: string[] = [];

  if (!checks.hasContent) {
    feedback.push('Content appears too short. Consider adding more detail and examples.');
  }

  if (!capsAlignment.hasLearningObjectives) {
    feedback.push('Missing clear learning objectives. Add specific outcomes for learners.');
  }

  if (!capsAlignment.hasAssessmentCriteria) {
    feedback.push('No assessment criteria found. Include marking guidelines or rubrics.');
  }

  if (!capsAlignment.hasTimeAllocation) {
    feedback.push('Time allocation not specified. Add duration for activities.');
  }

  if (!capsAlignment.hasDifferentiation) {
    feedback.push('No differentiation strategies visible. Include support for diverse learners.');
  }

  if (feedback.length === 0) {
    feedback.push('Content meets basic CAPS requirements. Consider enhancing with more interactive elements.');
  }

  return feedback;
};

/**
 * Generate strengths based on checks
 */
const generateStrengths = (checks: any, capsAlignment: any): string[] => {
  const strengths: string[] = [];

  if (checks.hasContent) strengths.push('Content has sufficient length and detail');
  if (checks.hasHtml) strengths.push('Properly formatted with HTML structure');
  if (checks.hasStructure) strengths.push('Clear organizational structure present');
  if (capsAlignment.hasLearningObjectives) strengths.push('Clear learning objectives defined');
  if (capsAlignment.hasAssessmentCriteria) strengths.push('Assessment criteria included');
  if (capsAlignment.hasDifferentiation) strengths.push('Differentiation strategies present');
  if (capsAlignment.hasInclusiveEd) strengths.push('Inclusive education principles applied');

  return strengths;
};

/**
 * Generate improvements based on checks
 */
const generateImprovements = (checks: any, capsAlignment: any): string[] => {
  const improvements: string[] = [];

  if (!capsAlignment.hasAssessmentCriteria || !capsAlignment.hasTimeAllocation) {
    improvements.push('Add explicit teacher notes detailing formal/informal assessment recommendations and time allocations.');
  }

  if (!capsAlignment.hasDifferentiation || !capsAlignment.hasInclusiveEd) {
    improvements.push('Include built-in differentiation strategies (e.g., support for English Additional Language learners or learners requiring extra time/scaffolding).');
  }

  if (!capsAlignment.hasICTIntegration) {
    improvements.push("Ensure all interactive placeholder tags like '[Illustration: ...]' have accompanying alt-text or printable descriptions for print-only usage.");
  }

  if (!capsAlignment.hasLearningObjectives) {
    improvements.push('Add specific, measurable learning objectives (Know, Apply, Analyze, Evaluate).');
  }

  return improvements;
};

const ScoreBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-emerald-500 to-green-500',
    orange: 'from-orange-500 to-amber-500',
    pink: 'from-pink-500 to-rose-500'
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color] || 'from-cyan-500 to-blue-500'} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const formatKey = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

/**
 * Display quality rating component
 */
export const QualityRatingDisplay: React.FC<{ rating: QualityRating }> = ({ rating }) => {
  return (
    <div className="space-y-5 p-5 bg-slate-900/50 rounded-2xl border border-white/10 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-lg font-bold text-cyan-400 font-sans tracking-wide">CAPS Compliance Analysis</h3>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
          Evaluator Mode
        </span>
      </div>
      
      {/* Overall Score */}
      <div className="flex items-center gap-5 p-4 bg-white/5 rounded-xl border border-white/5">
        <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <span className="text-3xl font-black text-white">{rating.overall}%</span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-white/70">Score</span>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white">Curriculum Quality Quotient</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Calculated score assessing technical design, South African context inclusion, age-appropriate scaffolding, and Bloom's cognitive taxonomy balance.
          </p>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreBar label="CAPS Compliance" value={rating.capsCompliance} color="blue" />
        <ScoreBar label="Pedagogical Scaffolding" value={rating.pedagogicalQuality} color="purple" />
        <ScoreBar label="Accessibility & Design" value={rating.accessibility} color="green" />
        <ScoreBar label="South African Relevance" value={rating.culturalRelevance} color="orange" />
        <ScoreBar label="Technical Execution" value={rating.technicalQuality} color="pink" />
      </div>

      {/* CAPS Alignment Checklist */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">CAPS Component Audit</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {Object.entries(rating.capsAlignment).map(([key, value]) => {
            if (key === 'bloomTaxonomy') return null;
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-lg ${value ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'} flex items-center justify-center text-[10px]`}>
                  {value ? '✓' : '✗'}
                </div>
                <span className="text-slate-300 font-medium">{formatKey(key)}</span>
              </div>
            );
          })}
        </div>
        
        {rating.capsAlignment.bloomTaxonomy && rating.capsAlignment.bloomTaxonomy.length > 0 && (
          <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider block mb-1.5">Identified Bloom's Cognitive Levels:</span>
            <div className="flex flex-wrap gap-1.5">
              {rating.capsAlignment.bloomTaxonomy.map((level, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                  {level}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feedback lists */}
      <div className="space-y-4 pt-2 border-t border-white/5">
        {rating.strengths && rating.strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-2">Curriculum Strengths</h4>
            <ul className="space-y-1.5">
              {rating.strengths.map((strength, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 select-none mt-0.5 font-bold">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {rating.improvements && rating.improvements.length > 0 && (
          <div>
            <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-2">Actionable Suggestions</h4>
            <ul className="space-y-1.5">
              {rating.improvements.map((improvement, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 select-none mt-0.5 font-bold">•</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  checkContentQuality,
  QualityRatingDisplay,
  performBasicQualityCheck
};
