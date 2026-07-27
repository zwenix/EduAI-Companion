import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Sparkles, User, Mic, Loader2, Play, Square, GraduationCap, Pause, 
  Image as ImageIcon, Clock, AlertCircle, Search, Plus, Trash2, Folder, 
  FolderOpen, ChevronDown, ChevronRight, Settings, ArrowLeft, Brain, Check, X, FileText, Send, Monitor, Volume2, Puzzle, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithTutor } from '../services/unifiedAiService';
import { marked } from 'marked';
import { replaceImagePlaceholders } from '../lib/imageReplacer';
import { useAi } from '../contexts/AiContext';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../services/ttsService';
import AiImage from './AiImage';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  image?: string;
  id?: string;
};

interface ChatSession {
  id: string;
  title: string;
  subject: string; // e.g. 'Mathematics', 'Physical Sciences', 'Life Sciences', 'History', 'Geography', 'Languages', 'General'
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  messages: ChatMessage[];
}

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

const STORAGE_KEY = 'eduai_chat_history_page_v2';

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

export default function AITutorPage({ onBack }: { onBack?: () => void }) {
  const { provider, ttsProvider } = useAi();
  
  // State variables for sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [folders, setFolders] = useState<string[]>(['Mathematics', 'Physical Sciences', 'Life Sciences', 'History', 'Geography', 'Languages', 'General']);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState<string>('');
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'studio' | 'advanced'>('studio');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<number | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [language, setLanguage] = useState('English');
  const [priorityTopic, setPriorityTopic] = useState('General');
  const [voice, setVoice] = useState('21m00Tcm4TlvDq8ikWAM');
  const [allVoices, setAllVoices] = useState<{ value: string; label: string }[]>(VOICES);

  // Loaded Voices
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

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const messages = useMemo(() => {
    return activeSession ? activeSession.messages : [];
  }, [activeSession]);

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

  // Subscribing to parent controls
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
                import('../lib/firestoreHelpers').then(({ handleFirestoreError, OperationType }) => {
                  handleFirestoreError(error, OperationType.LIST, 'students');
                });
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

  // Fetch AI Chat sessions from Firebase or fallback to local
  useEffect(() => {
    const fetchAiChats = async () => {
      if (auth.currentUser) {
        try {
           const docRef = doc(db, 'ai_tutor_sessions', auth.currentUser.uid);
           const docSnap = await getDoc(docRef);
           let loadedSessions: ChatSession[] = [];
           
           if (docSnap.exists() && docSnap.data().messages) {
              const rawData = docSnap.data().messages;
              let parsedData: any;
              try {
                parsedData = JSON.parse(rawData);
              } catch (e) {
                parsedData = [];
              }

              if (Array.isArray(parsedData)) {
                // Backward compatibility: existing messages array
                if (parsedData.length > 0) {
                  loadedSessions = [{
                    id: 'default',
                    title: 'Previous Discussion',
                    subject: 'General',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: parsedData
                  }];
                }
              } else if (parsedData && parsedData.sessions) {
                loadedSessions = parsedData.sessions;
                if (parsedData.folders) {
                  setFolders(parsedData.folders);
                }
              }
           } else {
             // Try localStorage
             const localData = localStorage.getItem(STORAGE_KEY);
             if (localData) {
               try {
                 const parsed = JSON.parse(localData);
                 if (parsed && parsed.sessions) {
                   loadedSessions = parsed.sessions;
                   if (parsed.folders) setFolders(parsed.folders);
                 } else if (Array.isArray(parsed) && parsed.length > 0) {
                   loadedSessions = [{
                     id: 'default',
                     title: 'Previous Discussion',
                     subject: 'General',
                     createdAt: new Date().toISOString(),
                     updatedAt: new Date().toISOString(),
                     messages: parsed
                   }];
                 }
               } catch (e) {}
             }
           }

           if (loadedSessions.length === 0) {
             const freshId = 'session-' + Date.now();
             loadedSessions = [{
               id: freshId,
               title: 'New Discussion',
               subject: 'General',
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               messages: []
             }];
           }

           setSessions(loadedSessions);
           setActiveSessionId(loadedSessions[0].id);
        } catch (error) {
           console.error("Error fetching AI chat history", error);
        }
      }
    };
    fetchAiChats();
  }, []);

  // Save Sessions state to Firebase and localStorage
  const saveSessionsToFirebase = async (updatedSessions: ChatSession[]) => {
    if (auth.currentUser) {
       try {
         const payload = {
           sessions: updatedSessions,
           folders: folders
         };
         // Save locally first for high speed!
         localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

         const docRef = doc(db, 'ai_tutor_sessions', auth.currentUser.uid);
         await setDoc(docRef, {
           userId: auth.currentUser.uid,
           messages: JSON.stringify(payload),
           updatedAt: serverTimestamp()
         });
       } catch (error) {
         console.error("Error saving AI chat sessions", error);
       }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Play TTS
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
  }, [isAudioPlaying, isAudioPaused, ttsProvider, language, voice]);

  // Create "New Chat" session
  const handleNewChat = () => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Discussion',
      subject: selectedSubjectFilter !== 'All' ? selectedSubjectFilter : 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    saveSessionsToFirebase(updated);
  };

  // Delete Chat Session
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat session?')) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      if (activeSessionId === id) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        } else {
          const freshId = 'session-' + Date.now();
          const freshSession: ChatSession = {
            id: freshId,
            title: 'New Discussion',
            subject: 'General',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: []
          };
          setSessions([freshSession]);
          setActiveSessionId(freshId);
        }
      }
      saveSessionsToFirebase(updated.length > 0 ? updated : []);
    }
  };

  // Update subject/folder of active chat session
  const handleMoveSessionToFolder = (subject: string) => {
    const updated = sessions.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, subject, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSessions(updated);
    saveSessionsToFirebase(updated);
  };

  // Send message
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

    // Update session state with User Message
    let updatedMsgs = [...messages, userMsg];
    let updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        let newTitle = s.title;
        if (s.title === 'New Discussion' || s.title === 'Previous Discussion') {
          newTitle = userText.substring(0, 32);
          if (userText.length > 32) newTitle += '...';
        }
        return {
          ...s,
          title: newTitle,
          messages: updatedMsgs,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    saveSessionsToFirebase(updatedSessions);
    setIsLoading(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.floor(Math.random() * 12) + 2, 95));
    }, 400);

    try {
      const chatMessagesForTutor = updatedMsgs.map(m => {
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

      const activeSubject = activeSession?.subject || 'General';
      const adaptiveInstruction = `[Adaptive Delivery Config: GradeLevel=${studentGrade} StylePreference=${studentStyle}. Adapt text terminology, layout styling, and exercises precisely to this profile.] ${dynamicDiagnosticContext}`;
      const promptText = `[Instruct: Reply exclusively in ${language}] ${adaptiveInstruction}` + (activeSubject !== 'General' 
        ? `[Priority Subject: ${activeSubject}] ${userText}`
        : userText);
      
      const newParts: any[] = [{ text: promptText }];
      if (selectedImage) {
        const match = selectedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
        if (match) newParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
      
      // Override the last prompt for tutoring engine parameters
      chatMessagesForTutor[chatMessagesForTutor.length - 1] = { role: 'user', parts: newParts };

      const response = await chatWithTutor(chatMessagesForTutor, provider);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setTimeout(() => {
        const modelMsg: ChatMessage = { role: 'model', text: response || 'I could not process that.' };
        const finalMsgs = [...updatedMsgs, modelMsg];
        
        const nextSessions = sessions.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: finalMsgs,
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        });

        setSessions(nextSessions);
        saveSessionsToFirebase(nextSessions);
        setIsLoading(false);
      }, 300);

    } catch (error) {
      console.error('[AI Tutor] send failed:', error);
      clearInterval(progressInterval);
      alert('Failed to get response. Please try again.');
      setIsLoading(false);
    }
  }, [input, messages, provider, language, selectedImage, studentData, isTimeLimitReached, isTopicRestricted, isCustomChatRestricted, sessions, activeSessionId, activeSession, folders]);

  // Voice recognition microphone recording
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
      console.warn('Speech recognition status notification:', e?.error || e);
      setIsRecording(false); 
      if (e?.error === 'not-allowed') {
        console.info('Speech recognition info: Microphone permission denied or blocked by iframe parent context.');
      }
    };
    
    rec.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = rec;
    
    try { 
      rec.start(); 
      setIsRecording(true); 
    } catch (e) { 
      console.warn('Mic start failed:', e); 
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

  // Grouping sessions chronologically by Date
  const groupedSessions = useMemo(() => {
    const grouped: Record<string, ChatSession[]> = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older Discussions': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Apply Filters (search box and folders filter)
    const filtered = sessions.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || 
        s.messages.some(m => m.text.toLowerCase().includes(searchHistoryQuery.toLowerCase()));
      const matchesSubject = selectedSubjectFilter === 'All' || s.subject === selectedSubjectFilter;
      return matchesSearch && matchesSubject;
    });

    filtered.forEach(s => {
      const date = new Date(s.updatedAt || s.createdAt);
      if (date >= today) {
        grouped['Today'].push(s);
      } else if (date >= yesterday) {
        grouped['Yesterday'].push(s);
      } else if (date >= sevenDaysAgo) {
        grouped['Previous 7 Days'].push(s);
      } else {
        grouped['Older Discussions'].push(s);
      }
    });

    return grouped;
  }, [sessions, searchHistoryQuery, selectedSubjectFilter]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] w-full rounded-[36px] overflow-hidden bg-[#070a18] text-white p-4 lg:p-6 relative font-sans">
      {/* Background radial glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,60,0.8)_0%,rgba(7,10,24,1)_100%)] pointer-events-none rounded-[36px]" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Time limit blocker overlay */}
      {isTimeLimitReached() && (
        <div className="absolute inset-0 bg-[#070b19]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-8 space-y-6 rounded-[36px]">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Clock size={32} className="animate-pulse" />
          </div>
          <div className="space-y-3 max-w-md">
            <h2 className="text-2xl font-black text-white">⏳ Study Time Complete!</h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              You've reached your daily AI Tutoring limit of <span className="text-brand-cyan font-bold font-sans">{studentData?.parentControls?.timeLimitMinutes} minutes</span> set by your parents.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Terrific work completing your studies! Rest your eyes, go enjoy some offline play, and return tomorrow to continue learning together!
            </p>
          </div>
          {onBack && (
            <button 
              onClick={onBack}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all mt-4"
            >
              <ArrowLeft size={14} /> Exit to Dashboard
            </button>
          )}
        </div>
      )}

      {viewMode === 'studio' ? (
        <div className="w-full space-y-6 text-white font-sans z-20">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
              Interactive Learning Studio
            </h1>
            <button
              type="button"
              onClick={() => setViewMode('advanced')}
              className="bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:border-cyan-500/50"
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span>Advanced AI Tutor Controls</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Box: AI Tutor Assistant (~65% / 8 cols) */}
            <div className="lg:col-span-8 bg-[#0c1024] border border-white/10 rounded-[28px] p-6 flex flex-col justify-between shadow-2xl min-h-[540px] relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                    <Brain size={20} />
                  </div>
                  <h3 className="text-lg font-display font-bold text-white">
                    AI Tutor Assistant
                  </h3>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  online
                </span>
              </div>

              {/* Message Area */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4 text-left">
                <div className="flex items-start gap-3.5 max-w-xl">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-md mt-1">
                    <Brain size={18} />
                  </div>
                  <div className="bg-[#161a33] text-slate-200 p-4 rounded-2xl rounded-tl-none border border-white/10 text-xs sm:text-sm leading-relaxed shadow-lg">
                    <p>Hi Sarah! Ready to explore some Grade 5 Mathematics today? Ask me anything about fractions, decimals, or geometry!</p>
                  </div>
                </div>

                {/* Display current active session messages if any */}
                {sessions.find(s => s.id === activeSessionId)?.messages.map((msg, idx) => (
                  <div key={idx} className={`flex items-start gap-3.5 max-w-xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                    {msg.role !== 'user' && (
                      <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-md mt-1">
                        <Brain size={18} />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-tr-none border border-pink-400/20'
                        : 'bg-[#161a33] text-slate-200 rounded-tl-none border border-white/10'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <form onSubmit={e => { e.preventDefault(); if (input.trim()) { handleSend(); } }} className="pt-4 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-3 bg-[#13172e] border border-white/10 rounded-2xl px-4 py-2 focus-within:border-pink-500/50 transition-all shadow-inner">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask AI Tutor anything..."
                    className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none px-2 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 disabled:opacity-40 hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
                  >
                    {isLoading ? 'Thinking...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column (~35% / 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Suggested Activities & Topics */}
              <div className="bg-[#0c1024] border border-white/10 rounded-[28px] p-6 shadow-2xl text-left">
                <h3 className="text-base sm:text-lg font-display font-bold text-white mb-4">
                  Suggested Activities & Topics
                </h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => { setInput('Explain Grade 5 Math - Fractions'); handleSend('Explain Grade 5 Math - Fractions'); }}
                    className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-[#161a33] border border-pink-500/40 text-left hover:border-pink-400 transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">Grade 5 Math - Fractions</span>
                      <Sparkles size={14} className="text-pink-400" />
                    </div>
                    <p className="text-[11px] text-slate-300">Interactive practice on equivalent fractions and simple addition.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setInput('Explain Science - Solar System'); handleSend('Explain Science - Solar System'); }}
                    className="w-full p-3.5 rounded-2xl bg-[#161a33] border border-cyan-500/30 text-left hover:border-cyan-400 transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Science - Solar System</span>
                      <Sparkles size={14} className="text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">Explore planetary orbits and basic astronomy concepts.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setInput('Let us do an English - Grammar Quiz'); handleSend('Let us do an English - Grammar Quiz'); }}
                    className="w-full p-3.5 rounded-2xl bg-[#161a33] border border-emerald-500/30 text-left hover:border-emerald-400 transition-all shadow-md group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">English - Grammar Quiz</span>
                      <Sparkles size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">Quick interactive quiz on parts of speech and sentence structure.</p>
                  </button>
                </div>
              </div>

              {/* Card 2: Interactive Toolset */}
              <div className="bg-[#0c1024] border border-white/10 rounded-[28px] p-6 shadow-2xl text-left">
                <h3 className="text-base sm:text-lg font-display font-bold text-white mb-4">
                  Interactive Toolset
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('advanced')}
                    className="p-3.5 bg-[#161a33] border border-white/10 rounded-2xl text-left hover:border-cyan-500/50 transition-all flex items-center gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                      <Monitor size={18} />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300">Interactive Whiteboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('advanced')}
                    className="p-3.5 bg-[#161a33] border border-white/10 rounded-2xl text-left hover:border-pink-500/50 transition-all flex items-center gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="p-2 bg-pink-500/10 rounded-xl text-pink-400 group-hover:scale-110 transition-transform">
                      <Volume2 size={18} />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-pink-300">Voice Tutor Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('advanced')}
                    className="p-3.5 bg-[#161a33] border border-white/10 rounded-2xl text-left hover:border-amber-500/50 transition-all flex items-center gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                      <Puzzle size={18} />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300">Step-by-Step Solver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('advanced')}
                    className="p-3.5 bg-[#161a33] border border-white/10 rounded-2xl text-left hover:border-emerald-500/50 transition-all flex items-center gap-3 cursor-pointer group shadow-sm"
                  >
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                      <Eye size={18} />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Concept Visualization</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {viewMode === 'advanced' && (
        <>
          <div className="flex justify-between items-center w-full mb-4 z-20">
            <button
              type="button"
              onClick={() => setViewMode('studio')}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>← Back to Interactive Learning Studio</span>
            </button>
          </div>
          {/* LEFT / MAIN COLUMN: CHAT WINDOW CARD */}
      <div className="flex-1 flex flex-col h-full bg-slate-900/60 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-xl relative z-20 overflow-hidden">
        
        {/* Top Header inside Chat Box */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack} 
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-all cursor-pointer active:scale-95 shrink-0"
                title="Exit to main portal"
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
              </button>
            )}
            
            <div className="p-2.5 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl border border-white/15 flex items-center justify-center shadow-md">
              <Brain size={22} className="text-brand-cyan" />
            </div>

            <div className="text-left">
              <h1 className="text-lg lg:text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                <span>AI Tutor Support</span>
                {activeSession && activeSession.title !== 'New Discussion' && (
                  <span className="text-xs text-cyan-400 font-mono font-normal bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {activeSession.title}
                  </span>
                )}
              </h1>
              {activeSession && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <select
                    value={activeSession.subject}
                    onChange={(e) => handleMoveSessionToFolder(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-brand-cyan focus:outline-none cursor-pointer border-0 p-0 [&>option]:bg-[#070b19] [&>option]:text-white"
                  >
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Tutor Customization Parameters"
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${
                isSettingsOpen 
                  ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40 shadow-[0_0_12px_rgba(34,211,238,0.35)]' 
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings size={14} className={isSettingsOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Collapsible Settings Drawer */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#090e1d]/95 border-b border-white/10 py-4 shrink-0 overflow-hidden backdrop-blur-xl relative z-30"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase font-black text-brand-cyan mb-1 tracking-wider">Target Grade</label>
                  <select 
                    value={studentGrade} 
                    onChange={e => setStudentGrade(e.target.value)}
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <option value="Grades R-12">Grades R-12 (Adaptive)</option>
                    <option value="Grade R">Grade R</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={`Grade ${num}`}>{`Grade ${num}`}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase font-black text-brand-cyan mb-1 tracking-wider">Subject Folder</label>
                  <select 
                    value={activeSession?.subject || 'General'}
                    onChange={e => handleMoveSessionToFolder(e.target.value)}
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 transition-all"
                  >
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase font-black text-brand-cyan mb-1 tracking-wider">Language</label>
                  <select 
                    value={language} 
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 transition-all"
                  >
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase font-black text-brand-cyan mb-1 tracking-wider">Voice Character</label>
                  <select 
                    value={voice} 
                    onChange={e => setVoice(e.target.value)}
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-white/10 transition-all"
                  >
                    {allVoices.map((v, i) => <option key={`${v.value}-${i}`} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message scroll list */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-white/15 p-2 shadow-[0_0_25px_rgba(34,211,238,0.2)] flex items-center justify-center mb-5">
                  <RobbieFace className="w-16 h-16" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-white text-center mb-2">
                  AI Tutor Support
                </h2>
                <p className="text-center text-xs lg:text-sm text-slate-300 max-w-md font-normal leading-relaxed mb-6 font-sans">
                  A localized AI companion for homework grading, concept explanations, and curriculum support. Ask a question or choose a subject below!
                </p>

                {/* Suggestions Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      disabled={isLoading}
                      onClick={() => handleSend(s.text)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer active:scale-95 ${s.color}`}
                    >
                      ✨ {s.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start text-left'}`}>
                {msg.role === 'model' && (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-9 h-9 flex flex-col items-center justify-center shrink-0 shadow-lg border border-purple-500/40 rounded-xl overflow-hidden bg-[#1E293B] mt-1"
                  >
                    <RobbieFace className="w-7 h-7" />
                  </motion.div>
                )}
                
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`p-5 lg:p-6 max-w-[85%] lg:max-w-[78%] shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 text-cyan-100 rounded-2xl rounded-tr-sm font-sans shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                      : 'bg-gradient-to-r from-purple-900/40 via-purple-900/20 to-pink-900/30 border border-purple-500/40 text-purple-100 rounded-2xl rounded-tl-sm font-sans shadow-[0_0_25px_rgba(168,85,247,0.15)]'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="flex flex-col gap-4">
                      <div className="prose prose-xs lg:prose-sm max-w-none prose-p:leading-relaxed prose-invert markdown-body"
                        dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(msg.text) as string) }}
                      />
                      {visuals[i] && (
                        <div className="pt-2 border-t border-white/10">
                          <AiImage prompt={`Educational illustration showing: ${msg.text.substring(0, 300)}`} aspectRatio="video" className="w-full max-w-sm rounded-xl" />
                        </div>
                      )}

                      {/* Action buttons at bottom of bot bubble */}
                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-purple-500/20 text-xs gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border text-[11px] font-bold ${
                              isAudioPlaying === i && !isAudioPaused 
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg' 
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                            onClick={() => handlePlayAudio(msg.text, i)}
                            disabled={isTtsLoading === i}
                          >
                            {isTtsLoading === i ? <Loader2 className="w-3 h-3 animate-spin text-cyan-400" /> : isAudioPlaying === i && !isAudioPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isAudioPlaying === i && !isAudioPaused ? "Pause Audio" : "Listen"}</span>
                          </button>
                          {isAudioPlaying === i && (
                            <button
                              className="p-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20"
                              onClick={handleStopAudio}
                              title="Stop Voice"
                            >
                              <Square className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border text-[11px] font-bold ${
                              visuals[i] 
                                ? 'bg-purple-500/30 text-purple-200 border-purple-500/50 shadow-lg' 
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                            onClick={() => setVisuals(prev => ({...prev, [i]: !prev[i]}))}
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>{visuals[i] ? "Hide Diagram" : "Generate Diagram"}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3 font-bold text-cyan-300">
                          <span className="hover:underline cursor-pointer opacity-90">[Download Full Lesson Plan PDF]</span>
                          <span className="hover:underline cursor-pointer opacity-90">[Launch Interactive Exercise]</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {msg.image && (
                        <img src={msg.image} alt="Uploaded" className="max-w-[180px] lg:max-w-[220px] rounded-xl object-contain mb-1.5 border border-white/10 shadow-md" />
                      )}
                      <p className="text-xs lg:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  )} 
                </motion.div>
                
                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 border border-cyan-300/50 p-0.5 flex items-center justify-center shrink-0 text-slate-950 shadow-lg mt-1 font-bold">
                    <User className="w-5 h-5 text-slate-950" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-brand-cyan animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl rounded-tl-none px-5 py-4 flex flex-col gap-2 min-w-[220px] shadow-lg">
                <div className="flex justify-between items-center text-[10px] font-bold text-purple-200">
                  <span>Robbie is formulating...</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden bg-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM INPUT BAR (Matching Screenshot 2) */}
        <div className="pt-4 border-t border-white/10 shrink-0 flex items-center gap-3 relative z-20">
          {/* Voice Input Glowing Button */}
          <button
            onClick={handleMicClick}
            disabled={isLoading}
            className={`px-5 lg:px-6 py-3 rounded-2xl border font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shrink-0 cursor-pointer shadow-lg active:scale-95 ${
              isRecording
                ? 'border-red-400 bg-red-500/20 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-pulse'
                : 'border-cyan-400/80 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:bg-cyan-500/25'
            }`}
          >
            <Mic size={18} className={isRecording ? "text-red-400 animate-bounce" : "text-brand-cyan"} />
            <span>{isRecording ? "Listening..." : "Voice Input"}</span>
          </button>

          {/* Text Input Container */}
          <div className="flex-1 bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-inner focus-within:border-cyan-500/50 transition-colors">
            {selectedImage && (
              <div className="relative inline-block shrink-0">
                <img src={selectedImage} alt="Preview" className="h-9 rounded-lg object-contain border border-white/10 shadow-md" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 scale-75 cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
              title="Attach Homework Photo"
            >
              <ImageIcon size={18} className="text-slate-400 hover:text-cyan-400" />
            </button>

            <input
              type="text"
              placeholder={isRecording ? "Listening to your voice..." : "Type your query here..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isLoading && (input.trim() || selectedImage) && handleSend()}
              className="w-full bg-transparent border-0 focus:outline-none text-xs sm:text-sm text-white placeholder:text-slate-500 font-sans"
              disabled={isLoading}
            />

            {isAudioPlaying !== null && (
              <button 
                onClick={handleStopAudio} 
                className="w-8 h-8 rounded-xl bg-red-500 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-red-500/10"
              >
                <Square className="w-3 h-3" />
              </button>
            )}

            <button 
              onClick={() => handleSend()} 
              disabled={isLoading || (!input.trim() && !selectedImage)} 
              className="p-2 rounded-xl bg-transparent hover:bg-white/10 text-slate-400 hover:text-cyan-400 disabled:opacity-40 transition-all shrink-0 cursor-pointer"
              title="Send query"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR PANEL (Matching Screenshot 2) */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar relative z-20">
        
        {/* Card 1: Recent Tutoring Topics */}
        <div className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-4 shadow-xl backdrop-blur-xl flex-1 flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white tracking-tight">
              Recent Tutoring Topics
            </h2>
            <button 
              onClick={handleNewChat}
              className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 text-xs font-bold flex items-center gap-1 shrink-0"
              title="New Discussion"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Search & Folder Filter inside Recent Topics card so all existing fields/menus are preserved */}
          <div className="space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text"
                placeholder="Search topics..."
                value={searchHistoryQuery}
                onChange={e => setSearchHistoryQuery(e.target.value)}
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            
            {/* Subject filter tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              <button
                onClick={() => setSelectedSubjectFilter('All')}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-semibold transition-all ${
                  selectedSubjectFilter === 'All' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800/40 text-slate-400 hover:text-white'
                }`}
              >
                All ({sessions.length})
              </button>
              {folders.slice(0, 4).map(sub => {
                const count = sessions.filter(s => s.subject === sub).length;
                if (count === 0 && selectedSubjectFilter !== sub) return null;
                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubjectFilter(sub)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-semibold transition-all ${
                      selectedSubjectFilter === sub ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topics List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {Object.entries(groupedSessions).map(([groupTitle, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mt-2">{groupTitle}</span>
                  {list.map(s => {
                    const isActive = s.id === activeSessionId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setActiveSessionId(s.id)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between text-sm cursor-pointer group relative ${
                          isActive 
                            ? 'bg-slate-800 border-cyan-500/60 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                            : 'bg-slate-800/50 border-white/10 text-slate-300 hover:border-cyan-500/30 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="truncate font-bold leading-snug">{s.title || 'New Discussion'}</p>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{s.subject}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={(e) => handleDeleteChat(s.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-rose-400 transition-opacity"
                            title="Delete topic"
                          >
                            <Trash2 size={13} />
                          </button>
                          <FileText size={16} className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs font-medium">
                No recent topics found. Click + to start!
              </div>
            )}
          </div>
        </div>

        {/* Card 2: AI Tutor Actions */}
        <div className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-3 shadow-xl backdrop-blur-xl shrink-0">
          <h2 className="text-lg font-display font-bold text-white tracking-tight mb-4">
            AI Tutor Actions
          </h2>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <span>Upload Resource</span>
          </button>

          <button
            onClick={handleNewChat}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <span>Clear Chat History</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full py-3.5 px-5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <span>Tutor Settings</span>
          </button>
        </div>

      </div>
        </>
      )}
    </div>
  );
}
