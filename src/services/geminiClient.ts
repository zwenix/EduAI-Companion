// Client-side Gemini engine — a faithful port of the server's `/api/gemini/action`
// handler so AI features keep working inside the standalone Android APK (and any
// other environment without the Node backend).
//
// It uses the official Google Gen AI SDK (web build) directly with the baked-in
// API key, replicating the same model fallback chain and prompt engineering as
// `server.ts`.

import { GoogleGenAI } from '@google/genai';
import { AI_SECRETS } from '../lib/aiSecrets';
import { MASTER_SYSTEM_PROMPT, IMAGE_PROMPT_GOLDEN_RULE, safeJsonParse } from './geminiService';
import { EduAIPromptEngine } from '../lib/prompt-engine';
import { buildInstructorPriority, EDUCATIONAL_IMAGE_STYLE } from '../lib/prompt-priority';

const GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: AI_SECRETS.GEMINI_API_KEY });
  }
  return _client;
}

async function generateWithFallback(options: any): Promise<any> {
  let lastError: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      return await getClient().models.generateContent({ model, ...options });
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || '');
      // If the key itself is bad (auth/permission) stop trying other models.
      if (/permission|api key|auth|forbidden|invalid.*key|401/i.test(msg)) {
        throw err;
      }
      console.warn(`[client-gemini] model '${model}' unavailable, trying next…`, msg);
    }
  }
  throw lastError || new Error('All Gemini models unavailable');
}

const stripDataUrl = (item: string) => {
  if (typeof item !== 'string' || !item.startsWith('data:')) {
    return { mimeType: 'image/jpeg', base64Data: item };
  }
  const p = item.split(';base64,');
  if (p.length === 2) {
    return { mimeType: p[0].replace('data:', '').split(';')[0], base64Data: p[1] };
  }
  return { mimeType: 'image/jpeg', base64Data: item.split(',')[1] || item };
};

const JSON_EDUCATIONAL_HINT = `\nReturn a valid JSON object with the following keys: content (string), memo (string), rubric (string), assessmentCriteria (string), successIndicators (array of strings), imagePrompt (string).`;

const JSON_VISUAL_HINT = `\nReturn a valid JSON object with the following keys: content (string), description (string), printInstructions (string), imagePrompt (string).`;

const JSON_ADMIN_HINT = `\nReturn a valid JSON object with the following keys: content (string), notes (string), documentType (string), imagePrompt (string).`;

