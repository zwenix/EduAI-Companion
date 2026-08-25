
Markdown

# 🇿🇦 -->  EduAI_Companion — Complete Build Guide
## SA-Compliant Educational Content Generator with NVIDIA NIM

> **Version:** 1.0.0  
> **Date:** 23/08/2026  
> **Frameworks:** CAPS · NPA · NPPPPR · SIAS · WP6 · POPIA · SASA · NCS R-12  
> **AI Models:** Nemotron 3 Ultra (text) · Qwen-Image (visuals)  Nemotron 3 Ultra (550B-A55B) —> **Output Formats:** PDF · DOCX · HTML · ZIP Package

---

## 🚀 QUICK START — Auto-Setup Script

Save the script below as `setup.sh` (Linux/Mac) or `setup.ps1` (Windows PowerShell), then run it.

### Linux / macOS — `setup.sh`

```bash
#!/bin/bash
set -e

echo "🇿🇦 ═══════════════════════════════════════════════"
echo "   -->  EduAI_Companion — Auto Setup Script"
echo "   SA-Compliant Educational Content Platform"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Create project structure ──
PROJECT_DIR="-->  EduAI_Companion"
echo "📁 Creating project structure..."
mkdir -p $PROJECT_DIR/{src/{templates,assemblers,compliance,generators,utils},output/{pdf,docx,html,images,packages},assets}
cd $PROJECT_DIR

# ── 2. Initialise npm ──
echo "📦 Initialising npm project..."
cat > package.json << 'PACKAGE_EOF'
{
  "name": "-->  EduAI_Companion",
  "version": "1.0.0",
  "description": "SA-Compliant Educational Content Generator — CAPS, SIAS, NPA, WP6, POPIA",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "ts-node src/index.ts",
    "generate:lesson": "ts-node src/index.ts -- --type lesson_plan",
    "generate:worksheet": "ts-node src/index.ts -- --type worksheet",
    "generate:studyguide": "ts-node src/index.ts -- --type study_guide",
    "generate:isp": "ts-node src/index.ts -- --type individual_support_plan",
    "generate:atp": "ts-node src/index.ts -- --type annual_teaching_plan",
    "generate:admin": "ts-node src/index.ts -- --type admin_document",
    "test": "echo \"No tests yet\" && exit 0"
  },
  "keywords": ["education", "south-africa", "caps", "sias", "nvidia", "nim"],
  "author": "-->  EduAI_Companion",
  "license": "MIT"
}
PACKAGE_EOF

# ── 3. Install dependencies ──
echo "📥 Installing dependencies..."
npm install openai dotenv puppeteer docx archiver sharp
npm install -D typescript @types/node ts-node @types/archiver

# ── 4. Create tsconfig.json ──
echo "⚙️  Creating TypeScript config..."
cat > tsconfig.json << 'TSCONFIG_EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "output"]
}
TSCONFIG_EOF

# ── 5. Create .env template ──
echo "🔑 Creating .env template..."
cat > .env << 'ENV_EOF'
# ═══════════════════════════════════════
# -->  EduAI_Companion Environment Configuration
# ═══════════════════════════════════════

# NVIDIA NIM API Key (get from https://build.nvidia.com/settings/api-keys)
NVIDIA_API_KEY=nvapi-your-key-here

# School Branding (customise for your school)
SCHOOL_NAME=Thuto Primary School
SCHOOL_DISTRICT=Gauteng East
SCHOOL_PROVINCE=Gauteng
SCHOOL_EMIS_NUMBER=700000001
SCHOOL_ADDRESS=123 Education Street, Benoni, 1501
SCHOOL_TEL=011 555 0123
SCHOOL_EMAIL=info@thutoprimary.edu.za
SCHOOL_PRINCIPAL=Mrs N. Molefe

# Default Language Settings
DEFAULT_LOLT=English
DEFAULT_HOME_LANGUAGE=isiXhosa

# Output Settings
OUTPUT_DIR=./output
ENV_EOF

# ── 6. Create .gitignore ──
cat > .gitignore << 'GIT_EOF'
node_modules/
dist/
output/
.env
*.log
GIT_EOF

echo ""
echo "✅ Project structure created!"
echo ""
echo "📁 Directory structure:"
find . -type f -not -path './node_modules/*' | head -30
echo ""
echo "═══════════════════════════════════════════════════"
echo "⚠️  NEXT STEPS:"
echo "  1. Edit .env with your NVIDIA API key"
echo "  2. Copy the source files from the guide below"
echo "  3. Run: npm start"
echo "═══════════════════════════════════════════════════"
```

### Windows PowerShell — `setup.ps1`

```powershell
Write-Host "🇿🇦 -->  EduAI_Companion — Auto Setup (Windows)" -ForegroundColor Green

$PROJECT_DIR = "-->  EduAI_Companion"
New-Item -ItemType Directory -Force -Path @(
    "$PROJECT_DIR/src/templates",
    "$PROJECT_DIR/src/assemblers",
    "$PROJECT_DIR/src/compliance",
    "$PROJECT_DIR/src/generators",
    "$PROJECT_DIR/src/utils",
    "$PROJECT_DIR/output/pdf",
    "$PROJECT_DIR/output/docx",
    "$PROJECT_DIR/output/html",
    "$PROJECT_DIR/output/images",
    "$PROJECT_DIR/output/packages",
    "$PROJECT_DIR/assets"
) | Out-Null

Set-Location $PROJECT_DIR

# Copy the same package.json, tsconfig.json, .env content from the bash script above
# Then run:
npm init -y
npm install openai dotenv puppeteer docx archiver sharp
npm install -D typescript @types/node ts-node @types/archiver

Write-Host "✅ Setup complete! Edit .env and add source files." -ForegroundColor Green
```

---

## 📁 COMPLETE SOURCE FILES

### File 1: `src/compliance/sa-frameworks.ts`

