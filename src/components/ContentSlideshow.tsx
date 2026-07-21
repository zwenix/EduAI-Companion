import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import imgLessonPlan from '../assets/images/lesson_plan_screenshot_1784286235763.jpg';
import imgUnitPlan from '../assets/images/unit_plan_screenshot_1784286250293.jpg';
import imgAssessment from '../assets/images/assessment_screenshot_1784286266626.jpg';
import imgStudyGuide from '../assets/images/study_guide_screenshot_1784286281497.jpg';

const slides = [
  {
    title: 'Lesson Plan',
    description: 'Generates detailed, CAPS-aligned step-by-step lesson sequences, diagnostic checklists, differentiated scaffolding for struggling or advanced learners, and values integration.',
    image: imgLessonPlan
  },
  {
    title: 'Unit Plan',
    description: 'Maps continuous topic pacing, ATP alignment timelines, and multi-term sequences (Terms 1 to 4) dynamically inside an automated curriculum grid.',
    image: imgUnitPlan
  },
  {
    title: 'Assessment & Rubric',
    description: 'Creates rigorous, CAPS-compliant formal tests and worksheets with dotted write-in lines, scoring badges, and structured evaluation matrices with no empty fields.',
    image: imgAssessment
  },
  {
    title: 'Study Guide & Revision Notes',
    description: 'Designs beautifully structured, bento-grid styled learner notes with highlighted formula panels, key vocabulary callouts, and critical thinking triggers.',
    image: imgStudyGuide
  }
];

export default function ContentSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full max-w-[420px] bg-[#0F172A] border-[6px] border-slate-700/80 rounded-[32px] shadow-2xl p-2 relative overflow-hidden text-left border-r-[12px] border-b-[8px] h-[360px] min-h-[360px] flex items-center justify-center group">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.98, x: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.02, x: -10 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-2 rounded-[24px] overflow-hidden bg-slate-900"
        >
          {slides[index].image && (
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6 }}
              src={slides[index].image} 
              alt={slides[index].title} 
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-8 flex flex-col justify-end">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-3"
            >
              <h4 className="text-emerald-400 text-lg font-black uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{slides[index].title}</h4>
              <p className="text-sm text-slate-200 leading-relaxed max-w-[90%] font-medium line-clamp-3">{slides[index].description}</p>
            </motion.div>
            
            {/* Progress indicators */}
            <div className="flex gap-2 mt-8 relative z-20">
              {slides.map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ 
                    width: i === index ? 32 : 8,
                    backgroundColor: i === index ? '#10b981' : 'rgba(255,255,255,0.1)'
                  }}
                  className="h-1 rounded-full transition-colors duration-500" 
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
