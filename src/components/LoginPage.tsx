import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, ShieldAlert, Rocket, Sparkles } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInAnonymously, sendPasswordResetEmail } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { FIREBASE_WEB_CLIENT_ID, GOOGLE_AUTH_SCOPES, ANDROID_APP_PACKAGE_NAME, ANDROID_DEBUG_SHA1 } from '../config/googleAuth';

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

  // Forgot-password flow
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState('');
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Persist the profile fields every Google path uses.
  const persistGoogleUser = (u: any) => {
    if (!u) return;
    localStorage.setItem('eduai_user_name', u.displayName || '');
    localStorage.setItem('eduai_user_photo', u.photoURL || '');
    localStorage.setItem('eduai_user_email', u.email || '');
  };

  useEffect(() => {
    // Consume the result of a Google redirect sign-in (used as a fallback
    // when popups are blocked, e.g. inside sandboxed iframes or strict
    // browsers). If the user just returned from accounts.google.com, this
    // completes the sign-in without any further taps.
    let cancelled = false;
    getRedirectResult(auth)
      .then((result) => {
        if (cancelled || !result?.user) return;
        persistGoogleUser(result.user);
        onSuccess();
      })
      .catch((redirectErr: any) => {
        if (cancelled) return;
        const code = String(redirectErr?.code || '');
        const msg = String(redirectErr?.message || '');
        console.error('Google redirect sign-in failed:', redirectErr);
        if (code === 'auth/unauthorized-domain' || /unauthorized-domain/i.test(msg)) {
          setError(`Google blocked this sign-in because the current domain is not allowlisted. In Firebase console → Authentication → Settings → Authorized domains, add: ${window.location.hostname}. Then reload and try again.`);
        } else {
          setError(`Google redirect sign-in failed${code ? ` (${code})` : ''}. ${msg}`);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      localStorage.setItem('eduai_user_name', 'Demo Teacher');
      localStorage.setItem('eduai_user_email', 'demo.teacher@eduai.com');
      localStorage.setItem('userRole_demo_user', 'teacher');
      try {
        await signInAnonymously(auth);
      } catch (anonErr) {
        console.warn("Anonymous auth fallback:", anonErr);
      }
      setIsLoading(false);
      onSuccess();
    } catch (err: any) {
      setIsLoading(false);
      onSuccess();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSent('');
    const targetEmail = resetEmail.trim();
    if (!targetEmail) {
      setResetError('Enter your account email first.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      // Same message for success vs unknown-email so the form does not leak
      // which addresses are registered.
      setResetSent(`If ${targetEmail} is registered on EduAI, a password reset link is on its way. Check your inbox (and spam folder).`);
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'auth/user-not-found') {
        setResetSent(`If ${targetEmail} is registered on EduAI, a password reset link is on its way. Check your inbox (and spam folder).`);
      } else if (code === 'auth/invalid-email' || /invalid-email/i.test(String(err?.message || ''))) {
        setResetError('That email address does not look valid. Check the spelling.');
      } else if (code === 'auth/too-many-requests' || /too-many-requests/i.test(String(err?.message || ''))) {
        setResetError('Too many reset attempts. Wait a few minutes and try again.');
      } else {
        setResetError(`Could not send the reset link${code ? ` (${code})` : ''}: ${String(err?.message || err)}`);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotMode = () => {
    setIsSignUp(false);
    setForgotMode(true);
    setError('');
    setResetError('');
    setResetSent('');
    setResetEmail(email.trim());
  };

  const handleGoogle = async () => {
    setIsGoogle(true);
    setError('');
    
    try {
      const isNative = Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';
      if (isNative) {
        // Native app (Android/iOS): popups don't exist in a WebView, and Google
        // blocks embedded-webview OAuth. Use the native Google Sign-In SDK and
        // exchange the returned idToken for a Firebase credential.
        //
        // Capacitor does not expose capacitor.config.ts through a public
        // getConfig() runtime API. Pass the Web client ID directly so native
        // initialization cannot be blocked by an empty runtime config lookup.
        // serverClientId / androidClientId are also supplied so the Android
        // plugin resolves the same Web client even before strings.xml is patched.
        try {
          await GoogleAuth.initialize({
            clientId: FIREBASE_WEB_CLIENT_ID,
            scopes: GOOGLE_AUTH_SCOPES,
            grantOfflineAccess: false as any,
          });
        } catch (initErr: any) {
          // initialize is idempotent; a second call after config sync can throw
          // "already initialized" on some plugin versions — safe to ignore.
          const msg = String(initErr?.message || initErr);
          if (!/already/i.test(msg)) console.warn('GoogleAuth.initialize note:', initErr);
        }
        const googleUser: any = await GoogleAuth.signIn();
        // The plugin returns idToken in multiple shapes across versions:
        //   - googleUser.authentication.idToken (preferred)
        //   - googleUser.idToken (flat)
        //   - googleUser.authentication.id_token
        const idToken: string | undefined =
          googleUser?.authentication?.idToken ||
          googleUser?.idToken ||
          googleUser?.authentication?.id_token;
        if (!idToken) {
          console.error('GoogleAuth signIn payload:', googleUser);
          throw new Error('Google Sign-In returned no ID token. The Android OAuth client may be misconfigured or the SHA-1 is not registered.');
        }
        // Firebase accepts (idToken) alone; accessToken is optional but forwarded when present.
        const accessToken: string | undefined = googleUser?.authentication?.accessToken || undefined;
        const credential = GoogleAuthProvider.credential(idToken, accessToken || null);
        const result = await signInWithCredential(auth, credential);
        if (result.user) {
          localStorage.setItem('eduai_user_name', result.user.displayName || googleUser?.name || '');
          localStorage.setItem('eduai_user_photo', result.user.photoURL || googleUser?.imageUrl || '');
          localStorage.setItem('eduai_user_email', result.user.email || googleUser?.email || '');
        }
      } else {
        const provider = new GoogleAuthProvider();
        GOOGLE_AUTH_SCOPES.forEach((s) => provider.addScope(s));
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
          const result = await signInWithPopup(auth, provider);
          if (result.user) persistGoogleUser(result.user);
        } catch (popupErr: any) {
          const popupCode = String(popupErr?.code || '');
          const popupMsg = String(popupErr?.message || '');
          // Popups are blocked inside sandboxed iframes and strict browsers.
          // Fall back to the full-page redirect flow — Google allows redirects
          // from iframes, and the result is consumed on the next page load by
          // getRedirectResult above.
          if (
            popupCode === 'auth/popup-blocked' ||
            popupCode === 'auth/popup-closed-by-user' ||
            /popup/i.test(popupMsg)
          ) {
            await signInWithRedirect(auth, provider);
            return; // the browser is navigating away — do not touch loading state
          }
          throw popupErr;
        }
      }

      setIsGoogle(false);
      onSuccess();
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const errCode = String(err?.code || "");
      const combined = `${errMsg} ${errCode}`.trim();

      if (errCode !== 'auth/popup-closed-by-user' && !errMsg.includes('popup-closed-by-user') && errCode !== 'auth/popup-blocked' && !errMsg.includes('popup-blocked')) {
        console.error("Google Auth error:", err);
      }

      if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        setError("The Google Sign-In popup was closed or blocked by the preview iframe. Tip: Click '⚡ QUICK DEMO ACCESS' below to enter instantly without logging in!");
      } else if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        setError("Login popup blocked by your browser/iframe. Tip: Click '⚡ QUICK DEMO ACCESS' below to enter instantly!");
      } else if (errCode === 'auth/unauthorized-domain' || /unauthorized-domain/i.test(combined)) {
        // The current host is not allowlisted in Firebase Auth.
        setError(`This domain isn't allowlisted for Google Sign-In yet. In Firebase console → Authentication → Settings → Authorized domains, add "${window.location.hostname}", then reload this page.`);
      } else if (/redirect_uri_mismatch|invalid_client|unauthorized origin/i.test(combined)) {
        // The OAuth client in GCP does not list the origin that just asked for
        // consent. Most common after swapping/recreating the Web client.
        setError(`Google rejected this sign-in request (${errCode || 'client/origin mismatch'}). In Google Cloud Console → project gen-lang-client-0448588221 → APIs & Services → Credentials → the Firebase "Web application" client (…-tv8hh929bsagjliekkoq4ptkcfb3gs0k, the one in google-services.json), add ${window.location.origin} under "Authorized JavaScript origins", and add https://gen-lang-client-0448588221.firebaseapp.com/__/auth/handler under "Authorized redirect URIs". Wait a few minutes, then try again.`);
      } else if ((Capacitor.isNativePlatform() || /android|ios/i.test(Capacitor.getPlatform())) && (errCode === '10' || /DEVELOPER_ERROR|ApiException:?\s*10|12500|12501/i.test(combined))) {
        // Native Google Sign-In error code 10 (DEVELOPER_ERROR): the OAuth
        // client is misconfigured. Almost always the signing SHA-1 fingerprint
        // below is not registered against the Android OAuth client, or the
        // OAuth client lives in a different Google Cloud project than the Web
        // client ID.
        setError(
          `Google Sign-In isn't configured for this Android build (code 10). In Google Cloud Console → Credentials (project gen-lang-client-0448588221), create an "Android" OAuth client with package name ${ANDROID_APP_PACKAGE_NAME} and SHA-1 ${ANDROID_DEBUG_SHA1}. The Web client ID the app uses must be ${FIREBASE_WEB_CLIENT_ID} — if that client was deleted or replaced in GCP, restore it or update src/config/googleAuth.ts. Also confirm the OAuth consent screen has a support email and is published (or your Google account is listed as a test user), and that you installed the APK built with signing/android-debug.keystore. Local debug builds use a different SHA-1 — register yours or install the CI release APK.`
        );
      } else if (/DEVELOPER_ERROR|12500|12501|10[^0-9]|invalid_client|api.*not.*register|not.*configured.*google|shA-1|SHA1|signing certificate|requestIdToken/i.test(combined)) {
        // Native Google Sign-In misconfiguration (most commonly an unregistered
        // SHA-1 fingerprint, wrong client ID type, or missing OAuth client).
        setError(`Google Sign-In is not fully configured for this app. ${errCode ? '(' + errCode + ') ' : ''}${errMsg} — Verify the Android OAuth client (package ${ANDROID_APP_PACKAGE_NAME}, SHA-1 ${ANDROID_DEBUG_SHA1}) exists in the same GCP project as web client ${FIREBASE_WEB_CLIENT_ID} (project 725068822716). If that web client was deleted or regenerated in GCP, update src/config/googleAuth.ts to the current client ID.`);
      } else if (/access_denied|disallowed_useragent|oauth2/i.test(combined) && !(Capacitor.isNativePlatform() || /android|ios/i.test(Capacitor.getPlatform()))) {
        // Usually the OAuth consent screen is in "Testing" mode and the
        // account is not a test user, or the app is in a restricted mode.
        setError(`Google blocked this sign-in (${errCode || 'access_denied'}). Check that the OAuth consent screen in project gen-lang-client-0448588221 is published (or your email is added under "Test users"), and that the Google Sign-In provider is enabled in Firebase → Authentication → Sign-in methods.`);
      } else {
        setError(`${errMsg}${errCode ? ' [' + errCode + ']' : ''}`);
      }
      setIsGoogle(false);
    }
  };

  return (
    <div className="h-full page-scroll w-full flex flex-col md:flex-row relative bg-[#060919] font-sans text-white select-none">
      
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
      <div className="flex-1 flex items-start md:items-center justify-center p-4 sm:p-8 lg:p-12 relative z-20">
        
        <div className="w-full max-w-[460px] mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="rounded-[36px] bg-transparent backdrop-blur-2xl border-2 border-cyan-400/80 shadow-[0_0_50px_rgba(0,211,238,0.35),0_0_20px_rgba(255,0,212,0.2)] p-7 sm:p-10 relative overflow-hidden"
          >
            {/* Top Card Title (Exactly matching screenshot 2) */}
            <div className="text-center mb-7">
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-tight">
                {forgotMode ? (
                  <>
                    <span className="text-cyan-300 drop-shadow-[0_0_12px_rgba(0,211,238,0.8)]">Forgot Your</span>{" "}
                    <br />
                    <span className="text-pink-400 drop-shadow-[0_0_12px_rgba(255,0,212,0.8)]">Password?</span>
                  </>
                ) : isSignUp ? (
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
              {forgotMode && (
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  Enter your account email and we'll send you a secure link to choose a new password.
                </p>
              )}
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
            {forgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {resetSent && (
                  <div className="p-4 bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 rounded-2xl text-xs font-medium text-center leading-relaxed">
                    {resetSent}
                  </div>
                )}
                {resetError && (
                  <div className="p-3 bg-rose-500/20 text-rose-200 border border-rose-500/40 rounded-2xl font-bold text-xs text-center">
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">
                    Account Email
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="you@school.edu.za"
                      className="w-full h-12 bg-transparent border border-cyan-400/50 focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(0,211,238,0.5)] rounded-2xl px-4 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="w-full h-13 mt-6 rounded-2xl font-display font-black text-base text-white tracking-widest bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,211,238,0.6)] hover:shadow-[0_0_35px_rgba(0,211,238,0.85)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer uppercase flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {resetLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                  The reset link arrives by email and expires shortly. For Google sign-in accounts, use your Google account recovery instead.
                </p>
              </form>
            ) : (
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
                        className="w-full h-12 bg-transparent border border-cyan-400/50 focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(0,211,238,0.5)] rounded-2xl px-4 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all"
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
                    className="w-full h-12 bg-transparent border border-pink-500/50 focus:border-pink-400 focus:shadow-[0_0_15px_rgba(255,0,212,0.5)] rounded-2xl px-4 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all"
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
                    className="w-full h-12 bg-transparent border border-cyan-400/50 focus:border-cyan-300 focus:shadow-[0_0_15px_rgba(0,211,238,0.5)] rounded-2xl px-4 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all"
                    required
                  />
                </div>
                {!isSignUp && (
                  <div className="text-right mt-1.5">
                    <button 
                      type="button" 
                      onClick={openForgotMode}
                      className="text-cyan-300 text-[11px] font-bold hover:text-cyan-200 hover:underline transition-colors focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
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

              {/* Quick Demo Access Option (Bypasses Popups / Instant Entry) */}
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={handleDemoLogin} 
                  disabled={isLoading || isGoogle}
                  className="w-full h-11 bg-cyan-500/15 border border-cyan-400/50 hover:bg-cyan-500/25 text-cyan-300 rounded-2xl font-display font-black text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,211,238,0.25)] hover:shadow-[0_0_25px_rgba(0,211,238,0.45)]"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                  <span>⚡ QUICK DEMO ACCESS (INSTANT ENTRY)</span>
                </button>
              </div>
            </form>
            )}

            {/* Bottom Toggle Link (Exactly matching screenshot 2: "Already have an account? Sign In") */}
            <div className="mt-6 text-center">
              {forgotMode ? (
                <button 
                  type="button" 
                  onClick={() => { setForgotMode(false); setError(''); }}
                  className="text-cyan-300 font-black italic hover:text-cyan-200 transition-colors focus:outline-none hover:underline"
                >
                  ← Back to Log In
                </button>
              ) : (
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
              )}
            </div>

          </motion.div>
        </div>

      </div>

    </div>
  );
}

