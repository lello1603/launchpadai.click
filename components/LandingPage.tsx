
import React, { useRef, useState, useEffect } from 'react';
// Fix: Use any cast for motion to bypass broken type definitions in the environment
import { motion as m, AnimatePresence, useScroll, useSpring, useTransform, animate } from 'framer-motion';
const motion = m as any;
import { fetchGlobalEmpireCount, fetchLatestShouts, postShout } from '../services/supabaseService';

interface Props {
  onStart: () => void;
}

const EXAMPLES = [
  {
    title: "VibeTrack",
    color: "bg-[#ff0050]/10",
    text: "text-[#ff0050]",
    quiz: {
      vp: "Finding local underground raves.",
      target: "Gen Z party people ✌️",
      features: "Map of secret spots, invite-only entry.",
    },
    avatars: [
      { initial: "Z", color: "bg-cyan-500 text-black" },
      { initial: "X", color: "bg-pink-500 text-white" }
    ]
  },
  {
    title: "NFTFlex",
    color: "bg-[#00f2ea]/10",
    text: "text-[#00f2ea]",
    quiz: {
      vp: "AR gallery for your digital fits.",
      target: "Digital collectors 🔥",
      features: "Selfie mode with NFTs, TikTok export.",
    },
    avatars: [
      { initial: "M", color: "bg-yellow-400 text-black" },
      { initial: "N", color: "bg-purple-600 text-white" }
    ]
  },
  {
    title: "SideHustle",
    color: "bg-white/10",
    text: "text-white",
    quiz: {
      vp: "Uber for professional dog walkers.",
      target: "Busy pet parents 🐶",
      features: "GPS tracking, treat-cam access.",
    },
    avatars: [
      { initial: "P", color: "bg-orange-500 text-black" },
      { initial: "D", color: "bg-slate-700 text-white" }
    ]
  }
];

const STEPS = [
  {
    title: "The Brain Dump 🧠",
    desc: "Just talk to us. Tell the AI what your app does. No tech-speak needed, just explain it like I'm five.",
    icon: "💬"
  },
  {
    title: "The Moodboard 🎨",
    desc: "Drop a screenshot of a design you think is fire. Our AI analyzes the colors and fonts to match that exact energy.",
    icon: "📸"
  },
  {
    title: "Interactive Review ✨",
    desc: "Gemini audits your code in real-time. If it finds a glitch, you collaborate to fix it during the synthesis phase.",
    icon: "⚡"
  },
  {
    title: "The Flex 📱",
    desc: "Use our built-in preview to play with your app. Screen record it, post it on socials, and watch the feedback roll in.",
    icon: "🎬"
  },
  {
    title: "Own the Code 🚀",
    desc: "Validated the idea? Ready to launch? Unlock the actual source code for $4.99 and take your empire to the next level.",
    icon: "👑"
  }
];

const SYSTEM_TEMPLATES = [
  "Manifest your empire...",
  "The world needs your weird ideas.",
  "Build the future you want to live in.",
  "Build the future.",
  "Your startup starts here."
];

