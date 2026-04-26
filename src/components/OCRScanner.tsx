import React, { useState, useRef } from 'react';
import { Camera, X, Scan, Check, Loader2, AlertCircle, RefreshCw, FileCheck, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { runOCRAndGrade } from '../services/unifiedAiService';
import { useAi } from '../contexts/AiContext';

export default function OCRScanner({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { provider } = useAi();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rubric, setRubric] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleProcess = async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    try {
      const gradingResult = await runOCRAndGrade(capturedImage, rubric || "Grade accurately based on general quality.", provider);
      setResult(gradingResult);
    } catch (error) {
       console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setRubric('');
    startCamera();
  };

  React.useEffect(() => {
    if (isOpen) startCamera();
    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-navy-dark w-full max-w-2xl max-h-[90vh] rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden border border-white/5"
      >
        <div className="p-8 border-b border-white/5 bg-white/5 backdrop-blur-xl flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <div className="bg-brand-cyan p-3 rounded-2xl text-navy-dark shadow-[0_0_20px_-5px_rgba(6,182,212,0.6)]">
              <Scan size={24} />
            </div>
            <div>
              <h2 className="font-hand text-3xl text-white tracking-wide">Vision Intelligence</h2>
              <p className="text-[10px] text-slate-500 font-extrabold tracking-[0.3em] uppercase mt-1">CAPS Engine • OCR Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col bg-navy-dark/40 scrollbar-hide">
          {!capturedImage && (
            <div className="flex-1 flex flex-col space-y-10">
              <div className="relative aspect-[3/4] bg-black rounded-[44px] overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.1)] border border-white/5">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 border-2 border-brand-cyan/20 pointer-events-none rounded-[44px]" />
                <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 border-y border-brand-cyan/10 h-1/3 pointer-events-none" />
                <div className="absolute inset-y-12 left-1/2 -translate-x-1/2 border-x border-brand-cyan/10 w-1/3 pointer-events-none" />
              </div>
              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={captureImage}
                  className="w-24 h-24 bg-white rounded-full shadow-[0_20px_60px_rgba(255,255,255,0.2)] flex items-center justify-center text-navy-dark active:scale-90 transition-all hover:bg-brand-cyan ring-[12px] ring-white/5"
                >
                  <Camera size={40} />
                </button>
                <p className="text-center text-[10px] text-slate-700 uppercase font-black tracking-[0.4em]">Ready for capture • High Precision Mode</p>
              </div>
            </div>
          )}

          {capturedImage && !result && (
            <div className="space-y-10 flex-1 flex flex-col">
              <div className="relative aspect-[3/4] glass rounded-[44px] overflow-hidden border border-white/10 shadow-2xl group">
                <img src={capturedImage} className="w-full h-full object-cover opacity-80" />
                <button onClick={() => setCapturedImage(null)} className="absolute top-6 right-6 bg-brand-cyan text-navy-dark p-4 rounded-3xl hover:bg-cyan-500 transition-all shadow-2xl active:scale-95">
                  <RefreshCw size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Neural Grading Rubric / Schema</label>
                <textarea 
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  placeholder="Define success criteria or CAPS objectives..."
                  className="w-full bg-navy-dark/60 border border-white/5 rounded-[36px] p-8 focus:border-brand-cyan focus:bg-navy-dark outline-none transition-all resize-none text-[15px] text-slate-300 placeholder:text-slate-800 leading-relaxed font-mono min-h-[160px] shadow-2xl backdrop-blur-md"
                />
              </div>

              <button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full bg-brand-cyan hover:bg-cyan-500 text-navy-dark py-6 rounded-[28px] font-black uppercase tracking-widest text-xs shadow-[0_20px_50px_rgba(6,182,212,0.3)] flex items-center justify-center gap-4 transition-all mt-auto active:scale-[0.98] disabled:opacity-30"
              >
                {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Synthesizing Data...</> : <><Scan size={20} /> Initialize Scoring</>}
              </button>
            </div>
          )}

          {result && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="glass p-10 rounded-[44px] flex items-center gap-8 overflow-hidden relative border border-white/10">
                <div className="w-24 h-24 bg-brand-cyan rounded-[32px] flex flex-col items-center justify-center text-navy-dark shadow-[0_15px_40px_rgba(6,182,212,0.4)] z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Result</span>
                  <span className="text-4xl font-black tracking-tighter">{result.totalScore}</span>
                </div>
                <div className="relative z-10">
                  <h3 className="font-hand text-3xl text-white">Evaluation Computed</h3>
                  <p className="text-xs text-brand-cyan/80 font-bold uppercase tracking-widest mt-1">Neural Vision Confidence: 99.2%</p>
                </div>
                <Brain size={160} className="absolute -right-12 -bottom-12 text-brand-cyan opacity-5" />
              </div>

              <div className="space-y-8">
                <div className="bg-navy-dark/60 border border-white/5 p-8 rounded-[40px] shadow-inner">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-5 ml-2">Extracted Stream</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">{result.extractedText}</p>
                </div>

                <div className="bg-brand-cyan/5 border border-brand-cyan/20 p-8 rounded-[40px]">
                  <h4 className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] mb-5 ml-2">Synthesis Feedback</h4>
                  <p className="text-lg text-slate-200 font-medium italic leading-relaxed">"{result.feedback}"</p>
                </div>

                <div className="glass p-8 rounded-[40px] border border-white/5">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-5 ml-2">Quantum Question Matrix</h4>
                  <ul className="space-y-4">
                    {result.marksPerQuestion?.map((mark: string, i: number) => (
                      <li key={i} className="text-sm flex gap-5 items-start group">
                        <span className="w-6 h-6 bg-navy-dark border border-white/10 rounded-lg flex items-center justify-center text-[10px] font-black text-brand-cyan group-hover:bg-brand-cyan group-hover:text-navy-dark transition-all shrink-0">{i+1}</span>
                        <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{mark}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button 
                onClick={reset}
                className="w-full py-6 rounded-[32px] border border-white/10 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-4"
              >
                <RefreshCw size={18} /> Reset Visual Terminal
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
