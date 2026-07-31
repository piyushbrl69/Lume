"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Smile, Meh, Frown, BookA, Pencil } from 'lucide-react';

export type FlashcardData = {
  id: string;
  front: string;
  back: string;
  source: 'custom' | 'vocab';
  dateAdded: string; // ISO string for easier filtering
  nextReviewDate: string; 
  lastRating: 'easy' | 'medium' | 'hard' | null;
};

interface FlashcardProps {
  card: FlashcardData;
  onRate: (id: string, rating: 'easy' | 'medium' | 'hard') => void;
}

export default function Flashcard({ card, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleRate = (e: React.MouseEvent, rating: 'easy' | 'medium' | 'hard') => {
    e.stopPropagation(); 
    setIsFlipped(false);
    
    setTimeout(() => {
      onRate(card.id, rating);
    }, 150); 
  };

  return (
    <div className="w-full max-w-lg mx-auto h-80 cursor-pointer perspective-1000" style={{ perspective: '1000px' }} onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* FRONT OF CARD */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow">
          
          {/* Source Badge */}
          <div className="absolute top-6 left-6 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {card.source === 'vocab' ? <BookA size={14} className="text-amber-500"/> : <Pencil size={14} className="text-indigo-500"/>}
            {card.source}
          </div>

          <span className="absolute top-6 right-6 text-slate-300 dark:text-slate-600">
            <RefreshCcw size={20} />
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mt-4">
            {card.front}
          </h3>
          <p className="absolute bottom-6 text-sm text-slate-400 font-medium tracking-wide uppercase">Click to flip</p>
        </div>

        {/* BACK OF CARD */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl p-8 shadow-md border border-indigo-100 dark:border-indigo-900 flex flex-col items-center justify-center text-center">
          <div className="flex-grow flex items-center justify-center">
            <p className="text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">
              {card.back}
            </p>
          </div>
          
          {/* Spaced Repetition UI */}
          <div className="w-full pt-6 border-t border-indigo-200 dark:border-indigo-900/50 flex justify-between gap-2 mt-auto">
            <button 
              onClick={(e) => handleRate(e, 'hard')}
              className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Frown size={24} />
              <span className="text-xs font-bold">Hard (1d)</span>
            </button>
            <button 
              onClick={(e) => handleRate(e, 'medium')}
              className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
            >
              <Meh size={24} />
              <span className="text-xs font-bold">Good (3d)</span>
            </button>
            <button 
              onClick={(e) => handleRate(e, 'easy')}
              className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <Smile size={24} />
              <span className="text-xs font-bold">Easy (7d)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}