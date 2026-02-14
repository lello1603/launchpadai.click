
import React, { useState, useEffect, useMemo, useRef } from 'react';
// Fix: Use any cast for motion to bypass broken type definitions in the environment
import { motion as m, AnimatePresence } from 'framer-motion';
const motion = m as any;
import { AppStep, StartupQuiz, UserState, PrototypeData, Project } from './types';
import LandingPage from './components/LandingPage';
import Quiz from './components/Quiz';
import ImageUpload from './components/ImageUpload';
import Dashboard from './components/Dashboard';
import PaywallModal from './components/PaywallModal';
import AuthModal from './components/AuthModal';
import ProjectVault from './components/ProjectVault';
import AdminPanel from './components/AdminPanel';
import ComplexityNotification from './components/ComplexityNotification';
// Removed reviewCode from imports as it is not exported by geminiService and not used in this component
import { refineProjectBrief, generatePrototypeFromBrief, debugCode, modifyPrototype } from './services/geminiService';
import { syncUserProfile, fetchUserProfile, auth, isSupabaseConfigured, saveProject, fetchUserProjects, deleteProject, logRepair, supabase } from './services/supabaseService';
import { triggerBackgroundSynthesis } from './services/emailService';

const SUPER_USER_EMAIL = "l.macrellino@gmail.com";