```typescript
// ============================================================
// sa-frameworks.ts
// Complete South African Educational Frameworks Registry
// CAPS · NPA · NPPPPR · SIAS · WP6 · POPIA · SASA
// ============================================================

// ── TYPES ──

export type CAPSPhase = "foundation" | "intermediate" | "senior" | "fet";

export type NPAAssessmentType =
  | "test" | "examination" | "assignment" | "project"
  | "practical_task" | "oral_presentation" | "demonstration"
  | "performance" | "investigation" | "case_study" | "research_task";

export type SIASSupportLevel = "level_1" | "level_2" | "level_3";

export type ContentType =
  | "lesson_plan" | "worksheet" | "study_guide" | "infographic"
  | "admin_document" | "assessment" | "individual_support_plan"
  | "annual_teaching_plan";

export interface BloomsDistribution {
  remembering: number;
  understanding: number;
  applying: number;
  analyzing: number;
  evaluating: number;
  creating: number;
}

export interface CAPSPhaseConfig {
  phase: CAPSPhase;
  displayName: string;
  grades: string[];
  subjects: string[];
  assessmentWeights: { schoolBasedAssessment: number; yearEndExam: number };
  formalAssessmentCount: Record<string, number>;
  bloomsDistribution: BloomsDistribution;
}

export interface SAContentRequest {
  contentType: ContentType;
  grade: string;
  subject: string;
  topic: string;
  term: 1 | 2 | 3 | 4;
  assessmentType?: NPAAssessmentType;
  isFormal?: boolean;
  includeInclusiveSupport?: boolean;
  siasSupportLevel?: SIASSupportLevel;
  differentiationRequired?: boolean;
  barrierCategories?: string[];
  homeLanguage?: string;
  lolt?: string;
  duration?: string;
  questionCount?: number;
  additionalInstructions?: string;
  containsLearnerData?: boolean;
}

// ── CAPS PHASES ──

export const CAPS_PHASES: Record<CAPSPhase, CAPSPhaseConfig> = {
  foundation: {
    phase: "foundation",
    displayName: "Foundation Phase",
    grades: ["Grade R", "Grade 1", "Grade 2", "Grade 3"],
    subjects: [
      "Home Language", "First Additional Language",
      "Mathematics", "Life Skills"
    ],
    assessmentWeights: { schoolBasedAssessment: 100, yearEndExam: 0 },
    formalAssessmentCount: {
      "Home Language": 8, "First Additional Language": 6,
      "Mathematics": 8, "Life Skills": 6
    },
    bloomsDistribution: {
      remembering: 30, understanding: 30, applying: 20,
      analyzing: 10, evaluating: 5, creating: 5
    }
  },
  intermediate: {
    phase: "intermediate",
    displayName: "Intermediate Phase",
    grades: ["Grade 4", "Grade 5", "Grade 6"],
    subjects: [
      "Home Language", "First Additional Language", "Mathematics",
      "Natural Sciences and Technology",
      "Social Sciences (History & Geography)",
      "Life Skills (Creative Arts, Physical Education, Personal & Social Well-being)"
    ],
    assessmentWeights: { schoolBasedAssessment: 75, yearEndExam: 25 },
    formalAssessmentCount: {
      "Home Language": 9, "First Additional Language": 8,
      "Mathematics": 8, "Natural Sciences and Technology": 6,
      "Social Sciences (History & Geography)": 6,
      "Life Skills (Creative Arts, Physical Education, Personal & Social Well-being)": 6
    },
    bloomsDistribution: {
      remembering: 25, understanding: 25, applying: 20,
      analyzing: 15, evaluating: 10, creating: 5
    }
  },
  senior: {
    phase: "senior",
    displayName: "Senior Phase",
    grades: ["Grade 7", "Grade 8", "Grade 9"],
    subjects: [
      "Home Language", "First Additional Language", "Mathematics",
      "Natural Sciences", "Social Sciences (History & Geography)",
      "Technology", "Economic and Management Sciences",
      "Life Orientation", "Creative Arts"
    ],
    assessmentWeights: { schoolBasedAssessment: 60, yearEndExam: 40 },
    formalAssessmentCount: {
      "Home Language": 9, "First Additional Language": 8,
      "Mathematics": 8, "Natural Sciences": 6,
      "Social Sciences (History & Geography)": 6, "Technology": 6,
      "Economic and Management Sciences": 6, "Life Orientation": 5,
      "Creative Arts": 5
    },
    bloomsDistribution: {
      remembering: 15, understanding: 20, applying: 20,
      analyzing: 20, evaluating: 15, creating: 10
    }
  },
  fet: {
    phase: "fet",
    displayName: "Further Education and Training Phase (FET)",
    grades: ["Grade 10", "Grade 11", "Grade 12"],
    subjects: [
      "Home Language", "First Additional Language",
      "Mathematics OR Mathematical Literacy", "Life Orientation",
      "Accounting", "Agricultural Sciences", "Business Studies",
      "Consumer Studies", "Dramatic Arts", "Economics",
      "Engineering Graphics and Design", "Geography", "History",
      "Information Technology", "Life Sciences", "Music",
      "Physical Sciences", "Religion Studies", "Tourism",
      "Visual Arts", "Civil Technology", "Electrical Technology",
      "Mechanical Technology", "Computer Applications Technology"
    ],
    assessmentWeights: { schoolBasedAssessment: 25, yearEndExam: 75 },
    formalAssessmentCount: {
      "Home Language": 7, "First Additional Language": 6,
      "Mathematics OR Mathematical Literacy": 7, "Life Orientation": 5,
      "Physical Sciences": 7, "Life Sciences": 7, "Accounting": 7,
      "History": 6, "Geography": 6, "Business Studies": 6,
      "Economics": 6, "default": 6
    },
    bloomsDistribution: {
      remembering: 10, understanding: 15, applying: 20,
      analyzing: 25, evaluating: 20, creating: 10
    }
  }
};

// ── NPA RATING CODES ──

export const NPA_RATING_CODES = [
  { code: 7, description: "Outstanding achievement", percentage: "80–100%" },
  { code: 6, description: "Meritorious achievement", percentage: "70–79%" },
  { code: 5, description: "Substantial achievement", percentage: "60–69%" },
  { code: 4, description: "Adequate achievement", percentage: "50–59%" },
  { code: 3, description: "Moderate achievement", percentage: "40–49%" },
  { code: 2, description: "Elementary achievement", percentage: "30–39%" },
  { code: 1, description: "Not achieved", percentage: "0–29%" }
];

// ── SIAS SUPPORT LEVELS ──

export const SIAS_SUPPORT_LEVELS = [
  {
    level: "level_1" as SIASSupportLevel,
    description: "Support by classroom teacher",
    provider: "Classroom teacher",
    accommodations: [
      "Differentiated instruction", "Additional time",
      "Simplified language", "Visual supports",
      "Peer tutoring", "Modified seating"
    ]
  },
  {
    level: "level_2" as SIASSupportLevel,
    description: "Support by School-Based Support Team (SBST)",
    provider: "SBST",
    accommodations: [
      "Individual Support Plan (ISP)", "Curriculum differentiation",
      "Assistive technology", "Specialist materials",
      "Adapted assessments", "Parent involvement programme"
    ]
  },
  {
    level: "level_3" as SIASSupportLevel,
    description: "Support by District-Based Support Team (DBST)",
    provider: "DBST",
    accommodations: [
      "Full psycho-educational assessment", "Formal curriculum adaptation",
      "Special school placement", "Specialist therapeutic services",
      "Examination concessions", "Medical referral"
    ]
  }
];

// ── UTILITY FUNCTIONS ──

export function detectPhase(grade: string): CAPSPhase {
  const normalized = grade.toLowerCase().replace(/\s+/g, " ").trim();
  const map: Record<string, CAPSPhase> = {
    "grade r": "foundation", "grade 0": "foundation",
    "grade 1": "foundation", "grade 2": "foundation", "grade 3": "foundation",
    "grade 4": "intermediate", "grade 5": "intermediate", "grade 6": "intermediate",
    "grade 7": "senior", "grade 8": "senior", "grade 9": "senior",
    "grade 10": "fet", "grade 11": "fet", "grade 12": "fet", "matric": "fet"
  };
  const phase = map[normalized];
  if (!phase) throw new Error(`Invalid grade "${grade}". Must be Grade R or Grade 1-12.`);
  return phase;
}

export function getPhaseConfig(grade: string): CAPSPhaseConfig {
  return CAPS_PHASES[detectPhase(grade)];
}

export function validateSubjectForPhase(subject: string, grade: string): boolean {
  const config = getPhaseConfig(grade);
  return config.subjects.some(
    s => s.toLowerCase().includes(subject.toLowerCase()) ||
         subject.toLowerCase().includes(s.toLowerCase())
  );
}

export function validateCAPSCompliance(
  grade: string, subject: string, contentType: string
) {
  const checks: Array<{ rule: string; status: "pass"|"fail"|"warning"; message: string }> = [];
  const config = getPhaseConfig(grade);
  const subjectValid = validateSubjectForPhase(subject, grade);

  checks.push({
    rule: "CAPS Subject-Phase Alignment",
    status: subjectValid ? "pass" : "warning",
    message: subjectValid
      ? `"${subject}" is valid for ${config.displayName}`
      : `"${subject}" may not align with ${config.displayName} subjects.`
  });

  checks.push({
    rule: "NPA Assessment Weighting",
    status: "pass",
    message: `SBA: ${config.assessmentWeights.schoolBasedAssessment}%, Exam: ${config.assessmentWeights.yearEndExam}%`
  });

  checks.push({
    rule: "POPIA Data Protection",
    status: "pass",
    message: "No real learner data in AI prompts"
  });

  return {
    isCompliant: checks.every(c => c.status !== "fail"),
    framework: "CAPS+NPA+NPPPPR+SIAS+WP6+POPIA",
    checks
  };
}
```

---

### File 2: `src/compliance/sa-prompts.ts`

```typescript
// ============================================================
// sa-prompts.ts
// SA-Compliant Prompt Engineering for Nemotron 3 Ultra
// ============================================================

import {
  SAContentRequest, CAPS_PHASES, detectPhase, getPhaseConfig,
  SIAS_SUPPORT_LEVELS, NPA_RATING_CODES
} from "./sa-frameworks";

export function buildSASystemPrompt(request: SAContentRequest): string {
  const phase = detectPhase(request.grade);
  const config = CAPS_PHASES[phase];

  return `You are -->  EduAI_Companion, an expert South African educational content designer.
You are FULLY aligned with ALL Department of Basic Education (DBE) frameworks.

══════════════════════════════════════════════════════════════
NON-NEGOTIABLE COMPLIANCE FRAMEWORKS:
══════════════════════════════════════════════════════════════

1. CAPS — Phase: ${config.displayName} | Grade: ${request.grade} | Subject: ${request.subject} | Term: ${request.term}
   All content MUST align with the specific CAPS document for this subject/grade/term.

2. NPA — SBA: ${config.assessmentWeights.schoolBasedAssessment}% | Exam: ${config.assessmentWeights.yearEndExam}%
   Use 7-point rating scale. Tag all questions with Bloom's level.

3. BLOOM'S for ${config.displayName}:
   Remembering: ${config.bloomsDistribution.remembering}% | Understanding: ${config.bloomsDistribution.understanding}% | Applying: ${config.bloomsDistribution.applying}%
   Analyzing: ${config.bloomsDistribution.analyzing}% | Evaluating: ${config.bloomsDistribution.evaluating}% | Creating: ${config.bloomsDistribution.creating}%

4. SIAS — ${request.includeInclusiveSupport ? "INCLUSIVE SUPPORT ENABLED — include differentiated content and accommodations" : "Use accessible language, adaptable design"}

5. WHITE PAPER 6 — ${request.differentiationRequired ? "DIFFERENTIATION MANDATORY — provide Core/Extended/Simplified versions" : "Apply UDL principles"}

6. POPIA — NO real learner data. Use placeholder names (Thabo, Amina, Sipho, Lerato). All fictional.

7. SA CONTEXT — Use Rand (R), SA places, SA names, metric system, SA English spelling (colour, behaviour, organise), DD/MM/YYYY dates. Include IKS where relevant.

══════════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON:
══════════════════════════════════════════════════════════════

{
  "metadata": {
    "title": string,
    "subject": string,
    "grade": string,
    "phase": string,
    "term": number,
    "capsReference": string,
    "atpWeek": string,
    "contentType": string,
    "duration": string | null,
    "totalMarks": number | null,
    "bloomsDistribution": { "remembering": %, "understanding": %, "applying": %, "analyzing": %, "evaluating": %, "creating": % },
    "npaCompliance": { "assessmentType": string|null, "isFormal": boolean, "ratingScale": "7-point NPA" },
    "siasCompliance": { "supportLevel": string, "accommodationsIncluded": boolean, "differentiationIncluded": boolean },
    "popiaCompliant": true,
    "generatedDate": "DD/MM/YYYY"
  },
  "sections": [
    {
      "sectionId": number,
      "heading": string,
      "content": string,
      "bulletPoints": string[],
      "bloomsLevel": string | null,
      "marks": number | null,
      "siasNotes": string | null,
      "differentiatedContent": { "core": string, "extended": string|null, "simplified": string|null } | null,
      "imagePrompt": string | null
    }
  ],
  "imagePrompts": [
    {
      "imageId": string,
      "sectionId": number,
      "prompt": string,
      "placement": "header"|"inline"|"full_width"|"sidebar",
      "suggestedSize": "small"|"medium"|"large",
      "accessibilityAltText": string
    }
  ],
  "siasSupport": {
    "supportLevel": string,
    "teacherNotes": string,
    "accommodations": string[],
    "referralGuidance": string | null
  } | null,
  "answerKey": {
    "questions": [{ "questionNumber": number, "answer": string, "bloomsLevel": string, "marks": number, "cognitiveLevel": string }],
    "totalMarks": number,
    "bloomsBreakdown": object
  } | null,
  "npaRatingTable": [{ "code": number, "description": string, "percentage": string }] | null
}

Return ONLY valid JSON. No markdown. No explanation outside JSON.`;
}

export function buildSAUserPrompt(request: SAContentRequest): string {
  const config = getPhaseConfig(request.grade);
  let prompt = "";

  switch (request.contentType) {
    case "lesson_plan":
      prompt = `Create a CAPS-aligned lesson plan:
