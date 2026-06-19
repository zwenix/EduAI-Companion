import React, { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#00d2ff] via-[#3a7bd5] to-[#8e44ad] relative overflow-hidden font-sans animate-fadeInZoom">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 left-[10%] w-64 h-64 bg-brand-yellow/30 rounded-full blur-[80px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-brand-pink/30 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      {/* Login Container */}
      <div className="w-full max-w-[420px] mx-4 relative z-10">
        <div className="bg-white/20 backdrop-blur-3xl border-4 border-white/40 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl kid-shadow overflow-hidden">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-24 h-24 flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-300 bg-white/30 rounded-3xl border-4 border-white">
               <img 
                src="https://i.ibb.co/tTc5gG5k/eduai-company-logo2-preview-177246762158%200-2-preview-177247315%203046.png"
                alt="EduAI Logo"
                className="w-full h-full object-contain scale-110 drop-shadow-md"
              />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2 font-display drop-shadow-md">
              {isSignUp ? "Join the Magic! ✨" : "Welcome back! 👋"}
            </h1>
            <p className="text-base text-blue-50 font-bold drop-shadow-sm">
              {isSignUp ? "Create your account" : "Log in to your magical adventure"}
            </p>
          </div>

          {isIframe && (
            <div className="mb-4 p-3.5 bg-indigo-950/80 text-indigo-200 border-2 border-indigo-500/40 rounded-2xl font-bold text-xs text-center flex flex-col items-center gap-1.5 shadow-lg">
              <span>🔒 Iframe Sandbox Active</span>
              <span className="font-medium text-indigo-300 leading-normal text-[11px]">
                If Google login fails, please click <b>"Open in a new tab"</b> in the top right of AI Studio first!
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-400 text-slate-900 border border-red-500/50 rounded-xl font-bold text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              {/* Name Input - Only for Sign Up */}
              {isSignUp && (
                <div className="relative group">
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full h-14 bg-white/20 border-2 border-white/50 rounded-2xl px-5 text-white placeholder-blue-100 focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 focus:border-brand-yellow transition-all font-bold text-lg kid-shadow-hover"
                    required
                  />
                </div>
              )}

              {/* Email Input */}
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full h-14 bg-white/20 border-2 border-white/50 rounded-2xl px-5 text-white placeholder-blue-100 focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 focus:border-brand-yellow transition-all font-bold text-lg kid-shadow-hover"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-14 bg-white/20 border-2 border-white/50 rounded-2xl px-5 text-white placeholder-blue-100 focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 focus:border-brand-yellow transition-all font-bold text-lg kid-shadow-hover"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={isLoading || isGoogle}
              className="w-full h-14 mt-6 bg-brand-yellow hover:bg-[#ffdf40] text-slate-800 rounded-[28px] font-display font-black text-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed kid-shadow-hover border-4 border-[#ffdf40]/50"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
              ) : (
                <>
                  {isSignUp ? "Register & Start!" : "Let's Go!"}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                </>
              )}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t-2 border-white/30"></div>
              <span className="shrink-0 px-4 text-sm font-black uppercase tracking-wider text-white drop-shadow-md">
                Or play with
              </span>
              <div className="flex-grow border-t-2 border-white/30"></div>
            </div>

            {/* Google Sign In */}
            <button 
              type="button"
              onClick={handleGoogle} 
              disabled={isLoading || isGoogle}
              className="w-full h-14 bg-white border-4 border-white/80 hover:bg-slate-50 text-slate-800 rounded-[28px] font-display font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 kid-shadow-hover hover:scale-[1.01]"
            >
              {isGoogle ? (
                <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Sign in with Google
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="mt-8 text-center bg-white/10 rounded-2xl p-4">
            <p className="text-base text-white font-bold">
              {isSignUp ? "Already have an account?" : "New here?"}{' '}
              <button 
                type="button" 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-brand-yellow hover:text-[#ffdf40] font-black transition-colors focus:outline-none focus:underline"
              >
                {isSignUp ? "Log in!" : "Sign up!"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
