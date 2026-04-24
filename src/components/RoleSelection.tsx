import React, { useEffect, useState } from 'react';
import { GraduationCap, Loader2, School, Shield, Sparkles, Star, Users, type LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Role = 'teacher' | 'student' | 'parent' | 'admin';

type RoleOption = {
  value: Role;
  title: string;
  description: string;
  icon: LucideIcon;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'teacher',
    title: 'Teacher',
    description: 'Create lessons, manage classes, and track learner progress.',
    icon: GraduationCap,
  },
  {
    value: 'student',
    title: 'Student',
    description: 'View class material, assignments, and class updates.',
    icon: School,
  },
  {
    value: 'parent',
    title: 'Parent',
    description: 'Follow learner progress and school communication.',
    icon: Users,
  },
  {
    value: 'admin',
    title: 'Admin',
    description: 'Oversee settings, approvals, and the school workspace.',
    icon: Shield,
  },
];

interface RoleSelectionProps {
  onComplete: (role: Role) => void;
  onBack: () => void;
}

export default function RoleSelection({ onComplete, onBack }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<Role>('teacher');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data, error: userError } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (userError) {
        setError((userError as any).message);
      }

      setEmail(data.user?.email ?? '');
      setCheckingUser(false);
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const handleContinue = async () => {
    setLoading(true);
    setError('');

    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data.user) {
      setError('Please sign in before choosing a role.');
      setLoading(false);
      return;
    }

    const payload = {
      id: data.user.id,
      email: data.user.email ?? email,
      role: selectedRole,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase.from('profiles').upsert([payload]);

    if (upsertError) {
      setError((upsertError as any).message);
    } else {
      onComplete(selectedRole);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0F172A] px-6 py-10 text-slate-100 flex items-center justify-center">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 glass p-10 rounded-[48px] border border-white/5 shadow-2xl">
        <header className="space-y-3 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-sm text-brand-cyan">
            <Sparkles className="h-4 w-4" />
            <span className="font-black uppercase tracking-widest text-[10px]">Role setup</span>
            <Star className="h-4 w-4" />
          </div>
          <h1 className="text-4xl font-hand">Choose your workspace role</h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Select the interface that best matches your daily school workflow. This saves your profile directly to our secure neural database.
          </p>
          {email ? <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Signed in as {email}</p> : null}
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-400 uppercase tracking-widest">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = selectedRole === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedRole(option.value)}
                className={
                  'rounded-[32px] border p-6 text-left transition-all group ' +
                  (active
                    ? 'border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan shadow-lg shadow-cyan-500/20'
                    : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10')
                }
              >
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${active ? 'bg-brand-cyan text-navy-dark' : 'bg-white/5 text-slate-400'} transition-colors`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className={`font-hand text-xl ${active ? 'text-white' : 'text-slate-200'}`}>{option.title}</h2>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading || checkingUser}
            className="inline-flex items-center gap-3 rounded-[24px] bg-brand-cyan px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-navy-dark transition-all hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {checkingUser ? 'Checking session...' : 'Initialize Workspace'}
          </button>

          <button 
            type="button"
            onClick={onBack}
            className="rounded-[24px] border border-white/10 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:border-white/30 hover:bg-white/5"
          >
            Back to portal
          </button>
        </div>
      </div>
    </main>
  );
}
