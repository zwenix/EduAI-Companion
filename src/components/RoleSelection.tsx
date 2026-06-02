import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2, School, Shield, Sparkles, Star, Users, type LucideIcon, Rocket, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Role = 'teacher' | 'student' | 'parent' | 'admin';

type RoleOption = {
  value: Role;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  color: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'teacher',
    title: 'Teacher',
    description: 'Create magic lessons and grade homework!',
    icon: GraduationCap,
    iconBg: 'bg-purple-500',
    color: 'border-purple-400',
  },
  {
    value: 'student',
    title: 'Student',
    description: 'Start your learning adventure and talk to AI!',
    icon: School,
    iconBg: 'bg-blue-500',
    color: 'border-blue-400',
  },
  {
    value: 'parent',
    title: 'Parent',
    description: 'Watch your child grow and chat with teachers!',
    icon: Users,
    iconBg: 'bg-green-500',
    color: 'border-green-400',
  },
  {
    value: 'admin',
    title: 'Admin',
    description: 'Manage the magical kingdom of EduAI!',
    icon: Shield,
    iconBg: 'bg-slate-600',
    color: 'border-slate-400',
  },
];

interface RoleSelectionProps {
  onComplete: (role: Role) => void;
  onBack: () => void;
}

export default function RoleSelection({ onComplete, onBack }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [stars, setStars] = useState<{ id: number, x: number, y: number, size: number, delay: number }[]>([]);

  useEffect(() => {
    // Generate random stars for background
    const newStars = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 2,
    }));
    setStars(newStars);
  }, []);

  const handleContinue = () => {
    if (!selectedRole) return;
    
    setLoading(true);
    
    // Simulate a tiny delay for the animation to look meaningful
    setTimeout(() => {
      onComplete(selectedRole);
    }, 600);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-600 via-blue-600 to-cyan-500 px-6 py-10 text-white flex flex-col justify-center relative overflow-hidden font-sans">
      {/* Animated Background Stars */}
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
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-yellow-400 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-bold text-yellow-300 mb-2 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
          >
            <Sparkles className="h-5 w-5" />
            <span className="tracking-wide uppercase">Identity Selection</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-comic tracking-wider text-white drop-shadow-lg">
            Choose Your <motion.span 
              initial={{ rotate: -5 }}
              animate={{ rotate: 5 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="inline-block text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]"
            >Path!</motion.span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-medium">
            Select your role to start your learning adventure.
          </p>
        </motion.div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-6">
          {ROLE_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const active = selectedRole === option.value;
            
            return (
              <motion.button
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                key={option.value}
                type="button"
                onClick={() => setSelectedRole(option.value)}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`group flex flex-col items-center text-center rounded-[2rem] p-8 transition-all duration-300 outline-none relative overflow-hidden
                  ${active 
                    ? `bg-white border-4 ${option.color} shadow-2xl shadow-yellow-400/30` 
                    : 'bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/20'
                  }
                `}
              >
                {/* Active indicator ring */}
                {active && (
                  <motion.div 
                    layoutId="activeRing"
                    className="absolute inset-0 border-4 border-yellow-400 rounded-[2rem]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <motion.div 
                  className={`${option.iconBg} p-6 rounded-3xl mb-6 shadow-xl relative z-10 transition-transform duration-300 group-hover:rotate-6`}
                  animate={active ? { y: [0, -10, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icon className="h-12 w-12 text-white" strokeWidth={2} />
                </motion.div>
                
                <h2 className={`font-comic text-3xl font-extrabold tracking-wide mb-3 relative z-10 ${active ? 'text-slate-800' : 'text-white'}`}>
                  {option.title}
                </h2>
                <p className={`text-base leading-relaxed relative z-10 font-medium ${active ? 'text-slate-600' : 'text-blue-100'}`}>
                  {option.description}
                </p>
              </motion.button>
            );
          })}
        </section>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-6 mt-10"
        >
          <motion.button
            whileHover={selectedRole && !loading ? { scale: 1.05 } : {}}
            whileTap={selectedRole && !loading ? { scale: 0.95 } : {}}
            type="button"
            onClick={handleContinue}
            disabled={loading || !selectedRole}
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-yellow-400 hover:bg-yellow-300 px-10 py-5 text-xl font-bold text-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Rocket className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
            {selectedRole ? 'Start Adventure!' : 'Select a Role'}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/50 px-8 py-5 text-lg font-bold text-white transition-all hover:bg-white/10 hover:border-white shadow-lg"
          >
            <Navigation className="h-5 w-5 rotate-180" />
            Go Back
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
