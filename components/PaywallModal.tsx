
import React, { useState } from 'react';
// Fix: Use any cast for motion to bypass broken type definitions in the environment
import { motion as m } from 'framer-motion';
const motion = m as any;
import { initiateStripeCheckout } from '../services/stripeService';

interface Props {
  onClose: () => void;
  onSubscribe: () => void;
}

const PaywallModal: React.FC<Props> = ({ onClose }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [payStatus, setPayStatus] = useState<string>('Level Up 🚀');

  const handlePayment = async () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    setPayStatus('Redirecting...');
    try {
      await new Promise(r => setTimeout(r, 800));
      await initiateStripeCheckout();
    } catch (err) {
      alert("Checkout failed.");
      setPayStatus('Level Up 🚀');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 z-[2000]">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-8 max-w-[340px] w-full text-center relative overflow-hidden border-white/10 shadow-[0_0_120px_rgba(255,0,80,0.2)] bg-black/80"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0050] via-indigo-600 to-cyan-400"></div>
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-600 hover:text-white transition-colors p-2 z-10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-2xl">
          <span className="text-3xl">👑</span>
        </div>

        <h2 className="text-3xl font-black mb-3 tracking-tighter uppercase">Credit Exhausted.</h2>
        <p className="text-slate-500 mb-8 text-[11px] font-bold leading-relaxed px-2 uppercase tracking-widest">
          You've used your one free empire generation. Join Pro to build the future without limits.
        </p>

        <div className="glass-card bg-white/[0.03] border-white/5 p-6 mb-8 text-left">
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black text-white">$4.99</span>
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">/ Month</span>
          </div>
          <ul className="space-y-3">
            {[
              { icon: '🚀', text: 'Unlimited Empires' },
              { icon: '🏛️', text: 'Cloud Vault Storage' },
              { icon: '🔥', text: 'Full React Source Export' },
              { icon: '🧠', text: 'One-Shot AI Repair' }
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <span className="text-xs">{f.icon}</span> {f.text}
              </li>
            ))}
          </ul>
        </div>

        <button 
          onClick={handlePayment}
          disabled={isRedirecting}
          className={`w-full py-5 rounded-2xl font-black text-base transition-all shadow-2xl flex items-center justify-center gap-4 ${isRedirecting ? 'bg-slate-900 text-slate-600' : 'bg-white text-black hover:scale-[1.03] active:scale-95 shadow-white/10'}`}
        >
          {isRedirecting && <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>}
          {payStatus}
        </button>
        
        <button 
          onClick={onClose}
          className="mt-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-indigo-400 transition-colors"
        >
          Return to Archives
        </button>
      </motion.div>
    </div>
  );
};

export default PaywallModal;
