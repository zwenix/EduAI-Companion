import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, Brain, ScanLine, UserCircle2 } from 'lucide-react';

import imgLessonPlan from '../assets/images/lesson_plan_screenshot_1784286235763.jpg';
import imgUnitPlan from '../assets/images/unit_plan_screenshot_1784286250293.jpg';
import imgAssessment from '../assets/images/assessment_screenshot_1784286266626.jpg';
import imgStudyGuide from '../assets/images/study_guide_screenshot_1784286281497.jpg';
import bgLandingAnalytics from '../assets/images/landing_analytics_bg_1786962597.jpg';
import bgAiTutor from '../assets/images/ai_tutor_bg_1786968958.jpg';
import bgToolboxOcr from '../assets/images/toolbox_ocr_bg_1786968958.jpg';

export interface Slide {
  title: string;
  tag: string;
  badgeColor: string;
  description: string;
  image?: string;
  icon?: any;
}

export const TOOLBOX_SLIDES: Slide[] = [
  {
    title: 'Lesson Plan Architect',
    tag: 'CAPS ALIGNED',
    badgeColor: 'from-cyan-500 to-blue-600',
    description: 'Generates detailed, CAPS-aligned step-by-step lesson sequences, diagnostic checklists, differentiated scaffolding for struggling or advanced learners, and values integration.',
    image: imgLessonPlan
  },
  {
    title: 'Curriculum Unit Planner',
    tag: 'ATP MAPPED',
    badgeColor: 'from-emerald-500 to-teal-600',
    description: 'Maps continuous topic pacing, ATP alignment timelines, and multi-term sequences (Terms 1 to 4) dynamically inside an automated curriculum grid.',
    image: imgUnitPlan
  },
  {
    title: 'Assessments & Rubrics',
    tag: 'FORMAL EXAMS',
    badgeColor: 'from-purple-500 to-indigo-600',
    description: 'Creates rigorous, CAPS-compliant formal tests and worksheets with write-in lines, scoring badges, and complete evaluation matrices.',
    image: imgAssessment
  },
  {
    title: 'Study Guides & Notes',
    tag: 'REVISION LAB',
    badgeColor: 'from-amber-500 to-orange-600',
    description: 'Designs beautifully structured learner notes with highlighted formula panels, key vocabulary callouts, and critical thinking triggers.',
    image: imgStudyGuide
  }
];

export const INTELLIGENT_AI_SLIDES: Slide[] = [
  {
    title: 'AI Tutor Companion',
    tag: 'PERSONALIZED',
    badgeColor: 'from-amber-500 to-orange-600',
    description: 'A localized AI companion for homework grading, concept explanations, and curriculum support, adaptive to each student’s grade and learning style.',
    icon: Brain,
    image: bgAiTutor
  },
  {
    title: 'OCR Auto-Grading',
    tag: 'AI VISION',
    badgeColor: 'from-cyan-500 to-blue-600',
    description: 'Leverage AI vision to scan physical student answer sheets, detect handwritten text, and perform objective auto-grading automatically.',
    icon: ScanLine,
    image: bgToolboxOcr
  },
  {
    title: 'Adaptive Learning Path',
    tag: 'DATA DRIVEN',
    badgeColor: 'from-emerald-500 to-teal-600',
    description: 'Analyze student performance metrics and generate personalized revision packs and skill mastery drills to close knowledge gaps.',
    icon: UserCircle2,
    image: bgLandingAnalytics
  }
];

interface ContentSlideshowProps {
  slides?: Slide[];
  /** Render a taller hero variant (used on full-width hub pages). */
  tall?: boolean;
}

export default function ContentSlideshow({ slides = TOOLBOX_SLIDES, tall = false }: ContentSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const handleSelect = (i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(i);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const currentSlide = slides[index];
  const Icon = (currentSlide as any).icon;

  return (
    <div className={`w-full h-full rounded-[32px] overflow-hidden relative shadow-2xl border border-cyan-500/30 bg-slate-950 flex flex-col justify-between group select-none ${
      tall ? 'min-h-[380px] max-h-[460px]' : 'min-h-[300px] max-h-[380px]'
    }`}>
      {/* Slide Image & Backdrop — steady crossfade, no blank gap (fixes flash between slides) */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          {currentSlide.image ? (
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover opacity-[0.52] filter brightness-[0.96] group-hover:opacity-[0.58] transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center opacity-80">
              {Icon && <Icon size={120} className="text-white/5" strokeWidth={1} />}
            </div>
          )}

          {/* Gradient Overlays for optimal readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
        </motion.div>
      </AnimatePresence>

      {/* Top Header Controls Bar */}
      <div className="relative z-10 p-5 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-cyan-300 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Interactive Feature Showcase</span>
        </div>

        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-slate-900/95 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-transparent transition-all shadow-md focus:outline-none"
          title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5 text-cyan-400" />}
        </button>
      </div>

      {/* Slide Content Overlay */}
      <div className="relative z-10 px-6 pb-6 pt-2 flex flex-col justify-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="space-y-2.5"
          >
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={`p-2 rounded-xl bg-gradient-to-r ${currentSlide.badgeColor} bg-opacity-20 backdrop-blur-sm border border-white/20`}>
                  <Icon size={20} className="text-white" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${currentSlide.badgeColor} shadow-sm`}>
                    {currentSlide.tag}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    0{index + 1} / 0{slides.length}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {currentSlide.title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed line-clamp-3 max-w-xl">
              {currentSlide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation Controls & Indicators */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10">
          {/* Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => handleSelect(i, e)}
                className="p-1 focus:outline-none"
                title={`Go to slide ${i + 1}`}
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? 'w-7 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                      : 'w-2 bg-white/25 hover:bg-white/40'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Prev / Next Manual Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white/5 hover:bg-transparent border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
              title="Previous Slide"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white/5 hover:bg-transparent border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
              title="Next Slide"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
