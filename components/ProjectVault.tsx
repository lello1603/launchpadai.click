
import React, { useState } from 'react';
// Fix: Use any cast for motion to bypass broken type definitions in the environment
import { motion as m, AnimatePresence } from 'framer-motion';
const motion = m as any;
import { Project } from '../types';

interface Props {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onStartNew: () => void;
  isLoading?: boolean;
  onSync?: () => void;
}

const ProjectVault: React.FC<Props> = ({ projects, onSelectProject, onDeleteProject, onStartNew, isLoading = false, onSync }) => {
  const [localDeletingIds, setLocalDeletingIds] = useState<string[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const startDelete = (e: React.MouseEvent | React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmingId(id);
    
    setTimeout(() => {
      setConfirmingId(current => current === id ? null : current);
    }, 4000);
  };

  const cancelDelete = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmingId(null);
  };

  const confirmDelete = async (e: React.MouseEvent | React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setConfirmingId(null);
    setLocalDeletingIds(prev => [...prev, id]);
    
    try {
      await onDeleteProject(id);
    } catch (err) {
      setLocalDeletingIds(prev => prev.filter(item => item !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 md:px-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div className="flex flex-col">
          <h2 className="text-5xl font-black tracking-tighter uppercase mb-2 text-white">The Vault. 🏛️</h2>
          <div className="flex items-center gap-3">
            <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-[10px]">Permanent Empire Archives</p>
            <button 
              onClick={(e) => { e.stopPropagation(); onSync?.(); }}
              disabled={isLoading}
              className={`p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all text-indigo-400 group flex items-center gap-2 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
              title="Force Sync"
            >
              <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">Sync Archives</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onStartNew}
            className="flex-1 md:flex-none px-8 py-4 bg-white text-black rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            Vibecode New ⚡
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {isLoading && projects.length === 0 ? (
          <motion.div 
            key="loading-vault"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-32 flex flex-col items-center text-center w-full"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            />
            <h3 className="text-2xl font-black uppercase tracking-widest text-slate-500">Decrypting Matrix...</h3>
          </motion.div>
        ) : projects.length === 0 ? (
          <motion.div 
            key="empty-vault"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-24 text-center border-white/5 bg-white/[0.02] shadow-2xl relative overflow-hidden w-full"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20"></div>
            <div className="text-7xl mb-10 opacity-30 grayscale drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">🛸</div>
            <h3 className="text-4xl font-black mb-6 tracking-tighter uppercase text-white">The Vault is Dark</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-12 font-medium text-lg leading-relaxed">
              No empires detected in the cloud. Build your first vision to archive it permanently.
            </p>
            <button 
              onClick={onStartNew}
              className="px-14 py-6 neon-pink text-white rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-2xl shadow-[#ff0050]/20"
            >
              Build First Empire 🚀
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="projects-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {projects.map((project) => {
              const isPendingLocal = project.id.startsWith('pending');
              const isCloudSynthesizing = (!project.code || project.code.trim().length < 10) && !isPendingLocal;
              const isLocked = isPendingLocal || isCloudSynthesizing;
              const isDeleting = localDeletingIds.includes(project.id);
              const isConfirming = confirmingId === project.id;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  whileHover={{ y: isDeleting || isLocked ? 0 : -8 }}
                  className={`glass-card group p-8 relative border-white/10 transition-all flex flex-col justify-between h-[420px] bg-white/[0.01] ${isLocked ? 'border-indigo-500/10 cursor-default' : 'hover:border-indigo-500/50 cursor-pointer'} ${isDeleting ? 'grayscale opacity-60' : ''}`}
                  onClick={() => onSelectProject(project)}
                >
                  {/* LOCK OVERLAY FOR LOCKED PROJECTS - Physically prevents interactions underneath */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center p-8 text-center rounded-[1.5rem] border border-indigo-500/10 pointer-events-none">
                       <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6"
                       >
                          <span className="text-3xl">🛠️</span>
                       </motion.div>
                       <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Synthesis in Progress</p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                          Cloud engines are mapping logic gates. Automated email dispatch on completion.
                       </p>
                    </div>
                  )}

                  {/* DELETE TRIGGER */}
                  {!isDeleting && (
                    <div className="absolute top-6 right-6 z-[600]" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      <AnimatePresence mode="wait">
                        {!isConfirming ? (
                          <motion.button 
                            key="delete-trigger" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            type="button" onClick={(e) => startDelete(e, project.id)}
                            className="w-12 h-12 bg-white/5 text-slate-500 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all border border-white/10 active:scale-90 flex items-center justify-center cursor-pointer shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </motion.button>
                        ) : (
                          <motion.div key="confirm-actions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2 bg-black/80 backdrop-blur-xl p-1.5 rounded-2xl border border-red-500/30 shadow-2xl">
                            <button onClick={cancelDelete} className="px-3 py-2 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
                            <button onClick={(e) => confirmDelete(e, project.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">Delete</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {isDeleting && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[250] flex flex-col items-center justify-center rounded-[1.5rem]">
                      <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-3"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Purging...</span>
                    </div>
                  )}

                  <div className={`relative pointer-events-none transition-all duration-500 ${isLocked ? 'blur-sm grayscale opacity-30 scale-95' : ''}`}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border ${isLocked ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-emerald-500/20 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}>
                        {isLocked ? '☁️' : '📦'}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${isLocked ? 'text-indigo-400' : 'text-slate-600'}`}>
                          {isLocked ? 'Cloud Build' : 'Project Entity'}
                        </h4>
                        <p className="text-white font-black truncate text-lg tracking-tight">{project.name || "Quantum Build"}</p>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border mb-6 transition-colors h-[140px] overflow-hidden ${isLocked ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-white/5 border-white/5 group-hover:bg-white/[0.08]'}`}>
                      <h4 className={`text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isLocked ? 'text-indigo-400' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-indigo-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                        {isLocked ? 'MAPPING GATES' : 'Source Blueprint'}
                      </h4>
                      <p className={`text-xs line-clamp-5 leading-relaxed font-medium italic ${isLocked ? 'text-indigo-300/60' : 'text-slate-400'}`}>
                        "{project.prompt.replace('--- MASTER SYSTEM PROMPT ---', '').trim()}"
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between pt-6 border-t border-white/5 relative z-0 pointer-events-none transition-all duration-500 ${isLocked ? 'blur-sm opacity-20' : ''}`}>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">Status</span>
                      <span className={`text-[11px] font-bold uppercase ${isLocked ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {isLocked ? 'Building...' : new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div 
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${isLocked ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/30' : 'bg-white text-black group-hover:bg-emerald-500 group-hover:text-white'}`}
                    >
                      {isLocked ? 'Locked' : 'Open Pro Demo'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectVault;
