"use client";

import React from 'react';
import { Clock, Volume2 } from 'lucide-react';
import { subDays, isSameDay, parseISO } from 'date-fns';
import { VocabEntry } from '@/app/vocab/page';

interface ReviewSectionProps {
  words: VocabEntry[];
  onPlayAudio: (text: string) => void;
}

export default function ReviewSection({ words, onPlayAudio }: ReviewSectionProps) {
  const today = new Date();
  
  // FIX: parseISO added to convert strings back to dates for comparison
  const sevenDaysAgoWords = words.filter(w => isSameDay(parseISO(w.dateAdded), subDays(today, 7)));
  const thirtyDaysAgoWords = words.filter(w => isSameDay(parseISO(w.dateAdded), subDays(today, 30)));
  
  const reviewWords = [...sevenDaysAgoWords, ...thirtyDaysAgoWords];

  if (reviewWords.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-6 rounded-3xl shadow-sm mb-8">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-4 text-lg">
        <Clock size={24} /> Spaced Repetition Review
      </div>
      <p className="text-sm text-amber-600 dark:text-amber-300 mb-4">
        You added these words 7 or 30 days ago. Time to test your memory!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviewWords.map(word => (
          <div key={word.id} className="bg-white/60 dark:bg-slate-900/50 p-4 rounded-2xl flex justify-between items-start border border-amber-100 dark:border-amber-900/30">
            <div>
              <h4 className="text-md font-bold text-slate-800 dark:text-white mb-1">{word.term}</h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm">{word.meaning}</p>
            </div>
            <button onClick={() => onPlayAudio(word.term)} className="p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-full transition-colors">
              <Volume2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}