import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Star, BookOpen, Clock, FileText, Video, Trophy, Filter, X, Zap, Target, Loader2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { patchOklchForHtml2canvas } from '../lib/pdfHelper';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface PortfolioItem {
  id: string;
  title: string;
  type: 'project' | 'assignment' | 'assessment' | 'achievement';
  subject: string;
  capsAlignment: string;
  date: string;
  grade: string;
  feedback?: string;
  icon: any;
  color: string;
  featured?: boolean;
}

const DEFAULT_ITEMS: PortfolioItem[] = [
  {
    id: '1',
    title: 'Solar System Diorama & Report',
    type: 'project',
    subject: 'Natural Sciences',
    capsAlignment: 'Term 4: Planet Earth and Beyond',
    date: '12 Nov 2026',
    grade: '95%',
    feedback: 'Outstanding attention to detail and excellent understanding of planetary orbits.',
    icon: Star,
    color: 'from-amber-400 to-orange-500',
    featured: true
  },
  {
    id: '2',
    title: 'Fractions & Decimals Mastery Test',
    type: 'assessment',
    subject: 'Mathematics',
    capsAlignment: 'Term 2: Numbers, Operations and Relationships',
    date: '05 Oct 2026',
    grade: '100%',
    feedback: 'Perfect score. You showed excellent logical progression in your working out.',
    icon: Target,
    color: 'from-emerald-400 to-teal-500',
    featured: true
  },
  {
    id: '3',
    title: 'Creative Writing: The African Fable',
    type: 'assignment',
    subject: 'English Home Language',
    capsAlignment: 'Term 3: Writing and Presenting',
    date: '22 Aug 2026',
    grade: '88%',
    feedback: 'Vivid imagery and strong narrative structure. Great use of metaphors.',
    icon: FileText,
    color: 'from-indigo-400 to-blue-500'
  },
  {
    id: '4',
    title: 'Top Achiever: Term 1',
    type: 'achievement',
    subject: 'General',
    capsAlignment: 'Academic Excellence',
    date: '30 Mar 2026',
    grade: 'Gold',
    icon: Trophy,
    color: 'from-yellow-300 to-yellow-500',
    featured: true
  },
  {
    id: '5',
    title: 'Data Collection & Bar Graphs',
    type: 'assignment',
    subject: 'Mathematics',
    capsAlignment: 'Term 1: Data Handling',
    date: '14 Feb 2026',
    grade: '92%',
    icon: FileText,
    color: 'from-indigo-400 to-blue-500'
  }
];

