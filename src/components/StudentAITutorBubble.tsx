import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Target, Sparkles, MessageCircle, X, Send, Bot, Loader2, ArrowRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { useAi } from '../contexts/AiContext';
import { chatWithTutor } from '../services/unifiedAiService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';
import { StudentDoc } from '../types';
import { logStudentActivity } from '../lib/activityLogger';

interface StudentAITutorBubbleProps {
  isDarkMode: boolean;
  student: StudentDoc | null;
}

type LocalChatMessage = {
  role: 'user' | 'model';
  text: string;
};

const STORAGE_KEY = 'eduai_floating_tutor_history';

export default function StudentAITutorBubble({ isDarkMode, student }: StudentAITutorBubbleProps) {
  const { provider } = useAi();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage or Firestore
  useEffect(() => {
    const loadChatHistory = async () => {
      // First attempt local storage
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        try {
          setMessages(JSON.parse(local));
          return;
        } catch (e) {
          console.warn("Failed to parse local floating chat history", e);
        }
      }

      // If authenticated and no local chat, try Firestore backup
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'ai_floating_sessions', auth.currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().messages) {
            const data = snap.data();
            const loaded = JSON.parse(data.messages);
            setMessages(loaded);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
          }
        } catch (error) {
          console.warn("Could not fetch remote floating sessions", error);
        }
      }
    };

    loadChatHistory();
  }, []);

  // Save messages to local and cloud storage
  const saveMessages = async (newMessages: LocalChatMessage[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    
    if (auth.currentUser && newMessages.length > 0) {
      try {
        const docRef = doc(db, 'ai_floating_sessions', auth.currentUser.uid);
        await setDoc(docRef, {
          userId: auth.currentUser.uid,
          messages: JSON.stringify(newMessages),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.warn("Could not sync floating session to Firebase", error);
      }
    }
  };

  // Scroll to bottom when messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  // Handle active or upcoming tasks & subjects to build contextual triggers
  const contextualSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    
    if (student) {
      // 1. Suggest from incomplete missions / action plans
      const pendingTasks = student.idp?.actionPlan?.filter(item => item.status !== 'Completed') || [];
      if (pendingTasks.length > 0) {
        // Take a couple of tasks and formulate educational questions
        pendingTasks.slice(0, 2).forEach(t => {
          if (t.task.toLowerCase().includes('algebra')) {
            suggestions.push("How do I solve Grade 10 algebra equations?");
          } else if (t.task.toLowerCase().includes('stoichiometry') || t.task.toLowerCase().includes('chemistry')) {
            suggestions.push("Explain Stoichiometry step-by-step");
          } else {
            // Trim task if too long
            const label = t.task.length > 35 ? t.task.substring(0, 32) + '...' : t.task;
            suggestions.push(`Help me with: ${label}`);
          }
        });
      }

      // 2. Fallbacks based on subjects enrolled
      const subjects = student.subjects || [];
      if (suggestions.length < 3 && subjects.length > 0) {
        subjects.slice(0, 2).forEach(sub => {
          if (sub.name.includes('Mathematics')) {
            suggestions.push("Give me a quick 3-question Math quiz");
          } else if (sub.name.includes('Physical Sciences')) {
            suggestions.push("Explain Newton's Laws in simple terms");
          } else if (sub.name.includes('English') || sub.name.includes('Language')) {
            suggestions.push("How can I improve my English comprehension?");
          }
        });
      }
    }

    // 3. Absolute standard defaults to reach exactly 3 helpful options
    if (suggestions.length < 3) {
      suggestions.push("Give me a motivational quote to study!");
    }
    if (suggestions.length < 3) {
      suggestions.push("What's the best way to revise CAPS content?");
    }

    // Return unique values up to 3
    return Array.from(new Set(suggestions)).slice(0, 3);
  }, [student]);

  // Send message handler
  const handleSend = useCallback(async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText) return;

    setInput('');
    const userMsg: LocalChatMessage = { role: 'user', text: promptText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setProgress(15);

    // Track student activity logs
    if (student?.id) {
      logStudentActivity(student.id, 'ai_chat', `Quick consulting: "${promptText.substring(0, 45)}..."`);
    }

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + Math.floor(Math.random() * 15) + 5, 92));
    }, 300);

    try {
      // Build correct history payload for chatWithTutor
      // Add general student classroom parameters so tutor replies contextually
      const studentClassroomContext = student ? 
        `[EduAI Student Floating Helper Integration. Learner Name="${student.name}", GradeLevel="${student.grade}", Subjects="${student.subjects?.map(s => s.name).join(', ')}", Weaknesses/Identified Knowledge gaps="${student.idp?.weaknesses?.join(', ')}", Strengths="${student.idp?.strengths?.join(', ')}"]. ` : '';

      const developerInstruction = `${studentClassroomContext}You are a supportive, high-energy South African CAPS curriculum AI Tutor. Since you are in a small floating dashboard popup chat bubble, keep answers highly scannable, motivating, bulleted where possible, and strictly UNDER 120 words to fit beautifully without overwhelming the interface! Direct the user clearly, use local South African slang or references where fitting (e.g. Rands, "sharp sharp", "lekker", local study strategies), and end with a quick, encouraging check-in request or question.`;

      // Convert messages to structure expected by tutor
      const chatMessagesForTutor = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Append instruction + prompt
      chatMessagesForTutor.push({
        role: 'user',
        parts: [{ text: `[System Instruction: ${developerInstruction}] ${promptText}` }]
      });

      const response = await chatWithTutor(chatMessagesForTutor, provider);
      
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        const modelMsg: LocalChatMessage = { role: 'model', text: response || "I'm sorry, I couldn't process your question right now. Let me check my CAPS notes!" };
        const finalMessages = [...updatedMessages, modelMsg];
        setMessages(finalMessages);
        saveMessages(finalMessages);
        setIsLoading(false);
      }, 300);

    } catch (error) {
      console.error("[Floating AI Tutor Error]", error);
      clearInterval(progressInterval);
      const errorMsg: LocalChatMessage = { 
        role: 'model', 
        text: "Oops! My network connection failed. Please try again in a few seconds or check if your internet is working properly." 
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsLoading(false);
    }
  }, [input, messages, provider, student]);

  // Clear Chat History
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your Quick chat history?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
      if (auth.currentUser) {
        const docRef = doc(db, 'ai_floating_sessions', auth.currentUser.uid);
        updateDoc(docRef, { messages: '[]' }).catch(console.warn);
      }
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-14 h-14 sm:w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-[0_10px_30px_rgba(79,70,229,0.3)] border-2 transition-all ${
            isOpen 
              ? 'bg-red-500 border-red-400 text-white shadow-red-500/20' 
              : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 border-indigo-400 text-white'
          }`}
          aria-label="Ask AI Tutor"
        >
          {isOpen ? (
            <X size={24} className="stroke-[2.5]" />
          ) : (
            <>
              <MessageCircle size={28} className="animate-pulse" />
              <div className="absolute -top-1 -right-1 bg-cyan-400 text-slate-905 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border border-indigo-900 animate-bounce">
                AI
              </div>
            </>
          )}
        </motion.button>
      </div>

      {/* Mini Chat Drawer/Card Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
              isDarkMode 
                ? 'bg-slate-900/95 border-slate-700/60 text-white backdrop-blur-md' 
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/80'
            }`}
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Bot size={20} className="text-brand-cyan animate-pulse" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                </div>
                <div>
                  <h3 className="font-hand text-base font-bold leading-tight flex items-center gap-1">
                    AI Homework Tutor <Sparkles size={14} className="text-yellow-400 fill-current" />
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Helpdesk • South Africa CAPS</span>
                </div>
              </div>
              
              {messages.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50/50'
              }`}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20 text-brand-cyan">
                    <Target size={22} />
                  </div>
                  <h4 className="font-hand text-lg font-bold mb-1">Howzit, {student?.name?.split(' ')[0] || 'Cadet'}! 👋</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-[260px]">
                    Ask me any school question contextually, or try one of the suggestions below to review your active syllabus!
                  </p>

                  {/* Suggestion Chips */}
                  <div className="mt-5 w-full space-y-2.5">
                    {contextualSuggestions.map((suggestion, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-3 text-left rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                          isDarkMode 
                            ? 'bg-slate-900/50 border-slate-800 hover:border-indigo-500 hover:bg-slate-850' 
                            : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50 shadow-sm shadow-slate-100'
                        }`}
                      >
                        <span className="truncate leading-normal pr-3">{suggestion}</span>
                        <ArrowRight size={14} className="shrink-0 text-brand-cyan" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'model' && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0 font-bold border border-indigo-400 shadow-sm shadow-indigo-600/25">
                        T
                      </div>
                    )}
                    
                    <div className={`p-3 max-w-[85%] rounded-2xl shadow-md text-xs relative ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none font-semibold'
                        : isDarkMode 
                          ? 'bg-slate-800 border border-slate-705/80 text-slate-100 rounded-tl-none leading-relaxed' 
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none leading-relaxed'
                    }`}>
                      {m.role === 'model' ? (
                        <div 
                          className="prose prose-xs max-w-none hover:prose-p:text-white leading-relaxed font-sans font-medium markdown-body transition-colors"
                          dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(m.text) as string) }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed font-sans">{m.text}</p>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0 animate-pulse">
                    <Sparkles size={14} />
                  </div>
                  <div className={`p-4 rounded-2xl rounded-tl-none flex flex-col gap-1.5 min-w-[160px] shadow-md border ${
                    isDarkMode ? 'bg-slate-855 border-slate-800' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <span>Thinking...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-cyan transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef}></div>
            </div>

            {/* Sticky Context Identifier pill if active helper has questions */}
            {messages.length > 0 && student?.idp?.actionPlan && (
              <div className={`px-4 py-2 border-t border-b text-[10px] font-bold flex items-center justify-between uppercase tracking-wider ${
                isDarkMode ? 'bg-slate-950/30 border-slate-800/80 text-cyan-400' : 'bg-slate-50 border-slate-100 text-indigo-500'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Target size={12} />
                  Academic Context: {student.grade} Activity Map
                </span>
              </div>
            )}

            {/* Input Form */}
            <div className={`p-3 border-t ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isLoading && input.trim()) handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask your quick tutor..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 text-xs rounded-xl outline-none border transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-500' 
                      : 'bg-slate-100 border-slate-200 focus:border-indigo-400 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
