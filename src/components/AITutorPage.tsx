import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, User, Mic, Loader2, Play, Square, History as HistoryIcon, GraduationCap, Pause, Image as ImageIcon } from 'lucide-react';
import { chatWithTutor } from '../services/unifiedAiService';
import { marked } from 'marked';
import { useAi } from '../contexts/AiContext';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../services/ttsService';
import Logo from './Logo';
import AiImage from './AiImage';

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
  { value: 'Algenib',  label: 'Algenib (Female)' },
  { value: 'Achernar', label: 'Achernar (Male)' },
  { value: 'Enif',     label: 'Enif (Female)' },
  { value: 'Canopus',  label: 'Canopus (Male)' },
  { value: 'Arcturus', label: 'Arcturus (Male)' },
  { value: 'Procyon',  label: 'Procyon (Male)' },
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
  const [voice, setVoice] = useState('Algenib');
  const [isRecording, setIsRecording] = useState(false);
  const [visuals, setVisuals] = useState<Record<number, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await speakText(text, ttsProvider, language);
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

    try {
      const chatMessagesForTutor = messages.map(m => {
        const parts: any[] = [{ text: m.text }];
        if (m.image) {
          const match = m.image.match(/^data:(image\/[a-z]+);base64,(.*)$/);
          if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
        return { role: m.role, parts };
      });
      
      const promptText = `[Instruct: Reply exclusively in ${language}] ` + (priorityTopic !== 'General' 
        ? `[Priority Topic: ${priorityTopic}] ${userText}`
        : userText);
      
      const newParts: any[] = [{ text: promptText }];
      if (selectedImage) {
        const match = selectedImage.match(/^data:(image\/[a-z]+);base64,(.*)$/);
        if (match) newParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
      chatMessagesForTutor.push({ role: 'user', parts: newParts });

      const response = await chatWithTutor(chatMessagesForTutor, provider);
      const modelMsg: ChatMessage = { role: 'model', text: response || 'I could not process that.' };
      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error('[AI Tutor] send failed:', error);
      alert('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, provider, priorityTopic, language, selectedImage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => { 
      const transcript = e.results[0][0].transcript;
      setInput(transcript); 
      setIsRecording(false); 
      handleSend(transcript);
    };
    rec.onerror = () => { setIsRecording(false); };
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
  }, [handleSend]);

  const handleMicClick = useCallback(() => {
    if (isRecording) { recognitionRef.current?.stop(); }
    else if (recognitionRef.current) {
      try { recognitionRef.current.start(); setIsRecording(true); }
      catch (e) { console.error('Mic error:', e); }
    } else {
      alert('Voice recognition not supported in this browser.');
    }
  }, [isRecording]);

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
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-140px)] w-full max-w-5xl mx-auto rounded-none lg:rounded-[3rem] overflow-hidden border-0 lg:border border-slate-200 shadow-none lg:shadow-xl bg-slate-50 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between sm:block">
          <h1 className="text-2xl lg:text-3xl font-hand tracking-wide flex items-center text-slate-800">
            <div className="mr-2 lg:mr-4"><Logo className="w-6 h-6 lg:w-8 lg:h-8" /></div>
            AI Tutor
          </h1>
          <p className="hidden sm:flex text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 items-center">
            <HistoryIcon className="h-3 w-3 mr-1" /> Chats saved locally
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-4 mt-2 sm:mt-0 justify-end">
          <div className="flex flex-col flex-1 sm:flex-none">
            <label className="text-[9px] lg:text-[10px] uppercase font-black text-slate-400 mb-0.5 lg:mb-1">Priority Topic</label>
            <select 
              value={['General', 'Mathematics', 'Physical Sciences', 'Life Sciences', 'History', 'Geography', 'Languages'].includes(priorityTopic) ? priorityTopic : 'Other'} 
              onChange={e => {
                if (e.target.value === 'Other') setPriorityTopic('');
                else setPriorityTopic(e.target.value);
              }}
              className="bg-slate-100 border-none outline-none text-slate-700 text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto [&>option]:bg-slate-800 [&>option]:text-white mb-2"
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
                className="bg-slate-100 border-none outline-none text-slate-700 text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto placeholder:text-slate-400"
                autoFocus
              />
            )}
          </div>
          <div className="flex flex-col flex-1 sm:flex-none">
            <label className="text-[9px] lg:text-[10px] uppercase font-black text-slate-400 mb-0.5 lg:mb-1">Language</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="bg-slate-100 border-none outline-none text-slate-700 text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto [&>option]:bg-slate-800 [&>option]:text-white"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col flex-1 sm:flex-none">
            <label className="text-[9px] lg:text-[10px] uppercase font-black text-slate-400 mb-0.5 lg:mb-1">Voice</label>
            <select 
              value={voice} 
              onChange={e => setVoice(e.target.value)}
              className="bg-slate-100 border-none outline-none text-slate-700 text-xs lg:text-sm font-medium py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg lg:rounded-xl w-full sm:w-auto [&>option]:bg-slate-800 [&>option]:text-white"
            >
              {VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 px-6">
            <GraduationCap size={40} className="mb-4 text-brand-cyan opacity-80" />
            <p className="text-center font-medium font-hand text-xl lg:text-2xl">Ask me anything about your school subjects, or upload a picture to learn about it! 🚀</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 lg:gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 lg:w-10 lg:h-10 flex flex-col items-center justify-center shrink-0">
                  <Logo className="w-full h-full object-contain drop-shadow-sm" />
                </div>
              )}
              
              <div className={`p-3 lg:p-4 max-w-[85%] lg:max-w-[80%] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-brand-cyan text-navy-dark rounded-2xl lg:rounded-3xl rounded-br-md font-medium' 
                  : 'bg-white border border-slate-200 rounded-2xl lg:rounded-3xl rounded-bl-md text-slate-700'
              }`}>
                {msg.role === 'model' ? (
                  <div className="flex flex-col gap-4">
                    <div className="prose prose-xs lg:prose-sm max-w-none prose-p:leading-relaxed markdown-body"
                      dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }}
                    />
                    {visuals[i] && (
                      <div className="pt-2 border-t border-slate-100">
                        <AiImage prompt={`Educational illustration showing: ${msg.text.substring(0, 300)}`} aspectRatio="video" className="w-full max-w-md" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {msg.image && (
                      <img src={msg.image} alt="Uploaded" className="max-w-[200px] lg:max-w-[250px] rounded-xl object-contain mb-2" />
                    )}
                    <p className="text-sm lg:text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
              </div>
              
              {msg.role === 'model' && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors ${
                      isAudioPlaying === i && !isAudioPaused ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    }`}
                    onClick={() => handlePlayAudio(msg.text, i)}
                    disabled={isTtsLoading === i}
                    title={isAudioPlaying === i && !isAudioPaused ? "Pause" : "Play"}
                  >
                    {isTtsLoading === i ? <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" /> : isAudioPlaying === i && !isAudioPaused ? <Pause className="w-3 h-3 lg:w-4 lg:h-4" /> : <Play className="w-3 h-3 lg:w-4 lg:h-4 ml-0.5 lg:ml-1" />}
                  </button>
                  {isAudioPlaying === i && (
                    <button
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors bg-red-100 text-red-600 hover:bg-red-200"
                      onClick={handleStopAudio}
                      title="Stop"
                    >
                      <Square className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>
                  )}
                  <button
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-colors ${
                      visuals[i] ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    }`}
                    onClick={() => setVisuals(prev => ({...prev, [i]: !prev[i]}))}
                    title="Generate Visual Aid"
                  >
                    <ImageIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                </div>
              )}
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 text-slate-500 shadow-sm">
                  <User className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm text-brand-cyan animate-pulse">
               <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl lg:rounded-3xl rounded-tl-md px-4 lg:px-6 py-3 lg:py-5 flex items-center gap-1.5 shadow-sm">
               <span className="w-1.5 lg:w-2 h-1.5 lg:h-2 bg-brand-cyan rounded-full animate-bounce"></span>
               <span className="w-1.5 lg:w-2 h-1.5 lg:h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-1.5 lg:w-2 h-1.5 lg:h-2 bg-brand-cyan rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 lg:p-6 bg-white border-t border-slate-200 shrink-0 flex flex-col gap-2">
        {selectedImage && (
          <div className="relative inline-block self-start ml-2 lg:ml-4">
            <img src={selectedImage} alt="Preview" className="h-16 lg:h-20 rounded-lg object-contain border border-slate-200 shadow-sm" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 scale-75"
            >
              <Pause className="w-4 h-4 rotate-45" /> {/* Close icon using rotated Pause/Plus alternatively, or just an X */}
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
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-all shrink-0"
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
              className="w-full pl-5 lg:pl-6 pr-12 lg:pr-14 h-12 lg:h-14 rounded-full border-2 border-slate-200 focus:border-brand-cyan focus:outline-none bg-slate-50 transition-all font-medium text-slate-700 text-sm lg:text-base"
              disabled={isLoading}
            />
            <button
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
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
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-navy-dark text-white shadow-lg flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          {isAudioPlaying !== null && (
            <button 
               onClick={handleStopAudio} 
               className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:bg-red-600 transition-all shrink-0"
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
