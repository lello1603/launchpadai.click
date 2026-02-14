
import React, { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
const motion = m as any;

interface Props {
  onComplete: (img: string | null) => void | Promise<void>;
}

const ImageUpload: React.FC<Props> = ({ onComplete }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0] || null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null);
  };

  const handleContinue = () => {
    onComplete(preview);
  };

  const handleSkip = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const result = onComplete(null);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await (result as Promise<void>);
      }
    } catch (err) {
      console.error('[ImageUpload] Skip & Generate error:', err);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-16 flex flex-col items-center justify-center"
    >
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Add Visual DNA</h2>
      <p className="text-slate-400 text-sm mb-10 max-w-md text-center">
        Upload a reference image (logo, mockup, or mood board) to guide the AI, or skip to continue with text only.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`w-full max-w-md border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
          isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 hover:border-white/40'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          id="image-upload"
        />
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-2xl object-contain" />
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Image loaded</p>
          </div>
        ) : (
          <label htmlFor="image-upload" className="cursor-pointer block">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <span className="text-4xl">📷</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Drop or click to upload</p>
            <p className="text-[9px] text-slate-600">PNG, JPG up to 5MB</p>
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-10 justify-center">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!preview}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all"
        >
          Generate with Image
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isStarting}
          className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {isStarting ? 'Starting…' : 'Skip & Generate'}
        </button>
      </div>
    </motion.div>
  );
};

export default ImageUpload;