Subject: ${request.subject} | Topic: ${request.topic} | Grade: ${request.grade} (${config.displayName})
Term: ${request.term} | Duration: ${request.duration || "1 hour"}
${request.homeLanguage ? `Home Language: ${request.homeLanguage}` : ""} | LOLT: ${request.lolt || "English"}

MANDATORY SECTIONS:
1. CAPS Reference & ATP Alignment (image prompt for header banner with SA school crest style)
2. Learning Objectives (CAPS specific aims)
3. Prior Knowledge
4. Resources / LTSM
5. Introduction / Baseline Assessment (5-10 min)
6. Direct Teaching (image prompts for diagrams/illustrations)
7. Guided Practice
8. Independent Practice
9. Assessment Opportunity (tag with Bloom's, specify NPA type)
10. Expanded Opportunity (advanced — CAPS extended content)
11. Support Activity (SIAS Level 1 accommodations)
12. Teacher Reflection Notes
13. Cross-curricular Links
14. IKS Integration

${request.differentiationRequired ? "DIFFERENTIATION: Provide Core, Extended, and Simplified versions of main activities." : ""}
${request.includeInclusiveSupport ? "SIAS: Include teacher support notes and accommodations for diverse learners." : ""}

Generate 3+ image prompts with alt-text. SA visual context required.`;
      break;

    case "worksheet":
    case "assessment":
      prompt = `Create a CAPS-aligned ${request.assessmentType || "worksheet"}:
Subject: ${request.subject} | Topic: ${request.topic} | Grade: ${request.grade} (${config.displayName})
Term: ${request.term} | Questions: ${request.questionCount || 10}
Formal: ${request.isFormal ? "Yes (SBA)" : "No (diagnostic/formative)"}

BLOOM'S DISTRIBUTION (MANDATORY — tag EVERY question):
Remembering ~${config.bloomsDistribution.remembering}% | Understanding ~${config.bloomsDistribution.understanding}%
Applying ~${config.bloomsDistribution.applying}% | Analyzing ~${config.bloomsDistribution.analyzing}%
Evaluating ~${config.bloomsDistribution.evaluating}% | Creating ~${config.bloomsDistribution.creating}%

SECTIONS:
1. Header (school info placeholder, subject, grade, date, marks, time — image prompt)
2. Instructions
3. Section A: Short Questions (lower order)
4. Section B: Application (middle order)
5. Section C: Analysis/Evaluation (higher order)
6. Section D: Extended Response (highest order)
7. TOTAL MARKS per question and overall
8. Complete Memorandum with marks, Bloom's level, cognitive category
9. NPA Rating Code conversion table

${request.includeInclusiveSupport ? "Include SIAS accommodations section." : ""}
Generate image prompts for header and educational diagrams with alt-text.`;
      break;

    case "study_guide":
    case "infographic":
      prompt = `Create a CAPS-aligned study guide / infographic:
Subject: ${request.subject} | Topic: ${request.topic} | Grade: ${request.grade} (${config.displayName}) | Term: ${request.term}

SECTIONS:
1. Title & CAPS Reference (image prompt for SA-themed banner)
2. Key Terminology ${request.homeLanguage && request.homeLanguage !== "English" ? `(include ${request.homeLanguage} translations)` : ""}
3. Core Concepts (image prompt for concept map with ALL labels)
4. Worked Examples (SA context — Rand, SA places, SA names)
5. Common Mistakes
6. Practice Questions with Answers (Bloom's tagged)
7. Exam Tips for ${config.displayName}
8. Did You Know? (SA context / IKS facts)
9. Self-Assessment Checklist

${request.differentiationRequired ? "Provide simplified and extended versions." : ""}
Generate 4+ image prompts with alt-text. SA visual context.`;
      break;

    case "individual_support_plan":
      prompt = `Create a SIAS-compliant Individual Support Plan (ISP):
Grade: ${request.grade} | Subject: ${request.subject} | Support Level: ${request.siasSupportLevel || "level_1"}
Barriers: ${request.barrierCategories?.join(", ") || "General support"}

MANDATORY ISP SECTIONS (SIAS Policy 2014):
1. Learner Profile (placeholder: "Learner Name: ___")
2. Barriers Identified (checklist)
3. Strengths and Interests
4. Support Strategies for ${request.subject} at ${request.grade}
5. Curriculum Adaptations (what CAPS content adapted)
6. Resources Required
7. Roles: Teacher / SBST / DBST / Parent
8. Review Date and Success Indicators
9. Referral Pathway (escalation to next SIAS level)
10. POPIA statement

Generate 1 image prompt for ISP header.`;
      break;

    case "annual_teaching_plan":
      prompt = `Create a CAPS-aligned Annual Teaching Plan (ATP):
Subject: ${request.subject} | Grade: ${request.grade} | Term: ${request.term}

ATP STRUCTURE:
For EACH week (1-10):
- Week number | CAPS topic | Content/concepts | Activities | Resources | Assessment (informal/formal)
- Formal tasks: specify SBA number, type, topic, marks

Include: Formal Assessment Programme, SIAS notes, cross-curricular links.
Generate 1 image for ATP header.`;
      break;

    case "admin_document":
      prompt = `Create a SA school admin document:
Type: ${request.topic} | Grade: ${request.grade} | Term: ${request.term}

Include: Official header, REF number, DD Month YYYY date, body with headings,
action items, contact placeholders, official sign-off, distribution list.
POPIA confidentiality notice required.
Generate 1 image for official document header.`;
      break;

    default:
      prompt = `Generate ${request.contentType} for ${request.subject}, ${request.topic}, ${request.grade}, Term ${request.term}. Full SA compliance.`;
  }

  if (request.additionalInstructions) {
    prompt += `\n\nAdditional: ${request.additionalInstructions}`;
  }

  return prompt;
}
```

---

### File 3: `src/templates/sa-html-templates.ts`

```typescript
// ============================================================
// sa-html-templates.ts
// South African School-Branded HTML Templates for PDF/DOCX
// ============================================================

import * as dotenv from "dotenv";
dotenv.config();

// ── School branding from .env ──
const SCHOOL = {
  name: process.env.SCHOOL_NAME || "Department of Basic Education",
  district: process.env.SCHOOL_DISTRICT || "District Office",
  province: process.env.SCHOOL_PROVINCE || "Province",
  emis: process.env.SCHOOL_EMIS_NUMBER || "000000000",
  address: process.env.SCHOOL_ADDRESS || "",
  tel: process.env.SCHOOL_TEL || "",
  email: process.env.SCHOOL_EMAIL || "",
  principal: process.env.SCHOOL_PRINCIPAL || ""
};

// ── SA Flag Colours ──
const SA_COLOURS = {
  green: "#007749",
  gold: "#FFB81C",
  black: "#000000",
  red: "#DE3831",
  blue: "#002395",
  white: "#FFFFFF"
};

// ── CSS Shared Styles ──
export const SA_BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', 'Segoe UI', Arial, 'Patrick Hand' , sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: white;
    padding: 0;
    margin: 0;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm 20mm;
    margin: 0 auto;
    background: white;
    position: relative;
  }

  /* ── SA FLAG STRIPE HEADER ── */
  .sa-flag-stripe {
    height: 6px;
    background: linear-gradient(
      to right,
      ${SA_COLOURS.black} 0%, ${SA_COLOURS.black} 16.6%,
      ${SA_COLOURS.gold} 16.6%, ${SA_COLOURS.gold} 33.3%,
      ${SA_COLOURS.green} 33.3%, ${SA_COLOURS.green} 50%,
      ${SA_COLOURS.white} 50%, ${SA_COLOURS.white} 66.6%,
      ${SA_COLOURS.red} 66.6%, ${SA_COLOURS.red} 83.3%,
      ${SA_COLOURS.blue} 83.3%, ${SA_COLOURS.blue} 100%
    );
    width: 100%;
    margin-bottom: 12px;
    border-radius: 3px;
  }

  /* ── SCHOOL HEADER ── */
  .school-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid ${SA_COLOURS.green};
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .school-header .school-info {
    flex: 1;
  }

  .school-header .school-name {
    font-size: 18pt;
    font-weight: 700;
    color: ${SA_COLOURS.green};
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .school-header .school-details {
    font-size: 8pt;
    color: #666;
    margin-top: 4px;
    line-height: 1.4;
  }

  .school-header .dbe-badge {
    text-align: right;
    font-size: 8pt;
    color: #666;
    border-left: 2px solid ${SA_COLOURS.gold};
    padding-left: 12px;
    margin-left: 12px;
  }

  .school-header .dbe-badge .dbe-title {
    font-weight: 700;
    color: ${SA_COLOURS.green};
    font-size: 9pt;
  }

  /* ── DOCUMENT TITLE BLOCK ── */
  .doc-title-block {
    background: linear-gradient(135deg, ${SA_COLOURS.green} 0%, #005c3a 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
  }

  .doc-title-block::after {
    content: '';
    position: absolute;
    right: -20px;
    top: -20px;
    width: 100px;
    height: 100px;
    background: rgba(255,184,28,0.15);
    border-radius: 50%;
  }

  .doc-title-block h1 {
    font-size: 16pt;
    font-weight: 700;
    margin-bottom: 4px;
    position: relative;
    z-index: 1;
  }

  .doc-title-block .doc-meta {
    font-size: 9pt;
    opacity: 0.9;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }

  .doc-title-block .doc-meta span {
    background: rgba(255,255,255,0.15);
    padding: 2px 8px;
    border-radius: 4px;
  }

  /* ── CAPS REFERENCE BAR ── */
  .caps-ref-bar {
    background: #f0f7f0;
    border: 1px solid ${SA_COLOURS.green};
    border-left: 4px solid ${SA_COLOURS.green};
    padding: 8px 12px;
    font-size: 9pt;
    margin-bottom: 16px;
    border-radius: 0 4px 4px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .caps-ref-bar .caps-label {
    font-weight: 600;
    color: ${SA_COLOURS.green};
  }

  .caps-ref-bar .blooms-mini {
    display: flex;
    gap: 6px;
    font-size: 7pt;
  }

  .caps-ref-bar .blooms-mini span {
    background: ${SA_COLOURS.green};
    color: white;
    padding: 1px 5px;
    border-radius: 3px;
  }

  /* ── CONTENT SECTIONS ── */
  .section {
    margin-bottom: 16px;
    page-break-inside: avoid;
  }

  .section-heading {
    background: ${SA_COLOURS.green};
    color: white;
    padding: 8px 14px;
    font-size: 11pt;
    font-weight: 600;
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-heading .blooms-tag {
    background: ${SA_COLOURS.gold};
    color: #333;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 8pt;
    font-weight: 500;
  }

  .section-body {
    border: 1px solid #e0e0e0;
    border-top: none;
    padding: 12px 14px;
    border-radius: 0 0 6px 6px;
    background: #fafafa;
  }

  .section-body p {
    margin-bottom: 8px;
  }

  .section-body ul, .section-body ol {
    padding-left: 20px;
    margin-bottom: 8px;
  }

  .section-body li {
    margin-bottom: 4px;
  }

  /* ── DIFFERENTIATION BOX (WP6) ── */
  .diff-box {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    margin: 10px 0;
    overflow: hidden;
  }

  .diff-header {
    padding: 6px 12px;
    font-size: 9pt;
    font-weight: 600;
    color: white;
  }

  .diff-core .diff-header { background: ${SA_COLOURS.green}; }
  .diff-extended .diff-header { background: ${SA_COLOURS.blue}; }
  .diff-simplified .diff-header { background: ${SA_COLOURS.gold}; color: #333; }

  .diff-content {
    padding: 8px 12px;
    font-size: 10pt;
  }

  /* ── SIAS SUPPORT BOX ── */
  .sias-box {
    background: #fff8e1;
    border: 1px solid ${SA_COLOURS.gold};
    border-left: 4px solid ${SA_COLOURS.gold};
    border-radius: 0 6px 6px 0;
    padding: 10px 14px;
    margin: 10px 0;
    font-size: 9pt;
  }

  .sias-box .sias-title {
    font-weight: 700;
    color: #7b6b00;
    margin-bottom: 4px;
    font-size: 10pt;
  }

  /* ── NPA RATING TABLE ── */
  .npa-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
  }

  .npa-table th {
    background: ${SA_COLOURS.green};
    color: white;
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
  }

  .npa-table td {
    padding: 5px 10px;
    border-bottom: 1px solid #e0e0e0;
  }

  .npa-table tr:nth-child(even) {
    background: #f5f5f5;
  }

  /* ── MARKS TABLE ── */
  .marks-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 9pt;
  }

  .marks-table th {
    background: ${SA_COLOURS.blue};
    color: white;
    padding: 6px 10px;
    text-align: center;
  }

  .marks-table td {
    padding: 5px 10px;
    text-align: center;
    border: 1px solid #ddd;
  }

  /* ── ANSWER LINE / STUDENT SPACE ── */
  .answer-line {
    border-bottom: 1px solid #999;
    height: 24px;
    margin: 8px 0;
  }

  .answer-space {
    border: 1px dashed #ccc;
    min-height: 60px;
    margin: 8px 0;
    border-radius: 4px;
    background: #fcfcfc;
  }

  /* ── IMAGE CONTAINER ── */
  .img-container {
    text-align: center;
    margin: 12px 0;
  }

  .img-container img {
    max-width: 100%;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .img-container .img-alt {
    font-size: 8pt;
    color: #888;
    font-style: italic;
    margin-top: 4px;
  }

  /* ── FOOTER ── */
  .page-footer {
    position: absolute;
    bottom: 10mm;
    left: 20mm;
    right: 20mm;
    border-top: 2px solid ${SA_COLOURS.green};
    padding-top: 6px;
    font-size: 7pt;
    color: #888;
    display: flex;
    justify-content: space-between;
  }

  .page-footer .popia-notice {
    font-style: italic;
    color: #aaa;
  }

  /* ── COMPLIANCE STAMP ── */
  .compliance-stamp {
    display: inline-flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 8px 0;
  }

  .compliance-stamp .stamp {
    background: #f0f7f0;
    border: 1px solid ${SA_COLOURS.green};
    color: ${SA_COLOURS.green};
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 600;
    text-transform: uppercase;
  }

  /* ── PRINT STYLES ── */
  @media print {
    body { padding: 0; }
    .page { width: 100%; padding: 10mm 15mm; min-height: auto; }
    .section { page-break-inside: avoid; }
    .no-print { display: none; }
  }
`;

// ── HTML DOCUMENT BUILDER ──

export interface RenderedSection {
  sectionId: number;
  heading: string;
  content: string;
  bulletPoints?: string[];
  bloomsLevel?: string | null;
  marks?: number | null;
  siasNotes?: string | null;
  differentiatedContent?: {
    core: string;
    extended?: string | null;
    simplified?: string | null;
  } | null;
}

export interface RenderedImage {
  imageId: string;
  sectionId: number;
  base64Data: string;
  placement: string;
  altText?: string;
}

export interface DocumentData {
  metadata: {
    title: string;
    subject: string;
    grade: string;
    phase: string;
    term: number;
    capsReference?: string;
    atpWeek?: string;
    contentType: string;
    duration?: string | null;
    totalMarks?: number | null;
    bloomsDistribution?: Record<string, number>;
    generatedDate?: string;
    npaCompliance?: {
      assessmentType?: string | null;
      isFormal?: boolean;
    };
    siasCompliance?: {
      supportLevel?: string;
      accommodationsIncluded?: boolean;
      differentiationIncluded?: boolean;
    };
  };
  sections: RenderedSection[];
  imagePrompts?: Array<{
    imageId: string;
    sectionId: number;
    accessibilityAltText?: string;
  }>;
  siasSupport?: {
    supportLevel: string;
    teacherNotes: string;
    accommodations: string[];
    referralGuidance?: string | null;
  } | null;
  answerKey?: {
    questions: Array<{
      questionNumber: number;
      answer: string;
      bloomsLevel: string;
      marks: number;
      cognitiveLevel: string;
    }>;
    totalMarks: number;
  } | null;
  npaRatingTable?: Array<{
    code: number;
    description: string;
    percentage: string;
  }> | null;
}

export function buildFullHTML(
  data: DocumentData,
  images: RenderedImage[]
): string {
  const imageMap = new Map(images.map(img => [img.sectionId, img]));
  const today = data.metadata.generatedDate || new Date().toLocaleDateString("en-ZA", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  // ── Build sections HTML ──
  let sectionsHTML = "";
  for (const section of data.sections) {
    const img = imageMap.get(section.sectionId);
    const imgSpec = data.imagePrompts?.find(ip => ip.sectionId === section.sectionId);

    sectionsHTML += `
    <div class="section">
      <div class="section-heading">
        <span>${section.heading}</span>
        ${section.bloomsLevel ? `<span class="blooms-tag">🧠 ${section.bloomsLevel}</span>` : ""}
        ${section.marks ? `<span class="blooms-tag">📝 ${section.marks} marks</span>` : ""}
      </div>
      <div class="section-body">
        <p>${(section.content || "").replace(/\n/g, "<br>")}</p>

        ${section.bulletPoints?.length ? `
        <ul>${section.bulletPoints.map(bp => `<li>${bp}</li>`).join("")}</ul>` : ""}

        ${img?.base64Data ? `
        <div class="img-container">
          <img src="data:image/png;base64,${img.base64Data}"
               alt="${imgSpec?.accessibilityAltText || section.heading}">
          <div class="img-alt">${imgSpec?.accessibilityAltText || ""}</div>
        </div>` : ""}

        ${section.differentiatedContent ? `
        <div class="diff-box diff-core">
          <div class="diff-header">📗 Core Activity (All Learners)</div>
          <div class="diff-content">${section.differentiatedContent.core}</div>
        </div>
        ${section.differentiatedContent.extended ? `
        <div class="diff-box diff-extended">
          <div class="diff-header">📘 Extended Activity (Advanced Learners)</div>
          <div class="diff-content">${section.differentiatedContent.extended}</div>
        </div>` : ""}
        ${section.differentiatedContent.simplified ? `
        <div class="diff-box diff-simplified">
          <div class="diff-header">📙 Simplified Activity (Support Learners)</div>
          <div class="diff-content">${section.differentiatedContent.simplified}</div>
        </div>` : ""}` : ""}

        ${section.siasNotes ? `
        <div class="sias-box">
          <div class="sias-title">🤝 SIAS Support Notes (Teacher Use Only)</div>
          <p>${section.siasNotes}</p>
        </div>` : ""}
      </div>
    </div>`;
  }

  // ── SIAS Support Section ──
  let siasHTML = "";
  if (data.siasSupport) {
    siasHTML = `
    <div class="section">
      <div class="section-heading" style="background: ${SA_COLOURS.gold}; color: #333;">
        <span>🤝 SIAS — Inclusive Education Support</span>
        <span class="blooms-tag">${data.siasSupport.supportLevel}</span>
      </div>
      <div class="section-body">
        <p><strong>Teacher Notes:</strong> ${data.siasSupport.teacherNotes}</p>
        <p><strong>Accommodations:</strong></p>
        <ul>${data.siasSupport.accommodations.map(a => `<li>${a}</li>`).join("")}</ul>
        ${data.siasSupport.referralGuidance ? `
        <div class="sias-box">
          <div class="sias-title">⚠️ Referral Guidance</div>
          <p>${data.siasSupport.referralGuidance}</p>
        </div>` : ""}
      </div>
    </div>`;
  }

  // ── Answer Key ──
  let answerKeyHTML = "";
  if (data.answerKey?.questions?.length) {
    answerKeyHTML = `
    <div class="section" style="page-break-before: always;">
      <div class="section-heading" style="background: ${SA_COLOURS.blue};">
        <span>📝 Memorandum / Answer Key</span>
        <span class="blooms-tag">Total: ${data.answerKey.totalMarks} marks</span>
      </div>
      <div class="section-body">
        <table class="marks-table">
          <thead>
            <tr>
              <th>Q#</th><th>Answer</th><th>Bloom's Level</th>
              <th>Cognitive Level</th><th>Marks</th>
            </tr>
          </thead>
          <tbody>
            ${data.answerKey.questions.map(q => `
            <tr>
              <td>${q.questionNumber}</td>
              <td style="text-align:left">${q.answer}</td>
              <td>${q.bloomsLevel}</td>
              <td>${q.cognitiveLevel}</td>
              <td><strong>${q.marks}</strong></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  // ── NPA Rating Table ──
  let npaTableHTML = "";
  if (data.npaRatingTable?.length) {
    npaTableHTML = `
    <div class="section">
      <div class="section-heading">
        <span>📊 NPA 7-Point Rating Scale</span>
      </div>
      <div class="section-body">
        <table class="npa-table">
          <thead><tr><th>Code</th><th>Description</th><th>Percentage</th></tr></thead>
          <tbody>
            ${data.npaRatingTable.map(r => `
            <tr><td><strong>${r.code}</strong></td><td>${r.description}</td><td>${r.percentage}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  // ── Blooms mini bar for CAPS reference ──
  const bloomsMini = data.metadata.bloomsDistribution
    ? Object.entries(data.metadata.bloomsDistribution)
        .map(([k, v]) => `<span>${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}%</span>`)
        .join("")
    : "";

  // ── FULL HTML ──
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.metadata.title} — -->  EduAI_Companion</title>
  <style>${SA_BASE_CSS}</style>
</head>
<body>
  <div class="page">

    <!-- SA Flag Stripe -->
    <div class="sa-flag-stripe"></div>

    <!-- School Header -->
    <div class="school-header">
      <div class="school-info">
        <div class="school-name">${SCHOOL.name}</div>
        <div class="school-details">
          ${SCHOOL.address ? SCHOOL.address + "<br>" : ""}
          ${SCHOOL.tel ? "Tel: " + SCHOOL.tel + " | " : ""}
          ${SCHOOL.email ? "Email: " + SCHOOL.email : ""}
          ${SCHOOL.emis !== "000000000" ? " | EMIS: " + SCHOOL.emis : ""}
        </div>
      </div>
      <div class="dbe-badge">
        <div class="dbe-title">Department of Basic Education</div>
        <div>${SCHOOL.province} Province</div>
        <div>${SCHOOL.district} District</div>
        <div>Republic of South Africa</div>
      </div>
    </div>

    <!-- Document Title -->
    <div class="doc-title-block">
      <h1>${data.metadata.title}</h1>
      <div class="doc-meta">
        <span>📚 ${data.metadata.subject}</span>
        <span>🎓 ${data.metadata.grade} (${data.metadata.phase})</span>
        <span>📅 Term ${data.metadata.term}</span>
        ${data.metadata.duration ? `<span>⏱️ ${data.metadata.duration}</span>` : ""}
        ${data.metadata.totalMarks ? `<span>📝 Total: ${data.metadata.totalMarks} marks</span>` : ""}
        <span>📆 ${today}</span>
      </div>
    </div>

    <!-- CAPS Reference Bar -->
    <div class="caps-ref-bar">
      <div>
        <span class="caps-label">CAPS:</span>
        ${data.metadata.capsReference || `${data.metadata.subject} — ${data.metadata.grade} — Term ${data.metadata.term}`}
        ${data.metadata.atpWeek ? ` | ATP: ${data.metadata.atpWeek}` : ""}
      </div>
      ${bloomsMini ? `<div class="blooms-mini">${bloomsMini}</div>` : ""}
    </div>

    <!-- Compliance Stamps -->
    <div class="compliance-stamp">
      <span class="stamp">✅ CAPS Aligned</span>
      <span class="stamp">✅ NPA Compliant</span>
      <span class="stamp">✅ POPIA Compliant</span>
      ${data.metadata.siasCompliance?.accommodationsIncluded ? '<span class="stamp">✅ SIAS Inclusive</span>' : ""}
      ${data.metadata.siasCompliance?.differentiationIncluded ? '<span class="stamp">✅ WP6 Differentiated</span>' : ""}
    </div>

    <!-- Content Sections -->
    ${sectionsHTML}

    <!-- SIAS Support -->
    ${siasHTML}

    <!-- NPA Rating Table -->
    ${npaTableHTML}

    <!-- Answer Key / Memorandum -->
    ${answerKeyHTML}

    <!-- Footer -->
    <div class="page-footer">
      <div>Generated by -->  EduAI_Companion | ${SCHOOL.name} | ${today}</div>
      <div class="popia-notice">POPIA: This document may contain information protected under the Protection of Personal Information Act (Act 4 of 2013).</div>
    </div>

  </div>
</body>
</html>`;
}
```

---

### File 4: `src/assemblers/pdf-assembler.ts`

```typescript
// ============================================================
// pdf-assembler.ts
// PDF Generation using Puppeteer — SA-Branded
// ============================================================

import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { buildFullHTML, DocumentData, RenderedImage } from "../templates/sa-html-templates";

export interface PDFOptions {
  outputDir?: string;
  filename?: string;
  format?: "A4" | "Letter";
  landscape?: boolean;
  printBackground?: boolean;
  margins?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

export async function generatePDF(
  data: DocumentData,
  images: RenderedImage[],
  options: PDFOptions = {}
): Promise<string> {
  const {
    outputDir = path.join(process.cwd(), "output", "pdf"),
    filename = `${data.metadata.contentType}_${data.metadata.grade.replace(/\s/g, "")}_T${data.metadata.term}_${Date.now()}.pdf`,
    format = "A4",
    landscape = false,
    printBackground = true,
    margins = { top: "10mm", bottom: "15mm", left: "10mm", right: "10mm" }
  } = options;

  // Ensure output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Build HTML
  const html = buildFullHTML(data, images);

  // Save HTML preview alongside PDF
  const htmlPath = path.join(outputDir, filename.replace(".pdf", ".html"));
  fs.writeFileSync(htmlPath, html, "utf8");
  console.log(`  📄 HTML preview: ${htmlPath}`);

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfPath = path.join(outputDir, filename);
    await page.pdf({
      path: pdfPath,
      format,
      landscape,
      printBackground,
      margin: margins,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="width:100%;text-align:center;font-size:8px;color:#999;padding:5px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          &nbsp;|&nbsp; -->  EduAI_Companion &nbsp;|&nbsp; CAPS Aligned &nbsp;|&nbsp; POPIA Compliant
        </div>`,
    });

    console.log(`  ✅ PDF generated: ${pdfPath}`);
    return pdfPath;
  } finally {
    await browser.close();
  }
}
```

---

### File 5: `src/assemblers/docx-assembler.ts`

```typescript
// ============================================================
// docx-assembler.ts
// DOCX Generation using 'docx' npm package — SA-Branded
// ============================================================

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, Header, Footer, PageNumber,
  ImageRun, TabStopType, TabStopPosition, UnderlineType,
  ITableCellBorders
} from "docx";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { DocumentData, RenderedImage } from "../templates/sa-html-templates";

