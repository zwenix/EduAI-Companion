import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const slides = [
  {
    title: 'Lesson Plan',
    description: 'Generates detailed, CAPS-aligned step-by-step lesson sequences, diagnostic checklists, differentiated scaffolding for struggling or advanced learners, and values integration.',
    image: '/src/assets/images/lesson_plan_screenshot_1784286235763.jpg'
  },
  {
    title: 'Unit Plan',
    description: 'Maps continuous topic pacing, ATP alignment timelines, and multi-term sequences (Terms 1 to 4) dynamically inside an automated curriculum grid.',
    image: '/src/assets/images/unit_plan_screenshot_1784286250293.jpg'
  },
  {
    title: 'Assessment & Rubric',
    description: 'Creates rigorous, CAPS-compliant formal tests and worksheets with dotted write-in lines, scoring badges, and structured evaluation matrices with no empty fields.',
    image: '/src/assets/images/assessment_screenshot_1784286266626.jpg'
  },
  {
    title: 'Study Guide & Revision Notes',
    description: 'Designs beautifully structured, bento-grid styled learner notes with highlighted formula panels, key vocabulary callouts, and critical thinking triggers.',
    image: '/src/assets/images/study_guide_screenshot_1784286281497.jpg'
  }
];

export default function ContentSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-[420px] bg-[#0F172A] border-[6px] border-slate-700/80 rounded-[32px] shadow-2xl p-2 relative overflow-hidden text-left border-r-[12px] border-b-[8px] h-[360px] min-h-[360px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-2 rounded-[24px] overflow-hidden bg-slate-800"
        >
          {slides[index].image && (
            <img 
              src={slides[index].image} 
              alt={slides[index].title} 
              className="w-full h-full object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
            <div className="space-y-2">
              <h4 className="text-cyan-400 text-xl font-black uppercase tracking-wider">{slides[index].title}</h4>
              <p className="text-sm text-slate-300 leading-relaxed max-w-[90%]">{slides[index].description}</p>
            </div>
            
            {/* Progress indicators */}
            <div className="flex gap-1.5 mt-6">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-cyan-400' : 'w-2 bg-white/20'}`} 
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
