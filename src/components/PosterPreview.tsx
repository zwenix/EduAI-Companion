import React from 'react';
import { motion } from 'motion/react';
import { parsePosterHtml } from '../lib/posterParser';

interface PosterPreviewProps {
  html: string;
}

export function PosterPreview({ html }: PosterPreviewProps) {
  const parsed = React.useMemo(() => parsePosterHtml(html), [html]);

  if (!parsed.isPoster) {
    // If it is not parsed as a poster layout, fallback to simple rendering
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // Framer Motion layout configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30, 
      scale: 0.96 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 110,
        damping: 14
      }
    },
    hover: {
      y: -6,
      scale: 1.015,
      boxShadow: "0 12px 30px -10px rgba(0,0,0,0.08), 0 10px 15px -8px rgba(0,0,0,0.04)",
      borderColor: "rgba(99, 102, 241, 0.3)", // subtle indigo border highlight on hover
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <div className={parsed.outerClasses || "poster-container max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100"}>
      
      {/* Banner Section */}
      {parsed.bannerHtml && (
        <div 
          className="banner bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-700 p-6 text-white"
          dangerouslySetInnerHTML={{ __html: parsed.bannerHtml }}
        />
      )}

      {/* Hero Illustration Section */}
      {parsed.heroHtml && (
        <div 
          className="hero-section bg-sky-50/50 p-8 border-b border-slate-100"
          dangerouslySetInnerHTML={{ __html: parsed.heroHtml }}
        />
      )}

      {/* Staggered Frame Motion Animated Grid Cards */}
      {parsed.cardsHtml.length > 0 && (
        <motion.div 
          className="content-grid grid md:grid-cols-2 gap-6 p-8 bg-white"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {parsed.cardsHtml.map((cardContent, idx) => (
            <motion.div
              key={`poster-card-${idx}`}
              className="content-card bg-slate-50/70 hover:bg-slate-50 rounded-2xl p-5 border border-slate-200 cursor-pointer overflow-hidden relative shadow-sm"
              variants={cardVariants}
              whileHover="hover"
              dangerouslySetInnerHTML={{ __html: cardContent }}
            />
          ))}
        </motion.div>
      )}

      {/* Key Takeaways Section */}
      {parsed.takeawaysHtml && (
        <div 
          className="takeaways bg-indigo-50/40 p-6 border-t border-slate-100"
          dangerouslySetInnerHTML={{ __html: parsed.takeawaysHtml }}
        />
      )}

      {/* Footer Section */}
      {parsed.footerHtml && (
        <footer 
          className="footer bg-slate-100/80 p-4 text-center text-xs text-slate-500 border-t border-slate-200"
          dangerouslySetInnerHTML={{ __html: parsed.footerHtml }}
        />
      )}

    </div>
  );
}
