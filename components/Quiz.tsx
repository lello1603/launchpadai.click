import React, { useState, useEffect } from 'react';
// Fix: Use any cast for motion to bypass broken type definitions in the environment
import { motion as m, AnimatePresence } from 'framer-motion';
const motion = m as any;
import { StartupQuiz } from '../types';

const FEEL_PLACEHOLDERS = [
  "e.g., Make my app look funny but still professional…",
  "e.g., Minimal and calm, like a meditation app…",
  "e.g., Bold and playful, Gen Z energy…",
  "e.g., Premium and sleek, like a fintech product…",
  "e.g., Warm and friendly, like a community app…",
];

interface Props {
  onComplete: (data: StartupQuiz) => void;
}

const Quiz: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [feelPlaceholderIndex, setFeelPlaceholderIndex] = useState(0);
  const [data, setData] = useState<StartupQuiz>({
    valueProposition: '',
    targetAudience: '',
    essentialFeatures: '',
    appFeel: '',
    businessGoal: ''
  });

  const totalSteps = 4;

  useEffect(() => {
    if (step !== 4) return;
    const interval = setInterval(() => {
      setFeelPlaceholderIndex((i) => (i + 1) % FEEL_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [step]);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete({ ...data, businessGoal: 'flex on socials' });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderInput = () => {
    switch(step) {
      case 1:
        return (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
            <label htmlFor="quiz-value-proposition" className="block text-3xl font-black neon-cyan">
              So, what’s this big idea actually doing? ⚡
            </label>
            <p className="text-slate-400 font-medium">Keep it simple, like you're explaining it to a friend at a cafe.</p>
            <textarea 
              autoFocus
              id="quiz-value-proposition"
              name="valueProposition"
              className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white focus:ring-2 focus:ring-[#ff0050] focus:border-transparent outline-none h-40 text-xl font-bold"
              placeholder="e.g., An app that sends you a random meme every time your ex posts."
              value={data.valueProposition}
              onChange={(e) => setData({ ...data, valueProposition: e.target.value })}
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
            <label htmlFor="quiz-target-audience" className="block text-3xl font-black neon-cyan">
              Who is this for? 🔥
            </label>
            <p className="text-slate-400 font-medium">Your friends? Creators? Small biz? The whole world?</p>
            <textarea 
              autoFocus
              id="quiz-target-audience"
              name="targetAudience"
              className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white focus:ring-2 focus:ring-[#ff0050] focus:border-transparent outline-none h-40 text-xl font-bold"
              placeholder="e.g., Tired students who need a laugh."
              value={data.targetAudience}
              onChange={(e) => setData({ ...data, targetAudience: e.target.value })}
            />
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
            <label htmlFor="quiz-essential-features" className="block text-3xl font-black neon-cyan">
              What's the one 'must-have' feature? 🏆
            </label>
            <p className="text-slate-400 font-medium">The thing that makes it look super cool.</p>
            <textarea 
              autoFocus
              id="quiz-essential-features"
              name="essentialFeatures"
              className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white focus:ring-2 focus:ring-[#ff0050] focus:border-transparent outline-none h-40 text-xl font-bold"
              placeholder="e.g., A dark-mode dashboard with neon animations."
              value={data.essentialFeatures}
              onChange={(e) => setData({ ...data, essentialFeatures: e.target.value })}
            />
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
            <label htmlFor="quiz-app-feel" className="block text-3xl font-black neon-cyan">
              How should the app feel? 🎨
            </label>
            <p className="text-slate-400 font-medium">Vibe, tone, and visual style in one line.</p>
            <textarea 
              autoFocus
              id="quiz-app-feel"
              name="appFeel"
              className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white focus:ring-2 focus:ring-[#ff0050] focus:border-transparent outline-none h-40 text-xl font-bold"
              placeholder={FEEL_PLACEHOLDERS[feelPlaceholderIndex]}
              value={data.appFeel}
              onChange={(e) => setData({ ...data, appFeel: e.target.value })}
            />
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-16 text-center">
        <h2 className="text-4xl font-black mb-4">Tell us the vibe. ✌️</h2>
        <div className="flex justify-center items-center gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#ff0050]' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      <div className="glass-card p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#ff0050]" />
        
        {renderInput()}
        
        <div className="mt-12 flex justify-between items-center gap-6">
          <button 
            onClick={handleBack}
            className={`px-8 py-4 rounded-2xl font-black transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white'}`}
          >
            Go Back
          </button>
          <button 
            onClick={handleNext}
            disabled={
              step === 1 ? !data.valueProposition.trim() :
              step === 2 ? !data.targetAudience.trim() :
              step === 3 ? !data.essentialFeatures.trim() :
              !data.appFeel.trim()
            }
            className="px-12 py-4 neon-pink text-white rounded-2xl font-black text-lg hover:scale-105 transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
          >
            {step === totalSteps ? 'Cooking Time 👨‍🍳' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
