import React from 'react';
import { User, Calendar, Award, Clipboard } from 'lucide-react';

export interface PrintHeaderData {
  studentName: string;
  grade: string;
  date: string;
  totalMarks: string;
  isEnabled: boolean;
}

interface PrintHeaderProps {
  data: PrintHeaderData;
  onChange: (newData: Partial<PrintHeaderData>) => void;
  isDarkMode?: boolean;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({ data, onChange, isDarkMode }) => {
  return (
    <div className={`p-5 rounded-[20px] border transition-all ${
      isDarkMode 
        ? 'bg-slate-800/40 border-white/10 text-white shadow-xl shadow-black/10' 
        : 'bg-white border-slate-200 text-slate-800 shadow-sm'
    } mb-6 max-w-4xl mx-auto`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dashed border-slate-700/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
            <Clipboard size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Worksheet Print Layout Header</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">Customize student metadata injected consistently at the top of worksheets, tests, and assessments on print.</p>
          </div>
        </div>
        
        {/* Toggle Option */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wider">Include Header:</span>
          <button
            onClick={() => onChange({ isEnabled: !data.isEnabled })}
            className={`w-12 h-6.5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer flex items-center ${
              data.isEnabled ? 'bg-brand-cyan' : 'bg-slate-350 dark:bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-5.5 h-5.5 rounded-full shadow-md transform transition-transform duration-200 ${
                data.isEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {data.isEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <User size={10} className="text-brand-cyan" /> Student Name
            </label>
            <input
              type="text"
              value={data.studentName}
              onChange={(e) => onChange({ studentName: e.target.value })}
              placeholder="Blank (Leaves a line)"
              className={`w-full p-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-cyan ${
                isDarkMode ? 'bg-[#0F172A] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Award size={10} className="text-brand-cyan" /> Grade / Class
            </label>
            <input
              type="text"
              value={data.grade}
              onChange={(e) => onChange({ grade: e.target.value })}
              placeholder="Blank (Leaves a line)"
              className={`w-full p-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-cyan ${
                isDarkMode ? 'bg-[#0F172A] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar size={10} className="text-brand-cyan" /> Assessment Date
            </label>
            <input
              type="text"
              value={data.date}
              onChange={(e) => onChange({ date: e.target.value })}
              placeholder="Formatted e.g. 2026-05-31"
              className={`w-full p-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-cyan ${
                isDarkMode ? 'bg-[#0F172A] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clipboard size={10} className="text-brand-cyan" /> Total Marks
            </label>
            <input
              type="text"
              value={data.totalMarks}
              onChange={(e) => onChange({ totalMarks: e.target.value })}
              placeholder="Blank (Leaves scores)"
              className={`w-full p-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-cyan ${
                isDarkMode ? 'bg-[#0F172A] border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
              }`}
            />
          </div>
        </div>
      )}

      {/* Visual Preview Box representing high fidelity print paper representation */}
      {data.isEnabled && (
        <div className="mt-4 pt-4 border-t border-slate-700/5 dark:border-white/5">
          <span className="text-[9px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest block mb-2">Live Printable Layout Preview</span>
          {getPrintHeaderElement(data)}
        </div>
      )}
    </div>
  );
};

// Purely style visual mockup for screen display in React component structure
export const getPrintHeaderElement = (data: PrintHeaderData) => {
  return (
    <div className="w-full border-2 border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white text-slate-800 font-sans text-left shadow-sm select-none">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#00d2ff] flex items-center justify-center text-white text-[9px] font-bold">Edu</div>
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-700">EduAI assessment layout</span>
        </div>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Curriculum and Assessment Policy Statement (CAPS)</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div className="flex items-end gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Learner Name:</span>
          <div className="border-b border-slate-300 dark:border-slate-600 flex-1 h-4 text-xs font-bold text-slate-900 leading-none pb-0.5 truncate min-w-[50px]">
            {data.studentName || '__________________________________________________'}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Grade / Class:</span>
          <div className="border-b border-slate-300 dark:border-slate-600 flex-1 h-4 text-xs font-bold text-slate-900 leading-none pb-0.5 truncate min-w-[50px]">
            {data.grade || '______________________'}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Assessment Date:</span>
          <div className="border-b border-slate-300 dark:border-slate-600 flex-1 h-4 text-xs font-bold text-slate-900 leading-none pb-0.5 truncate min-w-[50px]">
            {data.date || '______________________'}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Total Marks:</span>
          <div className="border-b border-slate-300 dark:border-slate-600 flex-1 h-4 text-xs font-bold text-slate-900 leading-none pb-0.5 truncate min-w-[50px]">
            {data.totalMarks ? `${data.totalMarks} Marks` : '______ / ______'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Generates raw styled HTML representing the same printable worksheet header to consistently inject during window.print exports
export const getPrintHeaderHtml = (data: PrintHeaderData) => {
  if (!data.isEnabled) return '';
  return `
<div class="eduai-print-header w-full border-2 border-slate-300 rounded-xl p-4 mb-6 bg-white shrink-0 text-slate-800" style="width: 100%; box-sizing: border-box; border: 2px solid #cbd5e1; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.5rem; page-break-inside: avoid; background-color: #ffffff; color: #1e293b; font-family: 'Nunito', system-ui, sans-serif; text-align: left;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.375rem; margin-bottom: 0.75rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <div style="width: 1.25rem; height: 1.25rem; border-radius: 0.25rem; bg-color: #00d2ff; background-color: #00d2ff; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.56rem; font-weight: 800; text-transform: uppercase;">Edu</div>
      <span style="font-size: 0.625rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; color: #334155;">EduAI CAPS Assessment Worksheet</span>
    </div>
    <span style="font-size: 0.5rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Republic of South Africa</span>
  </div>
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.625rem 1rem;">
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Learner Name:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${data.studentName || '__________________________________________________'}
      </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Grade / Class:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${data.grade || '______________________'}
      </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Assessment Date:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${data.date || '______________________'}
      </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Total Marks:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${data.totalMarks ? `${data.totalMarks} Marks` : '______ / ______'}
      </div>
    </div>
  </div>
</div>
`;
};
