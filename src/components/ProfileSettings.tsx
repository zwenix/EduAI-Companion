import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Sparkles, User, Check, Loader2, Save, 
  RefreshCw, Trash2, Video, AlertCircle, Mail, Phone, Upload, X 
} from 'lucide-react';

interface ProfileSettingsProps {
  fullName: string;
  setFullName: (val: string) => void;
  photoUrl: string;
  setPhotoUrl: (val: string) => void;
  gradeLevel: string;
  setGradeLevel: (val: string) => void;
  school: string;
  setSchool: (val: string) => void;
  jobTitle: string;
  setJobTitle: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  profileEmail: string;
  setProfileEmail: (val: string) => void;
  userRole: string;
  isDarkMode: boolean;
  onSave: () => Promise<void>;
}

export default function ProfileSettings({
  fullName,
  setFullName,
  photoUrl,
  setPhotoUrl,
  gradeLevel,
  setGradeLevel,
  school,
  setSchool,
  jobTitle,
  setJobTitle,
  phone,
  setPhone,
  profileEmail,
  setProfileEmail,
  userRole,
  isDarkMode,
  onSave
}: ProfileSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Preset prompts for quick generation
  const avatarPresets = [
    { label: "Cute 3D Learner", prompt: "A minimalist 3D claymation avatar of a happy smiling school student wearing educational headphones, vibrant pastel background, clean studio lighting, high resolution" },
    { label: "Futuristic Astronaut", prompt: "A 3D render avatar of a friendly cute astronaut holding a stack of books, educational space background, neon accents, high detail" },
    { label: "Tech Educator", prompt: "A vector flat illustration avatar of a passionate modern teacher in front of an educational whiteboard, friendly face, clean digital art" },
    { label: "Pixel Art Hero", prompt: "An 8-bit retro pixel-art avatar of a wise smiling academy wizard holding a digital scroll, high contrast" }
  ];

  // Stop camera tracks on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser or sandbox environment does not support camera capture APIs.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 400, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Video play failed:", err);
        });
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      let message = err.message || String(err);
      if (err.name === 'NotAllowedError') {
        message = "Camera permissions were denied. If you are viewing the app in the AI Studio iframe preview, please click 'Open in New Tab' to grant camera access!";
      }
      setCameraError(message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If mirrored, flip context horizontally
          if (isMirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          setPhotoUrl(dataUrl);
          stopCamera();
        }
      } catch (err: any) {
        console.error("Failed to capture snapshot:", err);
        setCameraError("Failed to freeze and capture snapshot: " + err.message);
      }
    }
  };

  const generateAIAvatar = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) {
      setGenError("Please provide an avatar description prompt or choose a preset.");
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    setGeneratedPreviewUrl(null);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToUse,
          provider: 'gemini-imagen'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        setGeneratedPreviewUrl(data.url);
      } else {
        throw new Error("No image data received from generator service.");
      }
    } catch (err: any) {
      console.error("AI Avatar Generation failed:", err);
      setGenError(err.message || String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedAvatar = () => {
    if (generatedPreviewUrl) {
      setPhotoUrl(generatedPreviewUrl);
      setGeneratedPreviewUrl(null);
      setAiPrompt('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await onSave();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err) {
      console.error("Profile save error:", err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const clearPhoto = () => {
    if (confirm("Are you sure you want to remove your profile photo?")) {
      setPhotoUrl('');
    }
  };

  // Human-friendly Academic Levels matching South African CAPS structure
  const academicLevels = [
    { value: "Grade R", label: "Grade R (Foundation Phase)" },
    { value: "Grade 1", label: "Grade 1 (Foundation Phase)" },
    { value: "Grade 2", label: "Grade 2 (Foundation Phase)" },
    { value: "Grade 3", label: "Grade 3 (Foundation Phase)" },
    { value: "Grade 4", label: "Grade 4 (Intermediate Phase)" },
    { value: "Grade 5", label: "Grade 5 (Intermediate Phase)" },
    { value: "Grade 6", label: "Grade 6 (Intermediate Phase)" },
    { value: "Grade 7", label: "Grade 7 (Senior Phase)" },
    { value: "Grade 8", label: "Grade 8 (Senior Phase)" },
    { value: "Grade 9", label: "Grade 9 (Senior Phase)" },
    { value: "Grade 10", label: "Grade 10 (FET Phase)" },
    { value: "Grade 11", label: "Grade 11 (FET Phase)" },
    { value: "Grade 12", label: "Grade 12 (FET Phase)" },
    { value: "Tertiary", label: "University / Tertiary Level" },
    { value: "Educator", label: "Professional Educator / Admin" }
  ];

  return (
    <div className={`rounded-[48px] p-8 lg:p-12 space-y-10 ${isDarkMode ? 'glass border border-white/5' : 'bg-white border border-slate-200 shadow-sm'}`}>
      
      {/* Photo Studio Area */}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="relative group self-center md:self-auto">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-brand-cyan/30 shadow-xl transition-transform hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-brand-cyan/10 flex items-center justify-center text-5xl text-brand-cyan font-hand border-4 border-brand-cyan/20 shadow-inner">
              {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          {photoUrl && (
            <button 
              onClick={clearPhoto}
              title="Remove profile image"
              className="absolute -top-1 -right-1 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h3 className={`text-2xl font-black font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {fullName || 'EduAI Explorer'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm shadow-amber-500/20">
              <Check size={10} strokeWidth={4} /> Verified Pro
            </span>
          </div>
          <p className="text-sm text-slate-500">Capture a picture with your device camera or let our advanced AI build a stunning custom avatar for you.</p>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
            {!isCameraActive ? (
              <button 
                onClick={startCamera}
                className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <Camera size={14} /> Use Live Camera
              </button>
            ) : (
              <button 
                onClick={stopCamera}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <X size={14} /> Close Camera
              </button>
            )}
            
            <button 
              onClick={() => {
                const manualUrl = prompt("Enter an image URL:");
                if (manualUrl) setPhotoUrl(manualUrl);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Upload size={14} /> Upload URL
            </button>
          </div>
        </div>
      </div>

      {/* Camera Live Feed Panel */}
      {isCameraActive && (
        <div className={`p-6 rounded-3xl border border-dashed transition-all ${isDarkMode ? 'bg-white/5 border-brand-cyan/20' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-brand-cyan' : 'text-brand-cyan/80'}`}>Live Camera Capture</h4>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isMirrored} 
                  onChange={(e) => setIsMirrored(e.target.checked)} 
                  className="rounded bg-slate-800 border-white/10 text-brand-cyan focus:ring-0" 
                />
                Mirror Feed
              </label>
              <button onClick={stopCamera} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          {cameraError ? (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/20 text-red-500 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-64 h-64 rounded-2xl overflow-hidden border border-brand-cyan/30 bg-black shadow-inner">
                <video 
                  ref={videoRef} 
                  className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                  playsInline 
                  muted 
                />
              </div>
              <button 
                onClick={capturePhoto}
                className="flex items-center gap-2 bg-brand-cyan text-navy-dark px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
              >
                <Video size={14} /> Freeze & Grab Frame
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Portrait Generator Tool */}
      <div className={`p-6 lg:p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-cyan/10 rounded-xl text-brand-cyan">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>AI Avatar Generator Studio</h4>
            <p className="text-xs text-slate-500">Provide an avatar idea and let Gemini build a unique illustration for you.</p>
          </div>
        </div>

        {/* Suggested Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {avatarPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setAiPrompt(preset.prompt);
                generateAIAvatar(preset.prompt);
              }}
              disabled={isGenerating}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${isDarkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'} disabled:opacity-50`}
            >
              🚀 {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. A vibrant watercolor illustration of a friendly South African high school student..."
            className={`flex-1 px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
          />
          <button
            onClick={() => generateAIAvatar()}
            disabled={isGenerating}
            className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-cyan-500/10 flex items-center gap-2 justify-center shrink-0 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Design Avatar
              </>
            )}
          </button>
        </div>

        {genError && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertCircle size={12} /> {genError}
          </p>
        )}

        {/* Generation Preview Area */}
        {generatedPreviewUrl && (
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/20">
            <img 
              src={generatedPreviewUrl} 
              alt="Generated preview" 
              className="w-24 h-24 rounded-2xl object-cover border border-brand-cyan/20 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-2 text-center sm:text-left">
              <h5 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Avatar Generation Ready!</h5>
              <p className="text-xs text-slate-500">Gemini generated this avatar successfully based on your prompt.</p>
              <div className="flex justify-center sm:justify-start gap-2">
                <button
                  onClick={applyGeneratedAvatar}
                  className="bg-brand-cyan text-navy-dark px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  Apply Avatar
                </button>
                <button
                  onClick={() => setGeneratedPreviewUrl(null)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border ${isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'}`}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Text Form Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Full Name / Display Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Display / Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full pl-12 pr-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
              placeholder="e.g. Sipho Nkosi"
            />
          </div>
        </div>

        {/* Academic Level */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Academic Grade & Phase Level</label>
          <select 
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className={`w-full px-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          >
            {academicLevels.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>

        {/* Institution / School */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">School / Academy</label>
          <input 
            type="text" 
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className={`w-full px-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
            placeholder="e.g. Houghton High School"
          />
        </div>

        {/* Relationship or Occupation */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Job Title / Role Context</label>
          <input 
            type="text" 
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className={`w-full px-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
            placeholder="e.g. Life Sciences Lead"
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Contact Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="email" 
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className={`w-full pl-12 pr-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
              placeholder="e.g. user@domain.co.za"
            />
          </div>
        </div>

        {/* Phone Matrix */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full pl-12 pr-5 py-4 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
              placeholder="+27 72 000 0000"
            />
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-dashed border-slate-200 dark:border-white/10">
        <div>
          {saveStatus === 'success' && (
            <p className="text-xs text-green-400 font-bold flex items-center gap-1">
              <Check size={14} /> Profile and Academic preferences synchronized successfully!
            </p>
          )}
          {saveStatus === 'error' && (
            <p className="text-xs text-red-400 font-bold flex items-center gap-1">
              <AlertCircle size={14} /> Relational database synchronization failed. Please try again.
            </p>
          )}
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-cyan hover:bg-cyan-500 text-navy-dark px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Synchronizing...
            </>
          ) : (
            <>
              <Save size={16} /> Synchronize Profile
            </>
          )}
        </button>
      </div>

    </div>
  );
}
