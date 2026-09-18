import React from 'react';
import { motion } from 'motion/react';
import { parsePosterHtml } from '../lib/posterParser';
import { buildTemplateComplianceBannerHTML, EDUAI_TEMPLATE_FOOTER_LINE, stripGeneratedComplianceMarkup, wrapWithTemplate } from '../lib/contentTemplate';

interface PosterPreviewProps {
  html: string;
  grade?: string;
  subject?: string;
  title?: string;
  contentType?: string;
}

export function PosterPreview({ html, grade, subject, title, contentType = 'Educational Poster' }: PosterPreviewProps) {
  const meta = { title: title || 'Educational Poster', subject, grade, contentType };
  const parsed = React.useMemo(() => parsePosterHtml(stripGeneratedComplianceMarkup(html)), [html]);

  const isFoundation = React.useMemo(() => {
    if (!grade) return false;
    const clean = String(grade).toLowerCase().trim();
    return clean === 'r' || clean === '1' || clean === '2' || clean === '3' || 
           clean.includes('grade r') || clean.includes('grade 1') || clean.includes('grade 2') || clean.includes('grade 3') ||
           clean.includes('foundation');
  }, [grade]);

  if (!parsed.isPoster) {
    // If it is not parsed as a poster layout, fallback to simple rendering
    return (
      <div 
        style={isFoundation ? {
          fontFamily: '"Patrick Hand", "Comic Neue", cursive, sans-serif',
          fontSize: '1.25rem',
          lineHeight: '1.6'
        } : undefined}
        dangerouslySetInnerHTML={{ __html: wrapWithTemplate(html, meta) }}
      />
    );
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
    <div 
      className={parsed.outerClasses || "poster-container max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100"}
      style={isFoundation ? {
        fontFamily: '"Patrick Hand", "Comic Neue", cursive, sans-serif',
        fontSize: '1.25rem',
        lineHeight: '1.6'
      } : undefined}
    >
      {/* One host-owned compliance section; model-authored status rows are
          removed before parsing so posters cannot repeat the labels. */}
      <div dangerouslySetInnerHTML={{ __html: buildTemplateComplianceBannerHTML(meta) }} />

      {/* Banner Section */}
      {parsed.bannerHtml && (
        <div
          className="banner p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}
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

      {/* Exact host-owned footer; the model's poster footer is intentionally
          not rendered so it cannot create a second copyright line. */}
      <footer className="footer p-4 text-center text-xs text-slate-500 border-t border-slate-200">
        {EDUAI_TEMPLATE_FOOTER_LINE}
      </footer>

    </div>
  );
}
