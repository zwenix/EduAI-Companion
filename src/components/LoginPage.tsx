import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, ShieldAlert, Rocket, Sparkles } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onSuccess: () => void;
  onSignUpClick: () => void;
}

export default function LoginPage({ onSuccess, onSignUpClick }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up as in Screenshot 2
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogle, setIsGoogle] = useState(false);
  const [error, setError] = useState('');
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    // Generate twinkling stars for cosmic background
    const newStars = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      delay: Math.random() * 4,
    }));
    setStars(newStars);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
 
    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError("Please enter your name.");
          setIsLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
          localStorage.setItem('eduai_user_name', name.trim());
          localStorage.setItem('eduai_user_email', email.trim());
        }
        setIsLoading(false);
        onSignUpClick(); // Redirect to role setup
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (userCredential.user) {
          localStorage.setItem('eduai_user_name', userCredential.user.displayName || '');
          localStorage.setItem('eduai_user_email', userCredential.user.email || '');
        }
        setIsLoading(false);
        onSuccess(); // Directly go to homepage/dashboard
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('auth/invalid-credential') || errMsg.includes('auth/wrong-password') || errMsg.includes('auth/user-not-found')) {
        setError("Invalid email or password. Please try again!");
      } else if (errMsg.includes('auth/email-already-in-use')) {
        setError("This email is already registered. Try logging in instead!");
      } else if (errMsg.includes('auth/weak-password')) {
        setError("Password should be at least 6 characters.");
      } else {
        setError(errMsg);
      }
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogle(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        localStorage.setItem('eduai_user_name', result.user.displayName || '');
        localStorage.setItem('eduai_user_photo', result.user.photoURL || '');
        localStorage.setItem('eduai_user_email', result.user.email || '');
      }

      setIsGoogle(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      const errCode = err?.code || "";

      if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        setError("The login window was closed. Please try again! (Tip: If using AI Studio preview, click 'Open in a new tab').");
      } else if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        setError("Login popup blocked. Please enable popups or open in a new tab.");
      } else {
        setError(errMsg);
      }
      setIsGoogle(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-[#060919] font-sans text-white select-none">
      
      {/* Cosmic Stars Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.6)_0%,rgba(6,9,25,1)_100%)] pointer-events-none" />
      
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: star.size > 2 ? '0 0 8px rgba(0,211,238,0.8)' : 'none',
          }}
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 2.5 + star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Hand-Drawn Neon Doodles (Matching Screenshot 2) */}
      <div className="absolute top-8 left-12 z-10 pointer-events-none hidden lg:block">
        <svg width="48" height="48" viewBox="0 0 100 100" className="text-cyan-400 opacity-80 filter drop-shadow-[0_0_8px_#00d2ff]">
          <path d="M50 10 L63 38 L93 38 L68 56 L78 86 L50 67 L22 86 L32 56 L7 38 L37 38 Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="absolute top-20 right-16 z-10 pointer-events-none hidden lg:block">
        <svg width="60" height="60" viewBox="0 0 100 100" className="text-pink-400 opacity-80 filter drop-shadow-[0_0_8px_#ff00d4]">
          <path d="M20 50 Q50 10 80 50 M65 20 L80 50 L55 60" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="absolute bottom-16 left-24 z-10 pointer-events-none hidden lg:block">
        <svg width="50" height="50" viewBox="0 0 100 100" className="text-emerald-400 opacity-80 filter drop-shadow-[0_0_8px_#00ff9f]">
          <path d="M10 80 Q50 90 85 45 M65 40 L85 45 L80 65" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="absolute bottom-24 right-20 z-10 pointer-events-none hidden lg:block">
        <svg width="45" height="45" viewBox="0 0 100 100" className="text-amber-300 opacity-80 filter drop-shadow-[0_0_8px_#ffdf40]">
          <path d="M50 15 L62 40 L90 40 L67 56 L76 84 L50 67 L24 84 L33 56 L10 40 L38 40 Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* LEFT COLUMN: Rocket Robot Mascot + EduAI Logo (Screenshot 2 left half) */}
      <div className="hidden md:flex md:w-[48%] lg:w-[50%] relative flex-col justify-between p-8 lg:p-12 z-10 select-none">
        
        {/* Top Brand Logo with Rocket */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,211,238,0.4)]">
            <Rocket className="w-6 h-6 text-cyan-300 -rotate-45 animate-pulse" />
          </div>
          <span className="text-3xl font-display font-black tracking-tight text-white flex items-center">
            Edu<span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,211,238,0.8)] font-display">AI</span>
          </span>
        </div>

        {/* Center Neon Mascot Robot riding Rocket */}
        <div className="relative my-auto flex flex-col items-center justify-center">
          
          {/* Ambient Glows Behind Robot */}
          <div className="absolute w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute w-[280px] h-[280px] bg-pink-500/20 rounded-full blur-[90px] pointer-events-none" />

          {/* Animated Rocket Robot Container */}
          <motion.div
            animate={{
              y: [-12, 12, -12],
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10 w-full max-w-[380px] aspect-square flex items-center justify-center"
          >
            {/* High Impact Glowing Neon Robot Rocket Vector Art */}
            <svg viewBox="0 0 500 500" className="w-full h-full filter drop-shadow-[0_0_25px_rgba(0,211,238,0.5)]">
              <defs>
                <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d2ff" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff00d4" />
                  <stop offset="60%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <filter id="neonGlowCyan">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="neonGlowPink">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Rocket Exhaust Flames */}
              <path d="M 180 340 Q 140 420 100 450 Q 160 410 190 360 Z" fill="url(#flameGrad)" opacity="0.85" className="animate-pulse" />
              <path d="M 210 360 Q 180 440 140 480 Q 200 420 225 375 Z" fill="#ff00d4" filter="url(#neonGlowPink)" opacity="0.9" />

              {/* Main Rocket Body */}
              <path d="M 360 140 C 320 220, 240 280, 180 340 L 220 370 C 290 310, 360 220, 390 170 Z" fill="none" stroke="#00d2ff" strokeWidth="8" filter="url(#neonGlowCyan)" />
              <path d="M 360 140 C 320 220, 240 280, 180 340 L 220 370 C 290 310, 360 220, 390 170 Z" fill="#090d29" opacity="0.9" />

              {/* Rocket Nosecone & Fins */}
              <path d="M 360 140 Q 410 110 420 100 Q 390 150 390 170 Z" fill="#ff00d4" stroke="#ff00d4" strokeWidth="4" filter="url(#neonGlowPink)" />
              <path d="M 180 340 Q 130 360 110 390 Q 160 370 190 360 Z" fill="#3b82f6" stroke="#00d2ff" strokeWidth="4" />

              {/* Rocket Porthole Window */}
              <circle cx="280" cy="240" r="32" fill="#060919" stroke="#00d2ff" strokeWidth="6" filter="url(#neonGlowCyan)" />
              <circle cx="280" cy="240" r="22" fill="#00d2ff" opacity="0.3" />

              {/* Cute Robot Mascot sitting on Rocket */}
              {/* Robot Head */}
              <rect x="210" y="130" width="90" height="75" rx="30" fill="#090d2b" stroke="#00d2ff" strokeWidth="6" filter="url(#neonGlowCyan)" />
              {/* Robot Face Screen */}
              <rect x="225" y="145" width="60" height="45" rx="18" fill="#00d2ff" opacity="0.2" />
              {/* Cheerful Robot Eyes & Smile */}
              <path d="M 238 162 Q 245 152 252 162" fill="none" stroke="#00d2ff" strokeWidth="5" strokeLinecap="round" />
              <path d="M 258 162 Q 265 152 272 162" fill="none" stroke="#00d2ff" strokeWidth="5" strokeLinecap="round" />
              <path d="M 246 176 Q 255 186 264 176" fill="none" stroke="#ff00d4" strokeWidth="4" strokeLinecap="round" filter="url(#neonGlowPink)" />

              {/* Robot Ears / Antennas */}
              <circle cx="202" cy="167" r="8" fill="#ff00d4" filter="url(#neonGlowPink)" />
              <circle cx="308" cy="167" r="8" fill="#ff00d4" filter="url(#neonGlowPink)" />
              <line x1="255" y1="130" x2="255" y2="110" stroke="#00d2ff" strokeWidth="5" />
              <circle cx="255" cy="105" r="7" fill="#00d2ff" filter="url(#neonGlowCyan)" />

              {/* Robot Body */}
              <rect x="220" y="210" width="70" height="55" rx="20" fill="#090d2b" stroke="#ff00d4" strokeWidth="5" filter="url(#neonGlowPink)" />
              {/* EduAI Chest Badge */}
              <rect x="232" y="225" width="46" height="22" rx="8" fill="#ff00d4" opacity="0.25" />
              <text x="255" y="240" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">EduAI</text>

              {/* Robot Waving Arm */}
              <path d="M 290 220 Q 325 200 335 175" fill="none" stroke="#00d2ff" strokeWidth="6" strokeLinecap="round" filter="url(#neonGlowCyan)" />
              <circle cx="338" cy="170" r="10" fill="#00d2ff" />
            </svg>
          </motion.div>
        </div>

        {/* Bottom Tagline */}
        <div className="text-left">
          <p className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-full inline-block">
            🚀 Ready for Next-Gen Learning
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Sign Up Glassmorphism Neon Form (Screenshot 2 right half) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-20">
        
        <div className="w-full max-w-[460px] mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="rounded-[36px] bg-[#0c102c]/85 backdrop-blur-2xl border-2 border-cyan-400/80 shadow-[0_0_50px_rgba(0,211,238,0.35),0_0_20px_rgba(255,0,212,0.2)] p-7 sm:p-10 relative overflow-hidden"
          >
            {/* Top Card Title (Exactly matching screenshot 2) */}
            <div className="text-center mb-7">
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-tight">
                {isSignUp ? (
                  <>
                    <span className="text-cyan-300 drop-shadow-[0_0_12px_rgba(0,211,238,0.8)]">Sign Up for Your</span>{" "}
                    <br />
                    <span className="text-pink-400 drop-shadow-[0_0_12px_rgba(255,0,212,0.8)]">Adventure!</span>
                  </>
                ) : (
                  <>
                    <span className="text-cyan-300 drop-shadow-[0_0_12px_rgba(0,211,238,0.8)]">Log In to Your</span>{" "}
                    <br />
                    <span className="text-pink-400 drop-shadow-[0_0_12px_rgba(255,0,212,0.8)]">Adventure!</span>
                  </>
                )}
              </h1>
            </div>

            {/* Sandbox iframe notification */}
            {isIframe && (
              <div className="mb-5 p-3 bg-indigo-950/80 text-indigo-200 border border-indigo-500/40 rounded-2xl text-xs flex flex-col items-center gap-1 text-center font-medium">
                <span className="flex items-center gap-1.5 text-cyan-300 uppercase tracking-widest text-[9px] font-mono font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" /> AI Studio Sandbox
                </span>
                <span className="text-[11px] text-slate-300">
                  If popup fails, please click <b>"Open in a new tab"</b> in AI Studio header!
                </span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3 bg-rose-500/20 text-rose-200 border border-rose-500/40 rounded-2xl font-bold text-xs text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Name Field (Sign Up Mode) */}
              <AnimatePresence initial={false}>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">
                      Name
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full h-12 bg-[#080b22]/90 border border-cyan-400/50 focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(0,211,238,0.5)] rounded-2xl px-4 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all"
                        required={isSignUp}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">
                  Email
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full h-12 bg-[#080b22]/90 border border-pink-500/50 focus:border-pink-400 focus:shadow-[0_0_15px_rgba(255,0,212,0.5)] rounded-2xl px-4 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">
                  {isSignUp ? "Choose a Password" : "Password"}
                </label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-12 bg-[#080b22]/90 border border-cyan-400/50 focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(0,211,238,0.5)] rounded-2xl px-4 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Big CTA Button (Matching Screenshot 2: "SIGN UP" glowing magenta pill) */}
              <button 
                type="submit" 
                disabled={isLoading || isGoogle}
                className="w-full h-13 mt-6 rounded-2xl font-display font-black text-base text-white tracking-widest bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 border-2 border-pink-400 shadow-[0_0_25px_rgba(255,0,212,0.6)] hover:shadow-[0_0_35px_rgba(255,0,212,0.85)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer uppercase flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <span>{isSignUp ? "SIGN UP" : "LOG IN"}</span>
                )}
              </button>

              {/* Google OAuth Option */}
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={handleGoogle} 
                  disabled={isLoading || isGoogle}
                  className="w-full h-11 bg-slate-900/90 border border-white/15 hover:bg-slate-800 text-slate-200 rounded-2xl font-display font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:border-cyan-400/50"
                >
                  {isGoogle ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              </div>
            </form>

            {/* Bottom Toggle Link (Exactly matching screenshot 2: "Already have an account? Sign In") */}
            <div className="mt-6 text-center">
              <p className="text-sm font-sans text-slate-300">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-cyan-300 font-black italic hover:text-cyan-200 transition-colors focus:outline-none hover:underline ml-1"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>

          </motion.div>
        </div>

      </div>

    </div>
  );
}