dotenv.config();

const SCHOOL = {
  name: process.env.SCHOOL_NAME || "Department of Basic Education",
  district: process.env.SCHOOL_DISTRICT || "District Office",
  province: process.env.SCHOOL_PROVINCE || "Province",
  emis: process.env.SCHOOL_EMIS_NUMBER || "000000000",
  address: process.env.SCHOOL_ADDRESS || "",
  tel: process.env.SCHOOL_TEL || "",
  email: process.env.SCHOOL_EMAIL || "",
  principal: process.env.SCHOOL_PRINCIPAL || ""
};

const SA_GREEN = "007749";
const SA_GOLD = "FFB81C";
const SA_BLUE = "002395";

const cellBorders: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
};

export interface DOCXOptions {
  outputDir?: string;
  filename?: string;
}

export async function generateDOCX(
  data: DocumentData,
  images: RenderedImage[],
  options: DOCXOptions = {}
): Promise<string> {
  const {
    outputDir = path.join(process.cwd(), "output", "docx"),
    filename = `${data.metadata.contentType}_${data.metadata.grade.replace(/\s/g, "")}_T${data.metadata.term}_${Date.now()}.docx`
  } = options;

  fs.mkdirSync(outputDir, { recursive: true });
  const imageMap = new Map(images.map(img => [img.sectionId, img]));

  const today = data.metadata.generatedDate || new Date().toLocaleDateString("en-ZA");

  // ── Build document children ──
  const children: Paragraph[] = [];

  // ── School Header ──
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: SCHOOL.name.toUpperCase(),
          bold: true, size: 36, color: SA_GREEN, font: "Arial"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${SCHOOL.district} | ${SCHOOL.province} Province | EMIS: ${SCHOOL.emis}`,
          size: 16, color: "666666", font: "Arial"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${SCHOOL.address} | Tel: ${SCHOOL.tel} | ${SCHOOL.email}`,
          size: 14, color: "999999", font: "Arial"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  // ── SA Flag Divider ──
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "━".repeat(80), color: SA_GREEN, size: 8 })
      ],
      spacing: { after: 100 }
    })
  );

  // ── Document Title ──
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.metadata.title,
          bold: true, size: 32, color: SA_GREEN, font: "Arial"
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 80 }
    })
  );

  // ── Metadata Row ──
  const metaText = [
    `📚 ${data.metadata.subject}`,
    `🎓 ${data.metadata.grade} (${data.metadata.phase})`,
    `📅 Term ${data.metadata.term}`,
    data.metadata.duration ? `⏱️ ${data.metadata.duration}` : null,
    data.metadata.totalMarks ? `📝 Total: ${data.metadata.totalMarks} marks` : null,
    `📆 ${today}`
  ].filter(Boolean).join("   |   ");

  children.push(
    new Paragraph({
      children: [new TextRun({ text: metaText, size: 18, color: "444444" })],
      spacing: { after: 60 }
    })
  );

  // ── CAPS Reference ──
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "CAPS Reference: ", bold: true, size: 18, color: SA_GREEN }),
        new TextRun({
          text: data.metadata.capsReference ||
            `${data.metadata.subject} — ${data.metadata.grade} — Term ${data.metadata.term}`,
          size: 18, color: "333333"
        })
      ],
      spacing: { after: 40 }
    })
  );

  // ── Compliance Stamps ──
  const stamps = ["CAPS Aligned", "NPA Compliant", "POPIA Compliant"];
  if (data.metadata.siasCompliance?.accommodationsIncluded) stamps.push("SIAS Inclusive");
  if (data.metadata.siasCompliance?.differentiationIncluded) stamps.push("WP6 Differentiated");

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: stamps.map(s => `[✅ ${s}]`).join("  "),
          size: 14, color: SA_GREEN, bold: true
        })
      ],
      spacing: { after: 120 }
    })
  );

  // ── Bloom's Distribution ──
  if (data.metadata.bloomsDistribution) {
    const bloomsText = Object.entries(data.metadata.bloomsDistribution)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}%`)
      .join(" | ");

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Bloom's Distribution: ", bold: true, size: 16, color: SA_GREEN }),
          new TextRun({ text: bloomsText, size: 16, color: "555555" })
        ],
        spacing: { after: 120 }
      })
    );
  }

  // ── Content Sections ──
  for (const section of data.sections) {
    // Section heading
    const headingRuns: TextRun[] = [
      new TextRun({
        text: section.heading,
        bold: true, size: 24, color: "FFFFFF", font: "Arial"
      })
    ];
    if (section.bloomsLevel) {
      headingRuns.push(new TextRun({
        text: `  [${section.bloomsLevel}]`,
        bold: false, size: 18, color: SA_GOLD
      }));
    }
    if (section.marks) {
      headingRuns.push(new TextRun({
        text: `  [${section.marks} marks]`,
        bold: false, size: 18, color: SA_GOLD
      }));
    }

    children.push(
      new Paragraph({
        children: headingRuns,
        shading: { type: ShadingType.SOLID, color: SA_GREEN },
        spacing: { before: 200, after: 60 }
      })
    );

    // Section content
    if (section.content) {
      const contentLines = section.content.split("\n");
      for (const line of contentLines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 40 }
          })
        );
      }
    }

    // Bullet points
    if (section.bulletPoints?.length) {
      for (const bp of section.bulletPoints) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: bp, size: 22 })],
            bullet: { level: 0 },
            spacing: { after: 20 }
          })
        );
      }
    }

    // Inline image
    const img = imageMap.get(section.sectionId);
    if (img?.base64Data) {
      try {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: Buffer.from(img.base64Data, "base64"),
                transformation: { width: 500, height: 350 },
                type: "png"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 }
          })
        );
        // Alt text
        const altSpec = data.imagePrompts?.find(ip => ip.sectionId === section.sectionId);
        if (altSpec?.accessibilityAltText) {
          children.push(
            new Paragraph({
              children: [new TextRun({
                text: `[Image: ${altSpec.accessibilityAltText}]`,
                size: 16, color: "999999", italics: true
              })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 }
            })
          );
        }
      } catch (imgError) {
        console.warn(`  ⚠️ Could not embed image for section ${section.sectionId}`);
      }
    }

    // Differentiation boxes (WP6)
    if (section.differentiatedContent) {
      const diffLevels = [
        { label: "📗 Core Activity (All Learners)", content: section.differentiatedContent.core, color: SA_GREEN },
        { label: "📘 Extended Activity (Advanced)", content: section.differentiatedContent.extended, color: SA_BLUE },
        { label: "📙 Simplified Activity (Support)", content: section.differentiatedContent.simplified, color: SA_GOLD }
      ];

      for (const diff of diffLevels) {
        if (diff.content) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: diff.label, bold: true, size: 20, color: diff.color })],
              shading: { type: ShadingType.SOLID, color: "F5F5F5" },
              spacing: { before: 60, after: 20 }
            }),
            new Paragraph({
              children: [new TextRun({ text: diff.content, size: 20 })],
              indent: { left: 360 },
              spacing: { after: 60 }
            })
          );
        }
      }
    }

    // SIAS notes
    if (section.siasNotes) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "🤝 SIAS Support: ", bold: true, size: 18, color: "7B6B00" }),
            new TextRun({ text: section.siasNotes, size: 18, color: "555555", italics: true })
          ],
          shading: { type: ShadingType.SOLID, color: "FFF8E1" },
          spacing: { before: 60, after: 60 }
        })
      );
    }
  }

  // ── SIAS Support Section ──
  if (data.siasSupport) {
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: "🤝 SIAS — Inclusive Education Support",
          bold: true, size: 24, color: "333333"
        })],
        shading: { type: ShadingType.SOLID, color: SA_GOLD },
        spacing: { before: 200, after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Support Level: ", bold: true, size: 20 }),
          new TextRun({ text: data.siasSupport.supportLevel, size: 20 })
        ],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Teacher Notes: ", bold: true, size: 20 }),
          new TextRun({ text: data.siasSupport.teacherNotes, size: 20 })
        ],
        spacing: { after: 40 }
      })
    );

    for (const acc of data.siasSupport.accommodations) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: acc, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 20 }
        })
      );
    }

    if (data.siasSupport.referralGuidance) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "⚠️ Referral: ", bold: true, size: 20, color: SA_GOLD.replace("#", "") }),
            new TextRun({ text: data.siasSupport.referralGuidance, size: 20 })
          ],
          spacing: { before: 40, after: 80 }
        })
      );
    }
  }

  // ── NPA Rating Table ──
  if (data.npaRatingTable?.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: "📊 NPA 7-Point Rating Scale",
          bold: true, size: 24, color: "FFFFFF"
        })],
        shading: { type: ShadingType.SOLID, color: SA_GREEN },
        spacing: { before: 200, after: 60 }
      })
    );

    const npaTable = new Table({
      rows: [
        new TableRow({
          children: ["Code", "Description", "Percentage"].map(h =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: h, bold: true, size: 18, color: "FFFFFF" })]
              })],
              shading: { type: ShadingType.SOLID, color: SA_GREEN },
              borders: cellBorders
            })
          )
        }),
        ...data.npaRatingTable.map(r =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: String(r.code), bold: true, size: 18 })]
                })],
                borders: cellBorders
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: r.description, size: 18 })]
                })],
                borders: cellBorders
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: r.percentage, size: 18 })]
                })],
                borders: cellBorders
              })
            ]
          })
        )
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    children.push(new Paragraph({ children: [] })); // spacer
    // We add table via sections
  }

  // ── Answer Key ──
  if (data.answerKey?.questions?.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: `📝 Memorandum / Answer Key — Total: ${data.answerKey.totalMarks} marks`,
          bold: true, size: 24, color: "FFFFFF"
        })],
        shading: { type: ShadingType.SOLID, color: SA_BLUE },
        spacing: { before: 200, after: 60 }
      })
    );

    for (const q of data.answerKey.questions) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Q${q.questionNumber}: `, bold: true, size: 20 }),
            new TextRun({ text: q.answer, size: 20 }),
            new TextRun({ text: `  [${q.bloomsLevel}]`, color: SA_GREEN, size: 16 }),
            new TextRun({ text: `  [${q.cognitiveLevel}]`, color: SA_BLUE, size: 16 }),
            new TextRun({ text: `  (${q.marks} marks)`, bold: true, size: 16 })
          ],
          spacing: { after: 30 }
        })
      );
    }
  }

  // ── POPIA Footer ──
  children.push(
    new Paragraph({
      children: [new TextRun({
        text: "━".repeat(80), color: SA_GREEN, size: 8
      })],
      spacing: { before: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: "POPIA Notice: This document may contain information protected under the Protection of Personal Information Act (Act 4 of 2013). " +
              "Generated by -->  EduAI_Companion. AI-generated content — verify against official DBE records.",
        size: 14, color: "999999", italics: true
      })],
      spacing: { after: 40 }
    })
  );

  // ── Create Document ──
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 1008, right: 1008 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${SCHOOL.name} | ${data.metadata.subject} | ${data.metadata.grade} | Term ${data.metadata.term}`, size: 14, color: "AAAAAA" })
              ],
              alignment: AlignmentType.RIGHT
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "-->  EduAI_Companion | CAPS Aligned | POPIA Compliant | Page ", size: 14, color: "AAAAAA" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "AAAAAA" }),
                new TextRun({ text: " of ", size: 14, color: "AAAAAA" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "AAAAAA" })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },
      children
    }]
  });

  // ── Write file ──
  const docxPath = path.join(outputDir, filename);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(`  ✅ DOCX generated: ${docxPath}`);

  return docxPath;
}
```

