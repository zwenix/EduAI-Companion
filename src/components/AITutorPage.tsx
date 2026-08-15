import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Sparkles, User, Mic, Loader2, Play, Square, GraduationCap, Pause, 
  Image as ImageIcon, Clock, AlertCircle, Search, Plus, Trash2, Folder, 
  FolderOpen, ChevronDown, ChevronRight, Settings, ArrowLeft, Brain, Check, X, FileText, Send, Monitor, Volume2, Puzzle, Eye,
  MessageSquare, Archive, BookOpen, Layers, History, Menu
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
const overlayAiTutor = 'https://i.ibb.co/chSwj5SL/ai-tutor.png';

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
  grade?: string; // Optional grade mode for the session
  messages: ChatMessage[];
}

const LANGUAGES = [
  { value: 'English',   label: 'English' },
  { value: 'Afrikaans', label: 'Afrikaans' },
  { value: 'isiXhosa',  label: 'isiXhosa' },
  { value: 'Khoekhoegowab (First Traditional Language)', label: 'Khoekhoegowab (First Traditional Language)' },
  { value: 'South African Sign Language (SASL)', label: 'South African Sign Language (SASL)' },
  { value: 'isiZulu',   label: 'isiZulu' },
  { value: 'Sesotho',   label: 'Sesotho' },
  { value: 'Sepedi (Sesotho sa Leboa)', label: 'Sepedi (Sesotho sa Leboa)' },
  { value: 'Setswana',  label: 'Setswana' },
  { value: 'isiNdebele',label: 'isiNdebele' },
  { value: 'SiSwati',   label: 'SiSwati' },
  { value: 'Tshivenda', label: 'Tshivenda' },
  { value: 'Xitsonga',  label: 'Xitsonga' },
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

import Logo from './Logo';

const EllyFace = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} shrink-0`}>
    {/* Left Ear */}
    <path d="M22 45 C8 40 4 62 14 76 C24 86 35 72 35 56 Z" fill="#38bdf8" fillOpacity="0.85" />
    {/* Right Ear */}
    <path d="M78 45 C92 40 96 62 86 76 C76 86 65 72 65 56 Z" fill="#38bdf8" fillOpacity="0.85" />
    {/* Head */}
    <circle cx="50" cy="56" r="23" fill="#0284c7" />
    {/* Trunk */}
    <path d="M43 66 C43 78 36 88 44 94 C52 100 59 88 57 76 L57 66 Z" fill="#0369a1" />
    {/* Eyes */}
    <circle cx="42" cy="51" r="3.5" fill="#ffffff" />
    <circle cx="42" cy="51" r="1.8" fill="#0f172a" />
    <circle cx="58" cy="51" r="3.5" fill="#ffffff" />
    <circle cx="58" cy="51" r="1.8" fill="#0f172a" />
    {/* Cheek blush */}
    <ellipse cx="36" cy="58" rx="3" ry="1.5" fill="#f43f5e" fillOpacity="0.4" />
    <ellipse cx="64" cy="58" rx="3" ry="1.5" fill="#f43f5e" fillOpacity="0.4" />
    {/* Smile on trunk root */}
    <path d="M45 63 Q50 66 55 63" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    {/* Graduation Cap Base (Mortarboard) */}
    <polygon points="50,14 82,24 50,34 18,24" fill="#1e293b" stroke="#fcd34d" strokeWidth="2" />
    {/* Cap Skull cap */}
    <path d="M34 29 L34 41 Q50 49 66 41 L66 29 Z" fill="#334155" />
    {/* Gold Tassel */}
    <path d="M50 24 L72 31 L72 48" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="72" cy="49" r="3" fill="#fcd34d" />
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
  const [activeBottomDrawer, setActiveBottomDrawer] = useState<'chats' | 'activities' | 'toolset' | 'archive' | 'settings' | null>(null);

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
  const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
  const [leftMenu, setLeftMenu] = useState<'chats' | 'activities' | 'tools' | 'archive' | null>(null);

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
             const freshSession: ChatSession = {
               id: freshId,
               title: 'New Discussion',
               subject: 'General',
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               messages: []
             };
             loadedSessions = [freshSession];
           }

           loadedSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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
      grade: 'Grades R-12', // Adaptive mode by default for new chats
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    setStudentGrade('Grades R-12');
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
            grade: 'Grades R-12',
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

  // Clear All Chat History
  const handleClearAllHistory = () => {
    if (confirm('Are you sure you want to completely clear your AI chat history? This cannot be undone.')) {
      const freshId = 'session-' + Date.now();
      const freshSession: ChatSession = {
        id: freshId,
        title: 'New Discussion',
        subject: 'General',
        grade: 'Grades R-12',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      const updated = [freshSession];
      setSessions(updated);
      setActiveSessionId(freshId);
      saveSessionsToFirebase(updated);
    }
  };

  // Restore grade from session
  useEffect(() => {
    if (activeSession) {
      setStudentGrade(activeSession.grade || 'Grades R-12');
    }
  }, [activeSessionId, activeSession?.grade]);

  // Update grade mode of active chat session
  const handleGradeChange = (grade: string) => {
    setStudentGrade(grade);
    const updated = sessions.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, grade, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setSessions(updated);
    saveSessionsToFirebase(updated);
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

  const handleVoiceInput = handleMicClick;

  const handleExportPDF = useCallback((content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Elly_Tutor_Lesson_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className="flex flex-1 min-h-0 w-full min-w-0 overflow-hidden text-white relative font-sans p-0 flex-row h-full bg-slate-950">
      {/* Subtle ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Time limit blocker overlay */}
      {isTimeLimitReached() && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-8 space-y-6">
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
              className="bg-white/5 hover:bg-transparent text-white border border-white/10 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all mt-4"
            >
              <ArrowLeft size={14} /> Exit to Dashboard
            </button>
          )}
        </div>
      )}

      {/* MAIN FULL BLEED CHAT AREA */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full bg-slate-950/80 relative z-20 overflow-hidden">
            
        {/* Top Header Bar - Full Bleed */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-3 sm:px-5 py-2.5 border-b border-white/10 bg-slate-900/80 backdrop-blur-md gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button 
                type="button"
                onClick={onBack} 
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-transparent border border-white/10 flex items-center justify-center text-slate-300 transition-all cursor-pointer active:scale-95 shrink-0"
                title="Exit to main portal"
              >
                <ArrowLeft size={15} strokeWidth={2.5} />
              </button>
            )}
            
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/40 flex items-center justify-center p-1 shadow-md shrink-0">
              <EllyFace className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="text-left min-w-0">
              {/* Same row: Elly + AI Tutor + Grade Selector */}
              <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-nowrap">
                <h1 className="text-sm sm:text-base lg:text-lg font-display font-bold text-white tracking-tight flex items-center gap-1.5 shrink-0">
                  <span>Elly</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950/70 px-1.5 sm:px-2 py-0.5 rounded-full border border-cyan-500/30 shrink-0">
                    AI Tutor
                  </span>
                </h1>

                {/* Compact Grade Level Selector on the same line */}
                <div className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg shrink-0 transition-colors">
                  <GraduationCap size={12} className="text-amber-400 shrink-0" />
                  <select
                    value={studentGrade}
                    onChange={e => handleGradeChange(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-xs text-white font-bold outline-none cursor-pointer max-w-[85px] sm:max-w-[120px] truncate [&>option]:bg-[#070b19] [&>option]:text-white"
                  >
                    <option value="All Grades">All Grades</option>
                    <option value="Grades R-12">Grades R-12</option>
                    <option value="Grade R">Grade R</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={`Grade ${num}`}>{`Grade ${num}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Intelligent Learning & Homework Companion</p>
            </div>
          </div>

          {/* Top Buttons: Language & Voice Model (side-by-side in same row, compact size), New Chat, Clear */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg shrink-0 transition-colors">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs text-white font-semibold outline-none cursor-pointer max-w-[80px] sm:max-w-[105px] truncate [&>option]:bg-[#070b19] [&>option]:text-white"
              >
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            {/* Voice Model Selector (right next to Language Selector in the same row) */}
            <div className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg shrink-0 transition-colors">
              <Volume2 size={12} className="text-pink-400 shrink-0" />
              <select
                value={voice}
                onChange={e => setVoice(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs text-white font-semibold outline-none cursor-pointer max-w-[80px] sm:max-w-[105px] truncate [&>option]:bg-[#070b19] [&>option]:text-white"
              >
                {allVoices.map((v, i) => <option key={`${v.value}-${i}`} value={v.value}>{v.label}</option>)}
              </select>
            </div>

            {/* New Chat */}
            <button
              type="button"
              onClick={handleNewChat}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={13} strokeWidth={3} />
              <span>New Chat</span>
            </button>

            {/* Clear Chat History */}
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
              title="Clear All Chat History"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear</span>
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
              className="bg-slate-900/95 border-b border-white/10 px-4 sm:px-6 py-4 shrink-0 overflow-hidden backdrop-blur-xl relative z-30"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase font-black text-brand-cyan mb-1 tracking-wider">Target Grade</label>
                  <select 
                    value={studentGrade} 
                    onChange={e => handleGradeChange(e.target.value)}
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-transparent transition-all"
                  >
                    <option value="All Grades">All Grades (Open Mode)</option>
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
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-transparent transition-all"
                  >
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase font-black text-brand-cyan mb-1 tracking-wider">Language</label>
                  <select 
                    value={language} 
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-transparent transition-all"
                  >
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase font-black text-brand-cyan mb-1 tracking-wider">Voice Character</label>
                  <select 
                    value={voice} 
                    onChange={e => setVoice(e.target.value)}
                    className="bg-white/5 border border-white/10 outline-none text-white text-xs py-1.5 px-2.5 rounded-lg [&>option]:bg-[#0B1122] [&>option]:text-white cursor-pointer hover:bg-transparent transition-all"
                  >
                    {allVoices.map((v, i) => <option key={`${v.value}-${i}`} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message scroll list — sole vertical scroller for the chat */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full text-slate-400 px-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/30 p-2 shadow-[0_0_30px_rgba(34,211,238,0.2)] flex items-center justify-center mb-4">
                  <EllyFace className="w-16 h-16" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-white text-center mb-2">
                  Hi! I'm Elly, your AI Tutor
                </h2>
                <p className="text-center text-xs sm:text-sm text-slate-300 max-w-md font-normal leading-relaxed mb-6 font-sans">
                  I'm here to help you understand tricky homework concepts, explain any subject step-by-step, or practice for exams. Type a question, use your microphone to speak, or upload a worksheet!
                </p>

                {/* Suggestions Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
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
                    className="w-9 h-9 flex flex-col items-center justify-center shrink-0 shadow-lg border border-indigo-500/40 rounded-xl overflow-hidden bg-[#1E293B] mt-1"
                  >
                    <EllyFace className="w-7 h-7" />
                  </motion.div>
                )}
                
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`p-5 lg:p-6 max-w-[85%] lg:max-w-[78%] shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border border-indigo-500/40 text-indigo-100 rounded-2xl rounded-tr-sm font-sans shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                      : 'bg-slate-900/90 border border-indigo-500/40 text-slate-100 rounded-2xl rounded-tl-sm font-sans shadow-[0_0_25px_rgba(99,102,241,0.1)] backdrop-blur-xl'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="flex flex-col gap-4">
                      <div className="prose prose-xs lg:prose-sm max-w-none prose-p:leading-relaxed prose-invert markdown-body"
                        dangerouslySetInnerHTML={{ __html: replaceImagePlaceholders(marked.parse(msg.text) as string) }}
                      />
                      {visuals[i] && (
                        <div className="pt-2 border-t border-indigo-500/20">
                          <AiImage prompt={`Educational illustration showing: ${msg.text.substring(0, 300)}`} aspectRatio="video" className="w-full max-w-sm rounded-xl border border-indigo-500/30 shadow-lg" />
                        </div>
                      )}

                      {/* Action buttons at bottom of bot bubble */}
                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-indigo-500/20 text-xs gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border text-[11px] font-bold cursor-pointer ${
                              isAudioPlaying === i
                                ? isAudioPaused
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                                  : 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-lg'
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-transparent hover:text-white'
                            }`}
                            onClick={() => handlePlayAudio(msg.text, i)}
                            disabled={isTtsLoading === i}
                          >
                            {isTtsLoading === i ? <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> : isAudioPlaying === i && !isAudioPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isAudioPlaying === i ? (isAudioPaused ? "Resume Audio" : "Pause Audio") : "Listen"}</span>
                          </button>
                          {isAudioPlaying === i && (
                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors text-[11px] font-bold cursor-pointer"
                              onClick={handleStopAudio}
                              title="Stop Voice"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border text-[11px] font-bold cursor-pointer ${
                              visuals[i] 
                                ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/50 shadow-lg' 
                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-transparent hover:text-white'
                            }`}
                            onClick={() => setVisuals(prev => ({...prev, [i]: !prev[i]}))}
                          >
                            <ImageIcon className="w-3 h-3 text-indigo-400" />
                            <span>{visuals[i] ? "Hide Image" : "Generate Topic Image"}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                          <span 
                            onClick={() => handleExportPDF(msg.text)} 
                            className="hover:underline cursor-pointer opacity-90 text-indigo-300"
                          >
                            [Download PDF]
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {msg.image && (
                        <img src={msg.image} alt="Uploaded" className="max-w-[180px] lg:max-w-[220px] rounded-xl object-contain mb-1.5 border border-white/10 shadow-md" />
                      )}
                      <p className="text-xs lg:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  )}
                </motion.div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-brand-cyan animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl rounded-tl-none px-5 py-4 flex flex-col gap-2 min-w-[220px] shadow-lg">
                <div className="flex justify-between items-center text-[10px] font-bold text-indigo-200">
                  <span>Elly is formulating...</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Chat Input Bar - Full Bleed */}
        <div className="px-3 sm:px-5 py-3 border-t border-white/10 bg-slate-900/80 backdrop-blur-md shrink-0">
          {selectedImage && (
            <div className="mb-2 relative inline-block bg-slate-800/95 p-2 rounded-xl border border-white/10 shadow-lg">
              <img src={selectedImage} alt="Selected preview" className="h-16 w-auto rounded-lg object-contain" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 scale-75 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          <form onSubmit={e => { e.preventDefault(); if (input.trim() || selectedImage) { handleSend(); } }} className="flex items-center gap-3">
            {/* File Upload Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Worksheet or Image"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-transparent text-slate-300 hover:text-cyan-400 border border-white/10 transition-all cursor-pointer shrink-0"
            >
              <ImageIcon size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
            />

            {/* Text Entry Prompt Box */}
            <div className="flex-1 bg-slate-800/90 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 focus-within:border-cyan-500/50 transition-all shadow-inner">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Elly anything or type your prompt..."
                className="w-full bg-transparent border-0 focus:outline-none text-xs sm:text-sm text-white placeholder:text-slate-500 font-sans"
              />

              {/* Microphone Icon for Voice Entry */}
              <button
                type="button"
                onClick={handleVoiceInput}
                title={isRecording ? "Stop Recording" : "Voice Input"}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:text-cyan-400"
                }`}
              >
                <Mic size={18} />
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="w-10 h-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 disabled:opacity-40 hover:opacity-90 font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
              title="Send Prompt"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} strokeWidth={2.5} />}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT-HAND SIDE VERTICAL NAVIGATION BAR */}
      <div className="w-14 sm:w-16 lg:w-44 bg-slate-900/95 border-l border-white/10 flex flex-col items-center lg:items-stretch py-3 px-1.5 sm:px-2 gap-1.5 shrink-0 z-30 justify-between h-full">
        {/* Top menu items */}
        <div className="flex flex-col items-center lg:items-stretch gap-1.5 w-full">
          <div className="hidden lg:block px-2 py-1 mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/5">
            Tutor Menu
          </div>

          {/* Chats Button */}
          <button
            type="button"
            onClick={() => setLeftMenu(leftMenu === 'chats' ? null : 'chats')}
            className={`w-full p-2.5 lg:px-3 lg:py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
              leftMenu === 'chats' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10'
            }`}
            title="Chat History"
          >
            <MessageSquare size={16} className={leftMenu === 'chats' ? 'text-slate-950 shrink-0' : 'text-cyan-400 shrink-0'} />
            <span className="hidden lg:inline whitespace-nowrap">Chats</span>
          </button>

          {/* Activities Button */}
          <button
            type="button"
            onClick={() => setLeftMenu(leftMenu === 'activities' ? null : 'activities')}
            className={`w-full p-2.5 lg:px-3 lg:py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
              leftMenu === 'activities' ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10'
            }`}
            title="Suggested Activities"
          >
            <Sparkles size={16} className={leftMenu === 'activities' ? 'text-slate-950 shrink-0' : 'text-amber-400 shrink-0'} />
            <span className="hidden lg:inline whitespace-nowrap">Activities</span>
          </button>

          {/* Interactive Tools Button */}
          <button
            type="button"
            onClick={() => setLeftMenu(leftMenu === 'tools' ? null : 'tools')}
            className={`w-full p-2.5 lg:px-3 lg:py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
              leftMenu === 'tools' ? 'bg-indigo-500 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10'
            }`}
            title="Interactive Tools"
          >
            <Monitor size={16} className={leftMenu === 'tools' ? 'text-white shrink-0' : 'text-indigo-400 shrink-0'} />
            <span className="hidden lg:inline whitespace-nowrap">Tools</span>
          </button>

          {/* Archive Button */}
          <button
            type="button"
            onClick={() => setLeftMenu(leftMenu === 'archive' ? null : 'archive')}
            className={`w-full p-2.5 lg:px-3 lg:py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
              leftMenu === 'archive' ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10'
            }`}
            title="Media Archive"
          >
            <Archive size={16} className={leftMenu === 'archive' ? 'text-slate-950 shrink-0' : 'text-emerald-400 shrink-0'} />
            <span className="hidden lg:inline whitespace-nowrap">Archive</span>
          </button>
        </div>

        {/* Bottom Menu Items (Settings) */}
        <div className="flex flex-col items-center lg:items-stretch w-full pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`w-full p-2.5 lg:px-3 lg:py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer ${
              isSettingsOpen ? 'bg-pink-500 text-white font-bold shadow-[0_0_12px_rgba(236,72,153,0.4)]' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10'
            }`}
            title="Tutor Settings"
          >
            <Settings size={16} className={isSettingsOpen ? 'text-white shrink-0' : 'text-pink-400 shrink-0'} />
            <span className="hidden lg:inline whitespace-nowrap">Settings</span>
          </button>
        </div>
      </div>

      {/* Drawers / Overlays with strict viewable height constraint */}
      <AnimatePresence>
        {leftMenu && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="w-full max-w-lg max-h-[80vh] flex flex-col bg-slate-900 border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  {leftMenu === 'chats' && (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <MessageSquare size={18} />
                      </div>
                      <h3 className="font-display font-bold text-white text-sm">Chat History & Folders</h3>
                    </>
                  )}
                  {leftMenu === 'activities' && (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Sparkles size={18} />
                      </div>
                      <h3 className="font-display font-bold text-white text-sm">Suggested Activities</h3>
                    </>
                  )}
                  {leftMenu === 'tools' && (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Monitor size={18} />
                      </div>
                      <h3 className="font-display font-bold text-white text-sm">Interactive Toolset</h3>
                    </>
                  )}
                  {leftMenu === 'archive' && (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Archive size={18} />
                      </div>
                      <h3 className="font-display font-bold text-white text-sm">Content & Media Archive</h3>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLeftMenu(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pt-3 min-h-0">
                {/* CHATS CONTENT */}
                {leftMenu === 'chats' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                          type="text"
                          placeholder="Search past chats..."
                          value={searchHistoryQuery}
                          onChange={e => setSearchHistoryQuery(e.target.value)}
                          className="w-full bg-slate-800/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { handleNewChat(); setLeftMenu(null); }}
                        className="px-3 py-2 bg-cyan-500 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1 hover:opacity-90 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Plus size={14} /> New Chat
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                      {sessions
                        .filter(s => !searchHistoryQuery || s.title.toLowerCase().includes(searchHistoryQuery.toLowerCase()) || s.messages.some(m => m.text.toLowerCase().includes(searchHistoryQuery.toLowerCase())))
                        .map(s => (
                          <div
                            key={s.id}
                            onClick={() => { setActiveSessionId(s.id); setLeftMenu(null); }}
                            className={`p-3 rounded-xl border transition-all text-left cursor-pointer group flex items-center justify-between text-xs ${
                              s.id === activeSessionId ? 'bg-cyan-500/20 border-cyan-500/50 text-white font-bold' : 'bg-slate-800/80 border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="truncate font-medium">{s.title || 'Discussion'}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                <span>{s.subject || 'General'}</span>
                                <span>•</span>
                                <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteChat(s.id, e)}
                              className="p-1 hover:text-rose-400 text-slate-500 transition-all cursor-pointer"
                              title="Delete session"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      {sessions.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          No chat history yet. Start a discussion above!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUGGESTED ACTIVITIES CONTENT */}
                {leftMenu === 'activities' && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-400">Choose a quick curriculum activity to begin learning right away:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setInput('Explain Grade 5 Math - Fractions with visual step-by-step examples'); handleSend('Explain Grade 5 Math - Fractions with visual step-by-step examples'); setLeftMenu(null); }}
                        className="p-3 rounded-xl bg-slate-800/90 border border-amber-500/30 text-left hover:border-amber-400 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-amber-200">Math - Fractions</span>
                          <Sparkles size={14} className="text-amber-400" />
                        </div>
                        <span className="text-[11px] text-slate-400">Visual breakdowns of numerators, denominators and improper fractions.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setInput('Explain Science - Solar System with planetary facts and scale models'); handleSend('Explain Science - Solar System with planetary facts and scale models'); setLeftMenu(null); }}
                        className="p-3 rounded-xl bg-slate-800/90 border border-cyan-500/30 text-left hover:border-cyan-400 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-200">Solar System</span>
                          <Sparkles size={14} className="text-cyan-400" />
                        </div>
                        <span className="text-[11px] text-slate-400">Planets, orbits, asteroid belts, and cosmic exploration.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setInput('Let us do an English - Grammar Quiz testing parts of speech and punctuation'); handleSend('Let us do an English - Grammar Quiz testing parts of speech and punctuation'); setLeftMenu(null); }}
                        className="p-3 rounded-xl bg-slate-800/90 border border-emerald-500/30 text-left hover:border-emerald-400 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-200">Grammar Quiz</span>
                          <Sparkles size={14} className="text-emerald-400" />
                        </div>
                        <span className="text-[11px] text-slate-400">Interactive quick checks on verbs, nouns, adjectives, and syntax.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setInput('Teach me about South African Geography, provinces and capital cities'); handleSend('Teach me about South African Geography, provinces and capital cities'); setLeftMenu(null); }}
                        className="p-3 rounded-xl bg-slate-800/90 border border-purple-500/30 text-left hover:border-purple-400 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-purple-200">SA Geography</span>
                          <Sparkles size={14} className="text-purple-400" />
                        </div>
                        <span className="text-[11px] text-slate-400">Provinces, capitals, natural landmarks, and biomes.</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE TOOLSET CONTENT */}
                {leftMenu === 'tools' && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-400">Launch specialized AI teaching modes and pedagogical tools:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setInput('Start an Interactive Whiteboard session to draw and visualize math or science concepts.'); handleSend('Start an Interactive Whiteboard session to draw and visualize math or science concepts.'); setLeftMenu(null); }}
                        className="p-3 bg-slate-800/90 border border-cyan-500/30 rounded-xl text-left hover:border-cyan-400 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
                          <Monitor size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">Whiteboard Canvas</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Interactive board for diagrams, equations, and visual learning.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setInput('Activate Voice Tutor Mode. Please talk to me conversationally and ask guiding questions.'); handleSend('Activate Voice Tutor Mode. Please talk to me conversationally and ask guiding questions.'); setLeftMenu(null); }}
                        className="p-3 bg-slate-800/90 border border-amber-500/30 rounded-xl text-left hover:border-amber-400 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                          <Volume2 size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-200">Voice Tutor Mode</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Conversational voice loop with Socratic guiding questions.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setInput('Let us do a Step-by-Step Solver exercise. Give me a problem and guide me through solving it one step at a time.'); handleSend('Let us do a Step-by-Step Solver exercise. Give me a problem and guide me through solving it one step at a time.'); setLeftMenu(null); }}
                        className="p-3 bg-slate-800/90 border border-purple-500/30 rounded-xl text-left hover:border-purple-400 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                          <Puzzle size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-purple-200">Step-by-Step Solver</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Socratic problem-solving coach with phased hints.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setInput('Explain a core curriculum concept with visual examples and analogies.'); handleSend('Explain a core curriculum concept with visual examples and analogies.'); setLeftMenu(null); }}
                        className="p-3 bg-slate-800/90 border border-emerald-500/30 rounded-xl text-left hover:border-emerald-400 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                          <Eye size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-200">Concept Visualizer</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Transform abstract lessons into vivid analogies and charts.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ARCHIVE CONTENT */}
                {leftMenu === 'archive' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">Stored images, worksheets, and uploaded resources across your sessions:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                      {sessions.flatMap(s => s.messages.filter(m => m.image).map((m, idx) => ({ url: m.image, title: s.title, date: s.updatedAt, id: s.id + idx }))).map((item, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square">
                          <img src={item.url} alt="Archived" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[10px]">
                            <span className="text-white font-bold truncate">{item.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {sessions.flatMap(s => s.messages.filter(m => m.image)).length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        <Archive size={24} className="mx-auto mb-2 opacity-40" />
                        No archived files yet. Upload a document or worksheet in chat!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

