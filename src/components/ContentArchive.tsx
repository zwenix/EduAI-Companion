import React, { useState, useRef, useEffect } from 'react';
import { Box, Search, Library, History, ExternalLink, Loader2, Trash2, Eye, Edit3, FileDown, Send, Check, X, FileText, FileJson, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { printContent, downloadAsHTML } from '../lib/printUtils';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
// PrintHeader import removed as per user request
import { PosterPreview } from './PosterPreview';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';

// Mock data to simulate the user's generated content and system templates
const INITIAL_ARCHIVE = [
  { id: '1', title: 'Algebra Introduction', subject: 'Mathematics', grade: '9', contentType: 'Lesson Plan', isSystem: true, createdAt: new Date() },
  { id: '2', title: 'Savanna Ecosytems Visual', subject: 'Natural Sciences', grade: '6', contentType: 'Poster', isSystem: true, createdAt: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Parent Evening Notice', subject: 'Administration', grade: 'All', contentType: 'Notice', isSystem: true, createdAt: new Date(Date.now() - 172800000) },
  { id: '4', title: 'Life Skills Flashcards', subject: 'Life Skills', grade: '3', contentType: 'Visual Aid', isSystem: true, createdAt: new Date(Date.now() - 259200000) },
];

const getCategoryColor = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('assessment') || t.includes('test') || t.includes('exam')) return 'bg-red-100 text-red-700 border border-red-200';
  if (t.includes('lesson') || t.includes('plan')) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (t.includes('revision') || t.includes('guide') || t.includes('notes')) return 'bg-purple-100 text-purple-700 border border-purple-200';
  if (t.includes('poster') || t.includes('visual')) return 'bg-pink-100 text-pink-700 border border-pink-200';
  if (t.includes('notice') || t.includes('admin')) return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (t.includes('worksheet') || t.includes('activity')) return 'bg-blue-100 text-blue-700 border border-blue-200';
  return 'bg-brand-yellow/30 text-slate-800 border border-brand-yellow/50';
};

const htmlToMarkdown = (html: string): string => {
  if (!html) return "";
  let md = html;

  // Replace block elements headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

  // Replace paragraph and block-level separators
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Replace list items
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');
  
  // Replace strong / em
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Replace links
  md = md.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Remove other HTML tags (while keeping their content)
  md = md.replace(/<[^>]*>/g, '');

  // Clean up excessive newlines
  md = md.replace(/\n\s*\n\s*\n/gi, '\n\n');

  // Decode basic HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");

  return md.trim();
};

const downloadBlobFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function ContentArchive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [contentTypeFilter, setContentTypeFilter] = useState('All');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('eduai_bookmarks') || '[]');
    } catch {
      return [];
    }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [items, setItems] = useState<any[]>(INITIAL_ARCHIVE);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('eduai_bookmarks', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribe: any;
    
    const loadItems = async () => {
      let combinedItems = [...INITIAL_ARCHIVE];
      
      try {
        const { getStudyNotes } = await import('../lib/offlineDB');
        const offlineItems = await getStudyNotes();
        const formattedOffline = offlineItems.map(item => ({
          ...item,
          isSystem: false,
          createdAt: typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
        }));
        // Filter out initial archive items just in case they overlap
        const offlineOnly = formattedOffline.filter(o => !INITIAL_ARCHIVE.find(i => i.id === o.id));
        combinedItems = [...offlineOnly, ...INITIAL_ARCHIVE];
      } catch (e) {
        console.warn("Could not load offline items", e);
      }
      
      setItems(combinedItems);

      if (auth.currentUser) {
        const q = query(collection(db, 'created_content'), where('teacherId', '==', auth.currentUser.uid));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          setItems([...fetchedItems, ...combinedItems]);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'created_content');
        });
      }
    };
    
    loadItems();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const subjects = ['All', ...Array.from(new Set(items.map(item => item.subject).filter(Boolean)))];
  const grades = ['All', ...Array.from(new Set(items.map(item => String(item.grade)).filter(Boolean)))];
  const contentTypes = ['All', ...Array.from(new Set(items.map(item => item.contentType).filter(Boolean)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.grade?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === 'All' || item.subject === subjectFilter;
    const matchesGrade = gradeFilter === 'All' || String(item.grade) === String(gradeFilter);
    const matchesContentType = contentTypeFilter === 'All' || item.contentType === contentTypeFilter;
    const matchesBookmark = !showBookmarksOnly || bookmarkedIds.includes(item.id);
    
    return matchesSearch && matchesSubject && matchesGrade && matchesContentType && matchesBookmark;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'created_content', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'created_content/' + id);
      }
    } else {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      
      try {
        const { getStudyNotes, saveStudyNote, clearStudyNotes } = await import('../lib/offlineDB');
        const offlineItems = await getStudyNotes();
        const filteredSaved = offlineItems.filter((i: any) => i.id !== id);
        await clearStudyNotes();
        for (const item of filteredSaved) {
          await saveStudyNote(item);
        }
      } catch (e) {
        console.error("Failed to delete offline item", e);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (selectedItem) {
      printContent(printableRef, selectedItem.title || "EduAI-Document", {
        subject: selectedItem.subject,
        grade: selectedItem.grade,
        contentType: selectedItem.contentType,
        date: selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : undefined,
        title: selectedItem.title
      });
    } else {
      printContent(printableRef, "EduAI-Archive-Item");
    }
  };

  const handleTweak = (item: any) => {
    let targetCreatorTab = 'teaching';
    const type = (item.contentType || '').toLowerCase();
    const grade = (item.grade || '').toLowerCase();
    
    if (grade.includes('1') || grade.includes('2') || grade.includes('3')) {
      targetCreatorTab = 'grade1';
    } else if (type.includes('poster') || type.includes('visual') || type.includes('card') || type.includes('diagram') || type.includes('map') || type.includes('label')) {
      targetCreatorTab = 'visual';
    } else if (type.includes('notice') || type.includes('letter') || type.includes('slip') || type.includes('invitation') || type.includes('calendar') || type.includes('timetable') || type.includes('register')) {
      targetCreatorTab = 'admin';
    }
    
    // Close preview modal if opened
    setSelectedItem(null);
    
    // Dispatch the trigger custom event
    const event = new CustomEvent('trigger-edit-content', {
      detail: { item, tab: targetCreatorTab }
    });
    window.dispatchEvent(event);
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

      {/* Filters and Search Bar */}
      <div className="flex flex-col xl:flex-row gap-3 mb-6 lg:mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search your archive..." 
            className="w-full pl-12 lg:pl-14 pr-6 py-3 lg:py-4 rounded-full bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-brand-cyan transition-all text-slate-700 text-sm lg:text-base animate-pulse-once"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          {/* Subject Filter */}
          <div className="relative w-full sm:w-44 shrink-0">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full appearance-none px-5 py-3 lg:py-4 rounded-full bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-brand-cyan transition-all text-slate-700 text-sm cursor-pointer"
            >
              {subjects.map((subject: any) => (
                <option key={subject} value={subject}>
                  {subject === 'All' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Grade Filter */}
          <div className="relative w-full sm:w-32 shrink-0">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full appearance-none px-5 py-3 lg:py-4 rounded-full bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-brand-cyan transition-all text-slate-700 text-sm cursor-pointer"
            >
              <option value="All">All Grades</option>
              {grades.filter(g => g !== 'All').map((g: any) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Content Type Filter */}
          <div className="relative w-full sm:w-40 shrink-0">
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="w-full appearance-none px-5 py-3 lg:py-4 rounded-full bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-brand-cyan transition-all text-slate-700 text-sm cursor-pointer"
            >
              <option value="All">All Formats</option>
              {contentTypes.filter(ct => ct !== 'All').map((ct: any) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <button
            onClick={() => setShowBookmarksOnly(prev => !prev)}
            className={`px-5 py-3 lg:py-4 rounded-full flex items-center justify-center gap-2 font-hand text-base transition-all border shrink-0 ${
              showBookmarksOnly 
                ? 'bg-amber-500 border-amber-600 text-white shadow-md hover:bg-amber-600' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${showBookmarksOnly ? 'fill-current text-white' : 'text-slate-400'}`} />
            {showBookmarksOnly ? 'Favorites' : 'Bookmarked'}
          </button>
        </div>
      </div>

      {/* Archive Grid */}
      <div className="grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div key={item.id} id="archive-list-item" className="bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] p-5 lg:p-6 hover:shadow-xl transition-all relative group flex flex-col h-full">
            <div className="flex justify-between items-start mb-3 lg:mb-4">
              <div className="flex gap-2 flex-wrap items-center">
                <span className={`px-2.5 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black tracking-widest uppercase ${item.isSystem ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.isSystem ? 'Official' : 'History'} • Gr {item.grade}
                </span>
                {item.contentType && (
                  <span className={`px-2.5 lg:px-3 py-1 rounded-full text-[9px] lg:text-[10px] font-black tracking-widest uppercase ${getCategoryColor(item.contentType)}`}>
                    {item.contentType}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={(e) => toggleBookmark(item.id, e)} 
                  title={bookmarkedIds.includes(item.id) ? "Remove Favorite" : "Bookmark Material"}
                  className={`p-1.5 rounded-full transition-all border ${
                    bookmarkedIds.includes(item.id) 
                      ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                >
                  <Bookmark size={15} className={bookmarkedIds.includes(item.id) ? 'fill-amber-500' : ''} />
                </button>
                {!item.isSystem && (
                  <button onClick={(e) => handleDelete(item.id, e)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 bg-slate-50 border border-slate-100 hover:bg-red-50 rounded-full shrink-0">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
            
            <h3 className="font-hand text-2xl text-slate-800 mb-1">{item.title}</h3>
            <p className="text-brand-cyan font-bold text-sm mb-4">{item.subject}</p>
            
            <div className="mt-auto pt-4 flex gap-2">
              <button onClick={() => setSelectedItem(item)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                <Eye size={14} /> View
              </button>
              <button onClick={() => handleTweak(item)} className="flex-1 bg-white border border-brand-cyan text-brand-cyan hover:bg-cyan-50 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
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
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 text-left">
                <div className="bg-white p-6 lg:p-10 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 min-h-[300px] lg:min-h-[400px] printable-doc animate-fade-in" ref={printableRef}>
                  <h1 className="text-xl lg:text-3xl font-bold mb-4 lg:mb-6 text-slate-800 border-b border-slate-200 pb-4 print:hidden">{selectedItem.title}</h1>
                  <div className="space-y-6 text-slate-700 text-sm lg:text-base">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 mb-4 print:hidden">
                      <p><strong>Subject:</strong> {selectedItem.subject}</p>
                      <p><strong>Grade:</strong> {selectedItem.grade}</p>
                      <p><strong>Type:</strong> {selectedItem.contentType}</p>
                      <p><strong>Date:</strong> {new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    {selectedItem.content ? (
                      selectedItem.content.includes('poster-container') || selectedItem.content.includes('content-card') ? (
                        <PosterPreview html={selectedItem.content} />
                      ) : (
                        <div className="prose prose-sm lg:prose-base max-w-none markdown-body"
                          dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(selectedItem.content.trim().startsWith('div ') ? '<' + selectedItem.content : selectedItem.content) as string) }}
                        />
                      )
                    ) : (
                      <div className="mt-4 lg:mt-8 p-4 lg:p-6 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-center text-slate-500 italic text-xs lg:text-sm">No content found for this item.</p>
                      </div>
                    )}

                    {selectedItem.memo && (
                      <div className="mt-10 pt-10 border-t-2 border-dashed border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">MARKING MEMORANDUM</h2>
                        <div className="prose prose-sm max-w-none markdown-body"
                          dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(selectedItem.memo.trim().startsWith('div ') ? '<' + selectedItem.memo : selectedItem.memo) as string) }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 lg:p-6 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 flex-wrap">
                  <button onClick={() => handleTweak(selectedItem)} className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold transition-all text-xs lg:text-base flex-1 sm:flex-none">
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
                  <button 
                    onClick={() => {
                      const mdContent = htmlToMarkdown(selectedItem?.content || '');
                      const filename = `${(selectedItem?.title || 'Archive-Item').replace(/\s+/g, '_')}.md`;
                      downloadBlobFile(mdContent, filename, 'text/markdown;charset=utf-8');
                    }}
                    className="flex items-center justify-center gap-2 border border-purple-500 text-purple-600 hover:bg-purple-50 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold transition-all text-xs lg:text-base flex-1 sm:flex-none"
                  >
                    <FileText size={16} /> Export Markdown
                  </button>
                  <button 
                    onClick={() => {
                      const jsonContent = JSON.stringify({
                        title: selectedItem?.title,
                        subject: selectedItem?.subject,
                        grade: selectedItem?.grade,
                        contentType: selectedItem?.contentType,
                        content: selectedItem?.content || "",
                        memo: selectedItem?.memo || null,
                        rubric: selectedItem?.rubric || null,
                        imagePrompt: selectedItem?.imagePrompt || null,
                        exportedAt: new Date().toISOString()
                      }, null, 2);
                      const filename = `${(selectedItem?.title || 'Archive-Item').replace(/\s+/g, '_')}.json`;
                      downloadBlobFile(jsonContent, filename, 'application/json;charset=utf-8');
                    }}
                    className="flex items-center justify-center gap-2 border border-blue-500 text-blue-600 hover:bg-blue-50 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold transition-all text-xs lg:text-base flex-1 sm:flex-none"
                  >
                    <FileJson size={16} /> Export JSON
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
