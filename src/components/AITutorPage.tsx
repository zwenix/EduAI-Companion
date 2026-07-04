import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, User, Mic, Loader2, Play, Square, History as HistoryIcon, GraduationCap, Pause, Image as ImageIcon, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithTutor } from '../services/unifiedAiService';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { useAi } from '../contexts/AiContext';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../services/ttsService';
import Logo from './Logo';
import AiImage from './AiImage';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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

const SUGGESTIONS = [
  { text: "Explain Gravity", color: "border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.2)] text-orange-200 bg-orange-950/30 hover:bg-orange-950/50" },
  { text: "Math Help", color: "border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)] text-emerald-200 bg-emerald-950/30 hover:bg-emerald-950/50" },
  { text: "Science Facts", color: "border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)] text-amber-200 bg-amber-950/30 hover:bg-amber-950/50" },
  { text: "Tell a Joke", color: "border-teal-500/50 shadow-[0_0_8px_rgba(20,184,166,0.2)] text-teal-200 bg-teal-950/30 hover:bg-teal-950/50" },
];

const RobbieFace = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={`${className} filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Ears/Antenna elements */}
    <rect x="22" y="38" width="8" height="24" rx="4" fill="#22d3ee" opacity="0.8" />
    <rect x="70" y="38" width="8" height="24" rx="4" fill="#22d3ee" opacity="0.8" />
    <circle cx="50" cy="18" r="4" fill="#22d3ee" />
    <line x1="50" y1="18" x2="50" y2="28" stroke="#22d3ee" strokeWidth="3" />
    
    {/* Robot Head Body */}
    <rect x="26" y="26" width="48" height="48" rx="16" fill="#1E293B" stroke="#22d3ee" strokeWidth="3.5" />
    
    {/* Inner Screen Face */}
    <rect x="32" y="32" width="36" height="36" rx="10" fill="#0F172A" stroke="#1e293b" strokeWidth="2" />
    
    {/* Glowing Eyes */}
    <path d="M 38 48 Q 42 44 46 48" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 54 48 Q 58 44 62 48" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
    
    {/* Glowing Smile */}
    <path d="M 44 58 Q 50 63 56 58" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
    
    {/* Neck/Shoulder bases */}
    <rect x="42" y="74" width="16" height="8" rx="2" fill="#22d3ee" opacity="0.9" />
    <path d="M 34 82 L 66 82" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

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
  const [allVoices, setAllVoices] = useState<{ value: string; label: string }[]>(VOICES);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const localVoices = window.speechSynthesis.getVoices();
        if (localVoices.length > 0) {
          const localOptions = localVoices.map(v => ({
            value: v.name,
            label: `${v.name} (${v.lang})`
          }));
          const combined = [...localOptions, ...VOICES];
          const uniqueOptions = combined.filter((v, idx, self) => 
            self.findIndex(t => t.value === v.value) === idx
          );
          setAllVoices(uniqueOptions);
          
          // Set voice default to first local english if there is one
          const firstLocalEnglish = localVoices.find(v => v.lang.startsWith('en'));
          if (firstLocalEnglish) {
            setVoice(firstLocalEnglish.name);
          } else {
            setVoice(localVoices[0].name);
          }
        }
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visuals, setVisuals] = useState<Record<number, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Adaptive Learning Context States
  const [studentGrade, setStudentGrade] = useState('Grades R-12');
  const [studentStyle, setStudentStyle] = useState('Visual');
  const [userRole, setUserRole] = useState('learner');
  const [studentData, setStudentData] = useState<any>(null);

  // Daily Study Duration Timer
  const todayStr = new Date().toISOString().split('T')[0];
  const storageTimeKey = `eduai_active_secs_${todayStr}`;
  const [elapsedSecondsToday, setElapsedSecondsToday] = useState(() => {
    const saved = localStorage.getItem(storageTimeKey);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSecondsToday(prev => {
        const nextVal = prev + 1;
        localStorage.setItem(storageTimeKey, nextVal.toString());
        return nextVal;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [storageTimeKey]);

  const isTopicRestricted = useCallback(() => {
    if (!studentData?.parentControls) return false;
    const restricted = studentData.parentControls.restrictedSubjects || [];
    return restricted.some((sub: string) => sub.toLowerCase().trim() === priorityTopic.toLowerCase().trim());
  }, [studentData, priorityTopic]);

  const isCustomChatRestricted = useCallback(() => {
    if (!studentData?.parentControls) return false;
    const customChatDisabled = studentData.parentControls.customChatDisabled ?? false;
    return customChatDisabled && priorityTopic.toLowerCase().trim() === 'general';
  }, [studentData, priorityTopic]);

  const isTimeLimitReached = useCallback(() => {
    if (!studentData?.parentControls?.timeLimitMinutes) return false;
    const limitSecs = studentData.parentControls.timeLimitMinutes * 60;
    return elapsedSecondsToday >= limitSecs;
  }, [studentData, elapsedSecondsToday]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let unsubscribeStudent: (() => void) | undefined;

    const fetchAdaptiveConfig = async () => {
      if (auth.currentUser) {
        try {
          let currentRole = 'learner';
          const uRef = doc(db, 'users', auth.currentUser.uid);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            const uData = uSnap.data();
            if (uData.role) {
              setUserRole(uData.role);
              currentRole = uData.role;
            }
            if (uData.gradeLevel) setStudentGrade(uData.gradeLevel);
            if (uData.learningPreference) setStudentStyle(uData.learningPreference);
          }

          if (currentRole === 'student' || currentRole === 'learner') {
            const email = auth.currentUser.email || '';
            if (email) {
              const q = query(collection(db, 'students'), where('email', '==', email));
              unsubscribeStudent = onSnapshot(q, (snap) => {
                if (!snap.empty) {
                  setStudentData(snap.docs[0].data());
                }
              }, (error) => {
                console.error("Error subscribing to student controls in real-time:", error);
              });
            }
          }
        } catch (e) {
          console.error("Failed to load user adaptive parameters:", e);
        }
      }
    };
    fetchAdaptiveConfig();
    return () => {
      if (unsubscribeStudent) unsubscribeStudent();
    };
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
    if (isTimeLimitReached()) {
      alert("⏳ Study Limit reached! You've used your daily learning time set by your parent.");
      return;
    }
    if (isTopicRestricted()) {
      alert(`🔒 Access Restricted: The subject "${priorityTopic}" has been restricted by your parents.`);
      return;
    }
    if (isCustomChatRestricted()) {
      alert("🔒 Strict Syllabus Active: General custom chat is currently locked. Please select an allowed curriculum topic.");
      return;
    }

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
  }, [input, messages, provider, priorityTopic, language, selectedImage, studentData, isTimeLimitReached, isTopicRestricted, isCustomChatRestricted]);

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
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-140px)] w-full max-w-5xl mx-auto rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-white/15 shadow-[0_0_50px_rgba(34,211,238,0.12)] bg-gradient-to-b from-[#070b19] via-[#0d1330] to-[#120721] text-white relative">
      {isTimeLimitReached() && (
        <div className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md z-55 flex flex-col items-center justify-center text-center p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-455">
            <Clock size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold font-hand text-white">⏳ Study Time Is Complete!</h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              You've reached your daily AI Tutoring limit of <span className="text-indigo-400 font-bold font-sans">{studentData?.parentControls?.timeLimitMinutes} minutes</span> set by your parent.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Awesome work completing your studies today! Rest your eyes, go enjoy some offline playtime, and return tomorrow to continue learning together!
            </p>
          </div>
        </div>
      )}
      {/* Header matching Image 1 layout & design */}
      <div className="flex items-center justify-between p-4 lg:p-5 bg-gradient-to-r from-[#070b19] to-[#0c1228] border-b border-white/15 shrink-0 backdrop-blur-md relative z-30">
        {/* Back Button capsule */}
        <button 
          onClick={() => {}} 
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-all cursor-pointer active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Centered Title */}
        <div className="text-center">
          <h1 className="text-lg lg:text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            AI Tutor
          </h1>
          <p className="text-[10px] text-brand-cyan uppercase tracking-widest font-extrabold">
            Robbie Active
          </p>
        </div>

        {/* Settings Gear Button */}
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title="Tutor Customization"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isSettingsOpen 
              ? 'bg-brand-cyan/25 text-brand-cyan border-brand-cyan/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]' 
              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <svg className={`w-5 h-5 ${isSettingsOpen ? 'rotate-90' : 'rotate-0'} transition-transform duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Collapsible Settings Panel (Preserves Grade, Topic, Language, Voice) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-[#090e1d]/95 border-b border-white/10 p-5 shrink-0 overflow-hidden backdrop-blur-xl relative z-20 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-black text-brand-cyan mb-1.5 tracking-wider">Target Grade</label>
                <select 
                  value={studentGrade} 
                  onChange={e => setStudentGrade(e.target.value)}
                  className="bg-white/5 border border-white/10 outline-none text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-xl [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 hover:border-white/15 transition-all"
                >
                  <option value="Grades R-12">Grades R-12 (Adaptive)</option>
                  <option value="Grade R">Grade R</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-black text-brand-cyan mb-1.5 tracking-wider">Priority Topic</label>
                <select 
                  value={['General', 'Mathematics', 'Physical Sciences', 'Life Sciences', 'History', 'Geography', 'Languages'].includes(priorityTopic) ? priorityTopic : 'Other'} 
                  onChange={e => {
                    if (e.target.value === 'Other') setPriorityTopic('');
                    else setPriorityTopic(e.target.value);
                  }}
                  className="bg-white/5 border border-white/10 outline-none text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-xl [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 hover:border-white/15 transition-all"
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
                    className="bg-white/10 border border-white/15 outline-none text-white text-xs font-medium py-2 px-3 mt-2 rounded-xl placeholder:text-slate-400"
                    autoFocus
                  />
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-black text-brand-cyan mb-1.5 tracking-wider">Language</label>
                <select 
                  value={language} 
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 outline-none text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-xl [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 hover:border-white/15 transition-all"
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-black text-brand-cyan mb-1.5 tracking-wider">Voice</label>
                <select 
                  value={voice} 
                  onChange={e => setVoice(e.target.value)}
                  className="bg-white/5 border border-white/10 outline-none text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-xl [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 hover:border-white/15 transition-all"
                >
                  {allVoices.map((v, index) => <option key={`${v.value}-${index}`} value={v.value}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 bg-[#0a0f21]/60">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 relative overflow-hidden">
            {/* Ambient Circuit Board Backing SVG */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] pointer-events-none opacity-20">
              <svg className="w-full h-full text-cyan-500" viewBox="0 0 500 500" fill="none">
                {/* Circuit lines */}
                <path d="M 250 250 L 250 50 L 100 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                <path d="M 250 250 L 100 250" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 250 250 L 400 250" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 250 250 L 250 450 L 400 450" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                <path d="M 250 250 L 120 120 L 50 120" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 250 250 L 380 380 L 450 380" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 250 250 L 380 120 L 450 120" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 250 250 L 120 380 L 50 380" stroke="currentColor" strokeWidth="1.5" />
                {/* Nodes */}
                <circle cx="100" cy="50" r="4" fill="currentColor" />
                <circle cx="100" cy="250" r="4" fill="currentColor" />
                <circle cx="400" cy="250" r="4" fill="currentColor" />
                <circle cx="400" cy="450" r="4" fill="currentColor" />
                <circle cx="50" cy="120" r="4" fill="currentColor" />
                <circle cx="450" cy="380" r="4" fill="currentColor" />
                <circle cx="450" cy="120" r="4" fill="currentColor" />
                <circle cx="50" cy="380" r="4" fill="currentColor" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              {/* Center-staged Glowing Robbie Avatar */}
              <div className="w-24 h-24 rounded-full bg-cyan-950/40 border-2 border-cyan-400 p-1 shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center mb-5 animate-bounce" style={{ animationDuration: '4s' }}>
                <RobbieFace className="w-20 h-20" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white text-center mb-2">
                Robbie, your AI Tutor
              </h2>
              <p className="text-center text-sm lg:text-base text-slate-300 max-w-md font-sans leading-relaxed mb-6">
                Ask me anything about your school subjects, or upload a picture of your homework to solve it together! 🚀
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 lg:gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-10 h-10 flex flex-col items-center justify-center shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.4)] border border-[#22d3ee]/50 rounded-full overflow-hidden bg-[#1E293B] mb-1"
                >
                  <RobbieFace className="w-8 h-8" />
                </motion.div>
              )}
              
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`p-4.5 lg:p-5 max-w-[82%] lg:max-w-[75%] shadow-2xl ${
                msg.role === 'user' 
                  ? 'bg-[#d946ef]/10 border-2 border-[#d946ef]/60 shadow-[0_0_15px_rgba(217,70,239,0.25)] text-white rounded-[24px] rounded-br-[4px] font-sans font-medium' 
                  : 'bg-[#22d3ee]/10 border-2 border-[#22d3ee]/60 shadow-[0_0_15px_rgba(34,211,238,0.25)] text-white rounded-[24px] rounded-bl-[4px] font-sans'
              }`}>
                {msg.role === 'model' ? (
                  <div className="flex flex-col gap-4">
                    <div className="prose prose-xs lg:prose-sm max-w-none prose-p:leading-relaxed prose-invert markdown-body"
                      dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(msg.text) as string) }}
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
                <div className="flex flex-col gap-2 shrink-0 mb-1">
                  <button
                    className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center transition-colors border ${
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
                      className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center transition-colors bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30"
                      onClick={handleStopAudio}
                      title="Stop"
                    >
                      <Square className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>
                  )}
                  <button
                    className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center transition-colors border ${
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#d946ef] to-[#a21caf] border border-[#d946ef]/50 p-0.5 flex items-center justify-center shrink-0 text-white shadow-[0_0_12px_rgba(217,70,239,0.4)] mb-1">
                  <User className="w-5 h-5 text-white" />
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
      <div className="p-4 lg:p-5 bg-gradient-to-b from-[#070b19]/90 to-[#030611]/95 border-t border-white/15 shrink-0 flex flex-col items-center z-25 relative">
        {isTopicRestricted() ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-red-400 text-xs font-semibold max-w-xl mx-auto w-full flex items-center justify-center gap-2 font-sans py-5 h-14">
            <AlertCircle size={14} className="shrink-0" />
            <span>🔒 Access Restricted: <span className="font-bold underline">{priorityTopic}</span> has been locked by your parents.</span>
          </div>
        ) : isCustomChatRestricted() ? (
          <div className="p-4 rounded-xl bg-slate-800/25 border border-slate-700/50 text-center text-indigo-400 text-xs font-semibold max-w-xl mx-auto w-full flex items-center justify-center gap-2 font-sans py-5 h-14">
            <GraduationCap size={14} className="shrink-0 text-brand-cyan" />
            <span>🔒 Syllabus Focus Active: General conversation is restricted by parents. Choose a subject above.</span>
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* Suggestions Sparks Row - Shown when no messages */}
            {!isLoading && !selectedImage && messages.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4 w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    disabled={isLoading}
                    onClick={() => handleSend(s.text)}
                    className={`px-4.5 py-1.5 rounded-full text-xs font-black border transition-all duration-300 cursor-pointer active:scale-95 ${s.color}`}
                  >
                    ✨ {s.text}
                  </button>
                ))}
              </div>
            )}

            {selectedImage && (
              <div className="relative inline-block self-start ml-2 lg:ml-4 mb-2">
                <img src={selectedImage} alt="Preview" className="h-16 lg:h-20 rounded-lg object-contain border border-white/10 shadow-sm" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 scale-75 cursor-pointer"
                >
                  <Pause className="w-4 h-4 rotate-45" />
                </button>
              </div>
            )}

            <div className="relative flex items-center gap-2 lg:gap-3 w-full">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              
              {/* Attachment Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/5 text-slate-300 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all shrink-0 cursor-pointer active:scale-95"
                title="Upload Homework Picture"
              >
                <ImageIcon className="w-5 h-5 text-brand-cyan" />
              </button>

              {/* Centered Pill Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={isRecording ? "Listening..." : "Ask me anything..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isLoading && (input.trim() || selectedImage) && handleSend()}
                  className="w-full pl-5 pr-5 h-12 rounded-full border border-white/10 focus:border-brand-cyan focus:outline-none bg-white/5 transition-all font-sans text-white text-sm lg:text-base placeholder:text-slate-500"
                  disabled={isLoading}
                />
              </div>

              {/* Send Button */}
              <button 
                onClick={() => handleSend()} 
                disabled={isLoading || (!input.trim() && !selectedImage)} 
                className="w-12 h-12 rounded-full bg-brand-cyan text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shrink-0 font-black cursor-pointer"
                title="Send Question"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>

              {isAudioPlaying !== null && (
                <button 
                  onClick={handleStopAudio} 
                  className="w-12 h-12 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-red-500/20"
                >
                  <Square className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              )}
            </div>

            {/* Giant Centered Voice Microphone Button */}
            <div className="flex flex-col items-center justify-center mt-4">
              <button
                onClick={handleMicClick}
                disabled={isLoading}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border-2 ${
                  isRecording 
                    ? 'bg-gradient-to-tr from-red-500 to-rose-600 text-white border-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)] scale-110' 
                    : 'bg-gradient-to-tr from-[#22d3ee] to-[#3b82f6] text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:shadow-[0_0_25px_rgba(34,211,238,0.9)] hover:scale-105 active:scale-95'
                }`}
                title={isRecording ? "Stop Recording" : "Speak to Robbie"}
              >
                <Mic className="w-7 h-7" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
                {isRecording ? "Listening Active" : "Speak to Robbie"}
              </span>
            </div>
          </div>
        )}
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
