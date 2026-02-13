
import React, { useMemo, useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
const motion = m as any;

interface Props {
  vp: string;
  onNotify: () => Promise<boolean>;
  onDismiss: () => void;
  isSendingNotification: boolean;
}

const ComplexityNotification: React.FC<Props> = ({ vp, onNotify, onDismiss, isSendingNotification }) => {
  const [handoffSuccess, setHandoffSuccess] = useState(false);

  const phrase = useMemo(() => {
    const phrases = [
      "Damn, your vision is deep.",
      "Logic gates are overflowing.",
      "Complexity level: Maximum.",
      "Crafting an empire takes time.",
      "Synthesizing your massive idea."
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }, []);

  const handleAction = async () => {
    const success = await onNotify();
    if (success) {
      setHandoffSuccess(true);
      setTimeout(() => {
        onDismiss();
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-10 text-center border-white/10 shadow-[0_40px_100px_rgba(99,102,241,0.2)] bg-[#0a0a0a] relative overflow-hidden"
      >
        <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-500 ${handoffSuccess ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
        
        <AnimatePresence mode="wait">
          {!handoffSuccess ? (
            <motion.div 
              key="request"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                 <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-4 leading-tight">
                {phrase}
              </h3>
              
              <p className="text-slate-500 text-[11px] font-bold mb-10 leading-relaxed px-4 uppercase tracking-widest">
                This build is too dense for a quick preview. Switch to <span className="text-indigo-400">Cloud Synthesis</span> and we'll notify you via email when your project is waiting in the Vault.
              </p>

              <div className="space-y-4">
                <button 
                  onClick={handleAction}
                  disabled={isSendingNotification}
                  className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                >
                  {isSendingNotification ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : "Handoff to Cloud Engine 🚀"}
                </button>
                
                <button 
                  onClick={onDismiss}
                  className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  I'll stay in this session.
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
                 <motion.svg 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                 </motion.svg>
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Signal Sent.</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">The Cloud Engine is now synthesizing your empire. Check your inbox shortly.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ComplexityNotification;