export default function StudentPortfolio({ isDarkMode }: { isDarkMode: boolean }) {
  const [items, setItems] = useState<PortfolioItem[]>(DEFAULT_ITEMS);
  const [filter, setFilter] = useState<string>('All');
  const [studentProfile, setStudentProfile] = useState<{ name: string; email: string; grade: string; school?: string } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingHtmlPdf, setIsGeneratingHtmlPdf] = useState(false);
  
  const subjects = ['All', 'Mathematics', 'Natural Sciences', 'English Home Language', 'General'];

  const filteredItems = items.filter(item => filter === 'All' || item.subject === filter);
  const featuredItems = items.filter(item => item.featured);

  useEffect(() => {
    const fetchStudentProfileAndReports = async () => {
      if (auth.currentUser) {
        try {
          const email = auth.currentUser.email?.toLowerCase().trim() || '';
          const q = query(collection(db, 'students'), where('email', '==', email));
          const snap = await getDocs(q);
          
          let stuId = '';
          if (!snap.empty) {
            const sData = snap.docs[0].data();
            stuId = snap.docs[0].id;
            setStudentProfile({
              name: sData.name || auth.currentUser.displayName || 'Learner',
              email: sData.email || email,
              grade: sData.gradeLevel || 'Grade 10',
              school: sData.school || 'EduAI Showcase Academy'
            });
          } else {
            setStudentProfile({
              name: auth.currentUser.displayName || 'Learner',
              email: email,
              grade: 'Grade 10',
              school: 'EduAI Showcase Academy'
            });
          }

          if (stuId) {
            const reportsQuery = query(collection(db, 'auto_grading_reports'), where('studentId', '==', stuId));
            const reportsSnap = await getDocs(reportsQuery);
            const loadedReports: PortfolioItem[] = reportsSnap.docs.map(doc => {
              const d = doc.data();
              return {
                id: doc.id,
                title: d.assignmentTitle || d.fileName || 'AutoGraded Assessment',
                type: 'assessment',
                subject: d.assignmentTitle?.includes('Math') ? 'Mathematics' : 'General',
                capsAlignment: 'Auto-Graded Submission',
                date: new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                grade: d.totalScore || 'N/A',
                feedback: d.feedback,
                icon: Target,
                color: 'from-emerald-400 to-teal-500',
                featured: false
              };
            });
            if (loadedReports.length > 0) {
              setItems(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newItems = loadedReports.filter(r => !existingIds.has(r.id));
                return [...prev, ...newItems];
              });
            }
          }

        } catch (error) {
          console.error("Error loading student profile for portfolio PDF:", error);
        }
      } else {
        setStudentProfile({
          name: 'Sibusiso Dube',
          email: 'sibu.dube@school.za',
          grade: 'Grade 10',
          school: 'EduAI Showcase Academy'
        });
      }
    };

    fetchStudentProfileAndReports();
  }, []);

  const generateParentReportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const A4_WIDTH = pdf.internal.pageSize.getWidth();
      const A4_HEIGHT = pdf.internal.pageSize.getHeight();

      const name = studentProfile?.name || 'Sibusiso Dube';
      const grade = studentProfile?.grade || 'Grade 10';
      const school = studentProfile?.school || 'EduAI Showcase Academy';
      const email = studentProfile?.email || 'sibu.dube@school.za';

      let pageNum = 1;

      // Page header and footer drawing helper
      const drawPageDecorations = (p: jsPDF, page: number) => {
        p.setDrawColor(6, 182, 212); // cyan-500
        p.setLineWidth(1.5);
        p.line(40, 45, A4_WIDTH - 40, 45);

        p.setFont('Helvetica', 'normal');
        p.setFontSize(8);
        p.setTextColor(148, 163, 184); // slate-400
        p.text('EduAI South Africa • Learning Journey Digest & CAPS Showcase', 40, 36);
        p.text(`Student: ${name} (${grade})`, A4_WIDTH - 40, 36, { align: 'right' });

        // Footer lines
        p.setDrawColor(226, 232, 240); // slate-200
        p.setLineWidth(0.5);
        p.line(40, A4_HEIGHT - 45, A4_WIDTH - 40, A4_HEIGHT - 45);

        p.setFontSize(8);
        p.setTextColor(148, 163, 184);
        p.text('CONFIDENTIAL • Official Parent Academic Portfolio Report', 40, A4_HEIGHT - 32);
        p.text(`Page ${page}`, A4_WIDTH - 40, A4_HEIGHT - 32, { align: 'right' });
      };

      // --- PAGE 1: TITLE BANNER, SUMMARY STATS, AND INTRO ---
      
      // Top Decorative Banner Box (Navy Blue Slate)
      pdf.setFillColor(15, 23, 42); // slate-900 / navy-dark
      pdf.roundedRect(40, 50, A4_WIDTH - 80, 95, 8, 8, 'F');

      // Top Banner Text Content
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('LEARNING JOURNEY PORTFOLIO', 60, 90);
      
      pdf.setTextColor(6, 182, 212); // bright cyan-400
      pdf.setFontSize(10.5);
      pdf.text('Official Continuous Academic Showcase & CAPS Alignment Digest', 60, 110);
      
      pdf.setTextColor(203, 213, 225); // slate-300
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('A curated collection of distinguished projects, continuous assessments, and academic milestones.', 60, 126);

      // Student Metadata card box
      let currentY = 170;
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(1);
      pdf.roundedRect(40, currentY, A4_WIDTH - 80, 80, 8, 8, 'FD');

      // Profile details inside card info
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text('STUDENT PROFILE', 60, currentY + 22);
      pdf.text('REPORT CONTEXT', A4_WIDTH / 2 + 20, currentY + 22);

      pdf.setFontSize(11.5);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text(name, 60, currentY + 41);
      pdf.text(grade, 60, currentY + 56);

      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`School: ${school}`, 60, currentY + 68);
      
      pdf.setFont('Helvetica', 'bold');
      pdf.text(`Date Generated:`, A4_WIDTH / 2 + 20, currentY + 41);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), A4_WIDTH / 2 + 20, currentY + 56);
      pdf.text(`Verification Ref: PTF-CAPS-${Math.floor(100000 + Math.random() * 900000)}`, A4_WIDTH / 2 + 20, currentY + 68);

      // Statistics grid boxes
      currentY += 105;
      const numFeatured = items.filter(i => i.featured).length;
      const totalItems = items.length;
      const numAverages = Math.round(items.reduce((acc, item) => {
        const gradeNum = parseInt(item.grade) || 0;
        return gradeNum > 0 ? acc + gradeNum : acc + 85; 
      }, 0) / totalItems);

      // Mini Stats Card 1: Total items
      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.roundedRect(40, currentY, (A4_WIDTH - 100) / 3, 55, 6, 6, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text(totalItems.toString(), 56, currentY + 25);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('TOTAL PORTFOLIO TASKS', 56, currentY + 39);

      // Mini Stats Card 2: Featured highlights
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(40 + (A4_WIDTH - 100) / 3 + 10, currentY, (A4_WIDTH - 100) / 3, 55, 6, 6, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(245, 158, 11); // amber-500
      pdf.text(`${numFeatured} Highlighted`, 40 + (A4_WIDTH - 100) / 3 + 20, currentY + 25);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('FEATURED BY EDUCATOR', 40 + (A4_WIDTH - 100) / 3 + 20, currentY + 39);

      // Mini Stats Card 3: Academic average
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(40 + ((A4_WIDTH - 100) / 3) * 2 + 20, currentY, (A4_WIDTH - 100) / 3, 55, 6, 6, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(16, 185, 129); // emerald-500
      pdf.text(`${numAverages}%`, 40 + ((A4_WIDTH - 100) / 3) * 2 + 30, currentY + 25);
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('AVG PORTFOLIO SCORE', 40 + ((A4_WIDTH - 100) / 3) * 2 + 30, currentY + 39);

      // Section label: PORTFOLIO SHOWCASE RECORDS
      currentY += 80;
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('DETAILED ACADEMIC SHOWCASE RECORDS', 40, currentY);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Every activity below aligns closely with South African CAPS curriculum units and has direct educator validation.', 40, currentY + 12);
      
      currentY += 25;

      // Draw decorations on page 1
      drawPageDecorations(pdf, pageNum);

      // ITERATE PORTFOLIO ITEMS
      items.forEach((item, index) => {
        // Correct height overflow
        if (currentY + 105 > A4_HEIGHT - 65) {
          pdf.addPage();
          pageNum++;
          drawPageDecorations(pdf, pageNum);
          currentY = 65;
        }

        // Bounding container
        pdf.setFillColor(248, 250, 252); // slate-50
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setLineWidth(0.5);
        pdf.roundedRect(40, currentY, A4_WIDTH - 80, 92, 6, 6, 'FD');

        // Color tag strip
        let col = [14, 165, 233]; // default cyan
        if (item.type === 'achievement') col = [245, 158, 11]; // amber
        else if (item.type === 'assessment') col = [16, 185, 129]; // emerald
        else if (item.type === 'project') col = [99, 102, 241]; // indigo

        pdf.setFillColor(col[0], col[1], col[2]);
        pdf.rect(40, currentY, 4, 92, 'F');

        // Meta tags
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(col[0], col[1], col[2]);
        pdf.text(`${item.type.toUpperCase()} • ${item.subject.toUpperCase()}`, 56, currentY + 18);

        // Score on right
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text('GRADE / RATING', A4_WIDTH - 140, currentY + 18);
        
        pdf.setFontSize(14);
        pdf.setTextColor(col[0], col[1], col[2]);
        pdf.text(item.grade, A4_WIDTH - 140, currentY + 34);

        // Date submitted
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(item.date, A4_WIDTH - 140, currentY + 48);

        // Activity title
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42); 
        pdf.text(item.title, 56, currentY + 34);

        // CAPS detail
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        pdf.text('CAPS Section Alignment:', 56, currentY + 48);

        pdf.setFont('Helvetica', 'bold');
        pdf.text(item.capsAlignment, 155, currentY + 48);

        // Separation lines
        pdf.setDrawColor(241, 245, 249);
        pdf.line(56, currentY + 54, A4_WIDTH - 160, currentY + 54);

        // Dynamic Feedback wrapping
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(100, 116, 139);
        const feedbackStr = item.feedback || "Exceptional classroom leadership, consistent revision habits, and high practical engagement logged.";
        
        const feedbackLines = pdf.splitTextToSize(`Educator Comments: "${feedbackStr}"`, A4_WIDTH - 230);
        pdf.text(feedbackLines, 56, currentY + 68);

        currentY += 102;
      });

      pdf.save(`Learning_Journey_Report_${name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Failed to generate parent portfolio PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateStudentJourneyPDF = async () => {
    setIsGeneratingHtmlPdf(true);
    try {
      const name = studentProfile?.name || 'Sibusiso Dube';
      const grade = studentProfile?.grade || 'Grade 10';
      const school = studentProfile?.school || 'EduAI Showcase Academy';
      const email = studentProfile?.email || 'sibu.dube@school.za';
      
      const element = document.createElement('div');
      element.className = 'pdf-container';
      element.style.background = '#020617'; // slate-950 background
      element.style.color = '#ffffff';
      element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      element.style.width = '794px'; 
      element.style.padding = '40px';
      element.style.boxSizing = 'border-box';
      
      const totalTasks = items.length;
      const highlightCount = items.filter(i => i.featured).length;
      const averageMarks = Math.round(items.reduce((acc, item) => {
        const gradeNum = parseInt(item.grade) || 0;
        return gradeNum > 0 ? acc + gradeNum : acc + 85; 
      }, 0) / totalTasks);

      element.innerHTML = `
        <div style="border: 2px solid rgba(6, 182, 212, 0.15); border-radius: 24px; padding: 35px; background-color: #0b1329; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 28px;">
            <div>
              <p style="font-size: 10px; color: #22d3ee; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 800; margin: 0 0 6px 0;">Learner Continuous CAPS Assessment Portfolio</p>
              <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0 0 6px 0;">LEARNING JOURNEY DOSSIER</h1>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">An official, compiled report summarizing featured learning activities, continuous feedback, and curriculum objectives.</p>
            </div>
            <div style="background-color: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); padding: 12px 18px; border-radius: 14px; text-align: right;">
              <span style="font-size: 8px; color: #a5b4fc; font-weight: 800; display: block; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px;">SECURE RECORD</span>
              <span style="font-size: 12px; font-weight: 900; color: #ffffff;">STUDENT JOURNEY</span>
            </div>
          </div>

          <!-- Profiles metadata grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background-color: rgba(15, 23, 42, 0.6); padding: 22px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.04); margin-bottom: 28px;">
            <div>
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 800; margin: 0 0 10px 0;">STUDENT PROFILE</p>
              <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0 0 4px 0;">${name}</h2>
              <p style="font-size: 12px; color: #cbd5e1; margin: 0 0 4px 0;">${grade} • ${school}</p>
              <p style="font-size: 11px; color: #64748b; margin: 0;">${email}</p>
            </div>
            <div>
              <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 800; margin: 0 0 10px 0;">EVALUATION INSIGHTS</p>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 6px 0;"><strong>Generated Date:</strong> ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 6px 0;"><strong>National Standard:</strong> CAPS Curriculum Aligned</p>
              <p style="font-size: 11px; color: #34d399; font-weight: 800; margin: 0;">Record ID: RC-PORT-${Math.floor(100000 + Math.random() * 900000)}</p>
            </div>
          </div>

          <!-- Main numerical progress markers -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 30px;">
            <div style="background-color: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.18); padding: 16px; border-radius: 14px; text-align: center;">
              <span style="font-size: 26px; font-weight: 900; color: #818cf8; display: block; line-height: 1.1;">${totalTasks}</span>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 800; display: block; margin-top: 6px;">Total Assessments</span>
            </div>
            <div style="background-color: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.18); padding: 16px; border-radius: 14px; text-align: center;">
              <span style="font-size: 26px; font-weight: 900; color: #fbbf24; display: block; line-height: 1.1;">${highlightCount}</span>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 800; display: block; margin-top: 6px;">Featured Milestones</span>
            </div>
            <div style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.18); padding: 16px; border-radius: 14px; text-align: center;">
              <span style="font-size: 26px; font-weight: 900; color: #34d399; display: block; line-height: 1.1;">${averageMarks}%</span>
              <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; font-weight: 800; display: block; margin-top: 6px;">Mastery Average</span>
            </div>
          </div>

          <!-- Assessment rows -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin: 0 0 16px 0;">Portfolio Achievements & Educator Comments</h3>
            
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${items.map(item => {
                let borderCol = 'rgba(6, 182, 212, 0.2)';
                let tagCol = '#06b6d4';
                if (item.type === 'achievement') {
                  borderCol = 'rgba(245, 158, 11, 0.2)';
                  tagCol = '#f59e0b';
                } else if (item.type === 'assessment') {
                  borderCol = 'rgba(16, 185, 129, 0.2)';
                  tagCol = '#10b981';
                } else if (item.type === 'project') {
                  borderCol = 'rgba(99, 102, 241, 0.2)';
                  tagCol = '#6366f1';
                }

                return `
                  <div style="padding: 16px 20px; border-radius: 14px; background-color: rgba(15, 23, 42, 0.45); border: 1px solid ${borderCol}; border-left: 5px solid ${tagCol}; page-break-inside: avoid;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                      <div>
                        <span style="font-size: 9px; text-transform: uppercase; font-weight: 800; color: ${tagCol}; letter-spacing: 1px;">${item.type} • ${item.subject}</span>
                        <h4 style="font-size: 14px; font-weight: 800; color: #ffffff; margin: 2px 0 0 0; letter-spacing: -0.2px;">${item.title}</h4>
                      </div>
                      <div style="text-align: right;">
                        <span style="font-size: 16px; font-weight: 900; color: #34d399;">${item.grade}</span>
                        <p style="font-size: 9px; color: #64748b; margin: 1px 0 0 0;">${item.date}</p>
                      </div>
                    </div>
                    
                    <p style="font-size: 10.5px; color: #94a3b8; margin: 0 0 6px 0;"><strong>CAPS Standards Mapping:</strong> <span style="color: #cbd5e1; font-weight: 600;">${item.capsAlignment}</span></p>
                    ${item.feedback ? `
                      <div style="padding: 10px 14px; border-radius: 10px; background-color: rgba(2, 6, 23, 0.7); border: 1px solid rgba(255,255,255,0.02); margin-top: 10px; font-style: italic; font-size: 11px; color: #e2e8f0; line-height: 1.45;">
                        "<strong>Teacher's Dialogue:</strong> ${item.feedback}"
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Footnotes verification stamp -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 28px; font-size: 9px; color: #475569;">
            <p>© Continuous Evaluation Portfolio Registry • EduAI Analytics</p>
            <p style="letter-spacing: 0.5px; font-family: monospace;">STAMP: DEEP-VAL-${new Date().toISOString().replace('T', '_').split('.')[0]}</p>
          </div>
        </div>
      `;

      document.body.appendChild(element);

      const opt = {
        margin:       15,
        filename:     `Academic_Journey_${name.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'pt' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all' as const, 'css' as const, 'legacy' as const] }
      };

      const restoreGetComputedStyle = patchOklchForHtml2canvas();
      await html2pdf().from(element).set(opt).save();
      restoreGetComputedStyle();

      document.body.removeChild(element);
    } catch (err) {
      console.error("Failed to generate student continuous journey PDF:", err);
    } finally {
      setIsGeneratingHtmlPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Hero Section */}
      <div className={cn(
        "relative rounded-[36px] p-8 lg:p-12 overflow-hidden text-white flex flex-col justify-end min-h-[300px] border shadow-2xl",
        isDarkMode ? "bg-[#0B1122] border-white/10" : "bg-slate-900 border-slate-800"
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
           <Award size={200} />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
        
        <div className="relative z-10 max-w-3xl">
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-emerald-300 mb-6 shadow-sm">
             <Trophy size={16} className="text-emerald-400" /> Academic Portfolio
           </motion.div>
           <h1 className="text-4xl lg:text-6xl font-hand tracking-wide leading-tight mb-4 drop-shadow-md">
             My Hall of <span className="text-brand-cyan">Brilliance</span>
           </h1>
           <p className="text-slate-300 font-medium text-sm lg:text-base leading-relaxed max-w-lg">
             A curated collection of your best work, projects, and achievements, fully aligned strictly with the CAPS curriculum.
           </p>

           <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={generateStudentJourneyPDF}
                disabled={isGeneratingHtmlPdf}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-black uppercase text-[10px] tracking-wider rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed border border-indigo-500/30"
              >
                {isGeneratingHtmlPdf ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Zap size={13} className="text-yellow-300 animate-pulse" />
                )}
                {isGeneratingHtmlPdf ? 'Compiling Rich PDF...' : 'Download Learning Journey (HTML-Rich PDF)'}
              </button>
             <button
               onClick={generateParentReportPDF}
               disabled={isGeneratingPdf}
               className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-brand-cyan hover:bg-cyan-400 disabled:bg-cyan-850 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed disabled:text-slate-400 border border-brand-cyan/20"
             >
               {isGeneratingPdf ? (
                 <Loader2 size={13} className="animate-spin" />
               ) : (
                 <FileText size={13} />
               )}
               {isGeneratingPdf ? 'Generating Journey PDF...' : 'Export Journey Report for Parents'}
             </button>
           </div>
        </div>
      </div>

      {/* Featured Showcase */}
      {featuredItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Star className="text-yellow-400" size={20} fill="currentColor" />
            <h2 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-slate-800")}>Featured Highlights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "rounded-[32px] p-6 lg:p-8 relative overflow-hidden shadow-xl border hover:scale-[1.02] transition-all group cursor-pointer flex flex-col",
                  isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                )}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-20 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110`} />
                
                <div className="relative z-10 flex-1">
                  <div className={cn("inline-block p-3 rounded-2xl mb-4 bg-gradient-to-br shadow-inner", item.color)}>
                    <item.icon size={24} className="text-white" />
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-[9px] uppercase tracking-widest font-black text-brand-cyan mb-1 block">
                      {item.type} • {item.subject}
                    </span>
                    <h3 className={cn("text-xl font-bold leading-tight", isDarkMode ? "text-white" : "text-slate-900")}>
                      {item.title}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md", isDarkMode ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500")}>
                      {item.capsAlignment}
                    </span>
                  </div>
                </div>
                
                <div className={cn("relative z-10 mt-6 pt-4 border-t flex justify-between items-end", isDarkMode ? "border-white/10" : "border-slate-100")}>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Score / Award</p>
                    <p className={cn("text-2xl font-black", item.type === 'achievement' ? "text-yellow-500" : "text-emerald-500")}>
                      {item.grade}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Full Library & Filtering */}
      <div className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className={cn("text-2xl font-hand px-2", isDarkMode ? "text-white" : "text-slate-800")}>Complete Portfolio</h2>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 custom-scrollbar">
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => setFilter(subj)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  filter === subj
                    ? "bg-brand-cyan text-navy-dark shadow-lg shadow-cyan-500/20"
                    : isDarkMode 
                      ? "bg-white/5 text-slate-400 hover:bg-white/10" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[32px] p-2 overflow-hidden shadow-sm">
           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse min-w-[600px]">
               <thead>
                 <tr className={isDarkMode ? "border-b border-white/10" : "border-b border-slate-200"}>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Activity</th>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Subject & CAPS</th>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Date</th>
                   <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Result</th>
                 </tr>
               </thead>
               <tbody>
                 <AnimatePresence>
                   {filteredItems.map((item, i) => (
                     <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key={item.id}
                        className={cn(
                          "group transition-all hover:bg-brand-cyan/5",
                          isDarkMode ? "border-b border-white/5 last:border-0" : "border-b border-slate-100 last:border-0"
                        )}
                     >
                       <td className="p-4">
                         <div className="flex items-center gap-3">
                           <div className={cn("p-2 rounded-lg bg-gradient-to-br", item.color)}>
                             <item.icon size={16} className="text-white" />
                           </div>
                           <div>
                             <p className={cn("text-sm font-bold leading-tight", isDarkMode ? "text-white" : "text-slate-800")}>{item.title}</p>
                             <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{item.type}</p>
                           </div>
                         </div>
                       </td>
                       <td className="p-4">
                         <p className={cn("text-xs font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{item.subject}</p>
                         <p className="text-[10px] text-slate-500 truncate max-w-[200px] mt-1">{item.capsAlignment}</p>
                       </td>
                       <td className="p-4 text-xs tracking-wider text-slate-400">{item.date}</td>
                       <td className="p-4">
                         <span className={cn(
                           "px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg flex items-center w-fit",
                           item.type === 'achievement' 
                             ? "bg-yellow-500/20 text-yellow-500" 
                             : "bg-emerald-500/20 text-emerald-500"
                         )}>
                           {item.grade}
                         </span>
                       </td>
                     </motion.tr>
                   ))}
                   {filteredItems.length === 0 && (
                     <tr>
                       <td colSpan={4} className="p-12 text-center text-slate-500 text-sm">
                         No portfolio items found for this subject.
                       </td>
                     </tr>
                   )}
                 </AnimatePresence>
               </tbody>
             </table>
           </div>
        </div>
      </div>
      
    </div>
  );
}
