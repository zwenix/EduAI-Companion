import React, { useState } from 'react';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface PasswordSecurityProps {
  isDarkMode: boolean;
}

/**
 * Password & Security menu — lets signed-in users change their password and
 * send a forgotten-password reset link to their account email.
 */
export default function PasswordSecurity({ isDarkMode }: PasswordSecurityProps) {
  const user = auth.currentUser;
  const userEmail = user?.email || localStorage.getItem('eduai_user_email') || '';
  const isAnonymous = !!user?.isAnonymous;
  const hasPasswordProvider = !!user?.providerData.some((p) => p.providerId === 'password');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Forgot password state
  const [resetEmail, setResetEmail] = useState(userEmail);
  const [isSending, setIsSending] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all border',
    'bg-[#0b101c] border-white/10 text-white placeholder-slate-500',
    'focus:border-cyan-500/50 focus:shadow-[0_0_12px_rgba(0,211,238,0.15)]'
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    if (!user) {
      setUpdateError('You must be signed in to change your password.');
      return;
    }
    if (isAnonymous) {
      setUpdateError('Quick demo access has no password. Create a full account (or sign in) to set a password.');
      return;
    }
    if (!hasPasswordProvider) {
      setUpdateError('This account signs in with Google, so it has no EduAI password to change. Use the reset link below or your Google account recovery.');
      return;
    }
    if (!currentPassword) {
      setUpdateError('Enter your current password first.');
      return;
    }
    if (newPassword.length < 6) {
      setUpdateError('New password should be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setUpdateError('New passwords do not match. Check the confirmation field.');
      return;
    }
    if (newPassword === currentPassword) {
      setUpdateError('Your new password is the same as the current one.');
      return;
    }

    setIsUpdating(true);
    try {
      // Re-authenticate with the current password, then update — this also
      // satisfies Firebase's "requires recent login" security rule.
      const credential = EmailAuthProvider.credential(user.email || userEmail, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setUpdateSuccess('Password updated successfully. Use your new password the next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = String(err?.message || err);
      const code = String(err?.code || '');
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || /invalid-credential|wrong-password/i.test(msg)) {
        setUpdateError('Current password is incorrect. Try again.');
      } else if (code === 'auth/weak-password' || /weak-password/i.test(msg)) {
        setUpdateError('New password should be at least 6 characters.');
      } else if (code === 'auth/requires-recent-login' || /requires-recent-login/i.test(msg)) {
        setUpdateError('For security, sign out and sign back in before changing your password.');
      } else if (code === 'auth/user-mismatch' || /user-mismatch/i.test(msg)) {
        setUpdateError('That password does not belong to this account.');
      } else {
        setUpdateError(`Could not update password${code ? ` (${code})` : ''}: ${msg}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    const email = resetEmail.trim();
    if (!email) {
      setResetError('Enter your account email first.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResetError('That email address does not look valid. Check the spelling.');
      return;
    }
    setIsSending(true);
    try {
      const actionCodeSettings: any = {
        url: `${window.location.origin}/?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      // Same message for success vs unknown-email so the form does not leak
      // which addresses are registered. Firebase may return user-not-found on
      // some configs — treat as success as well.
      setResetSuccess(`If ${email} is registered on EduAI, a password reset link is on its way. Check your inbox (and spam folder). The link is valid for about an hour. If you use Google Sign-In, use your Google account recovery instead.`);
      console.info('[EduAI] Password reset email requested for', email);
      if (!userEmail) setResetEmail('');
    } catch (err: any) {
      const code = String(err?.code || '');
      const msg = String(err?.message || '');
      console.error('[EduAI] sendPasswordResetEmail failed', { code, msg, email });
      if (code === 'auth/user-not-found') {
        setResetSuccess(`If ${email} is registered on EduAI, a password reset link is on its way. Check your inbox (and spam folder).`);
      } else if (code === 'auth/invalid-email' || /invalid-email/i.test(msg)) {
        setResetError('That email address does not look valid. Check the spelling.');
      } else if (code === 'auth/missing-email' || /missing-email/i.test(msg)) {
        setResetError('Enter your account email first.');
      } else if (code === 'auth/too-many-requests' || /too-many-requests/i.test(msg)) {
        setResetError('Too many reset attempts. Wait a few minutes and try again.');
      } else if (code === 'auth/network-request-failed' || /network/i.test(msg)) {
        setResetError('Network error — check your connection and try again.');
      } else if (code === 'auth/unauthorized-continue-uri' || /unauthorized-continue-uri|unauthorized-domain/i.test(msg)) {
        setResetError(`We could not send the reset link because ${window.location.hostname} is not yet allowlisted in Firebase. A project admin should add it under Firebase console → Authentication → Settings → Authorized domains. Your request was still logged — try again after the domain is allowlisted, or contact support.`);
      } else {
        setResetError(`Could not send the reset link${code ? ` (${code})` : ''}: ${msg || String(err)}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.25)]">
          <Key size={22} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">Password &amp; Security</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Change your password or send a forgotten-password reset link to your account email.
          </p>
        </div>
      </div>

      {/* Account status strip */}
      <div className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed',
        isAnonymous
          ? 'border-amber-400/25 bg-amber-500/5 text-amber-100/90'
          : hasPasswordProvider
          ? 'border-emerald-400/25 bg-emerald-500/5 text-emerald-100/90'
          : 'border-cyan-400/25 bg-cyan-500/5 text-cyan-100/90'
      )}>
        {isAnonymous ? (
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-300" />
        ) : hasPasswordProvider ? (
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-300" />
        ) : (
          <Info size={16} className="shrink-0 mt-0.5 text-cyan-300" />
        )}
        <div>
          <p className="font-black uppercase tracking-wider text-[10px] mb-0.5">
            {isAnonymous ? 'Demo Session' : hasPasswordProvider ? 'Email & Password Account' : 'Google Account'}
          </p>
          <p className="text-slate-300">
            {isAnonymous
              ? 'You entered with Quick Demo Access — there is no password on this session. Create or sign in to a full account to set one.'
              : hasPasswordProvider
              ? `Signed in as ${userEmail || 'your email'}. You can change your password below, or send a reset link if you forgot it.`
              : `Signed in with Google (${userEmail || 'your Google account'}). Google accounts manage their own passwords — use the reset link below or your Google account recovery.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Change password card */}
        <form onSubmit={handleChangePassword} className="rounded-[32px] border border-white/5 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock size={18} className="text-cyan-400" />
              <h4 className="text-white font-bold">Change Password</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[9px] font-black uppercase tracking-widest text-cyan-300">Signed-in users</span>
          </div>

          {updateSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-xs">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> {updateSuccess}
            </div>
          )}
          {updateError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-200 text-xs">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {updateError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">Current password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className={cn(inputClass, 'pr-11')}
                disabled={isAnonymous || !hasPasswordProvider}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer" aria-label="Show current password">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">New password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className={cn(inputClass, 'pr-11')}
                disabled={isAnonymous || !hasPasswordProvider}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer" aria-label="Show new password">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat the new password"
              autoComplete="new-password"
              className={inputClass}
              disabled={isAnonymous || !hasPasswordProvider}
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating || isAnonymous || !hasPasswordProvider}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_28px_rgba(6,182,212,0.55)] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {isUpdating ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        {/* Forgot password card */}
        <form onSubmit={handleSendReset} className="rounded-[32px] border border-white/5 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail size={18} className="text-amber-300" />
              <h4 className="text-white font-bold">Forgot Password</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[9px] font-black uppercase tracking-widest text-amber-300">Reset link</span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Can't remember your current password? We'll email a secure reset link so you can choose a new one. Also available on the sign-in screen.
          </p>

          {resetSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 text-xs">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> {resetSuccess}
            </div>
          )}
          {resetError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-200 text-xs">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {resetError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 ml-1">Account email</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@school.edu.za"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-display font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55)] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {isSending ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
