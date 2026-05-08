import React from 'react';
import { Brain } from 'lucide-react';
import { motion } from 'motion/react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.1, rotate: 2 }}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        y: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        },
        rotate: {
          type: 'spring',
          stiffness: 300
        },
        scale: {
          type: 'spring',
          stiffness: 300
        }
      }}
      className={cn("relative shrink-0 flex items-center justify-center", className)}
    >
      <img 
        src="https://i.ibb.co/tTc5gG5k/eduai-company-logo2-preview-177246762158%200-2-preview-177247315%203046.png" 
        alt="EduAI Companion Logo"
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
}
