# 🇿🇦 EduAI Companion — SA Compliance Integration Summary

> **Merged from:** `public/EDUAI_COMPANION_CAPS_CONTENT_FINAL.md` (CAPS document)
> **Date:** 25 August 2026
> **Status:** ✅ Fully Integrated

## 📋 What Was Merged

### 1. SA Compliance Frameworks (`src/lib/compliance/sa-frameworks.ts`)
- **CAPS Phases:** Foundation (R-3, 100% SBA), Intermediate (4-6, 75/25), Senior (7-9, 60/40), FET (10-12, 25/75)
- **Subjects:** Per-phase official DBE subjects (Foundation 4, Intermediate 6, Senior 9, FET 7+electives)
- **NPA Rating Codes:** 7-point scale Code 7 (80-100% Outstanding) → Code 1 (0-29% Not Achieved)
- **Blooms Distribution:** Phase-specific (Foundation 40/30/20/5/3/2 → FET 20/15/20/15/15/15)
- **SIAS Levels:** Level 1 (Classroom teacher), Level 2 (SBST), Level 3 (DBST), Level 4 (Special School)
- **Barriers & WP6:** Content/Process/Product/Environment differentiation strategies
- **POPIA:** Fictional names (Thabo, Amina...), no PII, confidentiality notices
- **SA Context:** Rand, DD/MM/YYYY, SA English spelling, SA places/animals/values, IKS, ubuntu
- **Utilities:** `detectPhase()`, `getPhaseConfig()`, `validateCAPSCompliance()`, `generateCAPSReference()`

### 2. SA Prompts (`src/lib/compliance/sa-prompts.ts`)
- **System Prompt Builder:** `buildSASystemPrompt()` — injects CAPS phase, NPA weights, Bloom's, SIAS, WP6, POPIA, SA context
- **User Prompt Builder:** `buildSAUserPrompt()` — content-type specific (lesson_plan, worksheet, assessment, study_guide, infographic, ISP, ATP, admin_document)
- **ISP Sections:** 11 mandatory per SIAS Policy 2014
- **Quality Checklist:** `buildSAQualityChecklist()` — CAPS/NPA/SIAS/POPIA verification

