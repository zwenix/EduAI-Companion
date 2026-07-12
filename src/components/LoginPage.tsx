import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Sparkles, ShieldAlert, Rocket, Orbit, Star, Heart, Smile } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface LoginPageProps {
  onSuccess: () => void;
  onSignUpClick: () => void;
}

export default function LoginPage({ onSuccess, onSignUpClick }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogle, setIsGoogle] = useState(false);
  const [error, setError] = useState('');
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    // Generate random stars for background
    const newStars = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
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
        setError("The login window was closed. Please try again! (Tip: If you are using Google AI Studio, make sure you clicked \"Open in a new tab\" to allow the login popup to connect properly).");
      } else if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        setError("The login popup was blocked by your browser. Please enable popups for this site or open the app in a new tab.");
      } else {
        setError(errMsg);
      }
      setIsGoogle(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden cinematic-neon-bg font-sans text-white">
      {/* 3D Floor Perspective Grid on backgrounds */}
      <div className="perspective-grid" />

      {/* Floating Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [0.15, 0.85, 0.15],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* LEFT COLUMN: Neon astronaut riding a rocket ship (Immersive cinematic art) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[48%] relative flex-col items-center justify-center p-8 border-r border-white/5 bg-slate-950/40 select-none overflow-hidden">
        {/* Swirling celestial lines */}
        <div className="absolute w-[450px] h-[450px] rounded-full border border-brand-cyan/15 animate-spin-slow scale-110" />
        <div className="absolute w-[300px] h-[300px] rounded-full border-2 border-dashed border-brand-pink/10 animate-reverse-spin scale-90" />
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Animated Flying Mascot */}
        <motion.div
          animate={{
            y: [-15, 15, -15],
            rotate: [-4, 4, -4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 flex flex-col items-center cursor-pointer"
        >
          {/* Neon rocket fire particle effects */}
          <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-16 h-36 bg-gradient-to-t from-transparent via-brand-pink/45 to-transparent blur-md rounded-full pointer-events-none animate-pulse" />
          
          <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-[40px] overflow-hidden p-1 bg-white/5 glass-neon-card border-brand-cyan/45 shadow-[0_0_40px_rgba(0,179,255,0.3)] flex items-center justify-center">
            <div className="w-full h-full rounded-[34px] overflow-hidden bg-slate-950/50 relative flex items-center justify-center">
              <img 
                src="https://i.ibb.co/CsvbkGYG/landing-image.jpg" 
                alt="Astronaut flying on rocket" 
                className="w-full h-full object-cover filter saturate-[1.25] brightness-[0.8] contrast-[1.1]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e2c]/90 via-transparent to-brand-cyan/20" />
            </div>
          </div>

          {/* Glowing HUD Labels overlay */}
          <div className="mt-8 text-center px-4">
            <h2 className="text-3xl font-display font-black tracking-widest text-white leading-none">
              EduAI <span className="text-brand-pink text-glow-pink">Companion</span>
            </h2>
            <p className="text-xs text-brand-cyan font-mono uppercase tracking-widest mt-2 bg-brand-cyan/10 px-4 py-1.5 rounded-full border border-brand-cyan/25 inline-block">
              Rocket Adventure Ready 🚀
            </p>
          </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Sign Up / Welcome back portal centered */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10 overflow-y-auto">
        
        {/* Hand-drawn neon doodles around the login box (SVGs and absolute panels) */}
        <div className="absolute top-[12%] right-[10%] w-16 h-16 pointer-events-none text-brand-pink opacity-50 hidden lg:block">
          {/* Hand drawn neon loop star */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50 15 L62 40 L88 40 L68 56 L75 82 L50 66 L25 82 L32 56 L12 40 L38 40 Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="filter drop-shadow-[0_0_6px_#FF00D4]" />
          </svg>
        </div>
        
        <div className="absolute bottom-[15%] left-[5%] w-24 h-24 pointer-events-none text-brand-green opacity-40 hidden lg:block">
          {/* Hand drawn neon arrow pointing to card */}
          <svg viewBox="0 0 100 100" className="w-full h-full rotate-45">
            <path d="M20 50 Q50 30 75 50 M60 30 L80 50 L60 70" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="filter drop-shadow-[0_0_8px_#00FF9F]" />
          </svg>
        </div>

        <div className="absolute top-[45%] right-[5%] w-20 h-20 pointer-events-none text-brand-yellow opacity-40 hidden lg:block">
          {/* Hand drawn loop swirl */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M20,50 C20,20 80,20 80,50 C80,80 20,80 50,50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="filter drop-shadow-[0_0_6px_#ffdf40]" />
          </svg>
        </div>

        {/* Ambient background glows specifically for form */}
        <div className="absolute w-80 h-80 bg-brand-cyan/5 rounded-full blur-[90px] pointer-events-none" />

        {/* Main card */}
        <div className="w-full max-w-[460px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 90 }}
            className={`glass-neon-card p-8 sm:p-10 shadow-[0_0_60px_rgba(3,6,17,0.7)] border-white/10 ${
              isSignUp ? 'animate-neon-pulse-pink' : 'animate-neon-pulse-cyan'
            }`}
          >
            {/* Logo wrapper */}
            <div className="flex flex-col items-center mb-6 text-center select-none">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                onClick={() => window.location.reload()}
                className="w-18 h-18 flex items-center justify-center mb-4 bg-white/5 border border-white/15 rounded-2xl p-2 shadow-lg cursor-pointer"
              >
                <img 
                  src="https://i.ibb.co/tTc5gG5k/eduai-company-logo2-preview-177246762158%200-2-preview-177247315%203046.png"
                  alt="EduAI Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,179,255,0.4)]"
                />
              </motion.div>
              
              <h1 className="text-3xl font-display font-black text-white tracking-tight mb-1 leading-none">
                {isSignUp ? (
                  <>Sign Up for <span className="text-brand-pink text-glow-pink font-display">Adventure!</span> ✨</>
                ) : (
                  <>Welcome <span className="text-brand-cyan text-glow-cyan font-display">Back!</span> 👋</>
                )}
              </h1>
              <p className="text-xs text-slate-300 font-bold uppercase tracking-widest font-mono">
                {isSignUp ? "Create Your School Profile" : "Log in to Your Magical Universe"}
              </p>
            </div>

            {isIframe && (
              <div className="mb-4 p-3.5 bg-indigo-950/65 text-indigo-200 border border-indigo-500/30 rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 shadow-lg text-center leading-normal">
                <span className="flex items-center gap-1.5 text-indigo-300 text-glow-cyan uppercase tracking-widest text-[9px] font-mono font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" /> Sandbox Active
                </span>
                <span className="text-[11px] font-sans text-slate-300">
                  If Google popup fails, please click <b>"Open in a new tab"</b> in the top right menu of AI Studio first!
                </span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3.5">
                
                {/* Name Input - Only for Sign Up */}
                <AnimatePresence initial={false}>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your Full Name"
                        className="w-full h-12 bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-brand-pink focus:shadow-[0_0_15px_rgba(255,0,212,0.35)] transition-all rounded-xl px-4 text-white placeholder-slate-400 focus:outline-none font-bold text-sm"
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Input */}
                <div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full h-12 bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-brand-cyan focus:shadow-[0_0_15px_rgba(0,179,255,0.35)] transition-all rounded-xl px-4 text-white placeholder-slate-400 focus:outline-none font-bold text-sm"
                    required
                  />
                </div>

                {/* Password Input */}
                <div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Choose a Password"
                    className="w-full h-12 bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-brand-cyan focus:shadow-[0_0_15px_rgba(0,179,255,0.35)] transition-all rounded-xl px-4 text-white placeholder-slate-400 focus:outline-none font-bold text-sm"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading || isGoogle}
                className={`w-full h-12 mt-6 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                  isSignUp ? 'primary-neon-btn-pink' : 'primary-neon-btn-cyan'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                ) : (
                  <>
                    <span>{isSignUp ? "SIGN UP & LAUNCH!" : "LET'S GO!"}</span>
                    <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                  </>
                )}
              </button>

              {/* Separator line */}
              <div className="relative flex items-center py-4 select-none">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="shrink-0 px-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Or play with
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Google Sign In button */}
              <button 
                type="button"
                onClick={handleGoogle} 
                disabled={isLoading || isGoogle}
                className="w-full h-12 bg-white border border-transparent hover:bg-slate-50 text-slate-800 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg hover:scale-[1.01]"
              >
                {isGoogle ? (
                  <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            </form>

            {/* Footer switch links */}
            <div className="mt-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-slate-300 font-medium">
                {isSignUp ? "Already have an account?" : "New here?"}{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-brand-cyan hover:text-cyan-300 font-black transition-colors focus:outline-none hover:underline"
                >
                  {isSignUp ? "Log in!" : "Sign up!"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
