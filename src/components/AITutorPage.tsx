import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, User, Mic, Loader2, Play, Square, History as HistoryIcon, GraduationCap, Pause, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithTutor } from '../services/unifiedAiService';
import { marked } from 'marked';
import { useAi } from '../contexts/AiContext';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../services/ttsService';
import Logo from './Logo';
import AiImage from './AiImage';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  image?: string;
  id?: string;
};

const LANGUAGES = [
  { value: 'English',   label: 'English' },
  { value: 'Spanish',   label: 'Spanish' },
  { value: 'French',    label: 'French' },
  { value: 'German',    label: 'German' },
  { value: 'isiZulu',   label: 'isiZulu' },
  { value: 'isiXhosa',  label: 'isiXhosa' },
  { value: 'Afrikaans', label: 'Afrikaans' },
];

const VOICES = [
  { value: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (Female)' },
  { value: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi (Female)' },
  { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (Female)' },
  { value: 'LcfcDJNUP1GQjkvn1xUw', label: 'Emily (Female)' },
  { value: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli (Female)' },
  { value: '29vD33N1CtxCmqQRPOAB', label: 'Drew (Male)' },
  { value: 'CYw3kZ02Hs0563khs1Fj', label: 'Dave (Male)' },
  { value: 'ErXwobaYiN019PkySvjV', label: 'Antoni (Male)' },
  { value: 'TX3OmvcUxq7OylEpIMJl', label: 'Liam (Male)' },
  { value: 'VR6AewLTigWG4xSOukaG', label: 'Arnold (Male)' },
];

const STORAGE_KEY = 'eduai_chat_history_page';

export default function AITutorPage() {
  const { provider, ttsProvider } = useAi();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<number | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [language, setLanguage] = useState('English');
  const [priorityTopic, setPriorityTopic] = useState('General');
  const [voice, setVoice] = useState('21m00Tcm4TlvDq8ikWAM');
  const [isRecording, setIsRecording] = useState(false);
  const [visuals, setVisuals] = useState<Record<number, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Adaptive Learning Context States
  const [studentGrade, setStudentGrade] = useState('Grade 10');
  const [studentStyle, setStudentStyle] = useState('Visual');
  const [userRole, setUserRole] = useState('learner');
  const [studentData, setStudentData] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAdaptiveConfig = async () => {
      if (auth.currentUser) {
        try {
          const uRef = doc(db, 'users', auth.currentUser.uid);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            const uData = uSnap.data();
            if (uData.role) setUserRole(uData.role);
            if (uData.gradeLevel) setStudentGrade(uData.gradeLevel);
            if (uData.learningPreference) setStudentStyle(uData.learningPreference);
          }

          const email = auth.currentUser.email || '';
          if (email) {
            const q = query(collection(db, 'students'), where('email', '==', email));
            const snap = await getDocs(q);
            if (!snap.empty) {
              setStudentData(snap.docs[0].data());
            }
          }
        } catch (e) {
          console.error("Failed to load user adaptive parameters:", e);
        }
      }
    };
    fetchAdaptiveConfig();
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setMessages(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const fetchAiChats = async () => {
      if (auth.currentUser) {
        try {
           const docRef = doc(db, 'ai_tutor_sessions', auth.currentUser.uid);
           const docSnap = await getDoc(docRef);
           if (docSnap.exists() && docSnap.data().messages) {
              const loadedMessages = JSON.parse(docSnap.data().messages);
              setMessages(loadedMessages);
           } else {
             const localData = localStorage.getItem(STORAGE_KEY);
             if (localData) setMessages(JSON.parse(localData));
           }
        } catch (error) {
           console.error("Error fetching AI chat history", error);
           handleFirestoreError(error, OperationType.GET, 'ai_tutor_sessions/' + auth.currentUser.uid);
        }
      }
    };
    fetchAiChats();
  }, []);

  const saveMessagesToFirebase = async (newMessages: ChatMessage[]) => {
    if (auth.currentUser && newMessages.length > 0) {
       try {
         const docRef = doc(db, 'ai_tutor_sessions', auth.currentUser.uid);
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
           await updateDoc(docRef, {
             messages: JSON.stringify(newMessages),
             updatedAt: serverTimestamp()
           });
         } else {
           await setDoc(docRef, {
             userId: auth.currentUser.uid,
             messages: JSON.stringify(newMessages),
             updatedAt: serverTimestamp()
           });
         }
       } catch (error) {
         console.error("Error saving AI chat history", error);
         handleFirestoreError(error, OperationType.WRITE, 'ai_tutor_sessions/' + auth.currentUser.uid);
       }
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      saveMessagesToFirebase(messages);
    }
  }, [messages]);

  useEffect(() => {
    // Pre-load voices to ensure they are available for synchronous playback 
    // to bypass user interaction restrictions on iOS/Safari
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handlePlayAudio = useCallback(async (text: string, index: number) => {
    if (isAudioPlaying === index) {
      if (isAudioPaused) {
        resumeSpeaking();
        setIsAudioPaused(false);
      } else {
        pauseSpeaking();
        setIsAudioPaused(true);
      }
      return;
    }

    stopSpeaking();
    setIsAudioPlaying(index);
    setIsAudioPaused(false);
    setIsTtsLoading(index);
    try {
      setTimeout(() => setIsTtsLoading(null), 500); 
      await speakText(text, ttsProvider, language, voice);
      setIsAudioPlaying(null);
      setIsAudioPaused(false);
    } catch (err) {
      console.error('[AI Tutor] TTS failed:', err);
      setIsTtsLoading(null);
      setIsAudioPlaying(null);
      setIsAudioPaused(false);
    }
  }, [isAudioPlaying, isAudioPaused, ttsProvider, language]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const textToProcess = overrideText || input.trim();
    if (!textToProcess && !selectedImage) return;

    const userText = textToProcess || (selectedImage ? "Please describe this image." : "");
    const userMsg: ChatMessage = { role: 'user', text: userText, image: selectedImage || undefined };

    setInput('');
    setSelectedImage(null);
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 12) + 2, 95));
    }, 400);

    try {
      const chatMessagesForTutor = messages.map(m => {
        const parts: any[] = [{ text: m.text }];
        if (m.image) {
          const match = m.image.match(/^data:(image\/[a-z]+);base64,(.*)$/);
          if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
        return { role: m.role, parts };
      });
      
      let dynamicDiagnosticContext = '';
      if (studentData) {
        const averageMark = studentData.subjects ? Math.round(studentData.subjects.reduce((sum: number, s: any) => sum + s.mark, 0) / studentData.subjects.length) : 75;
        const scaleDifficulty = averageMark > 78 ? 'Challenge Tier (stretch cognitive load, pose advanced conceptual quizzes)' : averageMark < 60 ? 'Remedial Scaffolding Tier (simplify notation, present analogies, check concepts step by step)' : 'Core CAPS Standard Tier';
        
        const weaknesses = studentData.idp?.weaknesses?.join(', ') || '';
        const strengths = studentData.idp?.strengths || '';
        const recommendations = studentData.idp?.recommendations?.join(', ') || '';

        dynamicDiagnosticContext = `[Student Profile diagnostics: AvgPerformance=${averageMark}%, DynamicDifficulty=${scaleDifficulty}, Strengths="${strengths}", Core Identified Knowledge Gaps/Weaknesses="${weaknesses}", Targeted Remediation Recommendations="${recommendations}". Scaffold responses appropriately to gently remediate designated weaknesses, prompt them with active check-in questions, and match cognitive load precisely to current performance tier.] `;
      }

      const adaptiveInstruction = `[Adaptive Delivery Config: GradeLevel=${studentGrade} StylePreference=${studentStyle}. Adapt text terminology, layout styling, and exercises precisely to this profile.] ${dynamicDiagnosticContext}`;
      const promptText = `[Instruct: Reply exclusively in ${language}] ${adaptiveInstruction}` + (priorityTopic !== 'General' 
        ? `[Priority Topic: ${priorityTopic}] ${userText}`
        : userText);
      
      const newParts: any[] = [{ text: promptText }];
      if (selectedImage) {
        const match = selectedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
        if (match) newParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
      chatMessagesForTutor.push({ role: 'user', parts: newParts });

      const response = await chatWithTutor(chatMessagesForTutor, provider);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setTimeout(() => {
        const modelMsg: ChatMessage = { role: 'model', text: response || 'I could not process that.' };
        setMessages(prev => [...prev, modelMsg]);
        setIsLoading(false);
      }, 300);

    } catch (error) {
      console.error('[AI Tutor] send failed:', error);
      clearInterval(progressInterval);
      alert('Failed to get response. Please try again.');
      setIsLoading(false);
    }
  }, [input, messages, provider, priorityTopic, language, selectedImage]);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Voice recognition not supported in this browser.');
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    
    if (language === 'Afrikaans') rec.lang = 'af-ZA';
    else if (language === 'isiZulu') rec.lang = 'zu-ZA';
    else if (language === 'isiXhosa') rec.lang = 'xh-ZA';
    else if (language === 'Sesotho') rec.lang = 'st-ZA';
    else if (language === 'Spanish') rec.lang = 'es-ES';
    else if (language === 'French') rec.lang = 'fr-FR';
    else if (language === 'German') rec.lang = 'de-DE';
    else rec.lang = 'en-US';

    rec.onresult = (e: any) => { 
      const transcript = e.results[0][0].transcript;
      setInput(transcript); 
      setIsRecording(false); 
      handleSend(transcript);
    };
    
    rec.onerror = (e: any) => { 
      console.error('Speech recognition error:', e);
      setIsRecording(false); 
    };
    
    rec.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = rec;
    
    try { 
      rec.start(); 
      setIsRecording(true); 
    } catch (e) { 
      console.error('Mic error:', e); 
      setIsRecording(false);
    }
  }, [isRecording, language, handleSend]);

  const handleStopAudio = useCallback(() => {
    stopSpeaking();
    setIsAudioPlaying(null);
    setIsAudioPaused(false);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-140px)] w-full max-w-5xl mx-auto rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0F172A] relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-[#0B1122]/90 border-b border-white/15 shrink-0 backdrop-blur-md">
        <div className="flex items-center justify-between sm:block">
          <h1 className="text-2xl lg:text-3xl font-hand tracking-wide flex items-center text-white">
            <div className="mr-2 lg:mr-4"><Logo className="w-6 h-6 lg:w-8 lg:h-8" /></div>
            AI Tutor
          </h1>
          <p className="hidden sm:flex text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 items-center flex-wrap gap-2">
            <HistoryIcon className="h-3 w-3 mr-1 text-brand-cyan" /> Chats saved locally
            <span className="ml-2 px-2.5 py-0.5 bg-brand-cyan/20 text-brand-cyan rounded-full text-[9px] border border-brand-cyan/10">
              🤖 Adaptive: {studentGrade} • {studentStyle} Mode
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-4 mt-2 sm:mt-0 justify-end">
          <div className="flex flex-col flex-1 sm:flex-none">
            <label className="text-[9px] lg:text-[10px] uppercase font-black text-brand-cyan/80 mb-0.5 lg:mb-1">Priority Topic</label>
            <select 
              value={['General', 'Mathematics', 'Physical Sciences', 'Life Sciences', 'History', 'Geography', 'Languages'].includes(priorityTopic) ? priorityTopic : 'Other'} 
              onChange={e => {
                if (e.target.value === 'Other') setPriorityTopic('');
                else setPriorityTopic(e.target.value);
              }}
              className="bg-white/10 hover:bg-white/15 transition-all border border-white/10 outline-none text-white text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto [&>option]:bg-[#0B1122] [&>option]:text-white mb-2 cursor-pointer"
            >
              <option value="General">General</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physical Sciences">Physical Sciences</option>
              <option value="Life Sciences">Life Sciences</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
              <option value="Languages">Languages</option>
              <option value="Other">Other...</option>
            </select>
            {!['General', 'Mathematics', 'Physical Sciences', 'Life Sciences', 'History', 'Geography', 'Languages'].includes(priorityTopic) && priorityTopic !== 'General' && (
              <input 
                type="text" 
                placeholder="Type topic..." 
                value={priorityTopic}
                onChange={e => setPriorityTopic(e.target.value)}
                className="bg-white/10 border border-white/15 outline-none text-white text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto placeholder:text-slate-400"
                autoFocus
              />
            )}
          </div>
          <div className="flex flex-col flex-1 sm:flex-none">
            <label className="text-[9px] lg:text-[10px] uppercase font-black text-brand-cyan/80 mb-0.5 lg:mb-1">Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="bg-white/10 hover:bg-white/15 transition-all border border-white/10 outline-none text-white text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col flex-1 sm:flex-none">
            <label className="text-[9px] lg:text-[10px] uppercase font-black text-brand-cyan/80 mb-0.5 lg:mb-1">Voice</label>
            <select 
              value={voice} 
              onChange={e => setVoice(e.target.value)}
              className="bg-white/10 hover:bg-white/15 transition-all border border-white/10 outline-none text-white text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer"
            >
              {VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 bg-[#0d1527]/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6">
            <div className="bg-brand-cyan/15 p-4 rounded-3xl mb-4 border border-brand-cyan/20">
               <GraduationCap size={44} className="text-brand-cyan" />
            </div>
            <p className="text-center font-semibold font-hand text-xl lg:text-3xl text-slate-200">Ask me anything about your school subjects, or upload a picture to learn about it! 🚀</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 lg:gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-8 h-8 lg:w-12 lg:h-12 flex flex-col items-center justify-center shrink-0"
                >
                  <Logo className="w-full h-full object-contain drop-shadow-md p-1 bg-[#1E293B] rounded-2xl shadow-lg border-2 border-brand-cyan/20" />
                </motion.div>
              )}
              
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`p-4 lg:p-6 max-w-[85%] lg:max-w-[80%] shadow-2xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-brand-cyan to-[#00a2cc] text-slate-950 rounded-2xl lg:rounded-3xl rounded-br-none font-bold' 
                  : 'bg-[#1E293B] border border-white/10 rounded-2xl lg:rounded-3xl rounded-bl-none text-slate-100'
              }`}>
                {msg.role === 'model' ? (
                  <div className="flex flex-col gap-4">
                    <div className="prose prose-xs lg:prose-sm max-w-none prose-p:leading-relaxed prose-invert markdown-body"
                      dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }}
                    />
                    {visuals[i] && (
                      <div className="pt-2 border-t border-white/5">
                        <AiImage prompt={`Educational illustration showing: ${msg.text.substring(0, 300)}`} aspectRatio="video" className="w-full max-w-md" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {msg.image && (
                      <img src={msg.image} alt="Uploaded" className="max-w-[200px] lg:max-w-[250px] rounded-xl object-contain mb-2 border border-white/10 shadow-md" />
                    )}
                    <p className="text-sm lg:text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )} 
              </motion.div>
              
              {msg.role === 'model' && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors border ${
                      isAudioPlaying === i && !isAudioPaused 
                        ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-lg shadow-brand-cyan/10' 
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => handlePlayAudio(msg.text, i)}
                    disabled={isTtsLoading === i}
                    title={isAudioPlaying === i && !isAudioPaused ? "Pause" : "Play"}
                  >
                    {isTtsLoading === i ? <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin text-brand-cyan" /> : isAudioPlaying === i && !isAudioPaused ? <Pause className="w-3 h-3 lg:w-4 lg:h-4" /> : <Play className="w-3 h-3 lg:w-4 lg:h-4 ml-0.5 lg:ml-1" />}
                  </button>
                  {isAudioPlaying === i && (
                    <button
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30"
                      onClick={handleStopAudio}
                      title="Stop"
                    >
                      <Square className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>
                  )}
                  <button
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors border ${
                      visuals[i] 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10' 
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setVisuals(prev => ({...prev, [i]: !prev[i]}))}
                    title="Generate Visual Aid"
                  >
                    <ImageIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                </div>
              )}
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-[#1E293B] border border-white/10 flex items-center justify-center shrink-0 text-slate-300 shadow-sm">
                  <User className="w-4 h-4 lg:w-5 lg:h-5 text-brand-cyan" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0 shadow-sm text-brand-cyan animate-pulse">
               <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl lg:rounded-3xl rounded-tl-none px-5 py-4 flex flex-col gap-2 min-w-[200px] shadow-sm">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <span>Tutor is thinking...</span>
                 <span>{generationProgress}%</span>
               </div>
               <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                 <div 
                   className="h-full bg-brand-cyan transition-all duration-300"
                   style={{ width: `${generationProgress}%` }}
                 />
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 lg:p-6 bg-[#0B1122]/95 border-t border-white/15 shrink-0 flex flex-col gap-2">
        {selectedImage && (
          <div className="relative inline-block self-start ml-2 lg:ml-4">
            <img src={selectedImage} alt="Preview" className="h-16 lg:h-20 rounded-lg object-contain border border-white/10 shadow-sm" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 scale-75"
            >
              <Pause className="w-4 h-4 rotate-45" />
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-2 lg:gap-3 max-w-4xl mx-auto w-full">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/5 text-slate-300 border border-white/10 flex items-center justify-center hover:bg-white/15 hover:text-white transition-all shrink-0"
            title="Upload Image"
          >
            <ImageIcon className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder={isRecording ? "Listening..." : "Type your question, or upload a picture... 🖼️"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isLoading && (input.trim() || selectedImage) && handleSend()}
              className="w-full pl-5 lg:pl-6 pr-12 lg:pr-14 h-12 lg:h-14 rounded-full border-2 border-white/10 focus:border-brand-cyan focus:outline-none bg-white/5 transition-all font-medium text-white text-sm lg:text-base placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
              onClick={handleMicClick}
              disabled={isLoading}
            >
              <Mic className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
          <button 
            onClick={() => handleSend()} 
            disabled={isLoading || (!input.trim() && !selectedImage)} 
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-brand-cyan text-slate-950 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shrink-0 font-black cursor-pointer shadow-brand-cyan/20"
          >
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          {isAudioPlaying !== null && (
            <button 
               onClick={handleStopAudio} 
               className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-red-500/20"
            >
              <Square className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          )}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