export async function callGeminiClientDirect(action: string, input: any): Promise<any> {
  switch (action) {
    case 'quality-check': {
      const { prompt: qualityPrompt } = input || {};
      const response = await generateWithFallback({
        contents: qualityPrompt || 'Evaluate CAPS compliance and provide educational feedback',
      });
      return { text: response.text || '' };
    }

    case 'generate-educational': {
      const { type, details } = input;
      const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN. NEVER INJECT <script src="https://cdn.tailwindcss.com"></script>. The app already has Tailwind.`;
      const response = await generateWithFallback({
        contents: `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design). Do NOT add Tailwind CDN scripts.`,
        config: { systemInstruction, temperature: 0.7 },
      });
      return { text: response.text || '' };
    }

    case 'generate-caps': {
      const isLessonPlan = ['Lesson Plan', 'Weekly Lesson Plan', 'Unit Plan', 'lesson-plan'].includes(input.contentType);
      const isStudyGuide = ['Study Guide / Learning Notes', 'Revision Pack', 'Daily Lesson Notes', 'Learning Activity'].includes(input.contentType);
      let contentTypeEng: 'lesson-plan' | 'worksheet' | 'study-guide' = 'worksheet';
      if (isLessonPlan) contentTypeEng = 'lesson-plan';
      else if (isStudyGuide) contentTypeEng = 'study-guide';

      const { system, user } = EduAIPromptEngine.assemblePrompt({
        contentType: contentTypeEng,
        grade: input.grade || '4',
        subject: input.subject || 'Mathematics',
        topic: input.topic || 'Addition',
        language: input.language || 'English',
        learnerProfile: input.learnerProfile || 'General Class',
        additionalInstructions: input.additionalInstructions || '',
        term: input.term || '1',
        week: input.week ? parseInt(input.week) : undefined,
        duration: input.duration || '2 hours',
        capsReference: input.capsReference || '',
        includeWorksheet: !!input.includeWorksheet,
      });

      let finalUserPrompt = user;
      if (input.existingContent) {
        finalUserPrompt = `The previous content generation was truncated due to character limits. Here is the content generated so far:\n\n${input.existingContent}\n\nCRITICAL INSTRUCTION: Continue generating the rest of the document seamlessly from exactly where it left off. Do not repeat anything already generated. Complete all remaining sections, summaries, worksheets, or rubrics until the document is 100% complete.`;
      } else {
        finalUserPrompt += `\n\n📌 MANDATORY QUALITY ENHANCEMENTS:\n1. TEACHER NOTES & TIME ALLOCATIONS: Include a dedicated Teacher Notes section with formal/informal assessment recommendations and explicit minute-by-minute time allocations per phase.\n2. DIFFERENTIATION STRATEGIES: Include explicit built-in differentiation strategies (support for English Additional Language / EAL learners, extra time/scaffolding accommodations, and extension tasks for advanced learners).\n3. PRINTABLE ILLUSTRATION DESCRIPTIONS: Ensure every [Illustration: ...] placeholder has a vivid, self-contained description suitable as both an image generation prompt and a printable text description.`;
        if (input.generateImage) {
          finalUserPrompt += `\n\n⚠️ CRITICAL ILLUSTRATION REQUIREMENT: You MUST include at least 2-3 inline illustration placeholders using the exact format: [Illustration: <vivid, detailed description of an educational graphic depicting the topic in South African context>]. Place them strategically inside the HTML.`;
        } else {
          finalUserPrompt += `\n\n⚠️ CRITICAL: DO NOT include any illustration or image placeholders in the content. Keep it purely text and standard structural HTML.`;
        }
        finalUserPrompt += JSON_EDUCATIONAL_HINT;
      }

      const response = await generateWithFallback({
        contents: finalUserPrompt,
        config: {
          maxOutputTokens: 8192,
          systemInstruction: system,
          responseMimeType: 'application/json',
        },
      });
      return safeJsonParse(response.text);
    }

    case 'generate-visual': {
      const effectiveLang = input.language || (input.subject?.includes('Afrikaans') ? 'Afrikaans' : input.subject?.includes('Xhosa') ? 'isiXhosa' : 'English');
      const langMandate = EduAIPromptEngine.buildLanguageMandate(effectiveLang, input.subject);
      let systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;
      if (langMandate) systemInstruction = `${langMandate}\n\n${systemInstruction}`;

      const isPoster = input.visualType?.toLowerCase().includes('poster');
      const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
      const isLessonDisplay = input.visualType?.toLowerCase().includes('display') || input.visualType?.toLowerCase().includes('chart') || input.visualType?.toLowerCase().includes('wall') || input.visualType?.toLowerCase().includes('lesson display');
      const isDiagram = input.visualType?.toLowerCase().includes('diagram');
      const isFlashcard = input.visualType?.toLowerCase().includes('flashcard') || input.visualType?.toLowerCase().includes('learning card');

      let visualPrompt = '';
      if (isPoster) {
        visualPrompt = `Create an exceptionally polished, high-resolution educational poster layout on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.\nCRITICAL RULE: DO NOT generate quiz questions, exam exercises, worksheets, homework, fill-in-the-blanks, or assessment tasks. This is exclusively a visual teaching aid.\nAESTHETICS & STRUCTURE SPECIFICATION:\n1. Clean Visual Hierarchy: Establish a clear flow from the top down. Use a generous, modern header banner, well-spaced bento-grid sections, and an impressive footer.\n2. Minimalist Vector Style: Keep illustrations, icons, and layout clean, elegant, and modern.\n3. Color Palette: Use a cohesive, premium palette of 3-4 professional colors.\n4. Central Visual Component: A spectacular hero section featuring a minimalist vector style illustration portraying "${input.topic}".\n5. Content Blocks: Present key concepts inside elegantly spaced card containers with large headers, concise bullet points (4-8 words), and relevant emojis.`;
      } else if (isInfographic) {
        visualPrompt = `Design an incredibly structured, premium academic infographic on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.\nCRITICAL RULE: DO NOT generate homework, questions, assessment exercises, or study guides with dense text. Focus on graphics, statistics, and high-impact visual layouts.\nAESTHETICS & STRUCTURE SPECIFICATION:\n1. High-Resolution Educational Poster Layout: Organize complex theories into a dual-column matrix or an asymmetrical bento grid structure.\n2. Minimalist Vector Style: Icons, graphics, charts, and mascots must be styled as modern flat minimalist vector graphics.\n3. Clean Visual Hierarchy: Guide the eye with clean numbered points, bold colored accents, distinct callout panels, and elegant divider ribbons.\n4. Concept breakdown: Each section must feature a descriptive visual mockup placeholder alongside hyper-concise capsule bullet facts.\n5. Visual Anchors: Include a striking comparison matrix or a centered concentric diagram showing relationships cleanly.`;
      } else if (isLessonDisplay) {
        visualPrompt = `Design a stunning, high-resolution visual Lesson Display / Anchor Chart on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.\nCRITICAL RULE: This is a permanent reference display, not a quiz or activity workbook. Ensure zero assessment activities or worksheet blocks.\nAESTHETICS & STRUCTURE SPECIFICATION:\n1. High-Resolution Educational Poster Layout: Style this as a full-screen anchor chart with a bold, professional border and a large modern minimalist header.\n2. Clean Visual Hierarchy: Create high-contrast floating keyword cards, word-wall cards, or step-by-step process paths with generous negative space.\n3. Minimalist Vector Style: All diagram lines, connecting arrows, indicators, and background grids must use a sleek, modern minimalist vector style.\n4. Primary Focal Point: Frame a central diagram representing the core mechanism of "${input.topic}".\n5. Vocabulary Anchors: Highlight 4-6 key term definition cards with dashed colored borders, a neat custom emoji, and single-sentence explanations.`;
      } else if (isFlashcard) {
        visualPrompt = `Design a set of professional, double-sided visual educational flashcards for South African Grade ${input.grade} ${input.subject} on "${input.topic}".\nDESIGN REQUIREMENTS:\n- Grid Layout: Show multiple cards in a beautifully aligned grid (2 or 3 per row).\n- Each card must have a front side (large bold title, delightful icon/emoji, catchy hint) and a back side (clear conceptual explanation, a South African contextual/CAPS example, and a fun "Did you know?" fact box).\n- Aesthetics: Rounded-3xl corners, thick colored outlines (3px) that change color per card, and micro shadow depth. Use rich vibrant background gradients.`;
      } else if (isDiagram) {
        visualPrompt = `Create a crystal-clear, beautifully illustrated scientific diagram of "${input.topic}" specifically adapted for South African Grade ${input.grade} ${input.subject} learners.\nCRITICAL: This is a teaching demonstration visual aid. DO NOT write worksheet questions, exercises, or tests.\nDIAGRAM ARCHITECTURE:\n- Flow & Layout: Set against a highly realistic, vibrant South African biome / context (e.g. water cycles over the Drakensberg mountains, food webs of the Kruger savanna, or plant cell structure featuring indigenous fynbos/Proteas).\n- Connections: Draw bright, stylized, high-contrast flowing directional arrows pointing out movement, cycle flow, or ecosystem energy transfers.\n- Diagram Labels: Place 5-6 crisp, floating educational pointing cards connected to their targets.\n- Key/Legend: Include a small, highly tidy legend card at the bottom right with colorful indicator boxes explaining key parts.`;
      } else {
        visualPrompt = `Create a highly visual display, not a worksheet, for Grade ${input.grade} ${input.subject} on topic ${input.topic}. Ensure it is styled beautifully.`;
      }

      const instructorPriority = buildInstructorPriority(input.additionalInstructions);
      const selectedVisualStyle = input.style || EDUCATIONAL_IMAGE_STYLE;
      let prompt = '';
      if (input.existingContent) {
        prompt = `The previous visual aid content generation was truncated due to character limits. Here is the content generated so far:\n\n${input.existingContent}\n\nCRITICAL INSTRUCTION: Continue the visual aid seamlessly from exactly where it left off. Do not repeat anything already generated.`;
      } else {
        prompt = `${instructorPriority}\n${visualPrompt}\nLanguage: ${effectiveLang}\nSelected visual style (supporting default only): ${selectedVisualStyle}\nColour scheme (supporting default only): ${input.colorScheme || 'Bright Primary Colors'}\nContent details (supporting default only): ${input.specificContent || 'Use the instructor brief and topic.'}\nImage style requirement: ${IMAGE_PROMPT_GOLDEN_RULE}`;
        if (input.generateImage) {
          prompt += `\n\nCRITICAL ILLUSTRATION REQUIREMENT: Include 2-3 detailed [Illustration: ...] placeholders using ${EDUCATIONAL_IMAGE_STYLE}.`;
        } else {
          prompt += `\n\nCRITICAL: Do not include illustration or image placeholders.`;
        }
        prompt += `\n\n${instructorPriority}`;
      }
      prompt += JSON_VISUAL_HINT;
      if (langMandate) prompt = `${langMandate}\n\n${prompt}\n\n${langMandate}`;

      const response = await generateWithFallback({
        contents: prompt,
        config: { maxOutputTokens: 8192, systemInstruction, responseMimeType: 'application/json' },
      });
      return safeJsonParse(response.text);
    }

    case 'generate-admin': {
      const effectiveLang = input.language || (input.purpose?.includes('Afrikaans') ? 'Afrikaans' : input.purpose?.includes('Xhosa') ? 'isiXhosa' : 'English');
      const langMandate = EduAIPromptEngine.buildLanguageMandate(effectiveLang);
      let systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nYou are an expert school administrative document and certificate architect.\nGenerate a formal ${input.documentType} for ${input.schoolName || 'the school'}.\nThe tone should be ${input.tone || 'Formal'}.\nIMPORTANT: The 'content' field MUST be formatted as visually pleasing HTML string styled with Tailwind CSS classes. DO NOT use generic Markdown.\n\nSTRICT COMPLIANCE & ZERO-HALLUCINATION MANDATES:\n1. ABSOLUTE METADATA ADHERENCE: Carry through and display the provided metadata fields: School Name ("${input.schoolName || 'Not specified'}"), Date & Time ("${input.timeDate || 'Not specified'}"), Recipient ("${input.recipient || 'Not specified'}"), Venue ("${input.venue || 'Not specified'}"), Class Teacher ("${input.classTeacher || 'Not specified'}"), and School Principal ("${input.schoolPrincipal || 'Not specified'}"). Do NOT invent different dates, times, school names, venues, or people's names.\n2. ZERO QUERIES OR PLACEHOLDERS: Do NOT generate query tags or dummy variables. Every parameter value MUST be rendered into the visible text.\n3. CERTIFICATE MANDATE: When generating certificates, the Date & Time field MUST be visibly printed on the certificate body as the date of award or issuance.`;
      if (langMandate) systemInstruction = `${langMandate}\n\n${systemInstruction}`;

      let prompt = '';
      if (input.existingContent) {
        prompt = `The previous administrative document generation was truncated due to character limits. Here is the content generated so far:\n\n${input.existingContent}\n\nCRITICAL INSTRUCTION: Continue generating the rest of the document seamlessly from exactly where it left off. Do not repeat anything already generated. Complete all remaining sections until the document is 100% complete.`;
      } else {
        const actionPrompt = (input.additionalInstructions || input.keyPoints || '').trim();
        const params = `Type: ${input.documentType}\nPurpose / Subject: ${input.purpose || 'Not specified'}\nSchool Name: ${input.schoolName || 'Not specified'}\nDate & Time: ${input.timeDate || 'Not specified'}\nRecipient: ${input.recipient || 'Not specified'}\nVenue: ${input.venue || 'Not specified'}\nClass Teacher: ${input.classTeacher || 'Not specified'}\nSchool Principal: ${input.schoolPrincipal || 'Not specified'}\nInclude Reply Slip: ${input.includeReplySlip ? 'Yes' : 'No'}\nLanguage: ${input.language || 'English'}`;
        if (actionPrompt.length > 0) {
          prompt = `### 🚀 ACTION PROMPT SCRIPT (ABSOLUTE HIGHEST PRIORITY DIRECTIVE)\n${actionPrompt}\n\n--------------------------------------------------------------------------------\nThe above Action Prompt Script takes priority over everything else. You must execute it first as your primary architectural blueprint and core instruction set.\n\n### 📋 SECONDARY PARAMETERS (TO BE INTEGRATED FULLY)\n${params}`;
        } else {
          prompt = `### 📋 DOCUMENT PARAMETERS & REQUIREMENTS (ALL TOGETHER)\nSince no Action Prompt Script was provided, use all of the following parameters together as the primary instruction set to generate the complete document:\n${params}`;
        }
        prompt += `\n\n### 🛑 STRICT RENDERING COMPLIANCE:\n- Carry through the exact Date & Time and all parameters into the document body or certificate.\n- Never output query prompts or bracketed placeholders.\n- Adhere strictly to all parameter values.`;
        if (input.generateImage) {
          prompt += `\n\n⚠️ CRITICAL ILLUSTRATION REQUIREMENT: You MUST include at least 1-2 inline illustration placeholders using the exact format: [Illustration: <vivid, detailed description of a professional school stamp, document seal, or graphic depicting the topic in South African context>].`;
        } else {
          prompt += `\n\n⚠️ CRITICAL: DO NOT include any illustration or image placeholders in the content. Keep it purely text and standard structural HTML.`;
        }
        prompt += JSON_ADMIN_HINT;
      }

      const response = await generateWithFallback({
        contents: prompt,
        config: { maxOutputTokens: 8192, systemInstruction, responseMimeType: 'application/json' },
      });
      return safeJsonParse(response.text);
    }

    case 'ocr-scan': {
      const { imageData, language, isHandwritten } = input;
      const items = Array.isArray(imageData) ? imageData : [imageData];
      const partsToProcess: any[] = [];
      for (const item of items) {
        const { mimeType, base64Data } = stripDataUrl(item);
        if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || mimeType.includes('officedocument') || mimeType.includes('docx')) {
          continue; // docx extraction requires server-side mammoth; skip in client fallback
        }
        partsToProcess.push({ inlineData: { mimeType, data: base64Data } });
      }
      if (partsToProcess.length === 0) {
        return { extractedText: '' };
      }
      const prompt = `Extract all text from the attached ${partsToProcess.length} page/s or document accurately, assuming the text is in ${language}.\n${isHandwritten ? 'The image/document contains handwritten notes, assessments, or drawings. Use professional Multimodal Handwriting Recognition to transcribe printed text, cursive handwriting, math symbols, annotations, and notes precisely.' : ''}\nFormat it cleanly. Make no other comments.`;
      const response = await generateWithFallback({
        contents: [{ role: 'user', parts: [{ text: prompt }, ...partsToProcess] }],
      });
      return { extractedText: response.text || '' };
    }

    case 'ocr-grade': {
      const { imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission } = input;
      const items = Array.isArray(imageData) ? imageData : [imageData];
      const partsToProcess: any[] = [];
      for (const item of items) {
        const { mimeType, base64Data } = stripDataUrl(item);
        if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || mimeType.includes('officedocument') || mimeType.includes('docx')) {
          continue;
        }
        partsToProcess.push({ inlineData: { mimeType, data: base64Data } });
      }

      let behaviorPrompt = '';
      if (behavioralAspects && Array.isArray(behavioralAspects) && behavioralAspects.length > 0) {
        behaviorPrompt = `\n- Evaluate the student's submission on these behavioral/work habit dimensions: ${behavioralAspects.join(', ')}. Analyze their work layout, structure, and handwriting quality to provide a dedicated, supportive "Learning Behavior & Focus Feedback" section in the overall feedback.`;
      }
      if (adjustLateSubmission) {
        behaviorPrompt += `\n- Special Context: This was submitted late, or as a redo attempt. Maintain rigorous academic scoring standards, but add a supportive, encouraging remark acknowledging their initiative to catch up or refine their work.`;
      }

      const prompt = `You are an AI Grader and South African CAPS Curriculum Specialist.\nAnalyze these student assessment page/s.\n\nTASK 1: MEMORANDUM & RUBRIC QUALITY CHECK & AUTO-GENERATION\n- You are supplied with this Teacher's Memorandum/Rubric: "${rubric || ''}".\n- IF the supplied Memorandum/Rubric is missing, blank, or extremely brief:\n  * You MUST automatically generate a highly comprehensive, detailed Memorandum and grading rubric mapped to CAPS criteria based on the student's work.\n  * Describe this generation in 'memoCorrectionReport' and set 'originalMemoCorrected' to true. Produce the newly generated Memorandum/Rubric in 'correctedMemo'.\n- IF a Memorandum/Rubric IS supplied by the teacher: review it for correctness, spelling, factual errors, marks allotment problems, CAPS misalignments, or lack of clarity. Correct issues, describe them in 'memoCorrectionReport', set 'originalMemoCorrected' accordingly, and return the (corrected) memo in 'correctedMemo'.\n\nTASK 2: EVALUATION AND GRADING\n- Extract all text answers from the student's submission pages and return it in 'extractedText'.\n- Evaluate each question's answer accurately according to the verified/generated memorandum/rubric.${behaviorPrompt}\n- ${isHandwritten ? "The student's inputs may be handwritten. Apply deep Handwriting Recognition (HWR) and optical reading on the student answers. Be forgiving on cursive forms, crossed-out errors, printed text, mathematical symbols, and structural layout answers." : ''}\n- Sum and return the total obtained score as a string in 'totalScore' (e.g., "18/25" or "72%").\n- List marks and reasoning for each question individually in the array 'marksPerQuestion'.\n- Provide highly constructive, encouraging feedback for the learner in 'feedback' (use encouraging South African educational tone).\n\nReturn a valid JSON object with keys: extractedText (string), marksPerQuestion (array of strings), feedback (string), totalScore (string), originalMemoCorrected (boolean), memoCorrectionReport (string), correctedMemo (string).`;

      const response = await generateWithFallback({
        contents: [{ role: 'user', parts: [{ text: prompt }, ...partsToProcess] }],
        config: { responseMimeType: 'application/json' },
      });
      return safeJsonParse(response.text);
    }

    case 'text-grade': {
      const { studentAnswers, memo, rubric, language } = input;
      const prompt = `You are an AI Grader. Grade this student's written response in ${language || 'English'}.\nStudent answers: ${studentAnswers}\nMemorandum / Memo notes: ${memo}\nRubric guidelines: ${rubric}\n\nPerform the following steps:\n1. Evaluate each answer.\n2. Calculate marks obtained per question according to the memo and rubric.\n3. Provide encouraging and highly constructive feedback for the student.\n4. Suggest actionable next steps to improve.\n5. Sum the final score and return a neat JSON report.\n\nReturn a valid JSON object with keys: marksPerQuestion (array of strings), feedback (string), totalScore (string).`;
      const response = await generateWithFallback({
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return safeJsonParse(response.text);
    }

    case 'chat': {
      const { messages } = input;
      const response = await generateWithFallback({
        contents: messages,
        config: {
          systemInstruction: 'You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise.',
        },
      });
      return { text: response.text || '' };
    }

    case 'generate-image': {
      const { prompt: imagePrompt, width, height } = input || {};
      let styledPrompt = imagePrompt || '';
      const styleSuffix = ', Disney 3D Animation Character and 3D Cute Icon, educational, high quality, vibrant colours';
      const lowerPrompt = styledPrompt.toLowerCase();
      if (styledPrompt && (!lowerPrompt.includes('disney 3d animation character') || !lowerPrompt.includes('3d cute icon'))) {
        styledPrompt += styleSuffix;
      }
      const aspectRatio = (width || 1024) > (height || 1024) ? '16:9' : (width || 1024) < (height || 1024) ? '9:16' : '1:1';
      const imageModels = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image', 'imagen-3.0-generate-002'];
      for (const m of imageModels) {
        try {
          const response = await getClient().models.generateContent({
            model: m,
            contents: { parts: [{ text: styledPrompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio as any } },
          });
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              return { imageUrl: `data:image/jpeg;base64,${part.inlineData.data}`, provider: 'gemini', model: m };
            }
          }
        } catch (e: any) {
          console.warn(`[client-gemini] image model ${m} failed:`, e?.message);
        }
      }
      const seed = Math.floor(Math.random() * 100000);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?width=${width || 1024}&height=${height || 1024}&nologo=true&model=turbo&enhance=true&seed=${seed}`;
      return { imageUrl: fallbackUrl, isFallback: true, provider: 'pollinations', model: 'Pollinations-Turbo' };
    }

    default:
      throw new Error(`Unsupported client action: ${action}`);
  }
}
