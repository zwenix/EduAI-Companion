import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Calendar, MessageSquare, AlertCircle, 
  Award, BookOpen, ChevronRight, GraduationCap, CheckCircle2, 
  ClipboardList, Trophy, Sparkles, Send, Check, Star, RefreshCw,
  Lock, Unlock, Shield, Clock, Eye, EyeOff, Clipboard, Settings, HelpCircle, AlertTriangle
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar 
} from 'recharts';

export default function ParentDashboard({ isDarkMode }: { isDarkMode: boolean }) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [reportCycle, setReportCycle] = useState<'weekly' | 'monthly' | 'term'>('weekly');
  const [parentNoteInput, setParentNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Parent controls state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [manageTab, setManageTab] = useState<'restrictions' | 'history'>('restrictions');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');
  const [savingControls, setSavingControls] = useState(false);

  // Clear states when child selection changes
  useEffect(() => {
    setIsUnlocked(false);
    setShowPinScreen(false);
    setPin('');
    setPinError('');
    setChatHistory([]);
    setPinChangeSuccess('');
  }, [selectedChildIndex]);

  const handleVerifyPin = () => {
    const parentRules = activeChild?.parentControls || {};
    const correctPin = parentRules.parentPin || '1234';
    if (pin === correctPin) {
      setIsUnlocked(true);
      setPinError('');
      setPin('');
      setPinChangeSuccess('');
      // automatically load history in background
      fetchChildChatHistory();
    } else {
      setPinError('Incorrect 4-digit PIN code. Please try again.');
      setPin('');
    }
  };

  const fetchChildChatHistory = async () => {
    if (!activeChild?.email) return;
    setHistoryLoading(true);
    try {
      const qUser = query(collection(db, 'users'), where('email', '==', activeChild.email.toLowerCase().trim()));
      const userSnap = await getDocs(qUser);
      if (!userSnap.empty) {
        const childUid = userSnap.docs[0].id;
        const chatDoc = await getDoc(doc(db, 'ai_tutor_sessions', childUid));
        if (chatDoc.exists()) {
          const msgs = JSON.parse(chatDoc.data().messages || '[]');
          setChatHistory(msgs);
        } else {
          setChatHistory([]);
        }
      } else {
        setChatHistory([]);
      }
    } catch (err) {
      console.error("Error loading child chat history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!activeChild || newPin.length !== 4) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }
    setSavingControls(true);
    setPinChangeSuccess('');
    try {
      const studentRef = doc(db, 'students', activeChild.id);
      const parentControls = activeChild.parentControls || {};
      await updateDoc(studentRef, {
        parentControls: {
          ...parentControls,
          parentPin: newPin,
        }
      });
      setPinChangeSuccess('Parent Access PIN changed successfully!');
      setNewPin('');
    } catch (e) {
      console.error("Error changing parent PIN:", e);
      setPinError('Failed to change PIN. Please try again.');
    } finally {
      setSavingControls(false);
    }
  };

  const handleToggleSubject = async (subjectName: string) => {
    if (!activeChild) return;
    setSavingControls(true);
    try {
      const studentRef = doc(db, 'students', activeChild.id);
      const parentControls = activeChild.parentControls || {};
      const restricted = parentControls.restrictedSubjects || [];
      
      const newRestricted = restricted.includes(subjectName)
        ? restricted.filter((s: string) => s !== subjectName)
        : [...restricted, subjectName];
        
      await updateDoc(studentRef, {
        parentControls: {
          ...parentControls,
          restrictedSubjects: newRestricted,
        }
      });
    } catch (e) {
      console.error("Error toggling restricted subject:", e);
    } finally {
      setSavingControls(false);
    }
  };

  const handleToggleCustomChat = async () => {
    if (!activeChild) return;
    setSavingControls(true);
    try {
      const studentRef = doc(db, 'students', activeChild.id);
      const parentControls = activeChild.parentControls || {};
      const isCustomDisabled = !parentControls.customChatDisabled;
      
      await updateDoc(studentRef, {
        parentControls: {
          ...parentControls,
          customChatDisabled: isCustomDisabled,
        }
      });
    } catch (e) {
      console.error("Error toggling custom chat restriction:", e);
    } finally {
      setSavingControls(false);
    }
  };

  const handleUpdateTimeLimit = async (minutes: number) => {
    if (!activeChild) return;
    setSavingControls(true);
    try {
      const studentRef = doc(db, 'students', activeChild.id);
      const parentControls = activeChild.parentControls || {};
      await updateDoc(studentRef, {
        parentControls: {
          ...parentControls,
          timeLimitMinutes: minutes,
        }
      });
    } catch (e) {
      console.error("Error updating time limit:", e);
    } finally {
      setSavingControls(false);
    }
  };

  const activeChild = children[selectedChildIndex];

  useEffect(() => {
    if (activeChild && activeChild.idp?.parentNote) {
      setParentNoteInput(activeChild.idp.parentNote);
    } else {
      setParentNoteInput('');
    }
    setSaveMessage('');
  }, [activeChild?.id]);

  const handleSaveParentNote = async () => {
    if (!activeChild) return;
    setIsSavingNote(true);
    setSaveMessage('');
    try {
      const studentRef = doc(db, 'students', activeChild.id);
      const updatedIdp = { ...(activeChild.idp || {}) };
      updatedIdp.parentNote = parentNoteInput.trim();
      updatedIdp.parentNoteTimestamp = new Date().toISOString();
      await updateDoc(studentRef, { idp: updatedIdp });
      setSaveMessage("Motivation saved! Your child will see this on their dashboard. ✨");
      setTimeout(() => setSaveMessage(''), 4500);
    } catch (e) {
      console.error("Error saving parent note:", e);
      setSaveMessage("Failed to save note. Please try again.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const getDynamicNarrative = (child: any, cycle: 'weekly' | 'monthly' | 'term') => {
    if (!child) return { title: '', perfLevel: '', body: '', strengths: '', weaknesses: '' };
    const avg = Math.round((child.subjects?.reduce((acc: number, item: any) => acc + item.mark, 0) || 0) / (child.subjects?.length || 1));
    const strengths = child.idp?.strengths || ["Consistent focus in learning sessions", "Excellent practical lab work"];
    const weaknesses = child.idp?.weaknesses || ["Complex problem solving under timed tests", "Algebraic conversions"];
    
    let cycleTitle = cycle === 'weekly' ? 'Weekly Narrative Report' : cycle === 'monthly' ? 'Monthly Academic Digest' : 'Term Narrative Summary';
    let perfLevel = avg >= 85 ? 'Distinguished Mastery' : avg >= 75 ? 'Academic Excellence' : avg >= 60 ? 'Satisfactory competency' : 'Support advised';
    
    let mainBody = '';
    if (avg >= 80) {
      mainBody = `${child.name} is demonstrating exceptional performance and high mastery across all core subjects. They show active learner citizenship and consistency. To maintain this growth, we suggest introducing some more advanced topics.`;
    } else if (avg >= 60) {
      mainBody = `${child.name} is demonstrating stable and good conceptual mastery. They regularly engage in independent study sessions. Focused support on complex abstract exercises and active self-tutoring check-ins will aid in ascending their mastery level.`;
    } else {
      mainBody = `${child.name} currently requires diagnostic and structured remediation assistance. Integrating regular practice worksheets combined with visual/auditory tutoring aids will accelerate their conceptual onboarding and boost exam confidence.`;
    }

    return {
      title: cycleTitle,
      perfLevel,
      body: mainBody,
      strengths: strengths[0] || "Task focus & structured submission",
      weaknesses: weaknesses[0] || "Complex algebra reasoning structures"
    };
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      setLoading(false);
      return;
    }

    // Subscribe to students linked to this parent email
    const childQuery = query(
      collection(db, 'students'), 
      where('parentEmail', '==', user.email)
    );

    const unsubscribeChildren = onSnapshot(childQuery, (snapshot) => {
      const childDocs: any[] = [];
      snapshot.forEach(doc => {
        childDocs.push({ id: doc.id, ...doc.data() });
      });
      setChildren(childDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to linked children:", error);
      setLoading(false);
    });

    // Subscribe to assignment notifications assigned to parents/channels
    const notificationsQuery = query(
      collection(db, 'notifications')
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notifDocs: any[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        notifDocs.push({ id: doc.id, ...d });
      });
      setNotifications(notifDocs.slice(0, 10)); // take recent 10
    });

    return () => {
      unsubscribeChildren();
      unsubscribeNotifications();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Synchronizing child records...</p>
      </div>
    );
  }

  const currentEmail = auth.currentUser?.email || '';

  if (children.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-indigo-500 to-emerald-700 p-8 sm:p-10 rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col justify-end min-h-[220px]">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Users size={150} />
          </div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-4xl font-hand tracking-wide">Parent family hub</h2>
            <p className="text-lg text-emerald-100 font-medium">No linked student accounts found.</p>
          </div>
        </div>

        <div className={`p-8 sm:p-10 rounded-[36px] max-w-2xl mx-auto text-center border space-y-6 ${isDarkMode ? 'glass' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center mx-auto text-brand-cyan">
            <Users size={28} />
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>How to Link Your Child's Profile</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Link your child's profile instantly via self-service configuration, or have their classroom teacher complete the mapping.
            </p>
          </div>

          <div className={`p-5 rounded-2xl text-left border space-y-3 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span> Link Instantly via Settings (Recommended)
            </p>
            <ol className="text-xs text-slate-400 list-decimal pl-5 space-y-1.5">
              <li>Click on <strong>Settings</strong> in the left sidebar menu.</li>
              <li>Go to the <strong>Personal Link Child</strong> section.</li>
              <li>Type your child's email address and press <strong>Link Profile</strong>. Your dashboards will sync instantly!</li>
            </ol>
          </div>

          <div className={`p-5 rounded-2xl text-left border space-y-3 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span> Method 2: Link via Educator
            </p>
            <p className="text-xs text-slate-400 pl-4">
              Provide your parent email address (<span className="text-brand-cyan font-black">{currentEmail}</span>) to your child's class teacher. They can add it to your child's student record under their Analytics & Reports dashboard.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-medium pt-2">
            Currently logged in email: <span className="text-white font-mono">{currentEmail}</span>
          </div>
        </div>
      </div>
    );
  }

  // Map active child's subjects to chart format
  const chartData = activeChild.subjects?.map((sub: any) => ({
    name: sub.name,
    Score: sub.mark,
  })) || [];

  // Generate GPA line chart based on first subject's history
  const historyData = [
    { name: 'Term 1', Score: 68 },
    { name: 'Term 2', Score: 74 },
    { name: 'Term 3', Score: 81 },
    { name: 'Term 4', Score: activeChild.subjects?.[0]?.mark || 79 },
  ];

  return (
    <div className="space-y-8">
      {/* Kid selector header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-hand leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Parent Family Portal</h1>
          <p className="text-xs text-slate-500 mt-1.5">Connected to school network for real-time CAPS statistics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Learner:</span>
              <select
                value={selectedChildIndex}
                onChange={e => setSelectedChildIndex(Number(e.target.value))}
                className={`p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-cyan cursor-pointer ${
                  isDarkMode ? 'bg-[#1E293B] border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                {children.map((child, i) => (
                  <option key={child.id} value={i}>{child.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {activeChild && (
            <button
              onClick={() => {
                setShowPinScreen(!showPinScreen);
                if (!showPinScreen) {
                  setIsUnlocked(false);
                  setPin('');
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isUnlocked 
                  ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/15'
              }`}
            >
              {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{isUnlocked ? 'Parent Controls: Unlocked' : 'Configure Parent Controls'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Numerical PIN Pad */}
      {showPinScreen && !isUnlocked && activeChild && (
        <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-[#1E293B] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-md'} mt-4 mb-4`}>
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="w-11 h-11 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">PIN Verification Required</h3>
              <p className="text-xs text-slate-400 mt-1">Please enter your 4-digit Parent PIN to access safety controls. (Default is <code className="font-mono bg-slate-800 text-slate-250 px-1.5 py-0.5 rounded text-[10px]">1234</code>)</p>
            </div>

            {/* Visual PIN dots */}
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map(index => (
                <div 
                  key={index} 
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-155 ${
                    pin.length > index 
                      ? 'bg-indigo-500 border-indigo-500 scale-110 shadow-sm shadow-indigo-550/20' 
                      : 'border-slate-500 bg-transparent'
                  }`} 
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-red-400 font-medium flex items-center justify-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                {pinError}
              </p>
            )}

            {/* Numerical Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto py-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    if (pin.length < 4) {
                      const newPinVal = pin + num;
                      setPin(newPinVal);
                      setPinError('');
                      if (newPinVal.length === 4) {
                        setTimeout(() => {
                          const parentRules = activeChild?.parentControls || {};
                          const correctPin = parentRules.parentPin || '1234';
                          if (newPinVal === correctPin) {
                            setIsUnlocked(true);
                            setPinError('');
                            setPin('');
                            setPinChangeSuccess('');
                            fetchChildChatHistory();
                          } else {
                            setPinError('Incorrect 4-digit PIN code. Please try again.');
                            setPin('');
                          }
                        }, 250);
                      }
                    }
                  }}
                  className={`h-11 text-sm font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-[#0F172A] hover:bg-slate-800 text-slate-200 border border-white/5' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => {
                  setPin('');
                  setPinError('');
                }}
                className={`h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#0F172A]/40 hover:bg-slate-800 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                }`}
              >
                Clear
              </button>
              <button
                key="0"
                onClick={() => {
                  if (pin.length < 4) {
                    const newPinVal = pin + '0';
                    setPin(newPinVal);
                    setPinError('');
                    if (newPinVal.length === 4) {
                      setTimeout(() => {
                        const parentRules = activeChild?.parentControls || {};
                        const correctPin = parentRules.parentPin || '1234';
                        if (newPinVal === correctPin) {
                          setIsUnlocked(true);
                          setPinError('');
                          setPin('');
                          setPinChangeSuccess('');
                          fetchChildChatHistory();
                        } else {
                          setPinError('Incorrect 4-digit PIN code. Please try again.');
                          setPin('');
                        }
                      }, 250);
                    }
                  }
                }}
                className={`h-11 text-sm font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                  isDarkMode ? 'bg-[#0F172A] hover:bg-slate-800 text-slate-200 border border-white/5' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm'
                }`}
              >
                0
              </button>
              <button
                onClick={() => {
                  if (pin.length > 0) {
                    setPin(prev => prev.slice(0, -1));
                    setPinError('');
                  }
                }}
                className={`h-11 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  isDarkMode ? 'bg-[#0F172A]/40 hover:bg-slate-800 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-550'
                }`}
              >
                ⌫
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowPinScreen(false);
                  setPin('');
                  setPinError('');
                }}
                className="text-xs text-slate-400 hover:text-slate-300 font-medium transition-all cursor-pointer"
              >
                Close Keypad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Control Panel once unlocked */}
      {showPinScreen && isUnlocked && activeChild && (
        <div className={`p-6 sm:p-8 rounded-[28px] border transition-all ${isDarkMode ? 'bg-[#1E293B] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-md'} mt-4 mb-4`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-700/10">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-indigo-400" size={22} />
                Parent Controls Console: <span className="text-indigo-400 font-hand text-2xl font-normal ml-1">{activeChild.name}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Restrict learning parameters, restrict subjects, and audit dialogue history.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setManageTab('restrictions')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  manageTab === 'restrictions'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : isDarkMode ? 'bg-[#0F172A] text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Safety Restrictions
              </button>
              <button
                onClick={() => {
                  setManageTab('history');
                  fetchChildChatHistory();
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  manageTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : isDarkMode ? 'bg-[#0F172A] text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Chat History Logs
              </button>
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setShowPinScreen(false);
                }}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  isDarkMode ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'
                }`}
              >
                Lock Controls
              </button>
            </div>
          </div>

          {manageTab === 'restrictions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              {/* Left Column: Safety and Timing */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-indigo-400" />
                    Daily AI Chat Study limits
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Define the duration of active AI Tutoring sessions available to your child. Once reached, their chat console will prompt them to resume learning the next day.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { label: 'Unlimited', value: 0 },
                      { label: '15 Mins', value: 15 },
                      { label: '30 Mins', value: 30 },
                      { label: '45 Mins', value: 45 },
                      { label: '60 Mins', value: 60 },
                      { label: '90 Mins', value: 90 },
                    ].map(opt => {
                      const currentLimit = activeChild.parentControls?.timeLimitMinutes ?? 0;
                      const isSelected = currentLimit === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleUpdateTimeLimit(opt.value)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md font-sans'
                              : isDarkMode ? 'bg-[#0F172A] text-slate-400 border border-white/5 hover:border-white/10' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/10 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Shield size={14} className="text-indigo-400" />
                    Safety Safeguards
                  </h4>
                  
                  {/* Custom/General Chat Override */}
                  <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-[#0F172A]/40 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="space-y-0.5 max-w-[80%] font-sans">
                      <span className="text-xs font-bold block">Strict Syllabus Tutoring Only</span>
                      <span className="text-[10px] text-slate-450 block leading-relaxed">
                        Forbid general conversations. Child must select a specific science or math curriculum unit to chat.
                      </span>
                    </div>
                    <button
                      onClick={handleToggleCustomChat}
                      className={`w-12 h-6.5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                        activeChild.parentControls?.customChatDisabled ? 'bg-red-500' : 'bg-emerald-600'
                      }`}
                    >
                      <div
                        className={`bg-white w-5.5 h-5.5 rounded-full shadow-md transform transition-transform duration-200 ${
                          activeChild.parentControls?.customChatDisabled ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Subject Exclusions and PIN Update */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Clipboard size={14} className="text-indigo-400" />
                    Subject Restriction Blocklist
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Choose which enrolled subjects are restricted from the AI Tutor chat. Restricted subjects are fully locked to encourage classroom-focused training.
                  </p>
                  
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeChild.subjects?.map((sub: any) => {
                      const restrictedList = activeChild.parentControls?.restrictedSubjects || [];
                      const isRestricted = restrictedList.includes(sub.name);
                      return (
                        <div
                          key={sub.name}
                          onClick={() => handleToggleSubject(sub.name)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isRestricted
                              ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                              : isDarkMode ? 'border-white/5 bg-[#0F172A]/20 hover:bg-[#0F172A]/40' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xs font-bold font-sans">{sub.name}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider font-sans ${
                            isRestricted ? 'bg-red-500/20 text-red-550' : 'bg-emerald-500/20 text-emerald-500'
                          }`}>
                            {isRestricted ? 'Restricted' : 'Allowed'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/10 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Change Parent Portal PIN
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        setNewPin(cleaned);
                      }}
                      placeholder="New 4-Digit PIN"
                      className={`p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full max-w-[150px] ${
                        isDarkMode ? 'bg-[#0F172A] border border-white/10 text-white' : 'bg-slate-100 border border-slate-200 text-slate-800'
                      }`}
                    />
                    <button
                      onClick={handleChangePin}
                      disabled={newPin.length !== 4 || savingControls}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all shadow-md cursor-pointer"
                    >
                      Save PIN
                    </button>
                  </div>
                  {pinChangeSuccess && (
                    <p className="text-[11px] text-emerald-500 font-medium font-sans mt-1">{pinChangeSuccess}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {manageTab === 'history' && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Verified AI Conversation Transcript Record
                </h4>
                <button
                  onClick={fetchChildChatHistory}
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:underline hover:opacity-85 font-bold uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw size={10} className={historyLoading ? 'animate-spin' : ''} />
                  Force Refresh
                </button>
              </div>

              {historyLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-indigo-400" size={24} />
                  Loading dynamic transcript history...
                </div>
              ) : chatHistory.length === 0 ? (
                <div className={`py-12 text-center rounded-2xl border border-dashed text-slate-450 text-xs ${
                  isDarkMode ? 'bg-slate-800/10 border-slate-700/60' : 'bg-slate-50 border-slate-300'
                }`}>
                  No active AI tutor history has been logged on the database for this learner yet.
                </div>
              ) : (
                <div className={`rounded-2xl p-4 max-h-[380px] overflow-y-auto space-y-3 border ${
                  isDarkMode ? 'bg-[#0F172A]/50 border-white/5' : 'bg-slate-50 border-slate-100'
                }`}>
                  {chatHistory.map((msg, i) => {
                    const isUser = msg.sender === 'user' || msg.role === 'user';
                    const textContent = msg.text || msg.content || '';
                    return (
                      <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] text-xs border ${
                          isUser
                            ? 'bg-indigo-600 text-white border-indigo-700 rounded-br-none'
                            : isDarkMode
                              ? 'bg-[#1E293B] text-slate-100 border-white/5 rounded-bl-none'
                              : 'bg-white text-slate-800 border-slate-200 rounded-bl-none shadow-sm'
                        }`}>
                          <span className="text-[9px] font-bold block mb-1 opacity-60 uppercase tracking-wide">
                            {isUser ? 'Learner (Child)' : 'EduAI Tutor Response'}
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap font-sans">{textContent}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* Hero card */}
      <div className="bg-gradient-to-br from-brand-cyan to-indigo-700 p-8 sm:p-10 rounded-[38px] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end min-h-[220px] gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <GraduationCap size={200} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-lg font-bold font-hand text-brand-cyan uppercase leading-none shadow-md">
            {activeChild.name.split(' ').map((n: string) => n.charAt(0)).join('')}
          </div>
          <div>
            <span className="inline-block bg-white/20 border border-white/25 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-2">
              Grade {activeChild.grade}
            </span>
            <h2 className="text-3xl font-black tracking-tight">{activeChild.name}</h2>
            <p className="text-sm text-cyan-100 font-medium">{activeChild.email}</p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 shrink-0 bg-black/15 p-4 rounded-2xl backdrop-blur-sm border border-white/5 w-full md:w-auto">
          <div>
            <span className="block text-[8px] font-black uppercase text-slate-300 tracking-wider">Overall GPA</span>
            <span className="text-2xl font-black text-brand-cyan">
              {Math.round((activeChild.subjects?.reduce((acc: number, item: any) => acc + item.mark, 0) || 0) / (activeChild.subjects?.length || 1))}%
            </span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="block text-[8px] font-black uppercase text-slate-300 tracking-wider">Status</span>
            <span className="text-xs font-black uppercase flex items-center gap-1 mt-1 text-emerald-300">
              <CheckCircle2 size={12} /> Live
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Child performance column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance chart */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-6`}>
            <div className="flex items-center justify-between border-b border-slate-200/5 pb-2">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <TrendingUp className="text-brand-cyan" size={18} />
                <span>Academic stats & Term progress</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Course Comparison</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickFormatter={(v: string) => v.split(' ')[0]} />
                      <YAxis stroke="#64748b" fontSize={8} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B1122', borderRadius: '8px', border: 'none' }} />
                      <Bar dataKey="Score" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Historical GPA Growth</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                      <YAxis stroke="#64748b" fontSize={8} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B1122', borderRadius: '8px', border: 'none' }} />
                      <Area type="monotone" name="Term Performance" dataKey="Score" stroke="#6366f1" fill="#6366f120" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Details */}
          <div className="space-y-4">
            <h3 className={`text-xs font-black text-slate-400 uppercase tracking-widest pl-1`}>CAPS Curriculum Subjects Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChild.subjects?.map((sub: any, i: number) => (
                <div key={i} className={`p-5 rounded-3xl border space-y-3 transition-colors ${
                  isDarkMode ? 'bg-[#1E293B]/20 hover:bg-[#1E293B]/40 border-white/5' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{sub.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Assessed SBA Portfolio</p>
                    </div>
                    <span className={`text-base font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                      sub.mark >= 75 ? 'text-emerald-400 bg-emerald-500/10' :
                      sub.mark >= 50 ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {sub.mark}%
                    </span>
                  </div>

                  {/* SBA Assessments list */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/5">
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Formative Assessments portfolio</p>
                    {sub.assessments && sub.assessments.length > 0 ? (
                      sub.assessments.map((a: any, j: number) => (
                        <div key={j} className="flex justify-between items-center text-xs text-slate-400">
                          <span className="truncate max-w-[150px]">{a.title}</span>
                          <span className={`font-mono text-[11px] font-bold ${a.score >= 70 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {a.score}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No formal SBA logs completed.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notices and Alerts panel */}
        <div className="space-y-8 animate-fadeIn">
          {/* Narrative Summary reports */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/5">
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <ClipboardList className="text-brand-cyan" size={18} />
                <span>Narrative Progress Digest</span>
              </h3>
            </div>
            
            <div className="flex gap-2">
              {(['weekly', 'monthly', 'term'] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setReportCycle(cycle)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    reportCycle === cycle
                    ? 'bg-brand-cyan text-slate-950 border-brand-cyan'
                    : (isDarkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-600')
                  }`}
                >
                  {cycle}
                </button>
              ))}
            </div>

            {(() => {
              const report = getDynamicNarrative(activeChild, reportCycle);
              return (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase text-indigo-400 font-mono">{report.title}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 uppercase tracking-widest">{report.perfLevel}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {report.body}
                  </p>
                  <div className={`p-3 rounded-2xl space-y-1 ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Key Strength Areas</div>
                    <p className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{report.strengths}</p>
                  </div>
                  <div className={`p-3 rounded-2xl space-y-1 ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Weakness Diagnostics</div>
                    <p className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{report.weaknesses}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Motivation Note - Two-Way Interactive Link */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-4`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <Sparkles className="text-yellow-400" size={18} />
              <span>Direct Motivation & Guidance Notes</span>
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Write a personalized note or goal here. These motivation notes sync directly onto your child's student dashboard immediately!
            </p>

            <div className="space-y-3">
              <textarea
                value={parentNoteInput}
                onChange={(e) => setParentNoteInput(e.target.value)}
                placeholder="E.g., Wonderful job on your science practical! So proud of you, keep up the fantastic effort Sibusiso! ❤️"
                className={`w-full min-h-[90px] p-4 text-xs rounded-2xl border resize-none focus:outline-none focus:ring-1 focus:ring-brand-cyan ${
                  isDarkMode ? 'bg-slate-900 border-white/10 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />

              {saveMessage && (
                <div className={`text-[11px] text-center font-bold font-sans ${saveMessage.includes('Failed') ? 'text-red-400' : 'text-brand-yellow'}`}>
                  {saveMessage}
                </div>
              )}

              <button
                onClick={handleSaveParentNote}
                disabled={isSavingNote || !parentNoteInput.trim()}
                className="w-full py-3 px-4 rounded-2xl bg-brand-cyan hover:scale-[1.01] active:scale-95 text-slate-950 font-black uppercase text-[11px] tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-cyan/10 border border-brand-cyan/20"
              >
                {isSavingNote ? (
                  <RefreshCw className="animate-spin h-3.5 w-3.5" />
                ) : (
                  <>
                    <span>Send Motivation</span>
                    <Send size={12} className="stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Milestones / Achievements Badge Wall */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-4`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <Trophy className="text-yellow-400" size={18} />
              <span>Earned Badge Milestones</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Math Cadet', desc: 'Secure math mark > 75%', icon: Trophy, active: (activeChild.subjects?.find((s: any) => s.name === 'Mathematics')?.mark || 0) >= 75, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                { title: 'STEM Explorer', desc: 'Secure science mark > 75%', icon: Sparkles, active: (activeChild.subjects?.find((s: any) => s.name === 'Physical Sciences')?.mark || 0) >= 75, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
                { title: 'Language Star', desc: 'Secure EFAL mark > 80%', icon: Star, active: (activeChild.subjects?.find((s: any) => s.name.includes('English'))?.mark || 0) >= 80, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
                { title: 'Streak Cadet', desc: 'Active student classroom sessions', icon: GraduationCap, active: true, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' }
              ].map((badge, j) => (
                <div
                  key={j}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                    badge.active
                    ? `opacity-100 scale-100 ${badge.color}`
                    : 'opacity-40 scale-95 border-dashed border-slate-800 bg-[#111827]/40'
                  }`}
                >
                  <div className={`p-2 rounded-xl mb-1.5`}>
                    <badge.icon size={20} />
                  </div>
                  <h4 className={`text-xs font-black truncate max-w-full ${badge.active ? (isDarkMode ? 'text-white' : 'text-slate-800') : 'text-slate-500'}`}>{badge.title}</h4>
                  <p className="text-[8px] text-slate-500 font-medium leading-none mt-1 mt-0.5">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications / Teacher announcements */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-6`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <MessageSquare className="text-indigo-500" size={18} />
              <span>Teacher Notices</span>
            </h3>

            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className={`p-4 rounded-2xl flex gap-3 ${
                    isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'
                  }`}>
                    <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className={`font-bold text-xs ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>{n.title}</h4>
                      <p className={`text-[11px] mt-1 pr-1 ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-700'}`}>{n.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-4 rounded-2xl flex gap-3 ${
                  isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-[#EBF5FF]'
                }`}>
                  <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-bold text-xs text-indigo-900">Term 3 Parent-Teacher Reviews</h4>
                    <p className="text-[11px] text-indigo-700 mt-1">
                      Schedule 1-on-1 progress reviews utilizing the Teacher Communicator instant messenger tab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignments or Missions */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-6 sm:p-8 rounded-[36px] shadow-sm space-y-6`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <Calendar className="text-rose-500" size={18} />
              <span>Study missions tracking</span>
            </h3>

            <ul className="space-y-4">
              <li className={`flex justify-between text-xs items-center border-b pb-2.5 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <div>
                  <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Algebra Portfolio SBA</span>
                  <span className="text-[10px] text-slate-500">Mathematics Grade {activeChild.grade}</span>
                </div>
                <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">Formative</span>
              </li>

              <li className={`flex justify-between text-xs items-center border-b pb-2.5 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                <div>
                  <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Stoichiometry assessment</span>
                  <span className="text-[10px] text-slate-500">Sciences Grade {activeChild.grade}</span>
                </div>
                <span className="text-[10px] font-black uppercase text-brand-cyan bg-brand-cyan/15 px-2 py-0.5 rounded-md">CAPS</span>
              </li>

              <li className="flex justify-between text-xs items-center">
                <div>
                  <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>English summary drafting</span>
                  <span className="text-[10px] text-slate-500">Language Grade {activeChild.grade}</span>
                </div>
                <span className="text-[10px] font-black uppercase text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md">Assigned</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