const GENERATION_PHRASES = [
  { text: "Harvesting design DNA...", emoji: "🧬" },
  { text: "Mapping logic structures...", emoji: "🧠" },
  { text: "Synthesizing components...", emoji: "⚛️" },
  { text: "Running Gemini code audit...", emoji: "⚖️" },
  { text: "Polishing pixel vibe...", emoji: "✨" },
  { text: "Finalizing build manifest...", emoji: "📝" },
  { text: "Igniting engines...", emoji: "🚀" }
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.LANDING);
  const [quizData, setQuizData] = useState<StartupQuiz | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [generatedBrief, setGeneratedBrief] = useState<string>('');
  const [prototypeData, setPrototypeData] = useState<PrototypeData | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(GENERATION_PHRASES[0].text);
  const [statusEmoji, setStatusEmoji] = useState(GENERATION_PHRASES[0].emoji);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [isVaultSyncing, setIsVaultSyncing] = useState(false);
  const [lockingToast, setLockingToast] = useState(false);
  
  // Background Processing State
  const [showComplexityPopup, setShowComplexityPopup] = useState(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [readyToast, setReadyToast] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const complexityTimerRef = useRef<any>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('launchpad_user');
    return saved ? JSON.parse(saved) : { generationCount: 0, isSubscribed: false, subscriptionExpiry: null, lastGenerationDate: null };
  });

  const isSuperUser = useMemo(() => userState.email?.toLowerCase() === SUPER_USER_EMAIL.toLowerCase(), [userState.email]);

  useEffect(() => {
    if (userState.id) {
      loadProjects(userState.id);
    }
  }, [userState.id]);

  const loadProjects = async (uid: string) => {
    setIsVaultSyncing(true);
    try {
      const projects = await fetchUserProjects(uid);
      setUserProjects(projects);
    } catch (err) {
      console.error("Project sync failure:", err);
    } finally {
      setIsVaultSyncing(false);
    }
  };

  // SMART POLLER: Watches for code availability in all projects
  useEffect(() => {
    let interval: any;
    // Specifically watch projects with less than 100 chars of code (unfinished builds)
    const hasUnfinishedProjects = userProjects.some(p => !p.code || p.code.trim().length < 100);

    if (userState.id && (pendingProjectId || isBackgroundMode || hasUnfinishedProjects)) {
      interval = setInterval(async () => {
        const latestProjects = await fetchUserProjects(userState.id!);
        
        // Find if any previously "empty" project now has valid code
        const newlyFinished = latestProjects.find(latest => {
          const localMatch = userProjects.find(p => p.id === latest.id);
          const hadNoCode = !localMatch || !localMatch.code || localMatch.code.trim().length < 100;
          const hasCodeNow = latest.code && latest.code.trim().length > 100;
          return hadNoCode && hasCodeNow;
        });

        if (newlyFinished || latestProjects.length > userProjects.length) {
          setUserProjects(latestProjects);
          if (newlyFinished) {
            setPendingProjectId(null);
            setIsBackgroundMode(false);
            setReadyToast(newlyFinished.name);
            setTimeout(() => setReadyToast(null), 12000);
          }
        }
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [userState.id, pendingProjectId, isBackgroundMode, userProjects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let phraseIndex = 0;
    let interval: any;
    if (currentStep === AppStep.GENERATING) {
      interval = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % GENERATION_PHRASES.length;
        setProcessingStatus(GENERATION_PHRASES[phraseIndex].text);
        setStatusEmoji(GENERATION_PHRASES[phraseIndex].emoji);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [currentStep]);

  const GATE_CHECK_TIMEOUT_MS = 8000;

  const checkGateOpen = async (): Promise<boolean> => {
    if (isSuperUser) return true;
    if (!userState.id) return false;
    try {
      const profilePromise = fetchUserProfile(userState.id);
      const profile = await Promise.race([
        profilePromise,
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('gate_check_timeout')), GATE_CHECK_TIMEOUT_MS)
        ),
      ]);
      if (!profile) return true;
      const hasCredit = profile.isSubscribed || profile.generationCount < 1;
      setUserState(prev => ({
        ...prev,
        generationCount: profile.generationCount,
        isSubscribed: profile.isSubscribed,
        subscriptionExpiry: profile.subscriptionExpiry
      }));
      return hasCredit;
    } catch {
      return true;
    }
  };

  const handleStartGeneration = async (img: string | null) => {
    console.log('[LaunchPad] handleStartGeneration called with image?', !!img);
    setImageData(img);
    if (!userState.id) {
      setShowAuth(true);
      return;
    }
    setIsProcessing(true);
    setCurrentStep(AppStep.GENERATING);
    let canProceed: boolean;
    try {
      canProceed = await checkGateOpen();
    } catch {
      canProceed = true;
    }
    if (!canProceed) {
      setIsProcessing(false);
      setCurrentStep(AppStep.UPLOAD);
      setShowPaywall(true);
      return;
    }
    complexityTimerRef.current = setTimeout(() => {
      setShowComplexityPopup(true);
    }, 120000);
    try {
      const brief = await refineProjectBrief(quizData!, img);
      setGeneratedBrief(brief);
      const proto = await generatePrototypeFromBrief(brief);
      setPrototypeData(proto);
      await finalizeGeneration(proto, brief);
    } catch (err: any) {
      setGenerationError(err.message);
      setCurrentStep(AppStep.REPAIRING);
    } finally {
      setIsProcessing(false);
      setIsBackgroundMode(false);
      clearTimeout(complexityTimerRef.current);
    }
  };

  const finalizeGeneration = async (prototype: PrototypeData, briefUsed: string) => {
    setPrototypeData(prototype);
    if (userState.id) {
      const saved = await saveProject(userState.id, prototype.title, briefUsed, prototype.code, activeProjectId || undefined);
      if (saved) {
        setActiveProjectId(saved.id);
        setUserProjects(prev => {
          const filtered = prev.filter(p => p.id !== saved.id);
          return [saved, ...filtered];
        });
        if (!activeProjectId) {
          const nextCount = userState.generationCount + 1;
          const updated = { ...userState, generationCount: nextCount };
          setUserState(updated);
          localStorage.setItem('launchpad_user', JSON.stringify(updated));
          await syncUserProfile(userState.id, updated);
        }
      }
    }
    if (isBackgroundMode) {
      setReadyToast(prototype.title);
      setTimeout(() => setReadyToast(null), 8000);
    } else {
      setCurrentStep(AppStep.DASHBOARD);
    }
  };

  const handleModify = async (request: string) => {
    if (!prototypeData) return;
    setIsProcessing(true);
    try {
      const updatedCode = await modifyPrototype(prototypeData.code, generatedBrief, request);
      const updatedProto = { ...prototypeData, code: updatedCode };
      setPrototypeData(updatedProto);
      await finalizeGeneration(updatedProto, generatedBrief);
    } catch (err) {
      console.error("Modify error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepair = async (errorLogs: string) => {
    if (!prototypeData) return;
    setIsProcessing(true);
    try {
      const fixedCode = await debugCode(prototypeData.code, errorLogs);
      const updatedProto = { ...prototypeData, code: fixedCode };
      setPrototypeData(updatedProto);
      await logRepair({ error_pattern: errorLogs.substring(0, 100), solution_logic: "Self-healing trigger", brief_context: generatedBrief });
      await finalizeGeneration(updatedProto, generatedBrief);
    } catch (err) {
      console.error("Repair error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunInBackground = async (): Promise<boolean> => {
    if (!userState.email || !userState.id) {
      setShowAuth(true);
      return false;
    }

    setIsSendingEmail(true);
    const pendingId = `pending-${Date.now()}`;
    setPendingProjectId(pendingId);
    
    // Pass strictly validated user data to worker
    const success = await triggerBackgroundSynthesis(
      userState.id, 
      userState.email, 
      quizData!, 
      generatedBrief || quizData!.valueProposition,
      imageData 
    );
    
    setIsBackgroundMode(true);
    setShowComplexityPopup(false);
    setIsSendingEmail(false);
    setCurrentStep(AppStep.VAULT); 
    return success;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      const emptyState: UserState = { generationCount: 0, isSubscribed: false, subscriptionExpiry: null, lastGenerationDate: null };
      setUserState(emptyState);
      localStorage.removeItem('launchpad_user');
      setUserProjects([]);
      setShowUserMenu(false);
      setCurrentStep(AppStep.LANDING);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setPrototypeData(null);
    }
    const backup = [...userProjects];
    setUserProjects(prev => prev.filter(p => p.id !== id));
    const ok = await deleteProject(id);
    if (!ok) {
      setUserProjects(backup);
      alert("Matrix Access Denied: Could not delete from cloud. Project restored.");
    }
  };

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const id = session.user.id;
        const profile = await fetchUserProfile(id);
        const newState: UserState = { 
          id, 
          email: session.user.email, 
          generationCount: profile?.generationCount ?? 0, 
          isSubscribed: profile?.isSubscribed ?? false, 
          subscriptionExpiry: profile?.subscriptionExpiry ?? null,
          lastGenerationDate: profile?.lastGenerationDate ?? null
        };
        setUserState(newState);
        localStorage.setItem('launchpad_user', JSON.stringify(newState));
        loadProjects(id);
      } else {
        setUserState({ generationCount: 0, isSubscribed: false, subscriptionExpiry: null, lastGenerationDate: null });
        localStorage.removeItem('launchpad_user');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const vaultProjects = useMemo(() => {
    let list = [...userProjects];
    if (pendingProjectId) {
      const pending: Project = {
        id: pendingProjectId,
        name: quizData?.valueProposition || "Synthesis in Progress",
        prompt: generatedBrief || "Cloud synthesis engine is mapping logic gates...",
        code: "",
        created_at: new Date().toISOString(),
        user_id: userState.id
      };
      list = [pending, ...list];
    }
    return list;
  }, [userProjects, pendingProjectId, quizData, generatedBrief]);

  return (
    <div className="min-h-screen text-white bg-[#010101] flex flex-col font-['Inter'] relative">
      <AnimatePresence>
        {readyToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[5000] glass-card px-8 py-5 border-emerald-500/50 bg-[#0a0a0a] flex items-center gap-4 shadow-[0_20px_60px_rgba(16,185,129,0.4)] border-2"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(16,185,129,0.5)]">✨</div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Synthesis Successful</p>
              <p className="text-white font-black text-sm">"{readyToast}" is ready to launch.</p>
            </div>
            <button 
              onClick={() => { setReadyToast(null); setCurrentStep(AppStep.VAULT); }}
              className="ml-4 px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Open Vault
            </button>
          </motion.div>
        )}
        
        {lockingToast && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={() => setLockingToast(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card px-12 py-12 border-indigo-500/50 bg-[#0a0a0a] shadow-[0_40px_100px_rgba(99,102,241,0.4)] flex flex-col items-center gap-6 border-2 max-w-sm text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30">
                <span className="text-4xl animate-pulse">🛠️</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Synthesis Active</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                  We are building your empire in the cloud. We'll notify you by email once development finishes.
                </p>
              </div>
              <button 
                onClick={() => setLockingToast(false)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-black transition-all"
              >
                Return to Vault
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full relative z-[500]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentStep(AppStep.LANDING)}>
          <div className="w-10 h-10 neon-pink rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="font-black text-2xl tracking-tighter uppercase">LaunchPad</div>
        </div>
        <div className="flex items-center gap-4">
          {userState.id ? (
            <div className="flex items-center gap-4 relative" ref={menuRef}>
              <button onClick={() => setCurrentStep(AppStep.VAULT)} className={`text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors ${currentStep === AppStep.VAULT ? 'text-white underline decoration-indigo-500 underline-offset-8' : ''}`}>Vault</button>
              <div 
                className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black border-2 border-indigo-400 cursor-pointer transition-transform hover:scale-110" 
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {userState.email?.charAt(0).toUpperCase()}
              </div>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-14 right-0 w-64 glass-card bg-[#0a0a0a] border-white/10 p-3 shadow-2xl z-[600]"
                  >
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Account Authority</p>
                      <p className="text-[11px] font-bold text-white truncate mt-1">{userState.email}</p>
                    </div>
                    <div className="space-y-1">
                      {isSuperUser && (
                        <button onClick={() => { setShowAdmin(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-left transition-colors">
                          <span className="text-sm">⚙️</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Admin Control</span>
                        </button>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-left group transition-all">
                        <span className="text-sm group-hover:scale-110 transition-transform">🚪</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-400">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="text-[10px] font-black bg-indigo-600 px-6 py-2 rounded-full hover:scale-105 transition-transform">Login</button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-4 flex-grow w-full">
        <AnimatePresence mode="wait">
          {currentStep === AppStep.LANDING && <LandingPage onStart={() => setCurrentStep(AppStep.QUIZ)} />}
          {currentStep === AppStep.QUIZ && <Quiz onComplete={d => { setQuizData(d); setCurrentStep(AppStep.UPLOAD); }} />}
          {currentStep === AppStep.UPLOAD && <ImageUpload onComplete={handleStartGeneration} />}
          {currentStep === AppStep.GENERATING && (
            <div className="flex flex-col items-center justify-center py-32 text-center h-full">
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }} 
                 className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mb-10" 
               />
               <div className="space-y-4">
                 <motion.h2 
                   key={processingStatus}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-4xl font-black uppercase tracking-tighter"
                 >
                   {processingStatus} {statusEmoji}
                 </motion.h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">
                   Synthesizing Codebase in real-time
                 </p>
               </div>
            </div>
          )}
          {currentStep === AppStep.REPAIRING && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8 border border-red-500/20">
                <span className="text-4xl">🛠️</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Synthesis Error</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">{generationError || "Something went wrong during generation."}</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => prototypeData && handleRepair(generationError || "Unknown error")}
                  disabled={isProcessing || !prototypeData}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 disabled:opacity-50 transition-all"
                >
                  {isProcessing ? "Repairing..." : "Repair Build"}
                </button>
                <button
                  onClick={() => { setGenerationError(null); setCurrentStep(AppStep.UPLOAD); }}
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
          {currentStep === AppStep.DASHBOARD && prototypeData && (
            <Dashboard 
              prompt={generatedBrief} 
              prototypeCode={prototypeData.code} 
              premiumCode={prototypeData.code}
              isSubscribed={userState.isSubscribed || isSuperUser} 
              onUnlock={() => setShowPaywall(true)} 
              onModify={handleModify}
              onRepair={handleRepair}
              isModifying={isProcessing}
            />
          )}
          {currentStep === AppStep.VAULT && (
            <ProjectVault 
              projects={vaultProjects} 
              isLoading={isVaultSyncing}
              onSync={() => loadProjects(userState.id!)}
              onSelectProject={p => { 
                // CRITICAL SELECTION GUARD: If code is too short (placeholder), strictly block Dashboard access
                // unfinished cloud builds often have no code or very short text.
                const isCodeValid = p.code && p.code.trim().length > 100;
                if(!isCodeValid || p.id.startsWith('pending')) {
                  setLockingToast(true);
                  return;
                }
                setGeneratedBrief(p.prompt); 
                setActiveProjectId(p.id); 
                setPrototypeData({ title: p.name, code: p.code, theme: { primary: "#6366f1", secondary: "#ff0050", font: "Inter" } }); 
                setCurrentStep(AppStep.DASHBOARD); 
              }} 
              onDeleteProject={handleDeleteProject} 
              onStartNew={() => { setActiveProjectId(null); setCurrentStep(AppStep.LANDING); }} 
            />
          )}
        </AnimatePresence>
      </main>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} onSubscribe={() => {}} />}
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      
      {showComplexityPopup && (
        <ComplexityNotification 
          vp={quizData?.valueProposition || ""} 
          onNotify={handleRunInBackground}
          onDismiss={() => setShowComplexityPopup(false)}
          isSendingNotification={isSendingEmail}
        />
      )}
    </div>
  );
};

export default App;
