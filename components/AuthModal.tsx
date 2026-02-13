
import React, { useState } from 'react';
// Fix: Use any cast for motion and custom Variants type to bypass environment issues
import { motion as m, AnimatePresence } from 'framer-motion';
const motion = m as any;
type Variants = any;
import { auth, isSupabaseConfigured } from '../services/supabaseService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, id: string) => void;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('SIGNUP');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setIsEmailSent(false);
    
    try {
      if (mode === 'SIGNUP') {
        const { data, error } = await auth.signUp(email, password);
        if (error) throw error;
        
        if (data?.user) {
          if (!data.session) {
            setIsEmailSent(true);
            setErrorMsg("Verification email sent! Please check your inbox to activate your account.");
          } else {
            onSuccess(data.user.email || email, data.user.id);
          }
        }
      } else {
        const { data, error } = await auth.signIn(email, password);
        if (error) {
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error("Invalid credentials. If you haven't used this specific LaunchPad instance before, please use 'Sign Up' instead.");
          }
          if (error.message.toLowerCase().includes("email not confirmed")) {
            throw new Error("Email not confirmed. Please check your inbox for the activation link.");
          }
          throw error;
        }

        if (data?.user) {
          onSuccess(data.user.email || email, data.user.id);
        }
      }
    } catch (err: any) {
      // HANDLE RATE LIMIT SPECIFICALLY
      if (err.message.toLowerCase().includes("rate limit") || err.message.toLowerCase().includes("too many requests")) {
        setErrorMsg("The Matrix is overheating! 🛡️ Too many requests. Please wait 60 seconds before trying again.");
      } else {
        setErrorMsg(err.message || "Authentication failed. Please verify your details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="glass-card w-full max-w-md p-10 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-white/10"
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isSupabaseConfigured ? 'from-indigo-500 via-emerald-500 to-cyan-500' : 'from-indigo-500 via-pink-500 to-cyan-500'}`}></div>
            
            <motion.div variants={itemVariants} className="mb-8 text-center">
              <div className="inline-flex items-center px-3 py-1 bg-[#ff0050]/10 border border-[#ff0050]/20 rounded-full mb-6">
                <span className="text-[10px] font-black text-[#ff0050] uppercase tracking-widest">
                  {isEmailSent ? '📧 CHECK YOUR INBOX' : '🎁 YOUR FIRST EMPIRE IS 100% FREE'}
                </span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">
                {mode === 'LOGIN' ? 'Welcome Back.' : 'Claim Your Workspace.'}
              </h2>
              <p className="text-slate-400 font-medium text-sm px-6">
                {isEmailSent 
                  ? "We've sent a magic link to your email. Click it to authorize this session."
                  : "Sign up now to start your generation and save your projects to the cloud."}
              </p>
            </motion.div>

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`mb-6 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border ${isEmailSent || errorMsg.includes("Matrix") ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
              >
                {errorMsg}
              </motion.div>
            )}

            {!isEmailSent && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div variants={itemVariants}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1 text-left">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@empire.com"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold placeholder:text-slate-700"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                    {mode === 'LOGIN' && (
                      <button type="button" className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Forgot?</button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold placeholder:text-slate-700"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className={`w-full py-5 ${isLoading ? 'bg-slate-800 text-slate-500' : 'bg-white text-black'} rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    mode === 'LOGIN' ? 'Enter Command Center 🚀' : 'Start Free Generation ✨'
                  )}
                </motion.button>
              </form>
            )}

            <motion.div variants={itemVariants} className="mt-8 text-center">
              <button 
                onClick={() => {
                  setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                  setErrorMsg(null);
                  setIsEmailSent(false);
                }}
                className="text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
              >
                {mode === 'LOGIN' ? "Need an account? Join now" : "Already built an empire? Log In"}
              </button>
            </motion.div>

            <motion.button 
              variants={itemVariants}
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-600 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
