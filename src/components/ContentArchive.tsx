import React, { useState, useRef, useEffect } from 'react';
import { Box, Search, Library, History, ExternalLink, Loader2, Trash2, Eye, Edit3, FileDown, Send, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { printContent, downloadAsHTML } from '../lib/printUtils';

// Mock data to simulate the user's generated content and system templates
const INITIAL_ARCHIVE = [
  { id: '1', title: 'Algebra Introduction', subject: 'Mathematics', grade: '9', contentType: 'Lesson Plan', isSystem: true, createdAt: new Date() },
  { id: '2', title: 'Savanna Ecosytems Visual', subject: 'Natural Sciences', grade: '6', contentType: 'Poster', isSystem: true, createdAt: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Parent Evening Notice', subject: 'Administration', grade: 'All', contentType: 'Notice', isSystem: false, createdAt: new Date(Date.now() - 172800000) },
  { id: '4', title: 'Life Skills Flashcards', subject: 'Life Skills', grade: '3', contentType: 'Visual Aid', isSystem: false, createdAt: new Date(Date.now() - 259200000) },
];

export default function ContentArchive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState(INITIAL_ARCHIVE);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('eduai_archive');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Combine with system defaults if needed, or just replace
        setItems([...parsed, ...INITIAL_ARCHIVE]);
      } catch (e) {
        console.error('Failed to load archive', e);
      }
    }
  }, []);

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    
    // Also update localStorage
    const saved = JSON.parse(localStorage.getItem('eduai_archive') || '[]');
    const filteredSaved = saved.filter((i: any) => i.id !== id);
    localStorage.setItem('eduai_archive', JSON.stringify(filteredSaved));
  };

  const handleDownloadPDF = async () => {
    printContent(printableRef, "EduAI-Archive-Item");
  };

  const handleAssign = () => {
    setIsAssigning(true);
    setTimeout(() => {
      setIsAssigning(false);
      setSelectedItem(null);
    }, 1000);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6 bg-gradient-to-r from-cyan-600 to-indigo-600 p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] text-white shadow-xl mb-6 lg:mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-5xl font-hand flex items-center gap-3 lg:gap-4 text-white">
            <Box className="h-8 w-8 lg:h-10 lg:w-10 text-brand-yellow" /> Content & Archive
          </h1>
          <p className="text-sm lg:text-lg text-cyan-100 font-medium mt-1 lg:mt-2 max-w-2xl">
            Central repository for your generated materials, templates, and school documents.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="glass p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] flex items-center gap-4 lg:gap-6 border border-slate-200 shadow-sm relative group overflow-hidden">
          <div className="p-3 lg:p-5 bg-brand-yellow/20 rounded-2xl lg:rounded-3xl text-brand-yellow"><Library className="h-6 w-6 lg:h-8 lg:w-8" /></div>
          <div>
            <h3 className="font-hand text-xl lg:text-2xl text-slate-800">Official Repo</h3>
            <p className="text-slate-500 text-xs lg:text-sm">System templates & documentation.</p>
          </div>
          <a href="#" className="absolute inset-0 z-10"></a>
          <ExternalLink className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-brand-yellow transition-colors" size={18} />
        </div>

        <div className="glass p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] flex items-center gap-4 lg:gap-6 border border-slate-200 shadow-sm relative group overflow-hidden">
          <div className="p-3 lg:p-5 bg-brand-cyan/20 rounded-2xl lg:rounded-3xl text-brand-cyan"><History className="h-6 w-6 lg:h-8 lg:w-8" /></div>
          <div>
            <h3 className="font-hand text-xl lg:text-2xl text-slate-800">Community Store</h3>
            <p className="text-slate-500 text-xs lg:text-sm">Explore shared materials.</p>
          </div>
          <a href="#" className="absolute inset-0 z-10"></a>
          <ExternalLink className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-brand-cyan transition-colors" size={18} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 lg:mb-8">
        <Search className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Search your archive..." 
          className="w-full pl-12 lg:pl-14 pr-6 py-3 lg:py-4 rounded-full bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-brand-cyan transition-all text-slate-700 text-sm lg:text-base"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* Archive Grid */}
      <div className="grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] p-5 lg:p-6 hover:shadow-xl transition-all relative group flex flex-col h-full">
            <div className="flex justify-between items-start mb-3 lg:mb-4">
              <span className={`px-2.5 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black tracking-widest uppercase ${item.isSystem ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                {item.isSystem ? 'Official' : 'History'} • Gr {item.grade}
              </span>
              {!item.isSystem && (
                <button onClick={(e) => handleDelete(item.id, e)} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-50 hover:bg-red-50 rounded-full">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <h3 className="font-hand text-2xl text-slate-800 mb-1">{item.title}</h3>
            <p className="text-brand-cyan font-bold text-sm mb-4">{item.subject}</p>
            
            <div className="mt-auto pt-4 flex gap-2">
              <button onClick={() => setSelectedItem(item)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Eye size={14} /> View
              </button>
              <button className="flex-1 bg-white border border-brand-cyan text-brand-cyan hover:bg-cyan-50 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Edit3 size={14} /> Tweak
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-navy-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 p-6 lg:p-8 text-white flex justify-between items-center shrink-0">
                <div>
                  <h2 className="font-hand text-2xl lg:text-4xl text-white">{selectedItem.title}</h2>
                  <p className="text-cyan-100 font-medium text-xs lg:text-base">Preview and Distribute</p>
                </div>
                <div className="hidden sm:block px-4 py-1.5 border-2 border-white/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Grade {selectedItem.grade}
                </div>
              </div>
              
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
                <div className="bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 min-h-[300px] lg:min-h-[400px] printable-doc" ref={printableRef}>
                  <h1 className="text-xl lg:text-3xl font-bold mb-4 lg:mb-6 text-slate-800 border-b border-slate-200 pb-4">{selectedItem.title}</h1>
                  <div className="space-y-6 text-slate-700 text-sm lg:text-base">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 mb-4">
                      <p><strong>Subject:</strong> {selectedItem.subject}</p>
                      <p><strong>Grade:</strong> {selectedItem.grade}</p>
                      <p><strong>Type:</strong> {selectedItem.contentType}</p>
                      <p><strong>Date:</strong> {new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    {selectedItem.content ? (
                      <div className="prose prose-sm lg:prose-base max-w-none markdown-body"
                        dangerouslySetInnerHTML={{ __html: marked.parse(selectedItem.content.trim().startsWith('div ') ? '<' + selectedItem.content : selectedItem.content) as string }}
                      />
                    ) : (
                      <div className="mt-4 lg:mt-8 p-4 lg:p-6 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-center text-slate-500 italic text-xs lg:text-sm">No content found for this item.</p>
                      </div>
                    )}

                    {selectedItem.memo && (
                      <div className="mt-10 pt-10 border-t-2 border-dashed border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">MARKING MEMORANDUM</h2>
                        <div className="prose prose-sm max-w-none markdown-body"
                          dangerouslySetInnerHTML={{ __html: marked.parse(selectedItem.memo.trim().startsWith('div ') ? '<' + selectedItem.memo : selectedItem.memo) as string }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 lg:p-6 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                  <button className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold transition-all text-xs lg:text-base flex-1 sm:flex-none">
                    <Edit3 size={16} /> Tweak in Creator
                  </button>
                  <button 
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold transition-all text-xs lg:text-base flex-1 sm:flex-none disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} 
                    {isDownloading ? 'Saving...' : 'Print / Save PDF'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <select className="flex-1 border border-slate-200 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-2.5 lg:py-3 bg-white outline-none focus:border-brand-cyan text-slate-700 text-xs lg:text-sm">
                    <option value="">Assign to Class...</option>
                    <option value="class-1">Class A</option>
                    <option value="class-2">Class B</option>
                  </select>
                  <button 
                    onClick={handleAssign}
                    disabled={isAssigning}
                    className="flex items-center justify-center gap-2 bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[10px] lg:text-[11px] transition-all disabled:opacity-50"
                  >
                    {isAssigning ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Assign
                  </button>
                  
                  <button onClick={() => setSelectedItem(null)} className="p-2.5 lg:p-3 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl lg:rounded-2xl transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
