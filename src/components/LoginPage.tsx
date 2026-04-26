import React, { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface LoginPageProps {
  onSuccess: () => void;
  onSignUpClick: () => void;
}

export default function LoginPage({ onSuccess, onSignUpClick }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogle, setIsGoogle] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock traditional login for now, or you could add signInWithEmailAndPassword
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    onSuccess();
  };

  const handleGoogle = async () => {
    setIsGoogle(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsGoogle(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      setIsGoogle(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B1122] relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-[10%] w-[500px] h-[500px] bg-brand-cyan/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 right-[10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Login Container */}
      <div className="w-full max-w-[420px] mx-4 relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-hidden ring-1 ring-white/5">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-20 h-20 flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-300">
               <img 
                src="https://i.ibb.co/tTc5gG5k/eduai-company-logo2-preview-177246762158%200-2-preview-177247315%203046.png"
                alt="EduAI Logo"
                className="w-full h-full object-contain scale-125 drop-shadow-md"
              />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-slate-400 font-medium">Log in to your EduAI terminal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan/50 transition-all font-medium"
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
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={isLoading || isGoogle}
              className="w-full h-14 bg-brand-cyan hover:bg-cyan-500 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="shrink-0 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Or continue with
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* Google Sign In */}
            <button 
              type="button"
              onClick={handleGoogle} 
              disabled={isLoading || isGoogle}
              className="w-full h-14 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-sm"
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
              Sign in with Google
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 font-medium">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={onSignUpClick}
                className="text-brand-cyan hover:text-cyan-400 font-semibold transition-colors focus:outline-none focus:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