const StepCard = ({ step, index }: { step: typeof STEPS[0], index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      className="glass-card p-12 md:p-16 mb-32 relative group border-white/10 hover:border-indigo-500/30 transition-colors flex flex-col items-center justify-center text-center"
    >
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 transition-transform">
        {step.icon}
      </div>
      <div className="flex flex-col items-center w-full">
        <span className="text-indigo-500 block text-xs tracking-[0.4em] font-black mb-4 uppercase">STEP 0{index + 1}</span>
        <h3 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase tracking-tighter leading-none">
          {step.title}
        </h3>
        <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-lg mx-auto">
          {step.desc}
        </p>
      </div>
    </motion.div>
  );
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const VibeStats = () => {
  const [count, setCount] = useState(0);
  const [newShout, setNewShout] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const STORAGE_KEY = 'launchpad_v12_manifest_sovereign';

  const [latestShout, setLatestShout] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { phrase: "Manifest your empire...", author: "LaunchPad", id: 'default', timestamp: 0 };
  });

  const loadLatestData = async () => {
    setIsSyncing(true);
    try {
      const c = await fetchGlobalEmpireCount();
      setCount(c);
      
      const dbResponse = await fetchLatestShouts(1); 
      if (dbResponse && dbResponse.length > 0) {
        const dbShout = dbResponse[0];
        setLatestShout((prev: any) => {
          if (prev.locked && prev.phrase && !SYSTEM_TEMPLATES.includes(prev.phrase)) return prev;
          return { ...dbShout, timestamp: dbShout.timestamp || Date.now() };
        });
      }
    } catch (err) {
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  useEffect(() => {
    loadLatestData();
    const interval = setInterval(loadLatestData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePostShout = async (e: React.FormEvent) => {
    e.preventDefault();
    const phrase = newShout.trim();
    if (!phrase || isPosting) return;
    
    setIsPosting(true);
    const manualManifest = {
      id: `u-${Date.now()}`,
      phrase: phrase,
      author: 'You',
      timestamp: Date.now(),
      locked: true 
    };

    setLatestShout(manualManifest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(manualManifest));
    setNewShout('');

    try {
      await postShout(phrase, 'Builder');
    } catch (err) {
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-16 max-w-4xl mx-auto px-4 relative z-20">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex-1 min-w-[280px] p-8 border-white/5 bg-white/[0.02] flex items-center gap-8 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
          <svg className={`w-14 h-14 text-[#00f2ea] transition-transform duration-500 ${isSyncing ? 'rotate-180 scale-110' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_#22c55e] transition-all duration-300 ${isSyncing ? 'bg-cyan-400 scale-125' : 'bg-green-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Empires Built</span>
          </div>
          <div className="text-5xl font-black tracking-tighter text-white tabular-nums leading-none min-w-[120px]">
            {count === 0 ? '...' : <AnimatedNumber value={count} />}
          </div>
          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-2 opacity-80">
            {isSyncing ? 'Refreshing Archive...' : 'Connected to Archives 🏛️'}
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card flex-1 min-w-[280px] p-8 border-white/5 bg-white/[0.02] relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-col items-start text-left h-full justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <span className="text-amber-400">✨</span> Community Manifestation
          </span>
          
          <div className="min-h-[70px] w-full mb-6 relative">
            <AnimatePresence mode="popLayout">
              <motion.div 
                key={latestShout.phrase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <p className="text-sm md:text-base font-bold text-white italic leading-relaxed line-clamp-2">
                  "{latestShout.phrase}"
                </p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-indigo-500/30"></span>
                  {latestShout.author}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <form onSubmit={handlePostShout} className="w-full relative group/input">
            <input 
              type="text"
              maxLength={80}
              placeholder="Manifest your empire..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700 pr-14 text-white"
              value={newShout}
              onChange={(e) => setNewShout(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isPosting || !newShout.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white disabled:opacity-30 transition-all"
            >
              {isPosting ? (
                <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const LandingPage: React.FC<Props> = ({ onStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end end"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="text-center py-12 px-4 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center px-4 py-2 bg-indigo-500/10 rounded-full text-indigo-400 text-sm font-bold mb-10 border border-indigo-500/20"
      >
        🚀 Vibe-coded. No configuration required.
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-8 leading-none"
      >
        Turn 'What If'<br />
        Into <span className="neon-cyan italic">Real Demos.</span> ⚡
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
      >
        Build a working prototype in seconds. Tell the AI your vision, drop a design screenshot, 
        and flex your live app in our built-in previewer. Ready to go viral?
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8"
      >
        <button 
          onClick={onStart}
          className="px-12 py-6 bg-white text-black rounded-3xl font-black text-2xl hover:scale-105 transition-all transform active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
        >
          Build My Demo 🔥
        </button>
        <button 
          onClick={() => {
            const el = document.getElementById('how-it-works');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-10 py-5 text-slate-400 hover:text-white font-bold transition-all"
        >
          See the Vibe ⚡
        </button>
      </motion.div>

      {/* RESTORED SECTION: VibeStats & Community Manifestation */}
      <VibeStats />

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-32 mt-24">
        <div className="glass-card p-8 border-white/5 bg-white/[0.02] text-left">
          <div className="text-3xl mb-4">🏛️</div>
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Immutable Archives</h4>
          <p className="text-sm text-slate-500 font-medium">Every successful synthesis is permanently stored in your encrypted Vault.</p>
        </div>
        <div className="glass-card p-8 border-white/5 bg-white/[0.02] text-left">
          <div className="text-3xl mb-4">🔍</div>
          <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2">AI Pre-Flight Audit</h4>
          <p className="text-sm text-slate-500 font-medium">Native Gemini review ensures your code is functional before you ever see it.</p>
        </div>
        <div className="glass-card p-8 border-white/5 bg-white/[0.02] text-left">
          <div className="text-3xl mb-4">👑</div>
          <h4 className="text-xs font-black text-[#ff0050] uppercase tracking-widest mb-2">Pure Sovereignty</h4>
          <p className="text-sm text-slate-500 font-medium">Own the logic. One-time unlock for full React source code export.</p>
        </div>
      </div>

      <section id="how-it-works" className="relative max-w-4xl mx-auto py-24 px-6 md:px-0 mt-32" ref={containerRef}>
        <div className="absolute left-1/2 -translate-x-1/2 top-24 bottom-24 w-1 bg-white/10 rounded-full hidden sm:block">
          <motion.div 
            style={{ scaleY } as any}
            className="w-full bg-[#ff0050] rounded-full origin-top shadow-[0_0_15px_#ff0050]"
          />
        </div>

        <div className="text-center mb-32">
          <h2 className="text-6xl font-black mb-4 tracking-tighter uppercase">HOW IT <span className="text-[#ff0050]">WORKS.</span></h2>
          <p className="text-slate-500 font-bold text-lg uppercase tracking-[0.4em]">The roadmap to your empire.</p>
        </div>

        <div className="space-y-12 relative z-10 flex flex-col items-center">
          {STEPS.map((step, i) => (
            <React.Fragment key={i}>
              <div className="w-full max-w-2xl">
                <StepCard step={step} index={i} />
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex justify-center mb-12">
                  <motion.div 
                    animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-indigo-400"
                  >
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-12 text-center glass-card p-12 border-indigo-500/20 bg-indigo-500/5">
          <p className="text-slate-400 font-medium text-xl italic leading-relaxed">
            "Worried about bugs? Our <span className="text-indigo-400 font-black">AI Reviewer</span> ensures your prototype is high-fidelity before it ever hits the screen." 💊
          </p>
        </div>
      </section>

      <div id="examples-section" className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden py-10 border-y border-white/5 bg-white/[0.02] mt-24">
        <div className="flex animate-scroll w-max gap-8 px-8">
          {[...EXAMPLES, ...EXAMPLES, ...EXAMPLES].map((item, idx) => (
            <div 
              key={idx} 
              className="w-[350px] text-left glass-card border-white/10 hover:border-cyan-500/50 transition-all group p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`px-3 py-1 ${item.color} ${item.text} text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10`}>
                    {item.title}
                  </div>
                  <div className="text-xl">⚡</div>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">THE BRAINSTORM</h4>
                    <p className="text-lg font-bold text-white leading-tight">{item.quiz.vp}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TARGET CROWD</h4>
                    <p className="text-sm text-slate-300 font-medium">{item.quiz.target}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">MUST-HAVE PROMPT</h4>
                    <p className="text-xs text-cyan-400 font-mono leading-relaxed italic">"{item.quiz.features}"</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-3">
                  {item.avatars.map((av, avIdx) => (
                    <div 
                      key={avIdx} 
                      className={`w-8 h-8 rounded-full border-2 border-black ${av.color} flex items-center justify-center text-[10px] font-black shadow-lg`}
                    >
                      {av.initial}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-black text-cyan-400 tracking-wider">CODE READY 🚀</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
