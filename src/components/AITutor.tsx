import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Mic, X, Send, Sparkles, User, GraduationCap, Volume2, VolumeX, Brain, Sliders, Check, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithTutor } from '../services/unifiedAiService';
import { generateSpeech } from '../services/multiAiService';
import { useAi } from '../contexts/AiContext';
import Markdown from 'react-markdown';
import Logo from './Logo';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const STORAGE_KEY = 'eduai_chat_history';

export default function AITutor({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { provider } = useAi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useVoiceOutput, setUseVoiceOutput] = useState(true);
  const [useElevenLabs, setUseElevenLabs] = useState(false);
  
  // Voice Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat history on mount
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

  // Save chat history on update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      // Try to find a good South African or English voice by default
      if (!selectedVoiceURI && voices.length > 0) {
        const defaultVoice = voices.find(v => v.lang.includes('en-ZA')) || voices.find(v => v.lang.includes('en-GB')) || voices[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakText = async (text: string) => {
    if (!useVoiceOutput) return;

    if (useElevenLabs) {
      try {
        setIsSpeaking(true);
        const audioUrl = await generateSpeech(text);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.play();
      } catch (err) {
        console.error("ElevenLabs failed, falling back to browser TTS", err);
        browserSpeak(text);
      }
    } else {
      browserSpeak(text);
    }
  };

  const browserSpeak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoiceURI) {
      const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = speechRate;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat logs? This action is irreversible.")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
      setIsSettingsOpen(false);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', parts: [{ text }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const responseText = await chatWithTutor([...messages, userMessage], provider);
      const botMessage: Message = { role: 'model', parts: [{ text: responseText || 'I am sorry, I could not process that.' }] };
      setMessages(prev => [...prev, botMessage]);
      if (responseText) speakText(responseText);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "An unexpected error occurred system-wide.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-32 right-10 w-[420px] max-w-[calc(100vw-2rem)] h-[650px] glass rounded-[42px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col z-[60] overflow-hidden border border-white/10"
    >
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl p-6 border-b border-white/5 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-brand-cyan/20 p-2 rounded-2xl border border-brand-cyan/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]">
            <Logo className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-hand text-xl tracking-wide">Neural Tutor</h3>
            <p className="text-[9px] text-slate-500 flex items-center gap-1.5 uppercase font-black tracking-[0.2em]">
              {isSpeaking ? (
                <><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-ping" /> Connection Active</>
              ) : (
                <><Sparkles size={10} className="text-brand-cyan" /> Groq Llama 3</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-xl transition-all ${isSettingsOpen ? 'bg-brand-cyan text-navy-dark' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Sliders size={18} />
          </button>
          <button 
            onClick={() => setUseVoiceOutput(!useVoiceOutput)}
            className="p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            {useVoiceOutput ? <Volume2 size={18} className="text-brand-cyan" /> : <VolumeX size={18} className="text-slate-600" />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Chat Area & Settings Overlay */}
      <div className="flex-1 relative overflow-hidden bg-navy-dark/40">
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 z-40 bg-navy-dark/95 backdrop-blur-2xl p-8 flex flex-col space-y-8"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-white text-2xl font-hand">System Config</h4>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
                    Neural Rate <span>{speechRate.toFixed(1)}x</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1" 
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-brand-cyan h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Voice Selection</label>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide py-2">
                    {availableVoices.map((voice) => (
                      <button
                        key={voice.voiceURI}
                        onClick={() => setSelectedVoiceURI(voice.voiceURI)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                          selectedVoiceURI === voice.voiceURI 
                          ? 'bg-brand-cyan/20 border-brand-cyan/30 text-white' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold truncate leading-tight">{voice.name}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{voice.lang}</p>
                        </div>
                        {selectedVoiceURI === voice.voiceURI && <Check size={14} className="text-brand-cyan shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-brand-yellow" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">ElevenLabs (HD)</span>
                  </div>
                  <button 
                    onClick={() => setUseElevenLabs(!useElevenLabs)}
                    className={`w-10 h-5 rounded-full transition-all relative flex items-center px-1 ${useElevenLabs ? 'bg-brand-cyan' : 'bg-slate-700'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${useElevenLabs ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <button 
                  onClick={clearHistory}
                  className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Clear Data Stream
                </button>
                <button 
                  onClick={() => speakText("Voice calibration successful.")}
                  className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Volume2 size={16} /> Test Sync
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} className="h-full overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="relative">
               <div className="absolute inset-0 bg-brand-cyan/20 blur-[30px] rounded-full animate-pulse"></div>
               <Logo />
            </div>
            <div>
              <h4 className="text-3xl text-white">Hello Teacher.</h4>
              <p className="text-sm text-slate-500 max-w-[240px] mt-2 font-medium leading-relaxed">How can we assist with the Grade 10 Mathematics curriculum today?</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {["Maths Gr 10 help", "Logistics Plan", "Quiz Ideas"].map((tip, i) => (
                <button 
                  key={`tip-${i}`} 
                  onClick={() => handleSend(tip)}
                  className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl hover:border-brand-cyan hover:text-white transition-all text-slate-400 backdrop-blur-md"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={`msg-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
                msg.role === 'user' 
                ? 'bg-brand-cyan border-cyan-400 text-navy-dark shadow-lg shadow-cyan-500/20' 
                : 'bg-white/5 border-white/10 text-slate-400'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <GraduationCap size={16} />}
              </div>
              <div className={`p-4 rounded-3xl text-[14px] leading-relaxed shadow-xl ${
                msg.role === 'user' 
                ? 'bg-brand-cyan text-navy-dark rounded-tr-none font-medium' 
                : 'glass text-slate-200 rounded-tl-none'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{msg.parts[0].text}</Markdown>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 animate-pulse">
                <Sparkles size={16} />
              </div>
              <div className="glass p-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 pt-0 bg-transparent shrink-0">
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-3 text-red-400 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-white/5 rounded-lg">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-2xl p-2 rounded-[28px] border border-white/10 focus-within:border-brand-cyan transition-all shadow-2xl">
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:text-white'}`}
          >
            <Mic size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Neural query..."}
            className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-white placeholder:text-slate-600 font-medium"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-2xl transition-all ${input.trim() && !isLoading ? 'bg-brand-cyan text-navy-dark shadow-lg shadow-cyan-500/20' : 'text-slate-700 bg-white/5'}`}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[9px] text-center text-slate-700 font-black uppercase tracking-[0.4em] mt-4">EduAI Intelligence Console</p>
      </div>
    </motion.div>
  );
}
