import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, User, Mic, Loader2, Play, Square, History as HistoryIcon, GraduationCap } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { chatWithTutor } from '../services/unifiedAiService';
import { generateSpeech } from '../services/multiAiService';
import Markdown from 'react-markdown';
import Logo from './Logo';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
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
  { value: 'Algenib',  label: 'Algenib (Female)' },
  { value: 'Achernar', label: 'Achernar (Male)' },
  { value: 'Enif',     label: 'Enif (Female)' },
  { value: 'Canopus',  label: 'Canopus (Male)' },
  { value: 'Arcturus', label: 'Arcturus (Male)' },
  { value: 'Procyon',  label: 'Procyon (Male)' },
];

const STORAGE_KEY = 'eduai_chat_history_page';

export default function AITutorPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<number | null>(null);
  const [language, setLanguage] = useState('English');
  const [voice, setVoice] = useState('Algenib');
  const [isRecording, setIsRecording] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
    rec.onerror = () => { setIsRecording(false); };
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
  }, []);

  const handleMicClick = useCallback(() => {
    if (isRecording) { recognitionRef.current?.stop(); }
    else if (recognitionRef.current) {
      try { recognitionRef.current.start(); setIsRecording(true); }
      catch (e) { console.error('Mic error:', e); }
    } else {
      alert('Voice recognition not supported in this browser.');
    }
  }, [isRecording]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg: ChatMessage = { role: 'user', text: userText };

    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // adapt to older API format:
      const chatMessagesForTutor = messages.map(m => ({
        role: m.role, parts: [{ text: m.text }]
      }));
      chatMessagesForTutor.push({ role: 'user', parts: [{ text: userText }] });

      const response = await chatWithTutor(chatMessagesForTutor, 'groq');
      const modelMsg: ChatMessage = { role: 'model', text: response || 'I could not process that.' };
      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error('[AI Tutor] send failed:', error);
      alert('Failed to get response. Please try again.');
    } finally {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 50); // slight delay for visual
    }
  }, [input, messages]);

  const handlePlayAudio = useCallback(async (text: string, index: number) => {
    if (isAudioPlaying === index) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setIsAudioPlaying(null);
      return;
    }

    setIsTtsLoading(index);
    try {
      // First try ElevenLabs / API
      const result = await generateSpeech(text);
      if (audioRef.current) {
        audioRef.current.src = result;
        audioRef.current.onplay = () => setIsAudioPlaying(index);
        audioRef.current.onended = () => setIsAudioPlaying(null);
        void audioRef.current.play();
      }
    } catch (err) {
      console.error('[AI Tutor] TTS failed:', err);
      // Fallback to browser
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsAudioPlaying(null);
      utterance.onstart = () => setIsAudioPlaying(index);
      window.speechSynthesis.speak(utterance);
    } finally {
      setIsTtsLoading(null);
    }
  }, [isAudioPlaying]);

  const handleStopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    window.speechSynthesis.cancel();
    setIsAudioPlaying(null);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full max-w-5xl mx-auto rounded-[3rem] overflow-hidden border border-slate-200 shadow-xl bg-slate-50 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-3xl font-hand tracking-wide flex items-center text-slate-800">
            <div className="bg-brand-cyan/20 p-2 rounded-2xl mr-4"><Logo className="w-8 h-8" /></div>
            AI Tutor
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center">
            <HistoryIcon className="h-3 w-3 mr-1" /> Chats saved locally
          </p>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-black text-slate-400 mb-1">Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="bg-slate-100 border-none outline-none text-slate-700 font-medium py-2 px-4 rounded-xl"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-black text-slate-400 mb-1">Voice</label>
            <select 
              value={voice} 
              onChange={e => setVoice(e.target.value)}
              className="bg-slate-100 border-none outline-none text-slate-700 font-medium py-2 px-4 rounded-xl"
            >
              {VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
            <GraduationCap size={48} className="mb-4 text-brand-cyan opacity-80" />
            <p className="text-center font-medium font-hand text-2xl">Ask me anything about your school subjects! 🚀</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm text-brand-cyan">
                  <Logo className="w-5 h-5" />
                </div>
              )}
              
              <div className={`p-4 max-w-[80%] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-brand-cyan text-navy-dark rounded-3xl rounded-br-md font-medium' 
                  : 'bg-white border border-slate-200 rounded-3xl rounded-bl-md text-slate-700'
              }`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
              
              {msg.role === 'model' && (
                <button
                  className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                    isAudioPlaying === i ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                  }`}
                  onClick={() => handlePlayAudio(msg.text, i)}
                  disabled={isTtsLoading === i}
                >
                  {isTtsLoading === i ? <Loader2 className="w-4 h-4 animate-spin" /> : isAudioPlaying === i ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                </button>
              )}
              
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 text-slate-500 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm text-brand-cyan animate-pulse">
               <Sparkles className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-md px-6 py-5 flex items-center gap-1.5 shadow-sm">
               <span className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-6 bg-white border-t border-slate-200 shrink-0">
        <div className="relative flex items-center gap-3 max-w-4xl mx-auto">
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder={isRecording ? "Listening..." : "Type your question here..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isLoading && handleSend()}
              className="w-full pl-6 pr-14 h-14 rounded-full border-2 border-slate-200 focus:border-brand-cyan focus:outline-none bg-slate-50 transition-all font-medium text-slate-700"
              disabled={isLoading}
            />
            <button
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
              onClick={handleMicClick}
              disabled={isLoading}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()} 
            className="w-14 h-14 rounded-full bg-navy-dark text-white shadow-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-navy-dark transition-all"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          {isAudioPlaying !== null && (
            <button 
               onClick={handleStopAudio} 
               className="w-14 h-14 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:bg-red-600 transition-all ml-1 shrink-0"
            >
              <Square className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