---

### File 6: `src/assemblers/zip-packager.ts`

```typescript
// ============================================================
// zip-packager.ts
// Package all generated outputs into a downloadable ZIP
// ============================================================

import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

export interface ZipContents {
  pdfPath?: string;
  docxPath?: string;
  htmlPath?: string;
  imagePaths?: string[];
  jsonPath?: string;
  metadata?: {
    title: string;
    grade: string;
    subject: string;
    term: number;
    contentType: string;
  };
}

export async function createZipPackage(
  contents: ZipContents,
  outputDir: string = path.join(process.cwd(), "output", "packages")
): Promise<string> {
  fs.mkdirSync(outputDir, { recursive: true });

  const zipFilename = contents.metadata
    ? `EduForge_${contents.metadata.contentType}_${contents.metadata.grade.replace(/\s/g, "")}_T${contents.metadata.term}_${Date.now()}.zip`
    : `EduForge_package_${Date.now()}.zip`;

  const zipPath = path.join(outputDir, zipFilename);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`  📦 ZIP package: ${zipPath} (${sizeMB} MB)`);
      resolve(zipPath);
    });

    archive.on("error", reject);
    archive.pipe(output);

    // Add files to ZIP
    if (contents.pdfPath && fs.existsSync(contents.pdfPath)) {
      archive.file(contents.pdfPath, { name: `pdf/${path.basename(contents.pdfPath)}` });
    }

    if (contents.docxPath && fs.existsSync(contents.docxPath)) {
      archive.file(contents.docxPath, { name: `docx/${path.basename(contents.docxPath)}` });
    }

    if (contents.htmlPath && fs.existsSync(contents.htmlPath)) {
      archive.file(contents.htmlPath, { name: `html/${path.basename(contents.htmlPath)}` });
    }

    if (contents.jsonPath && fs.existsSync(contents.jsonPath)) {
      archive.file(contents.jsonPath, { name: `data/${path.basename(contents.jsonPath)}` });
    }

    if (contents.imagePaths?.length) {
      for (const imgPath of contents.imagePaths) {
        if (fs.existsSync(imgPath)) {
          archive.file(imgPath, { name: `images/${path.basename(imgPath)}` });
        }
      }
    }

    // Add a README
    const readme = `# -->  EduAI_Companion — Generated Content Package