### 3. SA HTML Templates (`src/lib/templates/sa-html-templates.ts`)
- **SA Flag Stripe:** 6px gradient black→gold→green→white→red→blue
- **School Header:** DBE branded with EMIS, district, province
- **Document Title Block:** Green gradient #007749 with metadata pills
- **CAPS Reference Bar:** Green border with Bloom's mini tags
- **Compliance Stamps:** ✅ CAPS Aligned, NPA Compliant, POPIA Compliant, SIAS Inclusive, WP6 Differentiated
- **Differentiation Boxes:** Core (green #007749), Extended (blue #002395), Simplified (gold #FFB81C)
- **SIAS Box:** Gold #FFB81C border with teacher notes
- **NPA Table:** 7-point rating scale table
- **POPIA Footer:** 2026 date, confidentiality notice
- **Interfaces:** `DocumentData`, `RenderedImage`, `RenderedSection`

### 4. Image Generation Enhancement (`src/lib/imageGeneration.ts`)
- **Provider:** `flux` — FLUX.1-schnell via Hugging Face Inference Providers (`https://router.huggingface.co/hf-inference/models`), free tier (Qwen-Image on NVIDIA NIM retired 22 Oct 2026)
- **FLUX_CONFIG:** SizeMap header 1024x576, inline 1024x1024, full_width 1024x576, sidebar 768x1024 (FLUX.1-schnell grid, max 1024 px)
- **SA Enhancer:** `enhancePromptForSA()` — rainbow nation, Table Mountain/Kruger/protea, diverse SA learners, 300 DPI, Disney 3D style
- **Generation:** `generateImageFlux()` — backend proxy `/api/images/flux-generate` (Hugging Face Inference Providers → Cloudflare Workers AI) + direct HF router call in the APK
- **Batch:** `generateAllEducationalImages()` — walks the full provider graph, concurrency 2, 2s pause (from doc, safer than 3)
- **Priority:** flux (FLUX.1-schnell, primary) → pollinations (keyless) → gemini (secondary). Perchance and Qwen-Image are retired.
- **Options Extended:** `grade`, `subject`, `saContext`, `placement` header/inline/full_width/sidebar

### 5. Assemblers (`src/lib/assemblers/`)
- **pdf-assembler.ts:** Client (html2pdf.js) + Server (Puppeteer) with SA header/footer, page numbers
- **docx-assembler.ts:** Server (docx package) + Client (HTML fallback) with SA branding, differentiation, SIAS, NPA, POPIA
- **zip-packager.ts:** Server (archiver) + Client (JSZip) with README.md, COMPLIANCE_REPORT.md, images, JSON, PDF, DOCX, HTML
- **sa-document-assembler.ts:** Unified orchestration — HTML→PDF→DOCX→ZIP with progress callbacks

### 6. Content Pipeline (`src/services/saContentPipeline.ts`)
- **Pre-flight:** `preFlightCheck()` — CAPS phase detection, NPA weights, SIAS level, POPIA flag
- **Text Gen:** `generateSATextContent()` — uses existing `callMultiAi` (Nemotron 3 Ultra) + `safeJsonParse`
- **Image Gen:** `generateSAImages()` — FLUX.1-schnell with SA context, full provider graph, concurrency control
- **Audit:** `postAudit()` — CAPS ref, Bloom's, NPA, SIAS, POPIA, sections, images
- **Full Pipeline:** `generateFullSAPackage()` — 0:pre-flight, 1:text, 2:audit, 3:images, 4:checklist
- **Factory:** `mapContentCreatorToSARequest()` — maps ContentCreator UI to SAContentRequest

### 7. Prompt Engine (`src/lib/prompt-engine.ts`) v3.0
- **SA Compliance Mandate:** `buildSAComplianceMandate()` — CAPS phase, time allocation, NPA 7-point, Bloom's distribution, SIAS accommodations, WP6, POPIA, SA context (Rand, places, animals, values, IKS, 2026 year)
- **Extended Content Types:** `individual_support_plan`, `annual_teaching_plan`, `admin_document`, `assessment`, `diagram`, `mind-map`, `flashcard`, `homework`, `classroom-exercise`, `revision-pack`
- **SA Content Templates:** ISP (11 sections), ATP (weekly breakdown), Admin (official header with seal)
- **Image Prompt Enhancement:** FLUX-optimized, SA context (rainbow nation, diverse SA children, Table Mountain/Kruger, Rand), grade/subject aware

### 8. Master Prompt (`src/lib/prompts/master-prompt.ts`) v3.0
- **Frameworks:** CAPS, NPA (7-point, SBA/Exam weights, Bloom's tagging), SIAS (4 levels), WP6 (Core/Extended/Simplified), POPIA (Act 4 of 2013, placeholder names), SASA, NCS R-12
- **SA Context:** Rand (R), DD/MM/YYYY 2026, SA English spelling, 12 official languages, ubuntu, IKS, metric, SA places/animals/names
- **Visuals:** SA flag colours #000000 #FFB81C #007749 #FFFFFF #E31E24 #002395, flag stripe header, compliance stamps, Disney 3D diverse SA learners
- **FLUX Optimization:** All image prompts optimized for FLUX.1-schnell via Hugging Face — clean flat vector, educational poster, no text overlays, 300 DPI, legible text

### 9. Server (`server.ts`)
- **New Endpoint:** `POST /api/images/flux-generate` — Hugging Face Inference Providers
  - Model: `black-forest-labs/FLUX.1-schnell` (free), router `https://router.huggingface.co/hf-inference/models`
  - Bounded cold-start retry, then the legacy `api-inference.huggingface.co` host
  - Answers 501 + `{configured:false}` when `HUGGINGFACE_API_KEY` is unset (client skips FLUX for the session)
  - Returns a data URL with width/height/size
- **New Endpoint:** `POST /api/sa/generate-package` — SA-compliant full package
  - Pre-flight compliance via `validateCAPSCompliance`
  - Text generation via NVIDIA Nemotron 3 Ultra (or Gemini fallback)
  - Returns content + compliance report + compliance flags

### 10. AI Context (`src/contexts/AiContext.tsx`)
- **ImageProvider:** `'flux' | 'pollinations' | 'gemini-imagen'`; `perchance`, `qwen` and `qwen-image` migrate to `flux` on read
- **Default:** FLUX.1-schnell (Hugging Face), with keyless Pollinations as the guaranteed fallback

### 11. Unified AI Service (`src/services/unifiedAiService.ts`)
- **SA Fields Passed:** assessmentType, isFormal, includeInclusiveSupport, siasSupportLevel, differentiationRequired, barrierCategories, homeLanguage, lolt, questionCount, containsLearnerData, totalMarks, studentName, teacherName

## 🔄 Duplicate Resolution Strategy
- **App Structure Kept Same:** No breaking changes to existing ContentCreator, Visual Lab, Admin Lab, Video Lab
- **Best Implementation Chosen:** 
  - Image gen: FLUX.1-schnell (Hugging Face) primary → Pollinations (keyless) → Gemini; Perchance and Qwen-Image retired on 22 Oct 2026
  - PDF/DOCX: New assemblers use dynamic imports to avoid client bundling issues, fallback to existing html2pdf
  - Prompts: Merged doc's SA compliance into existing master-prompt and prompt-engine (not replaced)
  - Templates: New SA templates are additive, existing ContentCreator HTML still works

## ✅ Verification
- `tsc --noEmit --skipLibCheck` passes for sa-frameworks, sa-prompts, sa-html-templates, prompt-engine, master-prompt, imageGeneration
- Assemblers compile (optional deps docx/puppeteer/archiver are dynamic imports)
- Server.ts compiles after fixing .ts extension imports
- Build requires npm install (sharp cert issue in sandbox, but --ignore-scripts works)

## 📦 Output Formats
- PDF: SA-branded with flag stripe, school header, compliance stamps, POPIA footer
- DOCX: Editable with differentiation boxes, SIAS support, NPA table, memorandum
- HTML: Web preview with Tailwind, SA branding
- ZIP: Bundle with pdf/docx/html/images/data + README + COMPLIANCE_REPORT

## 🔑 Environment Variables Required
- `HUGGINGFACE_API_KEY` (or `HF_TOKEN`) — for FLUX.1-schnell image generation (optional: keyless Pollinations is the fallback)
- `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` — optional second FLUX backend (Workers AI)
- `POLLINATIONS_API_KEY` — optional; removes the Pollinations 45-second free-tier throttle
- Existing: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, etc.

## 🎯 Next Steps for User
1. Set `NVIDIA_API_KEY` in .env (get from https://build.nvidia.com/settings/api-keys)
2. Install optional assemblers deps if needed: `npm install docx archiver puppeteer jszip html2pdf.js`
3. Test image generation via Settings → Image Provider → FLUX.1-schnell
4. Generate SA-compliant content via ContentCreator — compliance stamps auto-included
5. Use new `/api/sa/generate-package` for full SA pipeline (optional)

## 📝 Notes
- Year fixed to 2026 (not 2024) everywhere per master prompt
- All image prompts include SA context: rainbow nation, diverse SA learners, Table Mountain/Kruger/protea, Rand
- POPIA: Only placeholder names, confidentiality notices in all footers
- Bloom's tags mandatory on every question per NPA
- Differentiation (Core/Extended/Simplified) per WP6
- SIAS accommodations per level 1-4
