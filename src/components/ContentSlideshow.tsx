import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles, Layers } from 'lucide-react';

import imgLessonPlan from '../assets/images/lesson_plan_screenshot_1784286235763.jpg';
import imgUnitPlan from '../assets/images/unit_plan_screenshot_1784286250293.jpg';
import imgAssessment from '../assets/images/assessment_screenshot_1784286266626.jpg';
import imgStudyGuide from '../assets/images/study_guide_screenshot_1784286281497.jpg';

const slides = [
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

export default function ContentSlideshow() {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying]);

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

  return (
    <div className="w-full h-full min-h-[340px] max-h-[420px] rounded-[32px] overflow-hidden relative shadow-2xl border border-cyan-500/30 bg-slate-950 flex flex-col justify-between group select-none">
      {/* Slide Image & Backdrop */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          {currentSlide.image ? (
            <motion.img
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6, ease: 'easeOut' }}
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover opacity-50 filter brightness-90"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 opacity-80" />
          )}

          {/* Gradient Overlays for optimal readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
        </motion.div>
      </AnimatePresence>

      {/* Top Header Controls Bar */}
      <div className="relative z-10 p-5 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-cyan-300 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Interactive Feature Showcase</span>
        </div>

        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-md focus:outline-none"
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
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Prev / Next Manual Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
              title="Previous Slide"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
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
