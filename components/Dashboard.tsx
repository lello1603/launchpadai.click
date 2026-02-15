
import React, { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
const motion = m as any;
import PhoneMockup from './PhoneMockup';

interface Props {
  prompt: string;
  prototypeCode: string;
  isSubscribed: boolean;
  onUnlock: () => void;
  onModify?: (request: string) => Promise<void>;
  onRepair?: (error: string) => Promise<void>;
  isModifying?: boolean;
}

const Dashboard: React.FC<Props> = ({ prompt, prototypeCode, isSubscribed, onUnlock, onModify, onRepair, isModifying }) => {
  const [activeTab, setActiveTab] = useState<'flex' | 'logic' | 'code'>('flex');
  const [currentCode, setCurrentCode] = useState(prototypeCode);
  const [copySuccess, setCopySuccess] = useState(false);
  const [demoError, setDemoError] = useState<{ message: string; stack?: string } | null>(null);
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [modifyRequest, setModifyRequest] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LAUNCHPAD_DEMO_ERROR') {
        setDemoError({ message: event.data.message, stack: event.data.stack });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => { 
    setDemoError(null); 
    setCurrentCode(prototypeCode);
  }, [prototypeCode]);

  const handleCopy = () => {
    const textToCopy = activeTab === 'logic' ? prompt : currentCode;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyRequest.trim() || isModifying) return;
    if (onModify) {
      await onModify(modifyRequest);
      setModifyRequest('');
      setShowModifyInput(false);
    }
  };

  const handleManualRepair = async () => {
    if (isModifying || !onRepair) return;
    await onRepair("Component failed to render. Re-synthesize 'AppDemo' with the same layout and fix runtime errors.");
  };

  return (
    <div className="py-12">
      <div className="flex flex-col lg:flex-row gap-16 items-start">
        <div className="flex-1 space-y-12 order-2 lg:order-1 w-full relative z-10">
          <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-[2rem] w-fit">
            {[
              { id: 'flex', label: '📱 Flex Demo', icon: '⚡' },
              { id: 'logic', label: '📋 Strategy DNA', icon: '🎨' },
              { id: 'code', label: '💻 Source', icon: '🔥' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-4 rounded-2xl font-black text-[11px] transition-all tracking-tight flex items-center gap-3 ${activeTab === tab.id ? 'bg-[#ff0050] text-white shadow-[0_0_20px_rgba(255,0,80,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-h-[480px]">
            <AnimatePresence mode="wait">
              {activeTab === 'flex' && (
                <motion.div key="flex" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <h2 className="text-6xl font-black tracking-tighter text-white">
                    Your prototype. <span className="neon-cyan italic">Share & validate.</span>
                  </h2>
                  
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setShowModifyInput(!showModifyInput)}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all shadow-xl"
                    >
                      Modify Prototype
                    </button>
                    <button 
                      onClick={handleManualRepair}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all shadow-xl"
                    >
                      Repair Build
                    </button>
                  </div>

                  {showModifyInput && (
                    <form onSubmit={handleModifySubmit} className="glass-card p-6 border-white/10 flex gap-4 shadow-2xl relative overflow-hidden bg-black/20">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Request design override..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                        value={modifyRequest}
                        onChange={(e) => setModifyRequest(e.target.value)}
                      />
                      <button type="submit" disabled={isModifying || !modifyRequest.trim()} className="px-6 py-2 bg-white text-black rounded-xl font-black text-[10px] uppercase hover:scale-105 transition-all disabled:opacity-30">
                        {isModifying ? 'Updating...' : 'Update'}
                      </button>
                    </form>
                  )}

                  {demoError && (
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex justify-between items-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                      <div className="flex items-center gap-3">
                         <span className="text-xl">🚫</span>
                         <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-red-400 leading-none">Standard Violation</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1 italic max-w-[200px] truncate">{demoError.message}</p>
                         </div>
                      </div>
                      <button onClick={handleManualRepair} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">Heal Build</button>
                    </div>
                  )}
                  
                  <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-2xl">
                    Play with your app below and share it on social. Unlock Strategy DNA, Source code, and full Vault access with a $4.99/mo subscription.
                  </p>
                </motion.div>
              )}

              {activeTab !== 'flex' && (
                <motion.div key="code" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative h-full">
                  <div className={`transition-all duration-700 ${!isSubscribed ? 'blur-3xl grayscale opacity-10 select-none pointer-events-none' : ''}`}>
                    <button onClick={handleCopy} className="absolute top-4 right-4 px-6 py-3 bg-white/10 rounded-full text-[10px] font-black uppercase text-white hover:bg-white transition-all hover:text-black shadow-2xl backdrop-blur-3xl z-20">
                      {copySuccess ? 'Copied' : 'Copy All'}
                    </button>
                    <div className="p-10 bg-black/60 border border-white/10 rounded-[3rem] text-[11px] font-mono text-indigo-200 overflow-auto max-h-[600px] shadow-inner leading-relaxed">
                      <pre className="whitespace-pre-wrap">{activeTab === 'logic' ? prompt : currentCode}</pre>
                    </div>
                  </div>
                  {!isSubscribed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-black/10 rounded-[3rem] backdrop-blur-[2px]">
                      <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.2)]">
                        <span className="text-5xl">👑</span>
                      </div>
                      <h3 className="text-4xl font-black mb-6 tracking-tighter uppercase">Unlock everything</h3>
                      <p className="text-slate-400 text-sm font-medium mb-6">Strategy DNA, Source code & full Vault access. $4.99/mo.</p>
                      <button onClick={onUnlock} className="px-14 py-7 bg-white text-black rounded-[2rem] font-black text-2xl hover:scale-105 transition-all shadow-[0_0_80px_rgba(255,255,255,0.3)]">Subscribe for $4.99/mo 🚀</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full lg:max-w-[480px] flex flex-col justify-center items-center order-1 lg:order-2 lg:sticky lg:top-16">
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/90">Live preview</p>
            <PhoneMockup code={currentCode} isSubscribed={true} interactive={true} locked={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
