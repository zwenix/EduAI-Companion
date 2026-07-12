import React, { useState, useEffect } from 'react';
import { 
  Image, Search, Plus, Copy, Trash2, Check, RefreshCw, 
  ExternalLink, ArrowLeft, Filter, BookOpen, Download, HelpCircle,
  Calculator, Atom, Languages, Heart, Grid, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, onSnapshot, setDoc, doc, deleteDoc, Timestamp 
} from 'firebase/firestore';

interface Illustration {
  id: string;
  prompt: string;
  imageUrl: string;
  subject?: string;
  grade?: string;
  teacherId?: string;
  createdAt: any;
}

export default function IllustrationLibrary({ isDarkMode }: { isDarkMode: boolean }) {
  const [illustrations, setIllustrations] = useState<Illustration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedCapsCategory, setSelectedCapsCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grouped');
  
  // Create state
  const [newPrompt, setNewPrompt] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newGrade, setNewGrade] = useState('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Editing state
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideUrl, setOverrideUrl] = useState('');
  
  // Feedback copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync real-time illustration items from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'illustrations'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Illustration[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            prompt: data.prompt || '',
            imageUrl: data.imageUrl || '',
            subject: data.subject || 'General',
            grade: data.grade || 'All',
            teacherId: data.teacherId || '',
            createdAt: data.createdAt
          });
        });
        
        // Sort by createdAt descending
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        
        setIllustrations(list);
        setLoading(false);
      }, (err) => {
        console.error("Firestore loading error:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    setIsGenerating(true);
    setStatusMessage('Crafting professional educational illustration...');

    try {
      const seed = Math.floor(Math.random() * 100000);
      const cleanPrompt = newPrompt.trim();
      const lowerPrompt = cleanPrompt.toLowerCase();
      const cleanId = lowerPrompt.replace(/[^a-z0-9_-]/g, '_').slice(0, 100);

      if (!cleanId) {
        setStatusMessage('Invalid characters in prompt.');
        setIsGenerating(false);
        return;
      }

      // Generate enhanced educational visual style compliant with SA palette
      const enhancedPrompt = `${cleanPrompt}, World-class masterpiece work of art, crisp render, sharp focus, charmingly aesthetic design, 4k, soft lighting, masterpiece emoji-style figurine 3D render, 3D Disney Character render, pure white background, natural beauty`;
      const generatedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=800&height=600&nologo=true&model=flux&seed=${seed}`;

      const docRef = doc(db, 'illustrations', cleanId);
      const user = auth.currentUser;
      
      const payload: any = {
        prompt: cleanPrompt,
        imageUrl: generatedUrl,
        subject: newSubject,
        grade: newGrade,
        createdAt: Timestamp.now()
      };
      
      if (user) {
        payload.teacherId = user.uid;
      }

      await setDoc(docRef, payload);
      
      setNewPrompt('');
      setStatusMessage('Sucessfully generated and stored in Illustration Library!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setStatusMessage('Failed to generate. Please verify network.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOverride = async (id: string) => {
    if (!overrideUrl.trim()) return;
    try {
      const docRef = doc(db, 'illustrations', id);
      await setDoc(docRef, {
        imageUrl: overrideUrl.trim(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      setOverrideId(null);
      setOverrideUrl('');
    } catch (e) {
      console.error(e);
      alert('Could not update illustration image URL.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this illustration from your library?')) return;
    try {
      const docRef = doc(db, 'illustrations', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error(e);
      alert('Could not delete illustration.');
    }
  };

  const copyToClipboard = (text: string, id: string, type: 'placeholder' | 'url') => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCapsCategory = (subjectStr?: string, promptStr?: string): 'Math' | 'Science' | 'Language' | 'Life Skills' => {
    const s = (subjectStr || '').toLowerCase();
    const p = (promptStr || '').toLowerCase();
    
    if (
      s === 'mathematics' || 
      s === 'math' || 
      p.includes('math') || 
      p.includes('fraction') || 
      p.includes('geometry') || 
      p.includes('algebra') || 
      p.includes('number') || 
      p.includes('equation') || 
      p.includes('calculus') || 
      p.includes('addition') ||
      p.includes('multiplication')
    ) {
      return 'Math';
    }
    
    if (
      s.includes('science') || 
      s.includes('biology') || 
      s.includes('physics') || 
      s.includes('chemistry') || 
      p.includes('science') || 
      p.includes('earth') || 
      p.includes('water') || 
      p.includes('cell') || 
      p.includes('organism') || 
      p.includes('planet') || 
      p.includes('animal') || 
      p.includes('plant') ||
      p.includes('skeleton') ||
      p.includes('volcano') ||
      p.includes('electricity') ||
      p.includes('energy') ||
      p.includes('ecosystem')
    ) {
      return 'Science';
    }
    
    if (
      s.includes('language') || 
      s.includes('english') || 
      s.includes('afrikaans') || 
      s.includes('zulu') || 
      s.includes('translation') || 
      p.includes('letter') || 
      p.includes('alphabet') || 
      p.includes('grammar') || 
      p.includes('vocabulary') || 
      p.includes('word') || 
      p.includes('sentence') ||
      p.includes('noun') ||
      p.includes('phonics')
    ) {
      return 'Language';
    }
    
    return 'Life Skills';
  };

  const getCapsCounts = () => {
    const counts = { All: illustrations.length, Math: 0, Science: 0, Language: 0, 'Life Skills': 0 };
    illustrations.forEach(item => {
      const cat = getCapsCategory(item.subject, item.prompt);
      counts[cat]++;
    });
    return counts;
  };

  const filteredIllustrations = illustrations.filter((item) => {
    const matchesSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || item.subject === selectedSubject;
    
    const categoryOfItem = getCapsCategory(item.subject, item.prompt);
    const matchesCapsCategory = selectedCapsCategory === 'All' || categoryOfItem === selectedCapsCategory;
    
    return matchesSearch && matchesSubject && matchesCapsCategory;
  });

  const subjectsList = ['All', 'Mathematics', 'Life Sciences', 'Natural Sciences', 'Social Sciences', 'Language', 'Life Skills', 'General'];

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className={`space-y-8 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-display font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Illustration Library
          </h2>
          <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Store, regenerate, and synchronise rich graphics across dynamic learning modules and posters.
          </p>
        </div>
      </div>

      {/* Grid containing Generation Tool & Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create/Generate Custom asset */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`${isDarkMode ? 'glass p-6' : 'bg-white border-2 border-slate-100 p-8'} rounded-[32px] shadow-xl relative overflow-hidden`}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white rounded-xl">
                <Plus size={18} />
              </span>
              <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Add Classroom Asset
              </h3>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Visual Prompt / Description
                </label>
                <textarea
                  rows={3}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="e.g. A cross-section of the Earth showcasing crust, mantle, outer core and inner core"
                  className={`w-full text-sm rounded-xl p-3 h-24 ${isDarkMode ? 'bg-slate-900/60 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-2 border-slate-100 text-slate-800 placeholder-slate-400'} focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    CAPS Subject
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className={`w-full text-xs rounded-xl p-3 ${isDarkMode ? 'bg-slate-900 border-white/10 text-slate-300' : 'bg-slate-50 border-2 border-slate-100 text-slate-700'} focus:outline-none`}
                  >
                    {subjectsList.filter(s => s !== 'All').map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Grade Sync
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className={`w-full text-xs rounded-xl p-3 ${isDarkMode ? 'bg-slate-900 border-white/10 text-slate-300' : 'bg-slate-50 border-2 border-slate-100 text-slate-700'} focus:outline-none`}
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((gr) => (
                      <option key={gr} value={gr}>Grade {gr}</option>
                    ))}
                    <option value="All">General / All</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !newPrompt.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-black py-3 rounded-xl shadow-md tracking-wider uppercase text-xs transition duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Image size={14} />
                    Generate & Index
                  </>
                )}
              </button>
            </form>

            {statusMessage && (
              <div className={`mt-4 p-3 rounded-xl border text-xs font-semibold ${isDarkMode ? 'bg-slate-900/80 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-800'} animate-pulse`}>
                {statusMessage}
              </div>
            )}

            <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'} text-xs space-y-2`}>
              <div className="flex items-start gap-2 text-slate-400">
                <span className="mt-0.5">💡</span>
                <p className="leading-relaxed">
                  <strong>How to use placeholders:</strong> Type <code>[Illustration: Your Prompt]</code> inside your custom worksheets, lessons, or notes.
                </p>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <span className="mt-0.5">✓</span>
                <p className="leading-relaxed">
                  The engine will seamlessly match your custom prompt to its library cache or generate it on-the-fly!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Search & Library Gallery */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search matching classroom illustrations / key terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-4 py-2 text-sm rounded-xl focus:outline-none ${isDarkMode ? 'bg-slate-900 border-2 border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50' : 'bg-white border-2 border-slate-100 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20'}`}
              />
            </div>
            
            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-400 select-none">
                <Filter size={14} className="inline mr-1" /> Subject
              </span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className={`text-xs rounded-xl p-2.5 ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-2 border-slate-100 text-slate-700'} focus:outline-none`}
              >
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic CAPS Subject Category Tabs & View Mode Switcher */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl border ${isDarkMode ? 'border-white/5 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'} backdrop-blur-sm`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-2 select-none">
                CAPS Subject:
              </span>
              {[
                { name: 'All', icon: BookOpen },
                { name: 'Math', icon: Calculator },
                { name: 'Science', icon: Atom },
                { name: 'Language', icon: Languages },
                { name: 'Life Skills', icon: Heart }
              ].map((cat) => {
                const IconComp = cat.icon;
                const counts = getCapsCounts();
                const count = cat.name === 'All' ? counts.All : (counts as any)[cat.name];
                const isActive = selectedCapsCategory === cat.name;
                
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCapsCategory(cat.name)}
                    className={`text-xs font-black rounded-xl px-3 py-1.5 flex items-center gap-1.5 cursor-pointer transition-all duration-200 border ${
                      isActive 
                        ? (cat.name === 'Math' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 font-extrabold shadow-sm' 
                           : cat.name === 'Science' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 font-extrabold shadow-sm'
                           : cat.name === 'Language' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 font-extrabold shadow-sm'
                           : cat.name === 'Life Skills' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-extrabold shadow-sm'
                           : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 font-extrabold shadow-sm')
                        : `${isDarkMode ? 'border-white/5 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-900' : 'border-slate-100 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`
                    }`}
                  >
                    <IconComp size={13} />
                    <span>{cat.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${isActive ? 'bg-indigo-500/20 text-white' : 'bg-slate-500/10 text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle */}
            <div className={`flex items-center gap-1.5 p-1 rounded-2xl border ${isDarkMode ? 'border-white/5 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
              <button
                onClick={() => setViewMode('grouped')}
                className={`p-1.5 rounded-xl cursor-pointer transition ${viewMode === 'grouped' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                title="Grouped CAPS Category View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl cursor-pointer transition ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                title="Unified Standard Grid"
              >
                <Grid size={15} />
              </button>
            </div>
          </div>

          {/* Loader or Illustration Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="animate-spin text-indigo-500" size={32} />
              <p className="text-sm font-bold text-slate-400">Accessing Cloud Library...</p>
            </div>
          ) : filteredIllustrations.length === 0 ? (
            <div className={`p-12 text-center rounded-[32px] border-2 border-dashed ${isDarkMode ? 'border-white/5 bg-slate-900/10' : 'border-slate-150 bg-slate-50/50'}`}>
              <div className="text-4xl mb-3">🖼️</div>
              <h4 className="font-extrabold text-sm text-slate-500">No Illustrations Synced</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Insert raw image prompt tags inside worksheets or use the tool on the left to initialize visual elements in real-time matching active filters.
              </p>
            </div>
          ) : (
            <div id="illustration-list-container" className="space-y-10">
              {viewMode === 'grouped' ? (
                <div className="space-y-12">
                  {[
                    {
                      label: 'Mathematics',
                      icon: Calculator,
                      color: 'text-amber-500',
                      bg: 'bg-amber-500/10',
                      border: 'border-amber-500/20',
                      desc: 'Numbers, fractions, equations, geometry and mathematical-symbols.',
                      items: filteredIllustrations.filter(item => getCapsCategory(item.subject, item.prompt) === 'Math')
                    },
                    {
                      label: 'Sciences (Life & Natural)',
                      icon: Atom,
                      color: 'text-indigo-400',
                      bg: 'bg-indigo-500/10',
                      border: 'border-indigo-500/20',
                      desc: 'Ecosystems, organisms, planetary cycles, volcanoes, and scientific diagrams.',
                      items: filteredIllustrations.filter(item => getCapsCategory(item.subject, item.prompt) === 'Science')
                    },
                    {
                      label: 'Languages & Literacy',
                      icon: Languages,
                      color: 'text-purple-400',
                      bg: 'bg-purple-500/10',
                      border: 'border-purple-500/20',
                      desc: 'Alphabets, grammar layouts, phonics, vocabulary charts and spelling structures.',
                      items: filteredIllustrations.filter(item => getCapsCategory(item.subject, item.prompt) === 'Language')
                    },
                    {
                      label: 'Life Skills & General',
                      icon: Heart,
                      color: 'text-emerald-500',
                      bg: 'bg-emerald-500/10',
                      border: 'border-emerald-500/20',
                      desc: 'Personal wellness, physical education, creative arts and social awareness.',
                      items: filteredIllustrations.filter(item => getCapsCategory(item.subject, item.prompt) === 'Life Skills')
                    }
                  ].map((catInfo) => {
                    const CatIcon = catInfo.icon;
                    if (catInfo.items.length === 0) return null;
                    
                    return (
                      <div key={catInfo.label} className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b pb-2 border-slate-100/10">
                          <div className="flex items-center gap-2.5">
                            <span className={`p-2 rounded-xl ${catInfo.bg} ${catInfo.color}`}>
                              <CatIcon size={18} />
                            </span>
                            <div>
                              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                {catInfo.label}
                              </h3>
                              <p className="text-[10px] text-slate-400 mt-0.5 animate-pulse">
                                {catInfo.desc}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                            {catInfo.items.length} {catInfo.items.length === 1 ? 'asset' : 'assets'}
                          </span>
                        </div>

                        {/* Section Grid */}
                        <motion.div 
                          className="grid grid-cols-1 md:grid-cols-2 gap-6"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {catInfo.items.map((item) => (
                            <motion.div
                              key={item.id}
                              className={`relative overflow-hidden rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900/40 border-white/5 hover:border-cyan-500/20' : 'bg-white border-slate-100 hover:border-indigo-500/20'} p-3.5 transition-all shadow-sm ${overrideId === item.id ? 'ring-2 ring-indigo-500' : ''}`}
                              variants={itemVariants}
                            >
                              {/* Image Frame */}
                              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 relative group border border-slate-200/50">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.prompt} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a 
                                    href={item.imageUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1.5 bg-black/60 hover:bg-black text-white rounded-lg text-xs"
                                    title="Open Image"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                </div>

                                <div className="absolute bottom-3 left-3 flex gap-2">
                                  <span className="px-2 py-0.5 text-[8px] font-black uppercase text-white bg-black/50 backdrop-blur-sm rounded-full leading-relaxed select-none">
                                    Grade {item.grade || 'All'}
                                  </span>
                                  <span className="px-2 py-0.5 text-[8px] font-black uppercase text-white bg-indigo-600/70 backdrop-blur-sm rounded-full leading-relaxed select-none">
                                    {item.subject || 'General'}
                                  </span>
                                </div>
                              </div>

                              {/* Body Info */}
                              <div className="mt-4 px-1.5 space-y-3">
                                <div>
                                  <h4 className="text-xs font-bold uppercase text-slate-400 select-none">Prompt / Keyword</h4>
                                  <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`} title={item.prompt}>
                                    {item.prompt}
                                  </p>
                                </div>

                                {/* Meta actions */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {/* Copy placeholder tags */}
                                  <button
                                    onClick={() => copyToClipboard(`[Illustration: ${item.prompt}]`, item.id, 'placeholder')}
                                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    title="Copy text placeholder [Illustration: ...]"
                                  >
                                    {copiedId === `${item.id}-placeholder` ? (
                                      <>
                                        <Check size={11} className="text-emerald-500 font-extrabold" />
                                        Copied Tag
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} />
                                        Copy Tag Placeholder
                                      </>
                                    )}
                                  </button>

                                  {/* Copy image URL */}
                                  <button
                                    onClick={() => copyToClipboard(item.imageUrl, item.id, 'url')}
                                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                    title="Copy direct image URL"
                                  >
                                    {copiedId === `${item.id}-url` ? (
                                      <>
                                        <Check size={11} className="text-emerald-500 font-extrabold" />
                                        Copied URL
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} />
                                        Copy CDN URL
                                      </>
                                    )}
                                  </button>

                                  {/* Edit override */}
                                  <button
                                    onClick={() => {
                                      setOverrideId(item.id);
                                      setOverrideUrl(item.imageUrl);
                                    }}
                                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
                                    title="Override image with customized graphic"
                                  >
                                    <RefreshCw size={11} />
                                    Over-write
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition ${isDarkMode ? 'bg-slate-800/60 hover:bg-red-950/40 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'} ml-auto`}
                                    title="Remove from cloud storage"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {/* Override state input */}
                                {overrideId === item.id && (
                                  <div className={`mt-3 p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-2 animate-fade-in`}>
                                    <label className="text-[10px] font-black uppercase text-slate-400">
                                      Custom Replacement Image URL
                                    </label>
                                    <div className="flex gap-1.5">
                                      <input
                                        type="text"
                                        value={overrideUrl}
                                        onChange={(e) => setOverrideUrl(e.target.value)}
                                        className={`flex-1 text-xs p-2 rounded-lg ${isDarkMode ? 'bg-slate-800 text-white border-white/5' : 'bg-white text-slate-800 border-slate-200 border'}`}
                                        placeholder="https://example.com/custom-image.png"
                                      />
                                      <button
                                        onClick={() => handleOverride(item.id)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 rounded-lg flex items-center justify-center cursor-pointer"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setOverrideId(null);
                                          setOverrideUrl('');
                                        }}
                                        className={`font-semibold text-xs px-2.5 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredIllustrations.map((item) => (
                    <motion.div
                      key={item.id}
                      className={`relative overflow-hidden rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900/40 border-white/5 hover:border-cyan-500/20' : 'bg-white border-slate-100 hover:border-indigo-500/20'} p-3.5 transition-all shadow-sm ${overrideId === item.id ? 'ring-2 ring-indigo-500' : ''}`}
                      variants={itemVariants}
                    >
                      {/* Image Frame */}
                      <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 relative group border border-slate-200/50">
                        <img 
                          src={item.imageUrl} 
                          alt={item.prompt} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={item.imageUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 bg-black/60 hover:bg-black text-white rounded-lg text-xs"
                            title="Open Image"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>

                        <div className="absolute bottom-3 left-3 flex gap-2">
                          <span className="px-2 py-0.5 text-[8px] font-black uppercase text-white bg-black/50 backdrop-blur-sm rounded-full leading-relaxed select-none">
                            Grade {item.grade || 'All'}
                          </span>
                          <span className="px-2 py-0.5 text-[8px] font-black uppercase text-white bg-indigo-600/70 backdrop-blur-sm rounded-full leading-relaxed select-none">
                            {item.subject || 'General'}
                          </span>
                        </div>
                      </div>

                      {/* Body Info */}
                      <div className="mt-4 px-1.5 space-y-3">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-slate-400 select-none">Prompt / Keyword</h4>
                          <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`} title={item.prompt}>
                            {item.prompt}
                          </p>
                        </div>

                        {/* Meta actions */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Copy placeholder tags */}
                          <button
                            onClick={() => copyToClipboard(`[Illustration: ${item.prompt}]`, item.id, 'placeholder')}
                            className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            title="Copy text placeholder [Illustration: ...]"
                          >
                            {copiedId === `${item.id}-placeholder` ? (
                              <>
                                <Check size={11} className="text-emerald-500 font-extrabold" />
                                Copied Tag
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                Copy Tag Placeholder
                              </>
                            )}
                          </button>

                          {/* Copy image URL */}
                          <button
                            onClick={() => copyToClipboard(item.imageUrl, item.id, 'url')}
                            className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                            title="Copy direct image URL"
                          >
                            {copiedId === `${item.id}-url` ? (
                              <>
                                <Check size={11} className="text-emerald-500 font-extrabold" />
                                Copied URL
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                Copy CDN URL
                              </>
                            )}
                          </button>

                          {/* Edit override */}
                          <button
                            onClick={() => {
                              setOverrideId(item.id);
                              setOverrideUrl(item.imageUrl);
                            }}
                            className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
                            title="Override image with customized graphic"
                          >
                            <RefreshCw size={11} />
                            Over-write
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition ${isDarkMode ? 'bg-slate-800/60 hover:bg-red-950/40 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'} ml-auto`}
                            title="Remove from cloud storage"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Override state input */}
                        {overrideId === item.id && (
                          <div className={`mt-3 p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-2 animate-fade-in`}>
                            <label className="text-[10px] font-black uppercase text-slate-400">
                              Custom Replacement Image URL
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={overrideUrl}
                                onChange={(e) => setOverrideUrl(e.target.value)}
                                className={`flex-1 text-xs p-2 rounded-lg ${isDarkMode ? 'bg-slate-800 text-white border-white/5' : 'bg-white text-slate-800 border-slate-200 border'}`}
                                placeholder="https://example.com/custom-image.png"
                              />
                              <button
                                onClick={() => handleOverride(item.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 rounded-lg flex items-center justify-center cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setOverrideId(null);
                                  setOverrideUrl('');
                                }}
                                className={`font-semibold text-xs px-2.5 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