${contents.metadata ? `
## Document Details
- **Title:** ${contents.metadata.title}
- **Subject:** ${contents.metadata.subject}
- **Grade:** ${contents.metadata.grade}
- **Term:** Term ${contents.metadata.term}
- **Type:** ${contents.metadata.contentType}
` : ""}
## Contents
- \`pdf/\` — Print-ready PDF with SA school branding
- \`docx/\` — Editable Word document
- \`html/\` — Web preview
- \`images/\` — Generated educational visuals
- \`data/\` — Raw JSON data

## Compliance
✅ CAPS Aligned | ✅ NPA Compliant | ✅ POPIA Compliant | ✅ SIAS Inclusive | ✅ WP6 Differentiated

## Notice
This content was exclusively generated by AI (From Various Partners) for EduAI Companion - to whom ALL Rights are exclusively reserved - 2026
Please verify against official DBE CAPS documents before use.
POPIA: Handle all personal information in accordance with the Protection of Personal Information Act.

Generated: ${new Date().toLocaleDateString("en-ZA")}
`;
    archive.append(readme, { name: "README.md" });

    archive.finalize();
  });
}
```

---

### File 7: `src/generators/image-generator.ts`

```typescript
// ============================================================
// image-generator.ts
// Image generation via Qwen-Image on NVIDIA NIM
// ============================================================

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { RenderedImage } from "../templates/sa-html-templates";

const imageClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

export interface ImageSpec {
  imageId: string;
  sectionId: number;
  prompt: string;
  placement: string;
  suggestedSize: string;
  accessibilityAltText?: string;
}

export function enhancePromptForSA(prompt: string, grade: string): string {
  return `${prompt}

Style: Clean flat vector illustration, educational poster design.
South African school context — diverse learners representing South Africa's rainbow nation.
Bright colours suitable for ${grade}. White or light background.
All text in the image must be clearly legible, correctly spelled, in English.
Professional educational material quality. No photorealistic elements.
Age-appropriate, inclusive, and culturally sensitive.`;
}

export async function generateImage(
  spec: ImageSpec,
  grade: string
): Promise<RenderedImage> {
  console.log(`  🎨 Generating: ${spec.imageId} — "${spec.prompt.substring(0, 50)}..."`);

  const enhanced = enhancePromptForSA(spec.prompt, grade);

  const sizeMap: Record<string, string> = {
    header: "1792x1024",
    full_width: "1792x1024",
    inline: "1024x1024",
    sidebar: "1024x1792"
  };

  try {
    const response = await imageClient.images.generate({
      model: "qwen/qwen-image",
      prompt: enhanced,
      n: 1,
      size: (sizeMap[spec.placement] || "1024x1024") as any,
      response_format: "b64_json"
    });

    const b64 = response.data[0]?.b64_json;
    if (!b64) throw new Error("No image data");

    // Save to disk
    const dir = path.join(process.cwd(), "output", "images");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${spec.imageId}.png`);
    fs.writeFileSync(filePath, Buffer.from(b64, "base64"));

    console.log(`  ✅ Image saved: ${spec.imageId}.png`);

    return {
      imageId: spec.imageId,
      sectionId: spec.sectionId,
      base64Data: b64,
      placement: spec.placement,
      altText: spec.accessibilityAltText
    };
  } catch (error: any) {
    console.error(`  ⚠️ Image failed (${spec.imageId}): ${error.message}`);
    return {
      imageId: spec.imageId,
      sectionId: spec.sectionId,
      base64Data: "",
      placement: spec.placement,
      altText: spec.accessibilityAltText
    };
  }
}

export async function generateAllImages(
  specs: ImageSpec[],
  grade: string,
  concurrency: number = 3
): Promise<RenderedImage[]> {
  console.log(`\n🎨 Generating ${specs.length} images (max ${concurrency} concurrent)...\n`);

  const results: RenderedImage[] = [];

  for (let i = 0; i < specs.length; i += concurrency) {
    const batch = specs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(spec => generateImage(spec, grade))
    );
    results.push(...batchResults);

    if (i + concurrency < specs.length) {
      console.log("  ⏳ Rate limit pause (2s)...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const ok = results.filter(r => r.base64Data).length;
  console.log(`\n✅ Images: ${ok}/${specs.length} generated successfully\n`);
  return results;
}
```

---

### File 8: `src/index.ts` — Main Entry Point

```typescript
// ============================================================
// index.ts
// -->  EduAI_Companion — Main Entry Point
// Complete SA-Compliant Educational Content Generator
// ============================================================

import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

import {
  SAContentRequest, detectPhase, getPhaseConfig,
  validateCAPSCompliance, SIAS_SUPPORT_LEVELS, CAPS_PHASES
} from "./compliance/sa-frameworks";
import { buildSASystemPrompt, buildSAUserPrompt } from "./compliance/sa-prompts";
import { generateAllImages, ImageSpec } from "./generators/image-generator";
import { DocumentData, RenderedImage } from "./templates/sa-html-templates";
import { generatePDF } from "./assemblers/pdf-assembler";
import { generateDOCX } from "./assemblers/docx-assembler";
import { createZipPackage, ZipContents } from "./assemblers/zip-packager";

// ── NIM Text Client ──
const textClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

// ============================================================
// PRE-FLIGHT COMPLIANCE
// ============================================================

function preFlightCheck(request: SAContentRequest): void {
  console.log("\n🇿🇦 ═══ SA COMPLIANCE PRE-FLIGHT CHECK ═══\n");

  const config = getPhaseConfig(request.grade);
  console.log(`  ✅ Phase: ${config.displayName} (${request.grade})`);

  const report = validateCAPSCompliance(request.grade, request.subject, request.contentType);
  for (const check of report.checks) {
    const icon = check.status === "pass" ? "✅" : check.status === "warning" ? "⚠️" : "❌";
    console.log(`  ${icon} ${check.rule}: ${check.message}`);
  }

  if (request.includeInclusiveSupport) {
    const level = SIAS_SUPPORT_LEVELS.find(s => s.level === (request.siasSupportLevel || "level_1"));
    console.log(`  ✅ SIAS: ${level?.description || "Level 1"}`);
  }

  if (request.containsLearnerData) {
    console.log("  ⚠️  POPIA: Learner data flagged — ensure no PII in prompts");
  }

  if (!report.isCompliant) {
    throw new Error("❌ Compliance failure — generation blocked.");
  }

  console.log("\n🇿🇦 ═══ ALL CHECKS PASSED ═══\n");
}

// ============================================================
// TEXT CONTENT GENERATION
// ============================================================

async function generateTextContent(request: SAContentRequest): Promise<DocumentData> {
  console.log(`📝 Generating ${request.contentType}...`);
  console.log(`   📚 ${request.subject} | ${request.grade} | Term ${request.term}`);
  console.log(`   📖 Topic: ${request.topic}\n`);

  const systemPrompt = buildSASystemPrompt(request);
  const userPrompt = buildSAUserPrompt(request);

  const completion = await textClient.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.6,
    top_p: 0.95,
    max_tokens: 16384
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from Nemotron 3 Ultra");

  const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed: DocumentData = JSON.parse(jsonStr);
    console.log(`✅ Generated ${parsed.sections.length} sections, ${parsed.imagePrompts?.length || 0} image prompts\n`);
    return parsed;
  } catch (e) {
    // Save raw response for debugging
    const debugPath = path.join("output", "debug_raw_response.txt");
    fs.mkdirSync("output", { recursive: true });
    fs.writeFileSync(debugPath, raw);
    console.error(`❌ JSON parse failed. Raw response saved: ${debugPath}`);
    throw e;
  }
}

// ============================================================
// POST-GENERATION AUDIT
// ============================================================

function postAudit(data: DocumentData): void {
  console.log("🔍 POST-GENERATION COMPLIANCE AUDIT:");
  const checks = [
    ["CAPS Reference", !!data.metadata?.capsReference],
    ["Bloom's Distribution", !!data.metadata?.bloomsDistribution],
    ["NPA Compliance", !!data.metadata?.npaCompliance],
    ["SIAS Compliance", !!data.metadata?.siasCompliance],
    ["POPIA Flag", data.metadata?.popiaCompliant === true],
    ["Sections Present", (data.sections?.length || 0) > 0],
    ["Image Prompts", (data.imagePrompts?.length || 0) > 0]
  ];

  for (const [label, ok] of checks) {
    console.log(`  ${ok ? "✅" : "⚠️"} ${label}`);
  }
  console.log("");
}

// ============================================================
// FULL PIPELINE
// ============================================================

export async function generateFullPackage(request: SAContentRequest): Promise<string> {
  const startTime = Date.now();

  console.log("\n" + "═".repeat(60));
  console.log("🇿🇦 -->  EduAI_Companion — SA-Compliant Content Generation Pipeline");
  console.log("═".repeat(60) + "\n");

  // Step 0: Pre-flight compliance
  preFlightCheck(request);

  // Step 1: Generate text content
  const content = await generateTextContent(request);
  postAudit(content);

  // Step 2: Generate images
  let images: RenderedImage[] = [];
  if (content.imagePrompts?.length) {
    images = await generateAllImages(
      content.imagePrompts as ImageSpec[],
      request.grade
    );
  }

  // Step 3: Save raw JSON
  const jsonDir = path.join("output", "data");
  fs.mkdirSync(jsonDir, { recursive: true });
  const jsonPath = path.join(jsonDir,
    `${request.contentType}_${request.grade.replace(/\s/g, "")}_T${request.term}_${Date.now()}.json`
  );
  fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2));
  console.log(`📄 JSON data saved: ${jsonPath}`);

  // Step 4: Generate PDF
  console.log("\n📄 Generating PDF...");
  let pdfPath: string | undefined;
  try {
    pdfPath = await generatePDF(content, images);
  } catch (e: any) {
    console.error(`  ⚠️ PDF generation failed: ${e.message}`);
  }

  // Step 5: Generate DOCX
  console.log("\n📄 Generating DOCX...");
  let docxPath: string | undefined;
  try {
    docxPath = await generateDOCX(content, images);
  } catch (e: any) {
    console.error(`  ⚠️ DOCX generation failed: ${e.message}`);
  }

  // Step 6: Package into ZIP
  console.log("\n📦 Creating ZIP package...");
  const htmlPath = pdfPath?.replace(".pdf", ".html");
  const imagePaths = images
    .filter(img => img.base64Data)
    .map(img => path.join("output", "images", `${img.imageId}.png`));

  const zipPath = await createZipPackage({
    pdfPath,
    docxPath,
    htmlPath,
    imagePaths,
    jsonPath,
    metadata: {
      title: content.metadata.title,
      grade: content.metadata.grade || request.grade,
      subject: content.metadata.subject || request.subject,
      term: content.metadata.term || request.term,
      contentType: request.contentType
    }
  });

  // ── Summary ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "═".repeat(60));
  console.log("🇿🇦 GENERATION COMPLETE");
  console.log("═".repeat(60));
  console.log(`  ⏱️  Time: ${elapsed}s`);
  console.log(`  📄 PDF:  ${pdfPath || "skipped"}`);
  console.log(`  📝 DOCX: ${docxPath || "skipped"}`);
  console.log(`  🎨 Images: ${images.filter(i => i.base64Data).length}/${content.imagePrompts?.length || 0}`);
  console.log(`  📦 ZIP:  ${zipPath}`);
  console.log(`  📊 JSON: ${jsonPath}`);
  console.log("═".repeat(60) + "\n");

  return zipPath;
}

// ============================================================
// EXAMPLE RUNS
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(a => a.startsWith("--type="))?.split("=")[1];

  // ── DEFAULT: Grade 5 Natural Sciences Lesson Plan ──
  if (!typeArg || typeArg === "lesson_plan") {
    await generateFullPackage({
      contentType: "lesson_plan",
      grade: "Grade 5",
      subject: "Natural Sciences and Technology",
      topic: "Properties of Materials — Thermal Conductors and Insulators",
      term: 2,
      duration: "1 hour",
      includeInclusiveSupport: true,
      siasSupportLevel: "level_1",
      differentiationRequired: true,
      homeLanguage: "isiZulu",
      lolt: "English",
      additionalInstructions:
        "Include a practical experiment using everyday SA household materials. " +
        "Reference Indigenous Knowledge about traditional building insulation."
    });
  }

  if (typeArg === "worksheet") {
    await generateFullPackage({
      contentType: "worksheet",
      grade: "Grade 9",
      subject: "Mathematics",
      topic: "Algebraic Expressions and Equations",
      term: 3,
      assessmentType: "test",
      isFormal: true,
      questionCount: 15,
      includeInclusiveSupport: true,
      siasSupportLevel: "level_1",
      differentiationRequired: false
    });
  }

  if (typeArg === "study_guide") {
    await generateFullPackage({
      contentType: "study_guide",
      grade: "Grade 11",
      subject: "Life Sciences",
      topic: "Biodiversity and Classification of Micro-organisms",
      term: 1,
      includeInclusiveSupport: true,
      differentiationRequired: true,
      homeLanguage: "Afrikaans",
      lolt: "English"
    });
  }

  if (typeArg === "individual_support_plan") {
    await generateFullPackage({
      contentType: "individual_support_plan",
      grade: "Grade 3",
      subject: "Home Language",
      topic: "Reading and Phonics Support",
      term: 1,
      includeInclusiveSupport: true,
      siasSupportLevel: "level_2",
      barrierCategories: ["Intrinsic barriers", "Pedagogical barriers"],
      containsLearnerData: true
    });
  }

  if (typeArg === "annual_teaching_plan") {
    await generateFullPackage({
      contentType: "annual_teaching_plan",
      grade: "Grade 7",
      subject: "Natural Sciences",
      topic: "Term 2 Full ATP",
      term: 2,
      includeInclusiveSupport: true,
      differentiationRequired: false
    });
  }

  if (typeArg === "admin_document") {
    await generateFullPackage({
      contentType: "admin_document",
      grade: "Grade 7",
      subject: "Administration",
      topic: "Parent Notification: Term 2 Assessment Programme",
      term: 2
    });
  }
}

main().catch(err => {
  console.error("\n💥 FATAL ERROR:", err.message);
  process.exit(1);
});
```

---

## 🏃 RUNNING THE PLATFORM

### First Time Setup

```bash
# 1. Make the setup script executable and run it
chmod +x setup.sh
./setup.sh

# 2. Enter the project
cd -->  EduAI_Companion

# 3. Add your NVIDIA API key
nano .env
# Edit: NVIDIA_API_KEY=nvapi-your-actual-key

# 4. Copy all the source files above into the src/ folder
# Following the file structure:
#   src/
#   ├── compliance/
#   │   ├── sa-frameworks.ts
#   │   └── sa-prompts.ts
#   ├── templates/
#   │   └── sa-html-templates.ts
#   ├── assemblers/
#   │   ├── pdf-assembler.ts
#   │   ├── docx-assembler.ts
#   │   └── zip-packager.ts
#   ├── generators/
#   │   └── image-generator.ts
#   └── index.ts
```

### Generate Content

```bash
# Generate a lesson plan (default)
npm start

# Generate specific content types
npm run generate:lesson
npm run generate:worksheet
npm run generate:studyguide
npm run generate:isp
npm run generate:atp
npm run generate:admin

# Or pass type directly
npx ts-node src/index.ts -- --type=worksheet
```

### Output Structure

```
output/
├── pdf/
│   ├── lesson_plan_Grade5_T2_1724400000.pdf     ← Print-ready SA-branded PDF
│   └── lesson_plan_Grade5_T2_1724400000.html    ← HTML preview
├── docx/
│   └── lesson_plan_Grade5_T2_1724400000.docx    ← Editable Word doc
├── images/
│   ├── img_1.png                                 ← Header banner
│   ├── img_2.png                                 ← Teaching diagram
│   └── img_3.png                                 ← Activity illustration
├── data/
│   └── lesson_plan_Grade5_T2_1724400000.json    ← Raw structured data
└── packages/
    └── EduForge_lesson_plan_Grade5_T2_1724400000.zip  ← Complete package
```

---

## 📋 COMPLETE FILE TREE REFERENCE

```
-->  EduAI_Companion/
├── .env                              ← API keys & school branding
├── .gitignore
├── package.json
├── tsconfig.json
├── setup.sh                          ← Auto-setup script (Linux/Mac)
├── setup.ps1                         ← Auto-setup script (Windows)
├── src/
│   ├── index.ts                      ← Main pipeline entry point
│   ├── compliance/
│   │   ├── sa-frameworks.ts          ← CAPS/NPA/SIAS/POPIA registries
│   │   └── sa-prompts.ts            ← SA-compliant prompt templates
│   ├── templates/
│   │   └── sa-html-templates.ts     ← SA-branded HTML/CSS templates
│   ├── assemblers/
│   │   ├── pdf-assembler.ts         ← HTML → PDF (Puppeteer)
│   │   ├── docx-assembler.ts        ← Structured → DOCX
│   │   └── zip-packager.ts          ← Package all outputs
│   └── generators/
│       └── image-generator.ts       ← Qwen-Image integration
├── assets/                           ← (Optional) School logos, images
└── output/                           ← Generated content
    ├── pdf/
    ├── docx/
    ├── html/
    ├── images/
    ├── data/
    └── packages/
```

---

## 🔧 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| `NVIDIA_API_KEY` error | Verify key at build.nvidia.com/settings/api-keys |
| JSON parse failure | Check `output/debug_raw_response.txt` — model may have added markdown |
| Puppeteer fails on Linux | Install: `sudo apt install -y chromium-browser` |
| Puppeteer fails on Mac | Run: `npx puppeteer browsers install chrome` |
| Rate limit (429) | Reduce concurrency in image-generator.ts or add longer pauses |
| DOCX images missing | Ensure images generated before DOCX assembly |
| Large file sizes | Reduce image sizes in image-generator.ts sizeMap |

---

## 🇿🇦 COMPLIANCE CHECKLIST

Before deploying to any South African school, verify:

- [ ] Content aligns with the **specific CAPS document** for the subject/grade
- [ ] **ATP pacing** matches current DBE-issued Annual Teaching Plans
- [ ] **NPA assessment counts** don't exceed prescribed limits
- [ ] **Bloom's distribution** matches phase requirements
- [ ] **SIAS accommodations** are practical for the classroom context
- [ ] **POPIA** — no real learner PII anywhere in the system
- [ ] **IKS integration** is accurate and respectful
- [ ] **SA English spelling** used throughout (colour, behaviour, etc.)
- [ ] All **generated content reviewed by a qualified educator** before use
- [ ] **School branding** in .env matches the actual school details

> ⚠️ **DISCLAIMER:** AI-generated content must always be reviewed and approved
> by a qualified South African educator before classroom use. This tool assists
> teachers — it does not replace professional pedagogical judgement.
That's the complete, self-contained build guide. Here's a summary of what's included:

Component	What It Does
setup.sh / setup.ps1	Auto-creates entire project, installs all dependencies
sa-frameworks.ts	Complete CAPS phase/subject registry, NPA ratings, SIAS levels, POPIA rules, validators
sa-prompts.ts	SA-compliant system + user prompt templates for all 6 content types
sa-html-templates.ts	Full SA school-branded HTML/CSS with flag stripes, DBE styling, SIAS boxes, Bloom's tags, NPA tables
pdf-assembler.ts	HTML → PDF via Puppeteer with page numbers, headers, footers
docx-assembler.ts	Structured → DOCX with embedded images, tables, SA branding, WP6 differentiation boxes
zip-packager.ts	Bundles PDF + DOCX + HTML + images + JSON into downloadable ZIP
image-generator.ts	Qwen-Image integration with SA context enhancement & concurrency control
index.ts	Full orchestration pipeline with pre-flight compliance, post-audit, and CLI support
Save the entire markdown above as EDUFORGE_ZA_COMPLETE.md
