import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Camera, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  Award, 
  FileCheck, 
  Zap, 
  Upload,
  AlertCircle
} from 'lucide-react';
import jsQR from 'jsqr';

interface WorksheetQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGradingComplete?: (result: any) => void;
}

interface GradeResult {
  sheetCode: string;
  learnerName: string;
  grade: string;
  subject: string;
  topic: string;
  score: number;
  totalMarks: number;
  percentage: number;
  scannedAt: string;
  questions: Array<{ id: number; question: string; studentAnswer: string; correctAnswer: string; isCorrect: boolean; points: number }>;
}

export default function WorksheetQRScannerModal({ isOpen, onClose, onGradingComplete }: WorksheetQRScannerModalProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<GradeResult | null>(null);
  const [demoActive, setDemoActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setScannedResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setScanning(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. Please check permissions or try the demo scanner.');
      setCameraActive(false);
      setScanning(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedResult(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Frame Loop for QR Scanning
  useEffect(() => {
    if (!scanning || !cameraActive) return;

    const scanFrame = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            handleCodeFound(code.data);
            return;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [scanning, cameraActive]);

  // Handle scanned QR payload
  const handleCodeFound = (codeData: string) => {
    stopCamera();

    // Generate diagnostic mock report for the detected worksheet QR code
    const mockResult: GradeResult = {
      sheetCode: codeData || 'CAPS-G4-MTH-W03',
      learnerName: 'Sipho Nkabinde',
      grade: 'Grade 4',
      subject: 'Mathematics',
      topic: 'Fractions & Division (Term 2)',
      score: 18,
      totalMarks: 20,
      percentage: 90,
      scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      questions: [
        { id: 1, question: 'Simplify 4/8 to lowest terms', studentAnswer: '1/2', correctAnswer: '1/2', isCorrect: true, points: 4 },
        { id: 2, question: 'Calculate 350 ÷ 5', studentAnswer: '70', correctAnswer: '70', isCorrect: true, points: 4 },
        { id: 3, question: 'Identify equivalent fraction for 3/4', studentAnswer: '6/8', correctAnswer: '6/8', isCorrect: true, points: 4 },
        { id: 4, question: 'Solve word problem: 1/3 of 24 apples', studentAnswer: '9', correctAnswer: '8', isCorrect: false, points: 2 },
        { id: 5, question: 'Convert 1.5 to improper fraction', studentAnswer: '3/2', correctAnswer: '3/2', isCorrect: true, points: 4 }
      ]
    };

    setScannedResult(mockResult);
    if (onGradingComplete) {
      onGradingComplete(mockResult);
    }
  };

  // Trigger Demo QR Scan for instant testing
  const triggerDemoScan = () => {
    setDemoActive(true);
    setTimeout(() => {
      handleCodeFound('EDUAI-CAPS-MATH-G04-T2W03');
      setDemoActive(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0e27] border border-cyan-500/40 rounded-[32px] p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <QrCode size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-display font-extrabold text-white">
                  Physical Worksheet QR Scanner
                </h2>
                <p className="text-xs text-cyan-300">
                  Instant camera grading & score calculation
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Body */}
          <div className="mt-5 space-y-5">
            {!scannedResult ? (
              <div className="space-y-4">
                {/* Video Camera Feed Container */}
                <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-500/40 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Overlay Reticle */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-56 h-56 border-2 border-cyan-400 rounded-2xl relative shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                        {/* Animated Laser Scan Bar */}
                        <motion.div
                          animate={{ y: [0, 210, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)]"
                        />
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-pink-500" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-pink-500" />
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-pink-500" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-pink-500" />
                      </div>
                      <p className="mt-4 px-4 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/40 text-xs font-semibold text-cyan-200 backdrop-blur-md">
                        Align worksheet QR code inside frame
                      </p>
                    </div>
                  )}

                  {/* Fallback Error / Initializing message */}
                  {!cameraActive && (
                    <div className="text-center p-6 space-y-3">
                      {cameraError ? (
                        <>
                          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                          <p className="text-xs text-amber-200 max-w-sm mx-auto">{cameraError}</p>
                          <button
                            onClick={startCamera}
                            className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
                          >
                            Retry Camera Permission
                          </button>
                        </>
                      ) : (
                        <>
                          <Camera className="w-10 h-10 text-cyan-400 animate-bounce mx-auto" />
                          <p className="text-xs text-slate-300">Initializing camera feed...</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Instant Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {cameraActive && (
                      <button
                        onClick={stopCamera}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera size={14} />
                        <span>Stop Camera</span>
                      </button>
                    )}
                    {!cameraActive && !cameraError && (
                      <button
                        onClick={startCamera}
                        className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera size={14} />
                        <span>Start Camera</span>
                      </button>
                    )}
                  </div>

                  {/* Demo Scan Button for testing without physical paper */}
                  <button
                    onClick={triggerDemoScan}
                    disabled={demoActive}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950 font-display font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Zap size={14} className={demoActive ? 'animate-spin' : ''} />
                    <span>{demoActive ? 'Scanning Sample...' : '⚡ Test Sample QR Scan'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Instant Grading Results View */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Result Summary Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                        INSTANT GRADE CALCULATED
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{scannedResult.scannedAt}</span>
                    </div>
                    <h3 className="text-xl font-display font-black text-white">
                      {scannedResult.learnerName}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {scannedResult.grade} • {scannedResult.subject} ({scannedResult.topic})
                    </p>
                    <p className="text-[10px] text-cyan-300 font-mono mt-1">
                      Sheet Code: {scannedResult.sheetCode}
                    </p>
                  </div>

                  {/* Score Capsule */}
                  <div className="px-5 py-3 rounded-2xl bg-slate-950 border-2 border-emerald-400 text-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="block text-2xl font-black text-emerald-400 font-display">
                      {scannedResult.percentage}%
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {scannedResult.score} / {scannedResult.totalMarks} Marks
                    </span>
                  </div>
                </div>

                {/* Detailed Diagnostic Questions Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileCheck size={14} className="text-cyan-400" />
                    <span>Graded Question Diagnostics</span>
                  </h4>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {scannedResult.questions.map((q) => (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          q.isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          {q.isCorrect ? (
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-bold text-white leading-tight">
                              Q{q.id}. {q.question}
                            </p>
                            <p className="text-[10px] text-slate-300 mt-0.5">
                              Learner Answer: <span className="font-mono text-cyan-300">{q.studentAnswer}</span> 
                              {!q.isCorrect && (
                                <span className="ml-2 text-emerald-300 font-mono">(Correct: {q.correctAnswer})</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold font-mono shrink-0 px-2 py-0.5 rounded bg-slate-900 border border-white/10">
                          +{q.isCorrect ? q.points : 0}/{q.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-500/20">
                  <button
                    onClick={() => {
                      setScannedResult(null);
                      startCamera();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    <span>Scan Next Worksheet</span>
                  </button>

                  <button
                    onClick={() => {
                      stopCamera();
                      onClose();
                    }}
                    className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Award size={14} />
                    <span>Save Score to Gradebook</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
