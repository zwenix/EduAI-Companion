import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  MessageSquare, 
  Image as ImageIcon, 
  Volume2, 
  Video, 
  Loader2, 
  Download, 
  Sparkles, 
  Cpu, 
  AlertCircle, 
  Play, 
  Square, 
  HelpCircle, 
  Globe, 
  RefreshCw, 
  Copy, 
  Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAi } from '../contexts/AiContext';

// Standard Hugging Face model cards for our playground
const TEXT_MODELS = [
  { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct', desc: 'Powerful multilingual reasoning and chat model, ideal for structured curricula and lesson plans.', category: 'Text/Chat' },
  { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', desc: 'Specialized coding assistant model, perfect for Grade 10-12 IT and computer literacy exercises.', category: 'Coding' },
  { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'LLaMA 3.3 70B Instruct', desc: 'State-of-the-art open-weights model by Meta. Incredible dialogue capability and versatility.', category: 'General Reasoning' }
];

const IMAGE_MODELS = [
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell', desc: 'Ultra-fast, state-of-the-art text-to-image generator with gorgeous typography rendering.', category: 'Elite Speed' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL 1.0', desc: 'Industry benchmark for rich digital painting aesthetic, children\'s illustrations, and posters.', category: 'Detailed Painting' }
];

const TTS_MODELS = [
  { id: 'facebook/mms-tts-eng', name: 'Hugging Face MMS (English)', langCode: 'en', langLabel: 'English' },
  { id: 'facebook/mms-tts-zul', name: 'Hugging Face MMS (isiZulu)', langCode: 'zu', langLabel: 'isiZulu' },
  { id: 'facebook/mms-tts-xho', name: 'Hugging Face MMS (isiXhosa)', langCode: 'xh', langLabel: 'isiXhosa' },
  { id: 'facebook/mms-tts-afr', name: 'Hugging Face MMS (Afrikaans)', langCode: 'af', langLabel: 'Afrikaans' },
  { id: 'facebook/mms-tts-sot', name: 'Hugging Face MMS (Sesotho)', langCode: 'st', langLabel: 'Sesotho' },
  { id: 'facebook/mms-tts-spa', name: 'Hugging Face MMS (Spanish)', langCode: 'es', langLabel: 'Spanish' },
  { id: 'facebook/mms-tts-fra', name: 'Hugging Face MMS (French)', langCode: 'fr', langLabel: 'French' },
  { id: 'facebook/mms-tts-deu', name: 'Hugging Face MMS (German)', langCode: 'de', langLabel: 'German' },
  { id: 'espnet/kan-bayashi_ljspeech_vits', name: 'LJSpeech VITS (High Quality English)', langCode: 'en', langLabel: 'English (Clear Voice)' }
];

const VIDEO_MODELS = [
  { id: 'damo-vilab/text-to-video-ms-1.7b', name: 'Damo-Vilab Text-to-Video', desc: 'Multimodal synthetic video physics engine. Generates mini looping clips.', category: 'Physics Loop' }
];

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function HFPlayground() {
  const { provider } = useAi();
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'tts' | 'video'>('text');

  // --- 1. Text Chat States ---
  const [chatModel, setChatModel] = useState(TEXT_MODELS[0].id);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- 2. Image States ---
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [imagePrompt, setImagePrompt] = useState('An educational sketch of a shiny copper electrical wire showing atoms flowing inside, digital art style, kids textbook aesthetic.');
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // --- 3. TTS States ---
  const [ttsModel, setTtsModel] = useState(TTS_MODELS[0].id);
  const [ttsText, setTtsText] = useState('Welcome to the EduAI Companion Hugging Face Synthesis Suite! Choose a different language below.');
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- 4. Video States ---
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
  const [videoPrompt, setVideoPrompt] = useState('A cute animated robot teacher teaching kids math on a chalkboard, 3D render');
  const [generatedVid, setGeneratedVid] = useState<string | null>(null);
  const [isVidLoading, setIsVidLoading] = useState(false);
  const [vidError, setVidError] = useState<string | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle Text Synthesis Call
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userPrompt = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setIsChatLoading(true);

    try {
      const messagesToSend = [...chatMessages, { role: 'user', content: userPrompt }].map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const res = await fetch(`/api/ai/hf-qwen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messagesToSend,
          model: chatModel
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to call text model ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || 'No output received.';
      setChatMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Error during Hugging Face query: ${err.message || 'Verification of server response failed.'}\nPlease verify that HUGGINGFACE_API_KEY is configured in your Secrets.`
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Image Synthesis Call
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isImgLoading) return;
    setIsImgLoading(true);
    setImgError(null);
    setGeneratedImg(null);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          provider: 'huggingface',
          model: imageModel
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned image generation error ${res.status}`);
      }

      const data = await res.json();
      if (data.url) {
        setGeneratedImg(data.url);
      } else {
        throw new Error('Image URL was not returned.');
      }
    } catch (err: any) {
      console.error(err);
      setImgError(err.message || 'Error occurred while communicating with Hugging Face FLUX Space.');
    } finally {
      setIsImgLoading(false);
    }
  };

  // Handle TTS Synthesis Call
  const handleGenerateTTS = async () => {
    if (!ttsText.trim() || isTtsLoading) return;
    setIsTtsLoading(true);
    setTtsAudioUrl(null);
    setTtsPlaying(false);

    try {
      const res = await fetch('/api/tts/hf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText.trim(),
          model: ttsModel
        })
      });

      if (!res.ok) {
        throw new Error(`TTS generation returned error status code ${res.status}`);
      }

      const data = await res.json();
      if (data.audio) {
        setTtsAudioUrl(data.audio);
      } else {
        throw new Error(data.error || 'Speech output was not generated successfully.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`TTS Error: ${err.message || 'Failed to synthesize speech.'}`);
    } finally {
      setIsTtsLoading(false);
    }
  };

  // Handle Video Synthesis Call
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isVidLoading) return;
    setIsVidLoading(true);
    setVidError(null);
    setGeneratedVid(null);

    try {
      const res = await fetch('/api/video/hf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          model: videoModel
        })
      });

      if (!res.ok) {
        throw new Error(`Video generation returned error status code ${res.status}`);
      }

      const data = await res.json();
      if (data.video) {
        setGeneratedVid(data.video);
      } else {
        throw new Error('Video path/binary output was not resolved successfully.');
      }
    } catch (err: any) {
      console.error(err);
      setVidError(err.message || 'Error occurred while contacting Hugging Face Video space.');
    } finally {
      setIsVidLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg border border-indigo-200/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-white/10 uppercase mb-3">
              <Cpu className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              Hugging Face API Integration
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Hugging Face AI Playground
            </h1>
            <p className="mt-2 text-indigo-100 max-w-2xl text-sm leading-relaxed">
              Explore state-of-the-art open-weights model architectures directly. Synthesize conversational intelligence, speech across official South African languages, art, and loop animations in one classroom studio hub.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-indigo-700/50 backdrop-blur-md border border-indigo-400/20 py-2 px-4 rounded-xl text-indigo-100 font-mono">
              Base: @huggingface/inference v4
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Selection Rail */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/55 max-w-fit">
        <button 
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'text' 
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Brain className="w-4 h-4 text-indigo-500" />
          Text LLMs Chat
        </button>
        <button 
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'image' 
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-emerald-500" />
          Illustration Studio
        </button>
        <button 
          onClick={() => setActiveTab('tts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'tts' 
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Volume2 className="w-4 h-4 text-amber-500" />
          Vocal MMS Synthesis
        </button>
        <button 
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            activeTab === 'video' 
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Video className="w-4 h-4 text-rose-500" />
          Explanation Video
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          
          {/* ======================= TABS 1: TEXT CHAT ======================= */}
          {activeTab === 'text' && (
            <>
              {/* Settings Panel Grid-1 */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    Model Configurations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select open-source model weights hosted on Hugging Face Serverless API.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Target Model ID
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {TEXT_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setChatModel(m.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-150 relative ${
                          chatModel === m.id 
                            ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' 
                            : 'border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono">
                            {m.category}
                          </span>
                          {chatModel === m.id && (
                            <motion.div layoutId="text-active-dot" className="w-2 h-2 rounded-full bg-indigo-500" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
                          {m.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-normal">
                          {m.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-xs leading-relaxed space-y-2 text-slate-500 dark:text-slate-400">
                  <div className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    Serverless API Guidelines
                  </div>
                  <p>
                    These endpoints support high-fidelity instruction-following. Response and load speed depend entirely on Hugging Face cold starts, but represent massive savings!
                  </p>
                </div>
              </div>

              {/* Chat View Grid-2 */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm flex flex-col h-[580px] overflow-hidden">
                {/* Chat Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono bg-slate-200/60 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-bold">
                      {chatModel}
                    </span>
                  </div>
                  <button 
                    onClick={() => setChatMessages([])}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1.5 transition-colors duration-150"
                  >
                    Clear History
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div className="max-w-xs text-slate-400 dark:text-slate-500">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Start a chat session</h4>
                        <p className="text-xs mt-1 leading-normal">
                          Ask lesson outline ideas, South African CAPS syllabus guidelines or coding help.
                        </p>
                      </div>

                      {/* Prompt Starters */}
                      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                        <button 
                          onClick={() => setChatInput("Explain Ohm's Law and direct current flows for grade 9 students with beautiful examples.")}
                          className="text-left px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-900 hover:bg-slate-50 cursor-pointer"
                        >
                          ⚡ "Explain Ohm's Law for Grade 9s"
                        </button>
                        <button 
                          onClick={() => setChatInput("Make a 5-question multiple choice test on metal extraction methods in South Africa.")}
                          className="text-left px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-900 hover:bg-slate-50 cursor-pointer"
                        >
                          ⛏️ "Metal MCQ quiz for South African geology"
                        </button>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-500'
                        }`}>
                          <Brain className="w-4 h-4" />
                        </div>
                        <div className={`rounded-2xl p-4 text-sm leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white font-medium shadow-sm rounded-tr-none' 
                            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/30 text-slate-700 dark:text-slate-200 rounded-tl-none relative group'
                        }`}>
                          {msg.content}

                          {msg.role === 'assistant' && (
                            <button
                              onClick={() => copyToClipboard(msg.content, i)}
                              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-700 p-1 rounded border border-slate-200 dark:border-slate-600"
                              title="Copy response"
                            >
                              {copiedIndex === i ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {isChatLoading && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-500 animate-spin">
                        <Loader2 className="w-4 h-4" />
                      </div>
                      <div className="rounded-2xl p-4 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200/30 text-slate-500 font-medium rounded-tl-none italic flex items-center gap-2">
                        <span>Thinking and generating response on serverless instance...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-55/40 dark:bg-slate-800/10">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                    className="flex gap-3"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your educational challenge prompt or query..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ======================= TABS 2: ILLUSTRATION STUDIO ======================= */}
          {activeTab === 'image' && (
            <>
              {/* Image config panel */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    Illustration Engine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Harness high-quality text-to-image models to build graphic support assets for students.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Target Diffusion ID
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {IMAGE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setImageModel(m.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-150 relative ${
                          imageModel === m.id 
                            ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20' 
                            : 'border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono">
                            {m.category}
                          </span>
                          {imageModel === m.id && (
                            <motion.div layoutId="image-active-dot" className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
                          {m.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-normal">
                          {m.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Prompt Input Box
                  </label>
                  <textarea
                    rows={4}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-normal"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isImgLoading || !imagePrompt.trim()}
                  className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isImgLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Canvas...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Render Illustration</span>
                    </>
                  )}
                </button>
              </div>

              {/* Image result card */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center h-[580px] text-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isImgLoading ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 z-10"
                    >
                      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
                      <div className="max-w-xs mx-auto">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Rendering Digital Art</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                          Hugging Face is computing model weights. This typically takes 5–15 seconds depending on queuing load.
                        </p>
                      </div>
                    </motion.div>
                  ) : generatedImg ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full h-full flex flex-col items-center justify-between"
                    >
                      <div className="flex-1 w-full max-w-md max-h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 relative flex items-center justify-center">
                        <img 
                          src={generatedImg} 
                          alt="Hugging Face Synthetic Output" 
                          className="object-contain w-full h-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="mt-4 flex gap-3">
                        <a 
                          href={generatedImg} 
                          download="eduai-illustration.jpg"
                          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Base64 / File
                        </a>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 mx-auto">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <div className="max-w-sm">
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-300">No generated artwork detected</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                          Define an educational illustration or concept artwork inside the left prompt box, choose your target Diffusion pipeline and fire up the engine!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {imgError && (
                  <div className="absolute bottom-4 left-4 right-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs px-4 py-3 rounded-2xl border border-rose-100 dark:border-rose-900/40 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-left leading-normal">{imgError}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======================= TABS 3: MMS SPEECH PRODUCTION ======================= */}
          {activeTab === 'tts' && (
            <>
              {/* Configuration */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-amber-500" />
                    Vocal MMS Studio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Convert instructional paragraphs into natural speech using highly specialized Massive Multilingual Speech synthesis.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Target Language & Voice Model
                  </label>
                  <select 
                    value={ttsModel}
                    onChange={(e) => {
                      setTtsModel(e.target.value);
                      const modelObj = TTS_MODELS.find(m => m.id === e.target.value);
                      if (modelObj?.langCode === 'en') {
                        setTtsText('Welcome to the EduAI Companion Hugging Face Synthesis Suite! Choose a different language below.');
                      } else if (modelObj?.langCode === 'zu') {
                        setTtsText('Siyakwamukela ku-EduAI Companion! Leli yiphimbo lesiZulu elicacile nelikhulayo.');
                      } else if (modelObj?.langCode === 'xh') {
                        setTtsText('Wamkelekile kwi-EduAI Companion! Eli lilizwi lesiXhosa elicacileyo nonokuphulaphula.');
                      } else if (modelObj?.langCode === 'af') {
                        setTtsText('Welkom by die EduAI Companion! Dit is n duidelike Afrikaanse teks na spraak stem.');
                      } else if (modelObj?.langCode === 'st') {
                        setTtsText('Re amohela ho EduAI Companion! Lona ke lentsoe la Sesotho le hlakileng.');
                      }
                    }}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    {TTS_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Input Text to Synthesize
                  </label>
                  <textarea
                    rows={4}
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-normal"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateTTS}
                  disabled={isTtsLoading || !ttsText.trim()}
                  className="w-full p-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isTtsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Voice...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Generate Vocals</span>
                    </>
                  )}
                </button>
              </div>

              {/* Player */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center h-[580px] text-center">
                <AnimatePresence mode="wait">
                  {isTtsLoading ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                      <div className="max-w-xs mx-auto">
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-300">Synthesizing Audio File</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                          Hugging Face massive speech pipelines are running voice rendering. Splitting paragraphs into sequential sub-blocks.
                        </p>
                      </div>
                    </motion.div>
                  ) : ttsAudioUrl ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md animate-bounce">
                        <Volume2 className="w-8 h-8" />
                      </div>
                      
                      <div className="max-w-sm">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200">Vocals synthesized successfully!</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-mono bg-slate-55 dark:bg-slate-800/80 px-4 py-2 rounded-xl">
                          Model weights: {ttsModel}
                        </p>
                      </div>

                      <div className="mx-auto max-w-sm border border-slate-105 rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 shadow-sm flex items-center gap-4">
                        <audio 
                          ref={audioRef}
                          src={ttsAudioUrl} 
                          controls
                          className="w-full shrink-0 h-10"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-amber-55 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 mx-auto">
                        <Volume2 className="w-8 h-8" />
                      </div>
                      <div className="max-w-sm">
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-300">Produce MMS Voiceover</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                          Synthesize custom teacher/student narration cards into Zulu, Afrikaans or English MMS speech to make study notes highly accessibility-friendly.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* ======================= TABS 4: VIDEO MAKER ======================= */}
          {activeTab === 'video' && (
            <>
              {/* Settings Panel Grid-1 */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Video className="w-5 h-5 text-rose-500" />
                    Video Generation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Create synthetic visual explanations with highly specialized text-to-video diffusion.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Target Model Architecture
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {VIDEO_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setVideoModel(m.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-150 relative ${
                          videoModel === m.id 
                            ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/20' 
                            : 'border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-mono">
                            {m.category}
                          </span>
                          {videoModel === m.id && (
                            <motion.div layoutId="video-active-dot" className="w-2 h-2 rounded-full bg-rose-500" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
                          {m.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-normal">
                          {m.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Video Scenario Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-normal"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isVidLoading || !videoPrompt.trim()}
                  className="w-full p-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isVidLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering Loop...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 text-white" />
                      <span>Synthesize 3s Video</span>
                    </>
                  )}
                </button>
              </div>

              {/* Video result card */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center h-[580px] text-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isVidLoading ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 z-10"
                    >
                      <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto" />
                      <div className="max-w-xs mx-auto">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Rendering Video Frames</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                          Hugging Face synthetic video pipelines are generating a sequence of 3D frame outputs.
                        </p>
                      </div>
                    </motion.div>
                  ) : generatedVid ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full h-full flex flex-col items-center justify-between"
                    >
                      <div className="flex-1 w-full max-w-md max-h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 relative flex items-center justify-center">
                        <video 
                          src={generatedVid} 
                          controls
                          autoPlay
                          loop
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="mt-4 flex gap-3">
                        <a 
                          href={generatedVid} 
                          download="eduai-loop.mp4"
                          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download MP4 / File
                        </a>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 mx-auto">
                        <Video className="w-8 h-8" />
                      </div>
                      <div className="max-w-sm">
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-300">No generated video detected</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                          Define an educational physics model animation loop or classroom visual explanation, choose the target Video weights and launch!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {vidError && (
                  <div className="absolute bottom-4 left-4 right-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs px-4 py-3 rounded-2xl border border-rose-100 dark:border-rose-900/40 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-left leading-normal">{vidError}</span>
                  </div>
                )}
              </div>
            </>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
