import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const slides = [
  {
    title: 'Lesson Plan',
    description: 'Detailed, CAPS-aligned instructional guides for classroom teaching.',
    image: 'https://images.unsplash.com/photo-1503676268724-c19f9999b62d?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Unit Plan',
    description: 'Comprehensive pacing guides and curriculum mapping for long-term planning.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Assessment',
    description: 'Formative quizzes, formal tests, and structured rubrics with answer keys.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Study Guide',
    description: 'Bento-grid styled learner notes for revision and critical concept understanding.',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=600&auto=format&fit=crop'
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
    <div className="w-full max-w-[420px] bg-slate-900 border-[6px] border-slate-700/80 rounded-[32px] shadow-2xl p-2 relative overflow-hidden text-left border-r-[12px] border-b-[8px] h-[360px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-2 rounded-[24px] overflow-hidden"
        >
          <img src={slides[index].image} alt={slides[index].title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
            <h4 className="text-cyan-400 text-lg font-black uppercase tracking-wider">{slides[index].title}</h4>
            <p className="text-xs text-slate-200 mt-2">{slides[index].description}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
